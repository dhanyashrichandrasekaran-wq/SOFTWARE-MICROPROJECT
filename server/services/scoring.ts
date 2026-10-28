/**
 * ScamQuest Authoritative Scoring Service
 * 
 * Score breakdown:
 * - Decision Quality: up to 70 points
 * - Evidence Identification: up to 30 points
 * - Total Score: 0 - 100 points
 * 
 * Branch normalization:
 * Normalizes decision scores based on max possible score along the traversed branch.
 * Evidence identification scores are normalized based on available clues.
 */

export interface DecisionRecord {
  qualityScore: number; // e.g. -10 to +10, or 0 to 10
  maxPossibleScore?: number;
}

export interface EvidenceEvaluation {
  evidenceId: string;
  selectedAsSuspicious: boolean;
  isLegitimate: boolean;
  scorePoints: number;
}

export interface ScoreResult {
  decisionScore: number; // 0 - 70
  evidenceScore: number; // 0 - 30
  totalScore: number;    // 0 - 100
  percentage: number;
  passed: boolean;
  decisionBreakdown: {
    totalRawScore: number;
    maxRawScore: number;
    normalized: number;
  };
  evidenceBreakdown: {
    correctClues: number;
    totalClues: number;
    normalized: number;
  };
}

export function calculateDecisionScore(
  decisions: Array<{ qualityScore?: number; quality_score?: number }>,
  maxPossiblePerStep: number = 10
): { score: number; raw: number; maxRaw: number } {
  if (decisions.length === 0) {
    return { score: 0, raw: 0, maxRaw: 0 };
  }

  const raw = decisions.reduce((acc, d) => {
    const val = typeof d.qualityScore === 'number' ? d.qualityScore : (d.quality_score ?? 0);
    return acc + Math.max(0, val);
  }, 0);
  const maxRaw = decisions.length * maxPossiblePerStep;

  // Normalized to 70 max points
  const normalized = maxRaw > 0 ? (raw / maxRaw) * 70 : 0;
  return {
    score: Math.min(70, Math.max(0, Math.round(normalized * 10) / 10)),
    raw,
    maxRaw,
  };
}

export function evaluateEvidenceSelection(
  selectedAsSuspicious: boolean,
  isLegitimate: boolean,
  scorePoints: number = 5
): { isCorrect: boolean; scoreAwarded: number } {
  // A clue is correctly identified if:
  // - Flagged as suspicious when it is NOT legitimate (i.e. isLegitimate === 0/false)
  // - Flagged as legitimate (not suspicious) when it IS legitimate (i.e. isLegitimate === 1/true)
  const isCorrect = (selectedAsSuspicious && !isLegitimate) || (!selectedAsSuspicious && isLegitimate);
  return {
    isCorrect,
    scoreAwarded: isCorrect ? scorePoints : 0,
  };
}

export function calculateEvidenceScore(
  selections: Array<{ isCorrect?: boolean; is_correct?: number | boolean; scoreAwarded?: number; score_awarded?: number }>,
  totalCluesAvailable: number
): { score: number; correctCount: number; totalCount: number } {
  const correctCount = selections.filter(s => Boolean(typeof s.isCorrect === 'boolean' ? s.isCorrect : s.is_correct)).length;
  const effectiveTotal = Math.max(selections.length, totalCluesAvailable, 1);

  // Normalized to 30 max points
  const normalized = (correctCount / effectiveTotal) * 30;
  return {
    score: Math.min(30, Math.max(0, Math.round(normalized * 10) / 10)),
    correctCount,
    totalCount: effectiveTotal,
  };
}

export function computeTotalScore(
  decisionScore: number,
  evidenceScore: number,
  passingScore: number = 70
): ScoreResult {
  const roundedDecision = Math.round(decisionScore * 10) / 10;
  const roundedEvidence = Math.round(evidenceScore * 10) / 10;
  const total = Math.min(100, Math.max(0, Math.round((roundedDecision + roundedEvidence) * 10) / 10));

  return {
    decisionScore: roundedDecision,
    evidenceScore: roundedEvidence,
    totalScore: total,
    percentage: Math.round(total),
    passed: total >= passingScore,
    decisionBreakdown: {
      totalRawScore: roundedDecision,
      maxRawScore: 70,
      normalized: roundedDecision,
    },
    evidenceBreakdown: {
      correctClues: Math.round((roundedEvidence / 30) * 10),
      totalClues: 10,
      normalized: roundedEvidence,
    },
  };
}
