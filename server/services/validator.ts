/**
 * ScamQuest Scenario Publication Validator
 * 
 * Enforces graph integrity before publication:
 * - Title and metadata validation
 * - Starting scene existence
 * - All choice targets exist
 * - All scenes reachable from start
 * - All paths lead to a terminal outcome scene
 * - Acyclic graph validation (rejects cycles)
 * - Complete feedback on choices and terminal scenes
 * - Valid score configurations
 */

export interface ValidationScene {
  id: string;
  scene_key: string;
  title: string;
  is_terminal: number | boolean;
  terminal_outcome_type?: string | null;
  terminal_explanation?: string | null;
}

export interface ValidationChoice {
  id: string;
  from_scene_id: string;
  next_scene_id: string;
  choice_key: string;
  label: string;
  quality_score: number;
  feedback_text: string;
}

export interface ValidationEvidence {
  id: string;
  scene_id: string;
  clue_key: string;
  label: string;
  explanation: string;
}

export interface ScenarioGraphData {
  title: string;
  initial_scene_id: string | null;
  passing_score: number;
  scenes: ValidationScene[];
  choices: ValidationChoice[];
  evidence?: ValidationEvidence[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateScenarioForPublication(data: ScenarioGraphData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Scenario title is required.');
  }

  // 2. Initial scene existence
  if (!data.initial_scene_id) {
    errors.push('Initial starting scene must be specified.');
  }

  const sceneMap = new Map<string, ValidationScene>();
  for (const scene of data.scenes) {
    sceneMap.set(scene.id, scene);
  }

  if (data.initial_scene_id && !sceneMap.has(data.initial_scene_id)) {
    errors.push(`Initial scene ID '${data.initial_scene_id}' does not exist in scenes.`);
  }

  if (data.scenes.length === 0) {
    errors.push('Scenario must contain at least one scene.');
    return { valid: false, errors, warnings };
  }

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const scene of data.scenes) {
    adj.set(scene.id, []);
  }

  // 3. Choice target validation and choices on terminal scenes
  for (const choice of data.choices) {
    if (!sceneMap.has(choice.from_scene_id)) {
      errors.push(`Choice '${choice.label || choice.id}' originates from nonexistent scene '${choice.from_scene_id}'.`);
      continue;
    }
    if (!sceneMap.has(choice.next_scene_id)) {
      errors.push(`Choice '${choice.label || choice.id}' points to nonexistent destination scene '${choice.next_scene_id}'.`);
      continue;
    }

    const fromScene = sceneMap.get(choice.from_scene_id)!;
    if (fromScene.is_terminal) {
      errors.push(`Terminal scene '${fromScene.title}' cannot contain outgoing choices.`);
    }

    if (!choice.label || choice.label.trim().length === 0) {
      errors.push(`Choice in scene '${fromScene.title}' has an empty label.`);
    }
    if (!choice.feedback_text || choice.feedback_text.trim().length === 0) {
      errors.push(`Choice '${choice.label}' is missing feedback explanation.`);
    }

    adj.get(choice.from_scene_id)?.push(choice.next_scene_id);
  }

  // Validate terminal scenes have explanations
  const terminalScenes = data.scenes.filter(s => Boolean(s.is_terminal));
  if (terminalScenes.length === 0) {
    errors.push('Scenario must have at least one terminal ending scene.');
  }

  for (const terminal of terminalScenes) {
    if (!terminal.terminal_explanation || terminal.terminal_explanation.trim().length === 0) {
      errors.push(`Terminal scene '${terminal.title}' requires an explanation.`);
    }
    if (!terminal.terminal_outcome_type) {
      errors.push(`Terminal scene '${terminal.title}' requires an outcome type (success, compromise, warning, neutral).`);
    }
  }

  // Non-terminal scenes must have at least one outgoing choice
  for (const scene of data.scenes) {
    if (!scene.is_terminal) {
      const outgoing = adj.get(scene.id) || [];
      if (outgoing.length === 0) {
        errors.push(`Non-terminal scene '${scene.title}' has no outgoing choices.`);
      }
    }
  }

  // 4. Reachability from initial scene (BFS/DFS)
  if (data.initial_scene_id && sceneMap.has(data.initial_scene_id)) {
    const reachable = new Set<string>();
    const queue: string[] = [data.initial_scene_id];
    reachable.add(data.initial_scene_id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const next of adj.get(curr) || []) {
        if (!reachable.has(next)) {
          reachable.add(next);
          queue.push(next);
        }
      }
    }

    // Unreachable scenes check
    for (const scene of data.scenes) {
      if (!reachable.has(scene.id)) {
        errors.push(`Unreachable scene detected: '${scene.title}' (${scene.scene_key}) cannot be reached from the start scene.`);
      }
    }

    // 5. Reachable ending check: verify every reachable scene can reach at least one terminal scene
    const canReachTerminal = new Set<string>();
    for (const term of terminalScenes) {
      canReachTerminal.add(term.id);
    }

    // Reverse reachability or iterate until fixed point
    let changed = true;
    while (changed) {
      changed = false;
      for (const [node, neighbors] of adj.entries()) {
        if (!canReachTerminal.has(node)) {
          if (neighbors.some(n => canReachTerminal.has(n))) {
            canReachTerminal.add(node);
            changed = true;
          }
        }
      }
    }

    for (const sceneId of reachable) {
      if (!canReachTerminal.has(sceneId)) {
        const scene = sceneMap.get(sceneId);
        errors.push(`Scene '${scene?.title || sceneId}' has no path leading to a terminal outcome.`);
      }
    }

    // 6. Cycle detection (DFS with 3 colors: 0=unvisited, 1=visiting, 2=visited)
    const color = new Map<string, number>();
    for (const scene of data.scenes) {
      color.set(scene.id, 0);
    }

    let hasCycle = false;
    const cyclePath: string[] = [];

    function dfs(node: string, path: string[]): boolean {
      color.set(node, 1);
      path.push(sceneMap.get(node)?.title || node);

      for (const next of adj.get(node) || []) {
        if (color.get(next) === 1) {
          path.push(sceneMap.get(next)?.title || next);
          return true; // Cycle detected
        }
        if (color.get(next) === 0) {
          if (dfs(next, path)) return true;
        }
      }

      color.set(node, 2);
      path.pop();
      return false;
    }

    for (const scene of data.scenes) {
      if (color.get(scene.id) === 0) {
        if (dfs(scene.id, cyclePath)) {
          hasCycle = true;
          break;
        }
      }
    }

    if (hasCycle) {
      errors.push(`Cycle detected in scenario graph: ${cyclePath.join(' -> ')}. ScamQuest scenarios must be acyclic.`);
    }
  }

  // 7. Score configuration validation
  if (data.passing_score < 0 || data.passing_score > 100) {
    errors.push(`Passing score must be between 0 and 100 (got ${data.passing_score}).`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
