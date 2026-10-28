import React, { useState, useEffect } from 'react';
import { Scenario, ScenarioDifficulty } from '../types';
import { api } from '../services/api';
import {
  Layers,
  Clock,
  Award,
  Search,
  Filter,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Shield,
  Smartphone,
  ShoppingBag,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface ScenarioLibraryProps {
  onSelectScenario: (scenarioId: string, attemptId?: string) => void;
}

export const ScenarioLibrary: React.FC<ScenarioLibraryProps> = ({ onSelectScenario }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const res = await api.getScenarios();
      setScenarios(res.scenarios);
    } catch (err: any) {
      setError(err.message || 'Failed to load scenarios.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All',
    'Employment Scams',
    'Scholarship & Financial Aid',
    'IT & Credential Phishing',
    'Marketplace & E-Commerce',
    'Social Engineering & Account Takeover',
    'Authentic Communications',
  ];

  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredScenarios = scenarios.filter((scen) => {
    if (selectedCategory !== 'All' && scen.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'All' && scen.difficulty !== selectedDifficulty) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        scen.title.toLowerCase().includes(q) ||
        scen.description.toLowerCase().includes(q) ||
        scen.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Employment Scams':
        return <Briefcase className="w-4 h-4 text-teal-400" />;
      case 'Scholarship & Financial Aid':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'IT & Credential Phishing':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'Marketplace & E-Commerce':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'Social Engineering & Account Takeover':
        return <Smartphone className="w-4 h-4 text-violet-400" />;
      case 'Authentic Communications':
        return <FileText className="w-4 h-4 text-sky-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-teal-400" />;
    }
  };

  const getDifficultyBadge = (diff: ScenarioDifficulty) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Advanced':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <span>Training Scenario Library</span>
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
              6 Seeded Scenarios
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulated inboxes reflecting genuine scam vectors facing students. Inspect headers, cross-examine evidence, and witness branching consequences.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search scenarios or clues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-teal-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Bars */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none max-w-full">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center space-x-1.5 ml-auto">
          <span className="text-xs font-mono text-slate-400">Difficulty:</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-teal-500/50"
          >
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenarios Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
          {error}
        </div>
      ) : filteredScenarios.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-300 font-semibold">No scenarios match your filter criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the category or search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScenarios.map((scen) => {
            const progress = scen.userProgress;
            const isCompleted = progress?.isCompleted;
            const inProgress = progress?.activeAttemptId;

            return (
              <div
                key={scen.id}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-teal-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:shadow-teal-500/5 group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                      {getCategoryIcon(scen.category)}
                      <span className="truncate max-w-[140px]">{scen.category}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getDifficultyBadge(
                        scen.difficulty
                      )}`}
                    >
                      {scen.difficulty}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2">
                    {scen.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {scen.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>~{scen.estimated_minutes} min duration</span>
                    </span>

                    {isCompleted && progress?.bestScore !== null ? (
                      <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Best: {progress.bestScore}/100</span>
                      </span>
                    ) : inProgress ? (
                      <span className="text-amber-400 font-medium">In Progress</span>
                    ) : (
                      <span className="text-slate-500">Unattempted</span>
                    )}
                  </div>

                  {/* Action Button */}
                  {inProgress ? (
                    <button
                      onClick={() => onSelectScenario(scen.id, inProgress)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center space-x-2 transition-colors active:scale-98"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume In-Progress Case</span>
                    </button>
                  ) : isCompleted ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectScenario(scen.id)}
                        className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>New Attempt</span>
                      </button>
                      <button
                        onClick={() => onSelectScenario(scen.id, 'review')}
                        className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <span>Replay & Review</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectScenario(scen.id)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center space-x-2 transition-colors active:scale-98 shadow-md shadow-teal-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Investigation</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
