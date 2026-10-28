import React, { useState, useEffect } from 'react';
import {
  Attempt,
  Scene,
  Choice,
  EvidenceItem,
  AttemptDecision,
} from '../types';
import { api } from '../services/api';
import {
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Info,
  Sparkles,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Eye,
  Check,
  X,
  FileSearch,
  MessageSquare,
  Smartphone,
  ShoppingBag,
  Award,
  ChevronRight,
  Lock,
  Clock,
} from 'lucide-react';

interface InvestigationRoomProps {
  scenarioId: string;
  initialAttemptId?: string;
  onExit: () => void;
}

export const InvestigationRoom: React.FC<InvestigationRoomProps> = ({
  scenarioId,
  initialAttemptId,
  onExit,
}) => {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [decisions, setDecisions] = useState<AttemptDecision[]>([]);
  const [sceneHistory, setSceneHistory] = useState<Scene[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tools & Modals
  const [showUrlInspector, setShowUrlInspector] = useState<boolean>(false);
  const [inspectedUrl, setInspectedUrl] = useState<string>('');
  const [showDossier, setShowDossier] = useState<boolean>(false);
  const [showConfidenceModal, setShowConfidenceModal] = useState<boolean>(false);
  const [selectedChoiceForConfidence, setSelectedChoiceForConfidence] = useState<Choice | null>(null);
  const [confidenceRating, setConfidenceRating] = useState<number>(3);
  const [lastFeedback, setLastFeedback] = useState<{
    text: string;
    qualityScore: number;
  } | null>(null);

  useEffect(() => {
    initInvestigation();
  }, [scenarioId, initialAttemptId]);

  const initInvestigation = async () => {
    try {
      setLoading(true);
      setError(null);

      let targetAttemptId = initialAttemptId;

      if (!targetAttemptId || targetAttemptId === 'review') {
        const startRes = await api.startAttempt(scenarioId);
        targetAttemptId = startRes.attemptId;
      }

      const res = await api.getAttempt(targetAttemptId);
      setAttempt(res.attempt);
      setCurrentScene(res.currentScene);
      setChoices(res.choices);
      setEvidence(res.evidence);
      setDecisions(res.decisions);
      setSceneHistory(res.sceneHistory);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize investigation.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEvidence = async (evidenceId: string, selectedAsSuspicious: boolean) => {
    if (!attempt || attempt.status === 'completed') return;

    try {
      await api.toggleEvidence(attempt.id, evidenceId, selectedAsSuspicious);
      // Refresh attempt state to reflect recalculated score
      const res = await api.getAttempt(attempt.id);
      setAttempt(res.attempt);
      setEvidence(res.evidence);
    } catch (err: any) {
      setError(err.message || 'Failed to record evidence selection.');
    }
  };

  const handleChoiceClick = (choice: Choice) => {
    // If scene is near ending or terminal choice, solicit confidence rating (1-5) first!
    if (attempt?.status === 'awaiting_final_decision' || choices.length <= 2) {
      setSelectedChoiceForConfidence(choice);
      setShowConfidenceModal(true);
    } else {
      executeDecision(choice.id);
    }
  };

  const executeDecision = async (choiceId: string, conf?: number) => {
    if (!attempt || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.submitDecision(attempt.id, choiceId, conf);

      setLastFeedback({
        text: res.choiceFeedback,
        qualityScore: res.qualityScore,
      });

      // Reload attempt state
      const updated = await api.getAttempt(attempt.id);
      setAttempt(updated.attempt);
      setCurrentScene(updated.currentScene);
      setChoices(updated.choices);
      setEvidence(updated.evidence);
      setDecisions(updated.decisions);
      setSceneHistory(updated.sceneHistory);
      setShowConfidenceModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartPracticeReplay = async (forkSceneId: string) => {
    if (!attempt) return;

    try {
      setLoading(true);
      const res = await api.createPracticeReplay(attempt.id, forkSceneId);
      // Load the newly created replay attempt
      const rep = await api.getAttempt(res.replayAttemptId);
      setAttempt(rep.attempt);
      setCurrentScene(rep.currentScene);
      setChoices(rep.choices);
      setEvidence(rep.evidence);
      setDecisions(rep.decisions);
      setSceneHistory(rep.sceneHistory);
      setLastFeedback(null);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize practice replay.');
    } finally {
      setLoading(false);
    }
  };

  const inspectLink = (url: string) => {
    setInspectedUrl(url);
    setShowUrlInspector(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Loading investigative scenario...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt || !currentScene) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Investigation Error</h3>
        <p className="text-xs text-rose-300">{error || 'Unable to load scenario attempt.'}</p>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const isCompleted = attempt.status === 'completed';
  const isReplay = Boolean(attempt.is_replay);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Scenario Title, Practice Replay Notice, Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono flex items-center space-x-1"
          >
            <span>&larr; Exit Case</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
                {attempt.category || 'Investigation'}
              </span>
              {isReplay ? (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center space-x-1 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  <span>Practice Replay (Official Score Locked)</span>
                </span>
              ) : (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Official Attempt
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">{attempt.scenario_title}</h2>
          </div>
        </div>

        {/* Live Score Counter */}
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Evidence Triage Score</span>
            <span className="text-sm font-extrabold font-mono text-teal-400">
              {attempt.evidence_score} <span className="text-[10px] text-slate-500">/ 30 pts</span>
            </span>
          </div>

          {isCompleted && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-right">
              <span className="text-[10px] text-emerald-400 font-mono block">Final Authoritative Score</span>
              <span className="text-sm font-extrabold font-mono text-white">
                {attempt.total_score} <span className="text-[10px] text-slate-500">/ 100</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Investigation Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulated Device / Inbox (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Simulated Inbox / Message Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Device / Client Header Bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <span className="text-xs font-mono text-slate-400 ml-2 flex items-center space-x-1">
                  {currentScene.channel_type === 'email' && <Mail className="w-3.5 h-3.5 text-teal-400" />}
                  {currentScene.channel_type === 'sms' && <Smartphone className="w-3.5 h-3.5 text-violet-400" />}
                  {currentScene.channel_type === 'chat' && <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />}
                  {currentScene.channel_type === 'marketplace' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className="uppercase tracking-wider font-semibold">Simulated {currentScene.channel_type} Client</span>
                </span>
              </div>

              {/* Security Inspector Button */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDossier(true)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-teal-300 border border-teal-500/20 flex items-center space-x-1"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>Sender Dossier</span>
                </button>
              </div>
            </div>

            {/* Message Headers */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800/70 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{currentScene.subject}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                    <span className="text-slate-200 font-medium">From: {currentScene.sender_name}</span>
                    <span className="font-mono text-teal-400/90">&lt;{currentScene.sender_address}&gt;</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap ml-2">
                  {currentScene.timestamp_label}
                </span>
              </div>
            </div>

            {/* Message Body Content */}
            <div className="p-5 space-y-4 bg-slate-900/60 min-h-[220px]">
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {currentScene.body_content}
              </div>

              {/* If scene contains links, offer Safe Link Inspector */}
              {currentScene.body_content.includes('http') && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-300 truncate">
                    <ExternalLink className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="font-mono text-[11px] text-teal-300 truncate">
                      {currentScene.body_content.match(/https?:\/\/[^\s]+/)?.[0] || 'Embedded Link Detected'}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      inspectLink(
                        currentScene.body_content.match(/https?:\/\/[^\s]+/)?.[0] ||
                          'http://login.campus-securityportal.example.net'
                      )
                    }
                    className="px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-semibold shrink-0 ml-2"
                  >
                    Safely Inspect URL
                  </button>
                </div>
              )}
            </div>

            {/* Branching Decisions / Action Panel */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-teal-400 flex items-center space-x-1.5">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Select Investigative Action</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {choices.length} available branches
                </span>
              </div>

              {!isCompleted ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoiceClick(choice)}
                      disabled={submitting}
                      className="text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/50 transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs sm:text-sm text-slate-100 group-hover:text-teal-300 transition-colors">
                          {choice.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{choice.description}</p>
                    </button>
                  ))}
                </div>
              ) : (
                /* Completed State Banner & Outcome */
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2">
                    {currentScene.terminal_outcome_type === 'success' ? (
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {currentScene.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {currentScene.terminal_outcome_type === 'success'
                          ? 'Optimal Threat Mitigation'
                          : 'Security Incident Recorded'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    {currentScene.terminal_explanation}
                  </p>

                  {/* Replay Alternate Choices Section */}
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[11px] font-mono text-slate-400 mb-2">
                      Explore Alternate Replay: Choose any earlier decision point to see what would have happened without changing your official score:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sceneHistory
                        .filter((s) => !s.is_terminal)
                        .map((s, idx) => (
                          <button
                            key={s.id}
                            onClick={() => handleStartPracticeReplay(s.id)}
                            className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Fork Step {idx + 1}: {s.title.slice(0, 20)}...</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Evidence Triage Cards & Decision Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Evidence Cards Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-teal-400" />
                  <span>Evidence & Clue Triage</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tag clues as Suspicious or Legitimate to earn evidence points (max 30 pts)
                </p>
              </div>
              <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {evidence.filter((e) => e.selected_as_suspicious !== null).length} / {evidence.length} Tagged
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {evidence.map((item) => {
                const isSelected = item.selected_as_suspicious !== null;
                const isSuspicious = item.selected_as_suspicious === true;
                const isLegitimate = item.selected_as_suspicious === false;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelected
                        ? isSuspicious
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-slate-200">{item.label}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                      </div>
                    </div>

                    {/* Clue Triage Toggle Buttons */}
                    {!isCompleted ? (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleEvidence(item.id, false)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors ${
                            isLegitimate
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-400 hover:text-emerald-300'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Legitimate</span>
                        </button>

                        <button
                          onClick={() => handleToggleEvidence(item.id, true)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors ${
                            isSuspicious
                              ? 'bg-rose-500 text-white font-bold'
                              : 'bg-slate-800 text-slate-400 hover:text-rose-300'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Suspicious</span>
                        </button>
                      </div>
                    ) : (
                      /* Post-completion Explanation */
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                        <p className="font-mono text-teal-400">Analysis:</p>
                        <p className="text-slate-400 mt-0.5">{item.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decision Trail / Case Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Investigative Audit Trail</span>
            </h3>

            {decisions.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 font-mono">
                No decisions taken yet. Choose an action from the simulator.
              </p>
            ) : (
              <div className="space-y-2.5">
                {decisions.map((dec, idx) => (
                  <div
                    key={dec.id}
                    className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs flex items-start space-x-2"
                  >
                    <span className="font-mono text-[10px] text-slate-400 mt-0.5">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-200">{dec.choice_label}</p>
                      <p className="text-[11px] text-teal-400/90 mt-0.5 font-sans">{dec.feedback_text}</p>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        dec.quality_score >= 8 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      +{dec.quality_score} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confidence Rating Modal (Before Final Decision) */}
      {showConfidenceModal && selectedChoiceForConfidence && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-2.5 text-teal-400">
              <Award className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Investigator Confidence Check</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Before submitting your conclusion for <span className="font-semibold text-teal-300">"{selectedChoiceForConfidence.label}"</span>, rate how confident you feel in this assessment.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-xs font-mono text-slate-400 block">Rate Confidence (1 to 5)</span>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setConfidenceRating(star)}
                    className={`w-9 h-9 rounded-xl font-bold font-mono text-sm transition-all ${
                      confidenceRating === star
                        ? 'bg-teal-500 text-slate-950 scale-110 shadow-lg shadow-teal-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {confidenceRating === 1 && 'Low certainty (Unsure)'}
                {confidenceRating === 2 && 'Slight suspicion'}
                {confidenceRating === 3 && 'Moderate certainty'}
                {confidenceRating === 4 && 'High confidence'}
                {confidenceRating === 5 && 'Definitive certainty'}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Note: Confidence is recorded for metacognitive calibration; it does not inflate your score.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfidenceModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDecision(selectedChoiceForConfidence.id, confidenceRating)}
                className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-xs font-bold text-slate-950 shadow-md shadow-teal-500/20"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Inspector Safe Tool Modal */}
      {showUrlInspector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-teal-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Safe Text URL Inspector</h3>
              </div>
              <button
                onClick={() => setShowUrlInspector(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Close [Esc]
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono break-all text-teal-300">
              {inspectedUrl}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Protocol:</span>
                <span
                  className={`font-mono font-bold ${
                    inspectedUrl.startsWith('https://') ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {inspectedUrl.startsWith('https://') ? 'HTTPS (Encrypted)' : 'HTTP (Unencrypted / Warning)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Registered Domain:</span>
                <span className="font-mono text-white">
                  {inspectedUrl.replace(/https?:\/\//, '').split('/')[0]}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Institution Check:</span>
                <span
                  className={`font-mono ${
                    inspectedUrl.includes('.edu') ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                  }`}
                >
                  {inspectedUrl.includes('.edu')
                    ? 'Official Academic TLD (.edu)'
                    : 'Commercial / Third-Party Lookalike (Non-.edu)'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              ScamQuest sandbox safety: All links are analyzed strictly as plain text. No external network requests are made.
            </p>

            <button
              onClick={() => setShowUrlInspector(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
            >
              Done Inspecting
            </button>
          </div>
        </div>
      )}

      {/* Sender Dossier / Background Modal */}
      {showDossier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-teal-400">
                <FileSearch className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Entity Dossier & Directory Check</h3>
              </div>
              <button
                onClick={() => setShowDossier(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 uppercase font-mono">Reported Sender</p>
                <p className="font-semibold text-white">{currentScene.sender_name}</p>
                <p className="text-teal-400 font-mono text-[11px]">{currentScene.sender_address}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 uppercase font-mono">University Directory Cross-Reference</p>
                <p className="text-slate-300">
                  Campus official domains reside on <span className="font-mono text-teal-300">campus.example.edu</span>. Any variations such as <span className="font-mono text-rose-300">-securityportal.example.net</span> or commercial recruiters on <span className="font-mono text-rose-300">.com</span> are unverified third-party registrations.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDossier(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
            >
              Return to Simulator
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
