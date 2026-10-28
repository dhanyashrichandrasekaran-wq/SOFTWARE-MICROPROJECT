import React, { useEffect, useState } from 'react';
import { StudentDashboardData } from '../types';
import { api } from '../services/api';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  TrendingDown,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  AlertTriangle,
} from 'lucide-react';

interface StudentDashboardProps {
  onStartScenario: (scenarioId: string, attemptId?: string) => void;
  onBrowseScenarios: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onStartScenario,
  onBrowseScenarios,
}) => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin"></div>
          <p className="text-sm font-mono text-slate-400">Loading investigative intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="text-sm text-red-400 mt-1">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-red-800/40 hover:bg-red-800/60 rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const inProgressAttempt = data.recentAttempts.find(
    (a) => a.status === 'in_progress' || a.status === 'awaiting_final_decision'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Resume In-Progress Investigation Banner (if any) */}
      {inProgressAttempt && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-indigo-500/15 border border-amber-500/40 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-mono tracking-wider font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    Active Case In Progress
                  </span>
                  <span className="text-xs text-slate-400">Saved State Automatically Restored</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {inProgressAttempt.scenario_title || 'Unfinished Scenario Investigation'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pick up where you left off. All inspected clues and decisions remain safely persisted.
                </p>
              </div>
            </div>

            <button
              onClick={() => onStartScenario(inProgressAttempt.scenario_id, inProgressAttempt.id)}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/25 transition-all transform active:scale-95"
            >
              <span>Resume Case Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-teal-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Available Scenarios</span>
            <Layers className="w-5 h-5 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{data.summary.totalAvailableScenarios}</span>
            <span className="text-xs text-slate-400 font-mono">cases</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Interactive phishing simulations</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Solved Cases</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{data.summary.completedScenariosCount}</span>
            <span className="text-xs text-emerald-400 font-mono">
              / {data.summary.totalAvailableScenarios}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Completed training scenarios</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Mean Investigation Score</span>
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{data.summary.averageScore}</span>
            <span className="text-xs text-indigo-400 font-mono">/ 100 pts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Authoritative score average</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Attempts</span>
            <RotateCcw className="w-5 h-5 text-violet-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{data.summary.totalAttemptsCount}</span>
            <span className="text-xs text-violet-400 font-mono">sessions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Includes practice replays</p>
        </div>
      </div>

      {/* Main Grid: Skill Weakness Analysis & Best Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill Weaknesses Card */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Skill Weakness Diagnostics</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated from missed clue categories during investigative triage
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
              Real DB Evaluation
            </span>
          </div>

          {data.skillBreakdown.length === 0 ? (
            <div className="py-8 text-center">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No diagnostic history recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Complete a scenario to map your strengths and vulnerabilities across phishing categories.
              </p>
              <button
                onClick={onBrowseScenarios}
                className="mt-4 px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-semibold"
              >
                Start First Scenario
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.skillBreakdown.map((skill) => (
                <div key={skill.categoryKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200 flex items-center space-x-1.5">
                      {skill.isWeakness ? (
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Identified Vulnerability" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" title="Proficient" />
                      )}
                      <span>{skill.categoryName}</span>
                      {skill.isWeakness && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Weakness
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-slate-400">
                      {skill.accuracy}% accuracy ({skill.missedCount} missed of {skill.totalEncountered})
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        skill.accuracy >= 80
                          ? 'bg-teal-400'
                          : skill.accuracy >= 60
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.max(5, skill.accuracy)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Performance per Scenario */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-teal-400" />
                <span>Personal Best Scores</span>
              </h3>
            </div>

            {data.bestScoresByScenario.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No completed scenarios yet. Start your first case to establish benchmark scores.
              </div>
            ) : (
              <div className="space-y-3">
                {data.bestScoresByScenario.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-slate-200 truncate">{item.scenarioTitle}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.passed ? (
                          <span className="text-teal-400">Passed Benchmark</span>
                        ) : (
                          <span className="text-rose-400">Remediation Suggested</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold font-mono text-white">{item.bestScore}</span>
                      <span className="text-[10px] text-slate-500 font-mono"> / 100</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <button
              onClick={onBrowseScenarios}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-teal-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Explore Scenario Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Attempts History Table */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Recent Investigation Attempts</span>
            </h3>
            <p className="text-xs text-slate-400">History of official attempts and practice replays</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Deterministic Scoring</span>
        </div>

        {data.recentAttempts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No recent attempts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Scenario</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {data.recentAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-sans font-medium text-slate-200">
                      {att.scenario_title || 'Scenario'}
                    </td>
                    <td className="py-3 px-3">
                      {att.status === 'completed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {att.is_replay ? (
                        <span className="inline-flex items-center space-x-1 text-violet-400">
                          <Sparkles className="w-3 h-3" />
                          <span>Replay</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Official</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {att.status === 'completed' ? `${att.total_score} / 100` : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {att.confidence_rating ? `${att.confidence_rating} / 5` : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(att.updated_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {att.status === 'completed' ? (
                        <button
                          onClick={() => onStartScenario(att.scenario_id, att.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-sans text-xs"
                        >
                          Review & Replay
                        </button>
                      ) : (
                        <button
                          onClick={() => onStartScenario(att.scenario_id, att.id)}
                          className="px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-sans text-xs border border-teal-500/40"
                        >
                          Resume
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
