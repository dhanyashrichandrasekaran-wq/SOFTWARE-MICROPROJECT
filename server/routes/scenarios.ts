import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../services/auth';
import { validateScenarioForPublication, ScenarioGraphData } from '../services/validator';

const router = Router();

// GET /api/scenarios
// List scenarios for student or admin
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const db = getDb();
    const user = req.user!;
    const isAdmin = user.role === 'admin';
    const category = req.query.category as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT s.*, v.version_number, v.passing_score, v.initial_scene_id
      FROM scenarios s
      LEFT JOIN scenario_versions v ON s.current_version_id = v.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isAdmin) {
      query += ` AND s.status = 'published'`;
    } else if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND s.category = ?`;
      params.push(category);
    }
    if (difficulty) {
      query += ` AND s.difficulty = ?`;
      params.push(difficulty);
    }

    query += ` ORDER BY s.title ASC`;
    const scenarios = db.prepare(query).all(...params) as any[];

    // Augment with user attempt status
    const augmented = scenarios.map((scen) => {
      const attempts = db.prepare(`
        SELECT id, status, total_score, updated_at
        FROM attempts
        WHERE user_id = ? AND scenario_id = ? AND is_replay = 0
        ORDER BY updated_at DESC
      `).all(user.id, scen.id) as any[];

      const completed = attempts.filter(a => a.status === 'completed');
      const inProgress = attempts.find(a => a.status === 'in_progress' || a.status === 'awaiting_final_decision');
      const bestScore = completed.length > 0 ? Math.max(...completed.map(a => a.total_score)) : null;

      return {
        ...scen,
        userProgress: {
          hasAttempted: attempts.length > 0,
          isCompleted: completed.length > 0,
          bestScore,
          activeAttemptId: inProgress ? inProgress.id : null,
          attemptsCount: completed.length,
        },
      };
    });

    res.json({ scenarios: augmented });
  } catch (err) {
    console.error('Error fetching scenarios:', err);
    res.status(500).json({ error: 'Failed to fetch scenarios.' });
  }
});

// GET /api/scenarios/:id
// Get scenario graph with scenes, evidence, and choices
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDb();
    const user = req.user!;
    const isAdmin = user.role === 'admin';

    const scenario = db.prepare(`
      SELECT s.*, v.id as version_id, v.version_number, v.initial_scene_id, v.passing_score
      FROM scenarios s
      LEFT JOIN scenario_versions v ON s.current_version_id = v.id
      WHERE s.id = ? OR s.slug = ?
    `).get(id, id) as any;

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found.' });
      return;
    }

    if (!isAdmin && scenario.status !== 'published') {
      res.status(403).json({ error: 'This scenario is not currently published.' });
      return;
    }

    const versionId = scenario.version_id;

    // Fetch all scenes
    const scenes = db.prepare(`
      SELECT * FROM scenes WHERE version_id = ? ORDER BY created_at ASC
    `).all(versionId) as any[];

    // Fetch evidence
    // Security check: If student, mask answer keys (is_legitimate, explanation, score_points)
    const rawEvidence = db.prepare(`
      SELECT * FROM evidence WHERE version_id = ?
    `).all(versionId) as any[];

    const evidence = rawEvidence.map((ev) => {
      if (isAdmin) {
        return ev;
      }
      return {
        id: ev.id,
        scene_id: ev.scene_id,
        clue_key: ev.clue_key,
        label: ev.label,
        description: ev.description,
        category: ev.category,
      };
    });

    // Fetch choices
    // Security check: If student, mask quality_score, feedback_text, is_optimal
    const rawChoices = db.prepare(`
      SELECT * FROM choices WHERE version_id = ?
    `).all(versionId) as any[];

    const choices = rawChoices.map((ch) => {
      if (isAdmin) {
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

    res.json({
      scenario,
      scenes,
      evidence,
      choices,
    });
  } catch (err) {
    console.error('Error fetching scenario details:', err);
    res.status(500).json({ error: 'Failed to fetch scenario details.' });
  }
});

// GET /api/scenarios/:id/validate (Admin Only)
// Run graph validator
router.get('/:id/validate', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDb();

    const scenario = db.prepare(`
      SELECT s.*, v.id as version_id, v.initial_scene_id, v.passing_score
      FROM scenarios s
      LEFT JOIN scenario_versions v ON s.current_version_id = v.id
      WHERE s.id = ?
    `).get(id) as any;

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found.' });
      return;
    }

    const scenes = db.prepare('SELECT * FROM scenes WHERE version_id = ?').all(scenario.version_id) as any[];
    const choices = db.prepare('SELECT * FROM choices WHERE version_id = ?').all(scenario.version_id) as any[];
    const evidence = db.prepare('SELECT * FROM evidence WHERE version_id = ?').all(scenario.version_id) as any[];

    const graphData: ScenarioGraphData = {
      title: scenario.title,
      initial_scene_id: scenario.initial_scene_id,
      passing_score: scenario.passing_score || 70,
      scenes,
      choices,
      evidence,
    };

    const validationResult = validateScenarioForPublication(graphData);
    res.json(validationResult);
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: 'Validation failed due to internal error.' });
  }
});

// POST /api/scenarios/:id/publish (Admin Only)
// Publish scenario after validation
router.post('/:id/publish', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDb();

    const scenario = db.prepare(`
      SELECT s.*, v.id as version_id, v.initial_scene_id, v.passing_score
      FROM scenarios s
      LEFT JOIN scenario_versions v ON s.current_version_id = v.id
      WHERE s.id = ?
    `).get(id) as any;

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found.' });
      return;
    }

    const scenes = db.prepare('SELECT * FROM scenes WHERE version_id = ?').all(scenario.version_id) as any[];
    const choices = db.prepare('SELECT * FROM choices WHERE version_id = ?').all(scenario.version_id) as any[];
    const evidence = db.prepare('SELECT * FROM evidence WHERE version_id = ?').all(scenario.version_id) as any[];

    const graphData: ScenarioGraphData = {
      title: scenario.title,
      initial_scene_id: scenario.initial_scene_id,
      passing_score: scenario.passing_score || 70,
      scenes,
      choices,
      evidence,
    };

    const validationResult = validateScenarioForPublication(graphData);
    if (!validationResult.valid) {
      res.status(400).json({
        error: 'Cannot publish scenario: validation errors detected.',
        details: validationResult.errors,
      });
      return;
    }

    // Set published
    db.prepare(`
      UPDATE scenarios SET status = 'published', updated_at = datetime('now') WHERE id = ?
    `).run(id);

    db.prepare(`
      UPDATE scenario_versions SET is_published = 1 WHERE id = ?
    `).run(scenario.version_id);

    res.json({ message: 'Scenario published successfully.' });
  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ error: 'Failed to publish scenario.' });
  }
});

// POST /api/scenarios/:id/archive (Admin Only)
router.post('/:id/archive', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDb();
    db.prepare(`UPDATE scenarios SET status = 'archived', updated_at = datetime('now') WHERE id = ?`).run(id);
    res.json({ message: 'Scenario archived successfully. Historical attempts remain preserved.' });
  } catch (err) {
    console.error('Archive error:', err);
    res.status(500).json({ error: 'Failed to archive scenario.' });
  }
});

// POST /api/scenarios (Admin Only: Create new scenario)
router.post('/', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { title, category, difficulty, estimated_minutes, description } = req.body;

    if (!title || !category || !difficulty) {
      res.status(400).json({ error: 'Title, category, and difficulty are required.' });
      return;
    }

    const db = getDb();
    const scenarioId = `scen-${crypto.randomUUID().slice(0, 8)}`;
    const versionId = `ver-${crypto.randomUUID().slice(0, 8)}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const initialSceneId = `scn-${crypto.randomUUID().slice(0, 8)}`;
    const terminalSceneId = `scn-${crypto.randomUUID().slice(0, 8)}`;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO scenarios (id, slug, title, category, difficulty, estimated_minutes, description, status, current_version_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
      `).run(
        scenarioId,
        slug,
        title.trim(),
        category.trim(),
        difficulty,
        Number(estimated_minutes) || 5,
        description ? description.trim() : 'Draft scenario description.',
        versionId
      );

      db.prepare(`
        INSERT INTO scenario_versions (id, scenario_id, version_number, initial_scene_id, passing_score, is_published)
        VALUES (?, ?, 1, ?, 70, 0)
      `).run(versionId, scenarioId, initialSceneId);

      // Starter initial scene
      db.prepare(`
        INSERT INTO scenes (id, version_id, scene_key, title, sender_name, sender_address, sender_avatar, subject, timestamp_label, body_content, channel_type, is_terminal)
        VALUES (?, ?, 'scene_start', 'Initial Incoming Message', 'System Admin', 'notice@campus.example.edu', 'mail', 'Action Required: Message Notice', 'Today, 09:00 AM', 'Initial investigative prompt for the student.', 'email', 0)
      `).run(initialSceneId, versionId);

      // Starter terminal scene
      db.prepare(`
        INSERT INTO scenes (id, version_id, scene_key, title, sender_name, sender_address, sender_avatar, subject, timestamp_label, body_content, channel_type, is_terminal, terminal_outcome_type, terminal_explanation)
        VALUES (?, ?, 'scene_conclusion', 'Investigation Conclusion', 'Security Office', 'security@campus.example.edu', 'check-circle', 'Investigation Completed', 'Today, 09:15 AM', 'You completed the investigation.', 'email', 1, 'success', 'Good job navigating this scenario.')
      `).run(terminalSceneId, versionId);

      // Starter choice
      const choiceId = `ch-${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO choices (id, version_id, from_scene_id, next_scene_id, choice_key, label, description, quality_score, feedback_text, is_optimal)
        VALUES (?, ?, ?, ?, 'verify_and_finish', 'Verify and conclude investigation', 'Confirm authenticity through established channels.', 10, 'Optimal verification practice.', 1)
      `).run(choiceId, versionId, initialSceneId, terminalSceneId);
    })();

    res.status(201).json({
      message: 'Scenario draft created.',
      scenarioId,
    });
  } catch (err) {
    console.error('Create scenario error:', err);
    res.status(500).json({ error: 'Failed to create scenario.' });
  }
});

export default router;
