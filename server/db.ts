import Database from 'better-sqlite3';
import path from 'path';

let dbInstance: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (dbInstance && !dbPath) {
    return dbInstance;
  }
  const resolvedPath = dbPath || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'scamquest.db');
  const db = new Database(resolvedPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  initSchema(db);

  if (!dbPath) {
    dbInstance = db;
  }
  return db;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('student', 'admin')) NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('Beginner', 'Intermediate', 'Advanced')) NOT NULL,
      estimated_minutes INTEGER NOT NULL DEFAULT 5,
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('draft', 'published', 'archived')) NOT NULL DEFAULT 'draft',
      current_version_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scenario_versions (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      initial_scene_id TEXT,
      passing_score INTEGER NOT NULL DEFAULT 70,
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
      UNIQUE(scenario_id, version_number)
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      scene_key TEXT NOT NULL,
      title TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_address TEXT NOT NULL,
      sender_avatar TEXT,
      subject TEXT NOT NULL,
      timestamp_label TEXT NOT NULL,
      body_content TEXT NOT NULL,
      channel_type TEXT CHECK(channel_type IN ('email', 'sms', 'chat', 'marketplace')) NOT NULL DEFAULT 'email',
      is_terminal INTEGER NOT NULL DEFAULT 0,
      terminal_outcome_type TEXT CHECK(terminal_outcome_type IN ('success', 'compromise', 'warning', 'neutral') OR terminal_outcome_type IS NULL),
      terminal_explanation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (version_id) REFERENCES scenario_versions(id) ON DELETE CASCADE,
      UNIQUE(version_id, scene_key)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      scene_id TEXT NOT NULL,
      clue_key TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT CHECK(category IN ('sender', 'domain', 'urgency', 'financial', 'credential', 'authentic_channel')) NOT NULL,
      is_legitimate INTEGER NOT NULL DEFAULT 0,
      explanation TEXT NOT NULL,
      score_points INTEGER NOT NULL DEFAULT 5,
      FOREIGN KEY (version_id) REFERENCES scenario_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      UNIQUE(version_id, clue_key)
    );

    CREATE TABLE IF NOT EXISTS choices (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      from_scene_id TEXT NOT NULL,
      next_scene_id TEXT NOT NULL,
      choice_key TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT NOT NULL,
      quality_score INTEGER NOT NULL DEFAULT 0,
      feedback_text TEXT NOT NULL,
      is_optimal INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (version_id) REFERENCES scenario_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (from_scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      FOREIGN KEY (next_scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      UNIQUE(version_id, from_scene_id, choice_key)
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      current_scene_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('in_progress', 'awaiting_final_decision', 'completed', 'abandoned')) NOT NULL DEFAULT 'in_progress',
      confidence_rating INTEGER CHECK(confidence_rating BETWEEN 1 AND 5 OR confidence_rating IS NULL),
      decision_score REAL NOT NULL DEFAULT 0,
      evidence_score REAL NOT NULL DEFAULT 0,
      total_score REAL NOT NULL DEFAULT 0,
      is_replay INTEGER NOT NULL DEFAULT 0,
      parent_attempt_id TEXT,
      replay_fork_scene_id TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES scenario_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_attempt_id) REFERENCES attempts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS attempt_decisions (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      scene_id TEXT NOT NULL,
      choice_id TEXT NOT NULL,
      quality_score INTEGER NOT NULL,
      feedback_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE CASCADE,
      UNIQUE(attempt_id, scene_id)
    );

    CREATE TABLE IF NOT EXISTS evidence_selections (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      evidence_id TEXT NOT NULL,
      selected_as_suspicious INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      score_awarded REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
      UNIQUE(attempt_id, evidence_id)
    );
  `);
}
