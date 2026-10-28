import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db';
import { requireAuth, AuthenticatedRequest } from '../services/auth';
import {
  calculateDecisionScore,
  evaluateEvidenceSelection,
  calculateEvidenceScore,
  computeTotalScore,
} from '../services/scoring';

const router = Router();

// POST /api/attempts/start
// Start or resume an attempt for a scenario
router.post('/start', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { scenarioId } = req.body;
    if (!scenarioId) {
      res.status(400).json({ error: 'scenarioId is required.' });
      return;
    }

    const db = getDb();
    const userId = req.user!.id;

    // Check scenario exists and is published
    const scenario = db.prepare(`
      SELECT s.*, v.id as version_id, v.initial_scene_id, v.passing_score
      FROM scenarios s
      JOIN scenario_versions v ON s.current_version_id = v.id
      WHERE s.id = ? OR s.slug = ?
    `).get(scenarioId, scenarioId) as any;

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found or has no active version.' });
      return;
    }

    // Save and Resume check: Look for existing in_progress or awaiting_final_decision attempt
    const existing = db.prepare(`
      SELECT * FROM attempts
      WHERE user_id = ? AND scenario_id = ? AND is_replay = 0 AND status IN ('in_progress', 'awaiting_final_decision')
      ORDER BY updated_at DESC LIMIT 1
    `).get(userId, scenario.id) as any;

    if (existing) {
      res.json({
        message: 'Resuming existing active attempt.',
        attemptId: existing.id,
        resumed: true,
      });
      return;
    }

    // Create a new attempt
    const attemptId = `att-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO attempts (id, user_id, scenario_id, version_id, current_scene_id, status, confidence_rating, decision_score, evidence_score, total_score, is_replay, parent_attempt_id, started_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'in_progress', NULL, 0, 0, 0, 0, NULL, datetime('now'), datetime('now'))
    `).run(attemptId, userId, scenario.id, scenario.version_id, scenario.initial_scene_id);

    res.status(201).json({
      message: 'New investigation attempt started.',
      attemptId,
      resumed: false,
    });
  } catch (err) {
    console.error('Error starting attempt:', err);
    res.status(500).json({ error: 'Failed to start investigation attempt.' });
  }
});

