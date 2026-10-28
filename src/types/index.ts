export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type ScenarioStatus = 'draft' | 'published' | 'archived';
export type ScenarioDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ChannelType = 'email' | 'sms' | 'chat' | 'marketplace';
export type OutcomeType = 'success' | 'compromise' | 'warning' | 'neutral';

export interface Scenario {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: ScenarioDifficulty;
  estimated_minutes: number;
  description: string;
  status: ScenarioStatus;
  current_version_id?: string;
  version_number?: number;
  passing_score?: number;
  userProgress?: {
    hasAttempted: boolean;
    isCompleted: boolean;
    bestScore: number | null;
    activeAttemptId: string | null;
    attemptsCount: number;
  };
}

export interface Scene {
  id: string;
  version_id: string;
  scene_key: string;
  title: string;
  sender_name: string;
  sender_address: string;
  sender_avatar?: string;
  subject: string;
  timestamp_label: string;
  body_content: string;
  channel_type: ChannelType;
  is_terminal: number | boolean;
  terminal_outcome_type?: OutcomeType | null;
  terminal_explanation?: string | null;
}

export interface EvidenceItem {
  id: string;
  scene_id: string;
  clue_key: string;
  label: string;
  description: string;
  category: 'sender' | 'domain' | 'urgency' | 'financial' | 'credential' | 'authentic_channel';
  is_legitimate?: boolean | number;
  explanation?: string;
  score_points?: number;
  selected_as_suspicious?: boolean | null;
  is_correct?: boolean | number;
}

export interface Choice {
  id: string;
  from_scene_id: string;
  next_scene_id: string;
  choice_key: string;
  label: string;
  description: string;
  quality_score?: number;
  feedback_text?: string;
  is_optimal?: boolean | number;
}

export interface AttemptDecision {
  id: string;
  attempt_id: string;
  scene_id: string;
  choice_id: string;
  quality_score: number;
  feedback_text: string;
  choice_label?: string;
  scene_title?: string;
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  scenario_id: string;
  version_id: string;
  current_scene_id: string;
  status: 'in_progress' | 'awaiting_final_decision' | 'completed' | 'abandoned';
  confidence_rating?: number | null;
  decision_score: number;
  evidence_score: number;
  total_score: number;
  is_replay: number | boolean;
  parent_attempt_id?: string | null;
  replay_fork_scene_id?: string | null;
  started_at: string;
  completed_at?: string | null;
  updated_at: string;
  scenario_title?: string;
  category?: string;
  difficulty?: ScenarioDifficulty;
  passing_score?: number;
}

export interface StudentDashboardData {
  summary: {
    totalAvailableScenarios: number;
    completedScenariosCount: number;
    inProgressCount: number;
    totalAttemptsCount: number;
    averageScore: number;
  };
  bestScoresByScenario: Array<{
    scenarioTitle: string;
    bestScore: number;
    passed: boolean;
  }>;
  recentAttempts: Attempt[];
  skillBreakdown: Array<{
    categoryKey: string;
    categoryName: string;
    accuracy: number;
    missedCount: number;
    totalEncountered: number;
    isWeakness: boolean;
  }>;
}

export interface AdminDashboardData {
  metrics: {
    totalStudents: number;
    totalScenarios: number;
    publishedScenarios: number;
    draftScenarios: number;
    archivedScenarios: number;
    totalAttempts: number;
    completedAttempts: number;
    activeAttempts: number;
    replayPractices: number;
    averageScore: number;
    passRatePercentage: number;
  };
  scenarioPerformance: Array<{
    id: string;
    title: string;
    category: string;
    difficulty: ScenarioDifficulty;
    status: ScenarioStatus;
    total_attempts: number;
    completed_count: number;
    avg_score: number | null;
    avg_confidence: number | null;
  }>;
  categoryVulnerabilities: Array<{
    category: string;
    total_tests: number;
    missed_count: number;
    failure_rate: number;
  }>;
}
