import React, { useState, useEffect } from 'react';
import { AdminDashboardData, Scenario, ScenarioDifficulty } from '../types';
import { api } from '../services/api';
import {
  Terminal,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Upload,
  PlusCircle,
  Eye,
  Check,
  X,
  TrendingDown,
  BarChart2,
  FileCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  onPreviewScenario: (scenarioId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onPreviewScenario }) => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validation Modal state
  const [validatingScenarioId, setValidatingScenarioId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Create Scenario Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('IT & Credential Phishing');
  const [newDifficulty, setNewDifficulty] = useState<ScenarioDifficulty>('Intermediate');
  const [newDuration, setNewDuration] = useState(5);
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [adminRes, scenRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getScenarios(),
      ]);
      setData(adminRes);
      setScenarios(scenRes.scenarios);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunValidation = async (scenarioId: string) => {
    try {
      setValidatingScenarioId(scenarioId);
      const res = await api.validateScenario(scenarioId);
      setValidationResult(res);
    } catch (err: any) {
      setError(err.message || 'Validation request failed.');
    }
  };

  const handlePublish = async (scenarioId: string) => {
    try {
      const res = await api.publishScenario(scenarioId);
      setActionSuccess(res.message);
      setValidationResult(null);
      setValidatingScenarioId(null);
      await loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to publish scenario.');
    }
  };

  const handleArchive = async (scenarioId: string) => {
    if (!confirm('Archive this scenario? Historical attempts will remain preserved.')) return;
    try {
      const res = await api.archiveScenario(scenarioId);
      setActionSuccess(res.message);
      await loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to archive scenario.');
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createScenario({
        title: newTitle.trim(),
        category: newCategory,
        difficulty: newDifficulty,
        estimated_minutes: newDuration,
        description: newDesc.trim() || 'New training scenario.',
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setActionSuccess('New scenario draft created with initial scenes and optimal choices.');
      await loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to create scenario draft.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300">
        <p className="font-semibold">Administrator Hub Error</p>
        <p className="text-xs text-red-400 mt-1">{error}</p>
        <button
          onClick={loadAdminData}
          className="mt-3 px-3 py-1.5 bg-red-900/40 rounded text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <span>Administrator & Pedagogical Hub</span>
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              Instructor Controls
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Audit student performance, validate scenario graph integrity before publication, and enforce acyclic educational branching.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition-colors self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Scenario Draft</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Enrolled Students</span>
          <div className="mt-2 text-2xl font-extrabold text-white">{data.metrics.totalStudents}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active investigative learners</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Attempts Logged</span>
          <div className="mt-2 text-2xl font-extrabold text-indigo-400">
            {data.metrics.totalAttempts}
            <span className="text-xs text-slate-400 font-mono ml-1.5 font-normal">
              ({data.metrics.replayPractices} replays)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all scenario versions</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Cohort Pass Rate</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">
            {data.metrics.passRatePercentage}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Scored ≥ 70/100 threshold</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Cohort Mean Score</span>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {data.metrics.averageScore} <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Deterministic normalization</p>
        </div>
      </div>

      {/* Scenarios Management Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Scenario Governance & Validation Console</span>
            </h3>
            <p className="text-xs text-slate-400">Manage drafts, validate graph reachability, and publish</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {data.metrics.publishedScenarios} Published / {data.metrics.totalScenarios} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Difficulty</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Attempts</th>
                <th className="py-2.5 px-3">Mean Score</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {data.scenarioPerformance.map((scen) => (
                <tr key={scen.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-200 max-w-[220px] truncate">
                    {scen.title}
                  </td>
                  <td className="py-3 px-3 text-slate-400">{scen.category}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {scen.difficulty}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {scen.status === 'published' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Published
                      </span>
                    ) : scen.status === 'draft' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Draft
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{scen.total_attempts}</td>
                  <td className="py-3 px-3 font-bold text-white">
                    {scen.avg_score !== null ? `${scen.avg_score}/100` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5 font-sans">
                    <button
                      onClick={() => onPreviewScenario(scen.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs inline-flex items-center space-x-1"
                      title="Preview Scenario"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => handleRunValidation(scen.id)}
                      className="px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs inline-flex items-center space-x-1"
                      title="Validate Scenario Graph"
                    >
                      <FileCheck className="w-3 h-3" />
                      <span>Validate</span>
                    </button>

                    {scen.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(scen.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 text-xs inline-flex items-center space-x-1"
                        title="Archive Scenario"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Archive</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cohort Vulnerability Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
          <TrendingDown className="w-4 h-4 text-rose-400" />
          <span>Cohort Phishing Vulnerability Distribution</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Identifies systematic training deficiencies across the student population
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.categoryVulnerabilities.map((vuln) => (
            <div
              key={vuln.category}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 capitalize">
                  {vuln.category.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono text-rose-400 font-bold">
                  {vuln.failure_rate}% error rate
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${Math.min(100, vuln.failure_rate)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {vuln.missed_count} missed clues out of {vuln.total_tests} evaluations
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Modal Dialog */}
      {validationResult && validatingScenarioId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                {validationResult.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="text-sm font-bold text-white">Scenario Graph Validation</h3>
              </div>
              <button
                onClick={() => setValidationResult(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {validationResult.valid ? (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                  <p className="font-bold flex items-center space-x-1.5">
                    <Check className="w-4 h-4" />
                    <span>Integrity Checks Passed!</span>
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-400/90 leading-relaxed">
                    Graph is verified acyclic, all scenes are reachable from initial node, choice destinations exist, and valid terminal outcomes are configured.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-1">
                  <p className="font-bold">Publishing Blocked — Integrity Violations:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-400">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setValidationResult(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
              {validationResult.valid && (
                <button
                  onClick={() => handlePublish(validatingScenarioId)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Publish to Library
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateScenario}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <span>Create Scenario Draft</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Scenario Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Payroll Direct Deposit Phishing"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500"
                  >
                    <option value="IT & Credential Phishing">IT & Credential Phishing</option>
                    <option value="Employment Scams">Employment Scams</option>
                    <option value="Scholarship & Financial Aid">Scholarship & Financial Aid</option>
                    <option value="Marketplace & E-Commerce">Marketplace & E-Commerce</option>
                    <option value="Social Engineering & Account Takeover">Social Engineering & Account Takeover</option>
                    <option value="Authentic Communications">Authentic Communications</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as ScenarioDifficulty)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description & Learning Objective</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the scenario context, spoofed identity, and learning takeaways..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20"
              >
                Create Draft
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