// GET /api/attempts/:id
// Get attempt state, current scene, decisions made, evidence selected
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDb();
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    const attempt = db.prepare(`
      SELECT a.*, s.title as scenario_title, s.category, s.difficulty, s.slug, v.passing_score
      FROM attempts a
      JOIN scenarios s ON a.scenario_id = s.id
      JOIN scenario_versions v ON a.version_id = v.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found.' });
      return;
    }

    // Enforce ownership: students can only access their own attempts
    if (!isAdmin && attempt.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden. You do not own this attempt.' });
      return;
    }

    const currentScene = db.prepare(`
      SELECT * FROM scenes WHERE id = ?
    `).get(attempt.current_scene_id) as any;

    // Available choices from current scene
    const rawChoices = db.prepare(`
      SELECT * FROM choices WHERE from_scene_id = ?
    `).all(attempt.current_scene_id) as any[];

    // For in-progress attempts, mask answers/quality scores from choices
    const choices = rawChoices.map((ch) => {
      if (attempt.status === 'completed' || isAdmin) {
        return ch;
      }
      return {
        id: ch.id,
        from_scene_id: ch.from_scene_id,
        next_scene_id: ch.next_scene_id,
        choice_key: ch.choice_key,
        label: ch.label,
        description: ch.description,
      };
    });

    // Evidence for this version
    const rawEvidence = db.prepare(`
      SELECT e.*, es.selected_as_suspicious, es.is_correct, es.score_awarded
      FROM evidence e
      LEFT JOIN evidence_selections es ON e.id = es.evidence_id AND es.attempt_id = ?
      WHERE e.version_id = ?
    `).all(attempt.id, attempt.version_id) as any[];

    const evidence = rawEvidence.map((ev) => {
      const isSelected = ev.selected_as_suspicious !== null;
      if (attempt.status === 'completed' || isAdmin) {
        return {
          ...ev,
          selected_as_suspicious: isSelected ? Boolean(ev.selected_as_suspicious) : null,
        };
      }
      return {
        id: ev.id,
        scene_id: ev.scene_id,
        clue_key: ev.clue_key,
        label: ev.label,
        description: ev.description,
        category: ev.category,
        selected_as_suspicious: isSelected ? Boolean(ev.selected_as_suspicious) : null,
      };
    });

    // Decisions history
    const decisions = db.prepare(`
      SELECT ad.*, c.label as choice_label, c.is_optimal, s.title as scene_title, s.scene_key
      FROM attempt_decisions ad
      JOIN choices c ON ad.choice_id = c.id
      JOIN scenes s ON ad.scene_id = s.id
      WHERE ad.attempt_id = ?
      ORDER BY ad.created_at ASC
    `).all(attempt.id) as any[];

    // All visited scenes
    const sceneHistory = db.prepare(`
      SELECT s.*
      FROM scenes s
      WHERE s.id IN (
        SELECT scene_id FROM attempt_decisions WHERE attempt_id = ?
        UNION
        SELECT ?
      )
      ORDER BY s.created_at ASC
    `).all(attempt.id, attempt.current_scene_id) as any[];

    res.json({
      attempt,
      currentScene,
      choices,
      evidence,
      decisions,
      sceneHistory,
    });
  } catch (err) {
    console.error('Error fetching attempt:', err);
    res.status(500).json({ error: 'Failed to retrieve attempt state.' });
  }
});

// POST /api/attempts/:id/evidence
// Toggle/set evidence selection
router.post('/:id/evidence', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { evidenceId, selectedAsSuspicious } = req.body;
    const userId = req.user!.id;
    const db = getDb();

    if (!evidenceId || typeof selectedAsSuspicious !== 'boolean') {
      res.status(400).json({ error: 'evidenceId and boolean selectedAsSuspicious are required.' });
      return;
    }

    const attempt = db.prepare('SELECT * FROM attempts WHERE id = ?').get(id) as any;
    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found.' });
      return;
    }
    if (attempt.user_id !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden. You do not own this attempt.' });
      return;
    }
    if (attempt.status === 'completed') {
      res.status(400).json({ error: 'Cannot modify evidence on a completed attempt.' });
      return;
    }

    const evidence = db.prepare('SELECT * FROM evidence WHERE id = ? AND version_id = ?').get(evidenceId, attempt.version_id) as any;
    if (!evidence) {
      res.status(404).json({ error: 'Evidence item not found in this scenario version.' });
      return;
    }

    const evaluation = evaluateEvidenceSelection(selectedAsSuspicious, Boolean(evidence.is_legitimate), evidence.score_points);

    db.transaction(() => {
      // Upsert into evidence_selections
      const existing = db.prepare('SELECT id FROM evidence_selections WHERE attempt_id = ? AND evidence_id = ?').get(attempt.id, evidenceId) as any;
      if (existing) {
        db.prepare(`
          UPDATE evidence_selections
          SET selected_as_suspicious = ?, is_correct = ?, score_awarded = ?, created_at = datetime('now')
          WHERE id = ?
        `).run(selectedAsSuspicious ? 1 : 0, evaluation.isCorrect ? 1 : 0, evaluation.scoreAwarded, existing.id);
      } else {
        const selId = `es-${crypto.randomUUID()}`;
        db.prepare(`
          INSERT INTO evidence_selections (id, attempt_id, evidence_id, selected_as_suspicious, is_correct, score_awarded, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(selId, attempt.id, evidenceId, selectedAsSuspicious ? 1 : 0, evaluation.isCorrect ? 1 : 0, evaluation.scoreAwarded);
      }

      // Re-calculate total evidence score
      const allSelections = db.prepare(`
        SELECT is_correct, score_awarded FROM evidence_selections WHERE attempt_id = ?
      `).all(attempt.id) as any[];

      const totalClues = db.prepare('SELECT COUNT(*) as count FROM evidence WHERE version_id = ?').get(attempt.version_id) as any;
      const evResult = calculateEvidenceScore(allSelections, totalClues.count);

      db.prepare(`
        UPDATE attempts SET evidence_score = ?, updated_at = datetime('now') WHERE id = ?
      `).run(evResult.score, attempt.id);
    })();

    res.json({
      message: 'Evidence recorded.',
      evidenceId,
      selectedAsSuspicious,
    });
  } catch (err) {
    console.error('Evidence selection error:', err);
    res.status(500).json({ error: 'Failed to record evidence selection.' });
  }
});

