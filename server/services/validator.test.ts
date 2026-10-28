import { describe, it, expect } from 'vitest';
import { validateScenarioForPublication, ScenarioGraphData } from './validator';

describe('ScamQuest Publication Validator', () => {
  it('validates a correct acyclic scenario graph with reachable terminals', () => {
    const validData: ScenarioGraphData = {
      title: 'Valid Phishing Scenario',
      initial_scene_id: 's1',
      passing_score: 70,
      scenes: [
        { id: 's1', scene_key: 'start', title: 'Start', is_terminal: 0 },
        { id: 's2', scene_key: 'step2', title: 'Step 2', is_terminal: 0 },
        { id: 's3', scene_key: 'win', title: 'Safe Ending', is_terminal: 1, terminal_outcome_type: 'success', terminal_explanation: 'Well done.' },
        { id: 's4', scene_key: 'lose', title: 'Compromised Ending', is_terminal: 1, terminal_outcome_type: 'compromise', terminal_explanation: 'Scammed.' },
      ],
      choices: [
        { id: 'c1', from_scene_id: 's1', next_scene_id: 's2', choice_key: 'inspect', label: 'Inspect email', quality_score: 10, feedback_text: 'Good inspection' },
        { id: 'c2', from_scene_id: 's1', next_scene_id: 's4', choice_key: 'click', label: 'Click link', quality_score: 0, feedback_text: 'Clicked bad link' },
        { id: 'c3', from_scene_id: 's2', next_scene_id: 's3', choice_key: 'report', label: 'Report to IT', quality_score: 10, feedback_text: 'Safely reported' },
        { id: 'c4', from_scene_id: 's2', next_scene_id: 's4', choice_key: 'ignore', label: 'Ignore warnings', quality_score: 0, feedback_text: 'Ignored signs' },
      ],
    };

    const res = validateScenarioForPublication(validData);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects scenario with missing title or initial scene', () => {
    const data: ScenarioGraphData = {
      title: '',
      initial_scene_id: null,
      passing_score: 70,
      scenes: [],
      choices: [],
    };
    const res = validateScenarioForPublication(data);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Scenario title is required.');
    expect(res.errors).toContain('Initial starting scene must be specified.');
  });

  it('detects cycles in scenario graph', () => {
    const cycleData: ScenarioGraphData = {
      title: 'Cyclic Scenario',
      initial_scene_id: 's1',
      passing_score: 70,
      scenes: [
        { id: 's1', scene_key: 'start', title: 'Start', is_terminal: 0 },
        { id: 's2', scene_key: 'step2', title: 'Step 2', is_terminal: 0 },
        { id: 's3', scene_key: 'step3', title: 'Step 3', is_terminal: 0 },
        { id: 's4', scene_key: 'term', title: 'Term', is_terminal: 1, terminal_outcome_type: 'success', terminal_explanation: 'Done' }
      ],
      choices: [
        { id: 'c1', from_scene_id: 's1', next_scene_id: 's2', choice_key: 'c1', label: 'Next', quality_score: 5, feedback_text: 'Go' },
        { id: 'c2', from_scene_id: 's2', next_scene_id: 's3', choice_key: 'c2', label: 'Next 2', quality_score: 5, feedback_text: 'Go 2' },
        { id: 'c3', from_scene_id: 's3', next_scene_id: 's1', choice_key: 'c3', label: 'Loop back', quality_score: 0, feedback_text: 'Loops' },
        { id: 'c4', from_scene_id: 's3', next_scene_id: 's4', choice_key: 'c4', label: 'Exit', quality_score: 10, feedback_text: 'Exit' },
      ],
    };
    const res = validateScenarioForPublication(cycleData);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('Cycle detected'))).toBe(true);
  });

  it('detects unreachable scenes from start scene', () => {
    const orphanData: ScenarioGraphData = {
      title: 'Orphan Scene Scenario',
      initial_scene_id: 's1',
      passing_score: 70,
      scenes: [
        { id: 's1', scene_key: 'start', title: 'Start', is_terminal: 0 },
        { id: 's2', scene_key: 'end', title: 'End', is_terminal: 1, terminal_outcome_type: 'success', terminal_explanation: 'Done' },
        { id: 's_orphan', scene_key: 'orphan', title: 'Floating Scene', is_terminal: 0 },
      ],
      choices: [
        { id: 'c1', from_scene_id: 's1', next_scene_id: 's2', choice_key: 'c1', label: 'Finish', quality_score: 10, feedback_text: 'Done' },
      ],
    };
    const res = validateScenarioForPublication(orphanData);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('Unreachable scene detected'))).toBe(true);
  });

  it('detects paths that cannot reach any terminal outcome', () => {
    const deadEndData: ScenarioGraphData = {
      title: 'Dead End Scenario',
      initial_scene_id: 's1',
      passing_score: 70,
      scenes: [
        { id: 's1', scene_key: 'start', title: 'Start', is_terminal: 0 },
        { id: 's2', scene_key: 'dead', title: 'Dead End Scene', is_terminal: 0 },
        { id: 's_term', scene_key: 'term', title: 'Terminal', is_terminal: 1, terminal_outcome_type: 'success', terminal_explanation: 'Done' },
      ],
      choices: [
        { id: 'c1', from_scene_id: 's1', next_scene_id: 's2', choice_key: 'c1', label: 'Go to dead end', quality_score: 5, feedback_text: 'Go' },
        { id: 'c2', from_scene_id: 's1', next_scene_id: 's_term', choice_key: 'c2', label: 'Finish', quality_score: 10, feedback_text: 'Finish' },
      ],
    };
    const res = validateScenarioForPublication(deadEndData);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('has no path leading to a terminal outcome') || e.includes('has no outgoing choices'))).toBe(true);
  });
});
