import { Router, Response } from 'express';
import { getDb } from '../db';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../services/auth';

const router = Router();

// GET /api/analytics/student
// Student personal learning dashboard
router.get('/student', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user!.id;

    // Available published scenarios
    const totalScenarios = db.prepare(`SELECT COUNT(*) as count FROM scenarios WHERE status = 'published'`).get() as any;

    // User's official attempts (excluding practice replays)
    const attempts = db.prepare(`
      SELECT a.*, s.title as scenario_title, s.category, s.difficulty
      FROM attempts a
      JOIN scenarios s ON a.scenario_id = s.id
      WHERE a.user_id = ? AND a.is_replay = 0
      ORDER BY a.updated_at DESC
    `).all(userId) as any[];

    const completedAttempts = attempts.filter(a => a.status === 'completed');
    const inProgressAttempts = attempts.filter(a => a.status === 'in_progress' || a.status === 'awaiting_final_decision');

    // Distinct scenarios completed
    const completedScenarioIds = new Set(completedAttempts.map(a => a.scenario_id));

    // Best scores per scenario
    const bestScoresByScenario: Record<string, { scenarioTitle: string; bestScore: number; passed: boolean }> = {};
    for (const att of completedAttempts) {
      if (!bestScoresByScenario[att.scenario_id] || att.total_score > bestScoresByScenario[att.scenario_id].bestScore) {
        bestScoresByScenario[att.scenario_id] = {
          scenarioTitle: att.scenario_title,
          bestScore: att.total_score,
          passed: att.total_score >= 70,
        };
      }
    }

    // Average score across completed attempts
    const avgScore = completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((acc, a) => acc + a.total_score, 0) / completedAttempts.length)
      : 0;

    // Skill Weaknesses based on missed evidence categories
    // Missed = is_correct = 0 in evidence_selections
    const missedCategoryStats = db.prepare(`
      SELECT e.category,
             COUNT(*) as total_encountered,
             SUM(CASE WHEN es.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
             SUM(CASE WHEN es.is_correct = 0 THEN 1 ELSE 0 END) as missed_count
      FROM evidence_selections es
      JOIN evidence e ON es.evidence_id = e.id
      JOIN attempts a ON es.attempt_id = a.id
      WHERE a.user_id = ? AND a.is_replay = 0
      GROUP BY e.category
    `).all(userId) as any[];

    const categoryLabels: Record<string, string> = {
      sender: 'Sender & Domain Spoofing',
      domain: 'Malicious Link Inspection',
      urgency: 'Psychological Urgency Cues',
      financial: 'Advance-Fee Demands',
      credential: 'MFA & Password Solicitation',
      authentic_channel: 'Authentic Channel Discrimination',
    };

    const skillBreakdown = missedCategoryStats.map(stat => {
      const accuracy = stat.total_encountered > 0
        ? Math.round((stat.correct_count / stat.total_encountered) * 100)
        : 100;
      return {
        categoryKey: stat.category,
        categoryName: categoryLabels[stat.category] || stat.category,
        accuracy,
        missedCount: stat.missed_count,
        totalEncountered: stat.total_encountered,
        isWeakness: accuracy < 75,
      };
    }).sort((a, b) => a.accuracy - b.accuracy);

    res.json({
      summary: {
        totalAvailableScenarios: totalScenarios.count,
        completedScenariosCount: completedScenarioIds.size,
        inProgressCount: inProgressAttempts.length,
        totalAttemptsCount: attempts.length,
        averageScore: avgScore,
      },
      bestScoresByScenario: Object.values(bestScoresByScenario),
      recentAttempts: attempts.slice(0, 5),
      skillBreakdown,
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ error: 'Failed to load student dashboard statistics.' });
  }
});

// GET /api/analytics/admin
// Administrator overall statistics & completion analytics
router.get('/admin', requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const db = getDb();

    // Scenario counts by status
    const scenarioCounts = db.prepare(`
      SELECT status, COUNT(*) as count FROM scenarios GROUP BY status
    `).all() as any[];

    const statusMap = { published: 0, draft: 0, archived: 0, total: 0 };
    for (const sc of scenarioCounts) {
      if (sc.status in statusMap) {
        (statusMap as any)[sc.status] = sc.count;
      }
      statusMap.total += sc.count;
    }

    // Attempts metrics
    const attemptSummary = db.prepare(`
      SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_replay = 1 THEN 1 ELSE 0 END) as replay_attempts,
        SUM(CASE WHEN status = 'completed' AND is_replay = 0 THEN 1 ELSE 0 END) as completed_official,
        SUM(CASE WHEN status IN ('in_progress', 'awaiting_final_decision') AND is_replay = 0 THEN 1 ELSE 0 END) as active_official,
        AVG(CASE WHEN status = 'completed' AND is_replay = 0 THEN total_score ELSE NULL END) as avg_score
      FROM attempts
    `).get() as any;

    // Student counts
    const studentCount = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`).get() as any;

    // Completion and pass rate
    const completedOfficial = attemptSummary.completed_official || 0;
    const passingCount = db.prepare(`
      SELECT COUNT(*) as count FROM attempts WHERE status = 'completed' AND is_replay = 0 AND total_score >= 70
    `).get() as any;

    const passRate = completedOfficial > 0
      ? Math.round((passingCount.count / completedOfficial) * 100)
      : 0;

    // Scenario performance table
    const scenarioPerformance = db.prepare(`
      SELECT s.id, s.title, s.category, s.difficulty, s.status,
             COUNT(a.id) as total_attempts,
             SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
             AVG(CASE WHEN a.status = 'completed' THEN a.total_score ELSE NULL END) as avg_score,
             AVG(CASE WHEN a.status = 'completed' THEN a.confidence_rating ELSE NULL END) as avg_confidence
      FROM scenarios s
      LEFT JOIN attempts a ON s.id = a.scenario_id AND a.is_replay = 0
      GROUP BY s.id
      ORDER BY s.title ASC
    `).all() as any[];

    // Category weakness distribution across all students
    const categoryVulnerabilities = db.prepare(`
      SELECT e.category,
             COUNT(*) as total_tests,
             SUM(CASE WHEN es.is_correct = 0 THEN 1 ELSE 0 END) as missed_count,
             ROUND(CAST(SUM(CASE WHEN es.is_correct = 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 1) as failure_rate
      FROM evidence_selections es
      JOIN evidence e ON es.evidence_id = e.id
      JOIN attempts a ON es.attempt_id = a.id
      WHERE a.is_replay = 0
      GROUP BY e.category
      ORDER BY failure_rate DESC
    `).all() as any[];

    res.json({
      metrics: {
        totalStudents: studentCount.count,
        totalScenarios: statusMap.total,
        publishedScenarios: statusMap.published,
        draftScenarios: statusMap.draft,
        archivedScenarios: statusMap.archived,
        totalAttempts: attemptSummary.total_attempts || 0,
        completedAttempts: completedOfficial,
        activeAttempts: attemptSummary.active_official || 0,
        replayPractices: attemptSummary.replay_attempts || 0,
        averageScore: Math.round((attemptSummary.avg_score || 0) * 10) / 10,
        passRatePercentage: passRate,
      },
      scenarioPerformance: scenarioPerformance.map(sp => ({
        ...sp,
        avg_score: sp.avg_score !== null ? Math.round(sp.avg_score * 10) / 10 : null,
        avg_confidence: sp.avg_confidence !== null ? Math.round(sp.avg_confidence * 10) / 10 : null,
      })),
      categoryVulnerabilities,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to load administrator analytics.' });
  }
});

export default router;
