import {
  User,
  Scenario,
  Scene,
  EvidenceItem,
  Choice,
  Attempt,
  AttemptDecision,
  StudentDashboardData,
  AdminDashboardData,
} from '../types';

const TOKEN_KEY = 'scamquest_jwt';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { email: string; name: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () =>
    request<{ user: User }>('/api/auth/me'),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  // Scenarios
  getScenarios: (params?: { category?: string; difficulty?: string; status?: string }) => {
    const search = new URLSearchParams();
    if (params?.category) search.append('category', params.category);
    if (params?.difficulty) search.append('difficulty', params.difficulty);
    if (params?.status) search.append('status', params.status);
    const qs = search.toString();
    return request<{ scenarios: Scenario[] }>(`/api/scenarios${qs ? `?${qs}` : ''}`);
  },

  getScenarioDetails: (id: string) =>
    request<{
      scenario: Scenario;
      scenes: Scene[];
      evidence: EvidenceItem[];
      choices: Choice[];
    }>(`/api/scenarios/${id}`),

  createScenario: (payload: { title: string; category: string; difficulty: string; estimated_minutes: number; description: string }) =>
    request<{ message: string; scenarioId: string }>('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  archiveScenario: (id: string) =>
    request<{ message: string }>(`/api/scenarios/${id}/archive`, { method: 'POST' }),

  validateScenario: (id: string) =>
    request<{ valid: boolean; errors: string[]; warnings: string[] }>(`/api/scenarios/${id}/validate`),

  publishScenario: (id: string) =>
    request<{ message: string }>(`/api/scenarios/${id}/publish`, { method: 'POST' }),

  // Attempts & Investigations
  startAttempt: (scenarioId: string) =>
    request<{ message: string; attemptId: string; resumed: boolean }>('/api/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ scenarioId }),
    }),

  getAttempt: (id: string) =>
    request<{
      attempt: Attempt;
      currentScene: Scene;
      choices: Choice[];
      evidence: EvidenceItem[];
      decisions: AttemptDecision[];
      sceneHistory: Scene[];
    }>(`/api/attempts/${id}`),

  toggleEvidence: (attemptId: string, evidenceId: string, selectedAsSuspicious: boolean) =>
    request<{ message: string; evidenceId: string; selectedAsSuspicious: boolean }>(`/api/attempts/${attemptId}/evidence`, {
      method: 'POST',
      body: JSON.stringify({ evidenceId, selectedAsSuspicious }),
    }),

  recordConfidence: (attemptId: string, rating: number) =>
    request<{ message: string; rating: number }>(`/api/attempts/${attemptId}/confidence`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    }),

  submitDecision: (attemptId: string, choiceId: string, confidenceRating?: number) =>
    request<{
      message: string;
      choiceFeedback: string;
      qualityScore: number;
      nextSceneId: string;
      completed: boolean;
      awaitingFinalDecision?: boolean;
      outcomeType?: string;
      explanation?: string;
      scoreSummary?: {
        decisionScore: number;
        evidenceScore: number;
        totalScore: number;
        percentage: number;
        passed: boolean;
      };
    }>(`/api/attempts/${attemptId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ choiceId, confidenceRating }),
    }),

  createPracticeReplay: (attemptId: string, forkSceneId: string) =>
    request<{
      message: string;
      replayAttemptId: string;
      parentAttemptId: string;
      forkSceneId: string;
      notice: string;
    }>(`/api/attempts/${attemptId}/replay`, {
      method: 'POST',
      body: JSON.stringify({ forkSceneId }),
    }),

  // Dashboards
  getStudentDashboard: () =>
    request<StudentDashboardData>('/api/analytics/student'),

  getAdminDashboard: () =>
    request<AdminDashboardData>('/api/analytics/admin'),
};