// POST /api/attempts/:id/confidence
// Submit confidence rating (1 - 5)
router.post('/:id/confidence', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user!.id;
    const db = getDb();

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ error: 'Confidence rating must be an integer between 1 and 5.' });
      return;
    }

    const attempt = db.prepare('SELECT * FROM attempts WHERE id = ?').get(id) as any;
    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found.' });
      return;
    }
    if (attempt.user_id !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden. You do not own this attempt.' });
      return;
    }

    db.prepare(`
      UPDATE attempts SET confidence_rating = ?, updated_at = datetime('now') WHERE id = ?
    `).run(numericRating, attempt.id);

    res.json({ message: 'Confidence rating recorded.', rating: numericRating });
  } catch (err) {
    console.error('Confidence error:', err);
    res.status(500).json({ error: 'Failed to save confidence rating.' });
  }
});

// POST /api/attempts/:id/decision
// Submit decision choice
router.post('/:id/decision', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { choiceId, confidenceRating } = req.body;
    const userId = req.user!.id;
    const db = getDb();

    if (!choiceId) {
      res.status(400).json({ error: 'choiceId is required.' });
      return;
    }

    const attempt = db.prepare(`
      SELECT a.*, v.passing_score
      FROM attempts a
      JOIN scenario_versions v ON a.version_id = v.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found.' });
      return;
    }
    if (attempt.user_id !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden. You do not own this attempt.' });
      return;
    }
    if (attempt.status === 'completed') {
      res.status(400).json({ error: 'Attempt is already completed.' });
      return;
    }

    const choice = db.prepare(`
      SELECT * FROM choices WHERE id = ? AND from_scene_id = ?
    `).get(choiceId, attempt.current_scene_id) as any;

    if (!choice) {
      res.status(400).json({ error: 'Invalid choice for the current scene.' });
      return;
    }

    const nextScene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(choice.next_scene_id) as any;
    if (!nextScene) {
      res.status(500).json({ error: 'Destination scene not found.' });
      return;
    }

    let completionResult: any = null;

    db.transaction(() => {
      // Save confidence rating if provided
      if (confidenceRating && Number(confidenceRating) >= 1 && Number(confidenceRating) <= 5) {
        db.prepare('UPDATE attempts SET confidence_rating = ? WHERE id = ?').run(Number(confidenceRating), attempt.id);
      }

      // Record decision
      const decisionId = `dec-${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO attempt_decisions (id, attempt_id, scene_id, choice_id, quality_score, feedback_text, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(decisionId, attempt.id, attempt.current_scene_id, choice.id, choice.quality_score, choice.feedback_text);

      // Check if next scene is terminal
      if (nextScene.is_terminal) {
        // Collect all decisions made for this attempt
        const allDecisions = db.prepare(`
          SELECT quality_score FROM attempt_decisions WHERE attempt_id = ?
        `).all(attempt.id) as any[];

        const decisionRes = calculateDecisionScore(allDecisions);

        // Collect all evidence selections
        const allSelections = db.prepare(`
          SELECT is_correct, score_awarded FROM evidence_selections WHERE attempt_id = ?
        `).all(attempt.id) as any[];

        const totalClues = db.prepare('SELECT COUNT(*) as count FROM evidence WHERE version_id = ?').get(attempt.version_id) as any;
        const evResult = calculateEvidenceScore(allSelections, totalClues.count);

        const scoreSummary = computeTotalScore(decisionRes.score, evResult.score, attempt.passing_score || 70);

        db.prepare(`
          UPDATE attempts
          SET current_scene_id = ?,
              status = 'completed',
              decision_score = ?,
              evidence_score = ?,
              total_score = ?,
              completed_at = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ?
        `).run(nextScene.id, scoreSummary.decisionScore, scoreSummary.evidenceScore, scoreSummary.totalScore, attempt.id);

        completionResult = {
          completed: true,
          outcomeType: nextScene.terminal_outcome_type,
          explanation: nextScene.terminal_explanation,
          scoreSummary,
        };
      } else {
        // Check if all outgoing choices from next scene are terminal
        const outgoingChoices = db.prepare('SELECT next_scene_id FROM choices WHERE from_scene_id = ?').all(nextScene.id) as any[];
        const nextScenes = db.prepare(`SELECT is_terminal FROM scenes WHERE id IN (${outgoingChoices.map(() => '?').join(',') || 'NULL'})`).all(...outgoingChoices.map(c => c.next_scene_id)) as any[];
        const isNearEnd = nextScenes.length > 0 && nextScenes.every(s => Boolean(s.is_terminal));

        const nextStatus = isNearEnd ? 'awaiting_final_decision' : 'in_progress';

        db.prepare(`
          UPDATE attempts
          SET current_scene_id = ?,
              status = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(nextScene.id, nextStatus, attempt.id);

        completionResult = {
          completed: false,
          awaitingFinalDecision: isNearEnd,
        };
      }
    })();

    res.json({
      message: 'Decision recorded.',
      choiceFeedback: choice.feedback_text,
      qualityScore: choice.quality_score,
      nextSceneId: nextScene.id,
      ...completionResult,
    });
  } catch (err) {
    console.error('Decision submission error:', err);
    res.status(500).json({ error: 'Failed to record decision.' });
  }
});

// POST /api/attempts/:id/replay
// Alternate Outcome Practice Replay:
// Creates a practice replay session branching from a specified scene without altering the original score!
router.post('/:id/replay', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { forkSceneId } = req.body;
    const userId = req.user!.id;
    const db = getDb();

    const parentAttempt = db.prepare(`
      SELECT * FROM attempts WHERE id = ?
    `).get(id) as any;

    if (!parentAttempt) {
      res.status(404).json({ error: 'Target attempt not found.' });
      return;
    }
    if (parentAttempt.user_id !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden. You do not own this attempt.' });
      return;
    }

    const scene = db.prepare('SELECT * FROM scenes WHERE id = ? AND version_id = ?').get(forkSceneId, parentAttempt.version_id) as any;
    if (!scene) {
      res.status(404).json({ error: 'Specified fork scene not found in this scenario.' });
      return;
    }

    // Ensure the fork scene is not terminal
    if (scene.is_terminal) {
      res.status(400).json({ error: 'Cannot fork from a terminal outcome scene.' });
      return;
    }

    const replayAttemptId = `rep-${crypto.randomUUID()}`;

    db.transaction(() => {
      // Create new replay attempt marked is_replay = 1
      db.prepare(`
        INSERT INTO attempts (id, user_id, scenario_id, version_id, current_scene_id, status, confidence_rating, decision_score, evidence_score, total_score, is_replay, parent_attempt_id, replay_fork_scene_id, started_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'in_progress', NULL, 0, 0, 0, 1, ?, ?, datetime('now'), datetime('now'))
      `).run(replayAttemptId, userId, parentAttempt.scenario_id, parentAttempt.version_id, forkSceneId, parentAttempt.id, forkSceneId);

      // Copy evidence selections from parent to replay attempt
      const parentSelections = db.prepare(`
        SELECT evidence_id, selected_as_suspicious, is_correct, score_awarded
        FROM evidence_selections WHERE attempt_id = ?
      `).all(parentAttempt.id) as any[];

      for (const sel of parentSelections) {
        db.prepare(`
          INSERT INTO evidence_selections (id, attempt_id, evidence_id, selected_as_suspicious, is_correct, score_awarded, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(`es-${crypto.randomUUID()}`, replayAttemptId, sel.evidence_id, sel.selected_as_suspicious, sel.is_correct, sel.score_awarded);
      }
    })();

    res.status(201).json({
      message: 'Alternate outcome practice replay initialized.',
      replayAttemptId,
      parentAttemptId: parentAttempt.id,
      forkSceneId,
      notice: 'This is a practice replay session. Your original official attempt and score will not be changed.',
    });
  } catch (err) {
    console.error('Replay initialization error:', err);
    res.status(500).json({ error: 'Failed to initialize practice replay.' });
  }
});

export default router;
