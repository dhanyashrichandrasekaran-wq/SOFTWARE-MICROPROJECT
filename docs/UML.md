# ScamQuest: UML Architecture & Behavioral Models

**Project**: ScamQuest (Software Engineering IA3 Microproject)  
**Standard**: OMG Unified Modeling Language (UML) Specification 2.5.1  
**Source Directory**: `docs/diagrams/`  

---

## Overview

This document presents the five core UML diagrams defining the architecture, domain model, interaction sequences, workflows, and state lifecycles of **ScamQuest**:

1. **Use Case Diagram** (`docs/diagrams/use_case.puml`): Actor interactions and system functional boundary.
2. **Class Diagram** (`docs/diagrams/class_diagram.puml`): Domain entities, schema relations, operations, and multiplicities.
3. **Sequence Diagram** (`docs/diagrams/sequence_diagram.puml`): Decision submission, transactional persistence, authoritative scoring, and consequence dispatch.
4. **Activity Diagram** (`docs/diagrams/activity_diagram.puml`): End-to-end investigative triage, safe inspection, branching paths, and replay.
5. **State Machine Diagram** (`docs/diagrams/state_machine.puml`): Attempt lifecycle states (`Created`, `InProgress`, `AwaitingFinalDecision`, `Completed`, `PracticeReplay`, `Abandoned`).

---

## 1. Use Case Diagram

### Purpose & Explanation
The Use Case Diagram establishes the functional boundary of ScamQuest and models the capabilities available to the two primary actors:
- **Student Investigator**: Engages in pedagogical simulations, inspects headers, tags evidence, rates decision confidence, reviews scores, and launches non-destructive practice replays.
- **Security Administrator**: Authors scenario drafts, executes structural graph validation, publishes acyclic cases, archives obsolete scenarios, and audits cohort failure rates.

### Standard Relationships
- `<<include>>`: Executing a decision includes confidence rating calibration prior to terminal branches; publishing a scenario unconditionally includes graph integrity validation.
- `<<extend>>`: Inspecting plain-text URLs extends the message investigation; alternate replay extends review of completed score breakdowns.

### Diagram Source Reference
See full PlantUML file: `docs/diagrams/use_case.puml`

---

## 2. Class Diagram

### Purpose & Explanation
The Class Diagram models the object-oriented and relational domain structure of ScamQuest. It captures implemented domain entities, attributes, visibility, operations, and cardinality.

### Key Classes & Multiplicities
- **User (1) &rarr; (0..*) Attempt**: Each user owns zero or more simulation attempts.
- **Scenario (1) &rarr; (1..*) ScenarioVersion**: Scenarios maintain immutable published versions to preserve historical auditability when edits occur.
- **ScenarioVersion (1) &rarr; (1..*) Scene & Choice**: Version graphs represent directed acyclic scenarios.
- **Attempt (1) &rarr; (0..*) AttemptDecision & EvidenceSelection**: Persists student actions per attempt.
- **Attempt (0..1) &rarr; (0..*) Attempt (Practice Replay)**: Self-association linking practice replays to parent official attempts via `parent_attempt_id`.
- **ScoringService & GraphValidatorService**: Stateless domain services handling deterministic normalization and graph cycle detection.

### Diagram Source Reference
See full PlantUML file: `docs/diagrams/class_diagram.puml`

---

## 3. Sequence Diagram

### Purpose & Explanation
The Sequence Diagram details the runtime message exchanges during decision submission (`POST /api/attempts/:id/decision`). It demonstrates:
1. Client token verification via Express middleware.
2. Transactional locking of attempt state in SQLite.
3. Verification that choice belongs to current scene.
4. Quality score recording in `attempt_decisions`.
5. Server-side authoritative scoring calculation upon reaching a terminal scene:
   - Decision Score (0–70 points) normalized across branch depth.
   - Evidence Score (0–30 points) based on tagged clues.
   - Total score computation (0–100 points) and attempt completion timestamping.
6. Return of consequence explanation and score breakdown to the React client.

### Diagram Source Reference
See full PlantUML file: `docs/diagrams/sequence_diagram.puml`

---

## 4. Activity Diagram

### Purpose & Explanation
The Activity Diagram models the operational workflow of a student conducting an investigation:
- Initial attempt allocation or automatic resumption of in-progress cases.
- Concurrent inspection activities (Sender details, Safe URL text breakdown, Organization dossier).
- Tagging clues as Suspicious or Legitimate with live score calculation.
- Iterative branching through scenes until reaching a terminal ending.
- Score finalization and optional fork into Alternate Practice Replay.

### Diagram Source Reference
See full PlantUML file: `docs/diagrams/activity_diagram.puml`

---

## 5. State Machine Diagram

### Purpose & Explanation
The State Machine Diagram documents the lifecycle transitions of an investigation attempt:
- **Created**: Initial node allocation and version binding.
- **InProgress**: Intermediate scenes; student tags evidence and executes branching decisions.
- **AwaitingFinalDecision**: Terminal branch reached; system prompts for 1–5 confidence check.
- **Completed**: Decision and evidence scores computed; attempt locked against mutation.
- **PracticeReplay**: Forked practice session (`is_replay = 1`); allows testing alternate bad/good choices while strictly preserving the official completed score.
- **Abandoned**: Inactivity timeout state.

### Diagram Source Reference
See full PlantUML file: `docs/diagrams/state_machine.puml`
