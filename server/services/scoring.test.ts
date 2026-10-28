import { describe, it, expect } from 'vitest';
import {
  calculateDecisionScore,
  evaluateEvidenceSelection,
  calculateEvidenceScore,
  computeTotalScore
} from './scoring';

describe('ScamQuest Scoring Engine', () => {
  it('correctly normalizes decision score to max 70 points', () => {
    // 3 decisions, all optimal (10 / 10 each)
    const decisions = [
      { qualityScore: 10 },
      { qualityScore: 10 },
      { qualityScore: 10 }
    ];
    const res = calculateDecisionScore(decisions);
    expect(res.score).toBe(70);
    expect(res.raw).toBe(30);
    expect(res.maxRaw).toBe(30);
  });

  it('normalizes decisions across branches with different decision counts', () => {
    // Branch A: 2 decisions with 10 each -> (20 / 20) * 70 = 70
    const branchA = calculateDecisionScore([{ qualityScore: 10 }, { qualityScore: 10 }]);
    // Branch B: 4 decisions with 10 each -> (40 / 40) * 70 = 70
    const branchB = calculateDecisionScore([
      { qualityScore: 10 },
      { qualityScore: 10 },
      { qualityScore: 10 },
      { qualityScore: 10 }
    ]);
    expect(branchA.score).toBe(70);
    expect(branchB.score).toBe(70);
  });

  it('handles partial and suboptimal decisions correctly', () => {
    // 2 decisions: one optimal (10), one mediocre (4) -> raw 14/20 -> 49
    const decisions = [{ qualityScore: 10 }, { qualityScore: 4 }];
    const res = calculateDecisionScore(decisions);
    expect(res.score).toBe(49);
  });

  it('evaluates evidence identification: suspicious vs legitimate', () => {
    // A clue is a phishing sign (isLegitimate = false). Player marks it suspicious -> correct
    const checkPhish = evaluateEvidenceSelection(true, false, 5);
    expect(checkPhish.isCorrect).toBe(true);
    expect(checkPhish.scoreAwarded).toBe(5);

    // A clue is legitimate info (isLegitimate = true). Player marks it legitimate (selectedAsSuspicious = false) -> correct
    const checkLegit = evaluateEvidenceSelection(false, true, 10);
    expect(checkLegit.isCorrect).toBe(true);
    expect(checkLegit.scoreAwarded).toBe(10);

    // False positive: legitimate info marked as suspicious -> incorrect
    const falsePositive = evaluateEvidenceSelection(true, true, 10);
    expect(falsePositive.isCorrect).toBe(false);
    expect(falsePositive.scoreAwarded).toBe(0);
  });

  it('calculates evidence score normalized up to 30 points', () => {
    const selections = [
      { isCorrect: true, scoreAwarded: 5 },
      { isCorrect: true, scoreAwarded: 5 },
      { isCorrect: false, scoreAwarded: 0 },
    ];
    // 2 out of 3 correct
    const res = calculateEvidenceScore(selections, 3);
    expect(res.score).toBe(20);
    expect(res.correctCount).toBe(2);
    expect(res.totalCount).toBe(3);
  });

  it('computes authoritative total score bounded between 0 and 100', () => {
    const res = computeTotalScore(70, 30, 70);
    expect(res.totalScore).toBe(100);
    expect(res.passed).toBe(true);

    const failRes = computeTotalScore(35, 10, 70);
    expect(failRes.totalScore).toBe(45);
    expect(failRes.passed).toBe(false);
  });
});
