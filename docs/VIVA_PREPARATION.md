# ScamQuest: Oral Viva Voce Examination Guide
## 15 Concise Model Questions and Technical Answers

**Subject**: Software Engineering IA3 Microproject Evaluation  
**Candidate Preparation**: Full-Stack Architecture, Database Normalization, Security, UML & QA Testing  

---

### Category 1: Problem Definition & Educational Objectives

#### Q1: What specific gap does ScamQuest address in existing cybersecurity awareness solutions?
**Answer**: Traditional campus cybersecurity awareness relies primarily on passive warning emails, static posters, or annual compliance quizzes. These methods fail to instill practical triage skills. ScamQuest provides an interactive, scenario-based simulated inbox where students actively inspect headers, evaluate evidence clues, experience branching consequences, and explore "what-if" alternate decisions in a zero-risk sandbox.

#### Q2: Why is the inclusion of authentic campus communications (Scenario 6) pedagogically critical?
**Answer**: If a training tool only presents scams, students quickly adopt an artificial "report everything" heuristic. In real university operations, indiscriminately reporting or blocking authentic messages (e.g., registrar notices or health compliance deadlines) causes missed academic milestones and overwhelms security analysts with false alarms. Scenario 6 trains discernment by rewarding students for verifying authentic SPF/DKIM signatures and accepting legitimate communications.

---

### Category 2: Full-Stack Architecture & Technology Stack

#### Q3: Explain the architectural pattern of ScamQuest and why this tech stack was selected.
**Answer**: ScamQuest implements a decoupled Client-Server architecture utilizing:
- **Frontend**: React 19 with TypeScript and Tailwind CSS, providing a responsive cybersecurity detective interface.
- **Backend**: Express.js with TypeScript running on Node.js v20+, serving RESTful API endpoints.
- **Database**: Embedded SQLite accessed via `better-sqlite3` with Write-Ahead Logging (WAL) and foreign keys enabled.
This stack was chosen because it executes entirely locally without paid cloud subscriptions, external API keys, or internet dependencies, guaranteeing reproducible evaluation during lab vivas.

#### Q4: How does the application prevent client-side answer tampering or DevTools inspection?
**Answer**: The backend implements strict Information Masking. When an active student queries a scenario or attempt (`GET /api/scenarios/:id` or `GET /api/attempts/:id`), the API controller explicitly redacts `quality_score`, `feedback_text`, `is_optimal`, and evidence `is_legitimate` flags. These values exist solely in the server database and are only dispatched to the client after the student commits a decision or completes the attempt.

---

### Category 3: Database Design & Normalization

#### Q5: Describe the database schema normalization and how scenario versioning is achieved.
**Answer**: The schema is normalized into 9 relational tables: `users`, `scenarios`, `scenario_versions`, `scenes`, `evidence`, `choices`, `attempts`, `attempt_decisions`, and `evidence_selections`. To ensure historical attempts are never invalidated when an administrator edits a scenario, each scenario references immutable `scenario_versions`. Editing a published scenario creates a new version, preserving all past student attempts linked to previous version IDs.

#### Q6: How does the system handle concurrent writes and ensure ACID transactional guarantees?
**Answer**: ScamQuest enables SQLite `WAL` (Write-Ahead Logging) mode and foreign key enforcement (`PRAGMA foreign_keys = ON`). Complex state mutations—such as decision recording combined with score normalization, or practice replay forking—are wrapped in atomic transactions (`db.transaction(...)`). If any step fails, the entire transaction rolls back, preventing corrupt or half-completed attempts.

---

### Category 4: Scoring Algorithm & Mathematical Normalization

#### Q7: Detail the authoritative scoring formula and explain how branch depth bias is eliminated.
**Answer**: Total score is authoritatively computed on the server and bounded between 0–100:
$$\text{Total Score} = \text{Decision Quality (0–70 pts)} + \text{Evidence Triage (0–30 pts)}$$
To prevent bias between short branches (e.g., 2 decisions) and long branches (e.g., 4 decisions), decision quality is normalized against the maximum possible score for the specific traversed path:
$$\text{Decision Score} = \min\left(70, \frac{\sum \max(0, Q_i)}{N_{\text{steps}} \times 10} \times 70\right)$$
Evidence triage is normalized against total available clues:
$$\text{Evidence Score} = \min\left(30, \frac{N_{\text{correct}}}{N_{\text{total}}} \times 30\right)$$

#### Q8: How is the 1–5 confidence rating utilized, and why does it not inflate the student's score?
**Answer**: Prior to terminal decisions, students submit a confidence rating from 1 (low certainty) to 5 (definitive certainty). This rating is captured solely for metacognitive calibration—allowing instructors to correlate student confidence with actual correctness. Confidence deliberately does not increase the score to prevent students from artificially inflating points on lucky guesses.

---

### Category 5: UML Models & State Transitions

#### Q9: Walk through the Attempt Lifecycle State Machine and explain the Practice Replay transition.
**Answer**: An attempt moves through five distinct states:
1. **Created**: Attempt record allocated and linked to the scenario version.
2. **InProgress**: Active scene rendered; evidence tagged and intermediate choices recorded.
3. **AwaitingFinalDecision**: Terminal choices reached; confidence check modal triggered.
4. **Completed**: Terminal consequence rendered, scores locked, and attempt finalized.
5. **PracticeReplay**: When a student forks an earlier scene, a new attempt is instantiated with `is_replay = 1` and `parent_attempt_id` referencing the original. The official completed attempt and score remain immutable.

#### Q10: How does the Sequence Diagram illustrate decision submission and server transaction flow?
**Answer**: The sequence diagram models the chronological exchange: The student submits `{ choiceId, conf }` &rarr; Express auth middleware validates the HMAC token &rarr; Attempt controller opens an ACID transaction &rarr; Validates choice belongs to current scene &rarr; Commits `attempt_decisions` &rarr; Queries next scene &rarr; If terminal, invokes `ScoringService` to compute normalized scores and updates attempt status to `completed` &rarr; Commits transaction &rarr; Dispatches JSON consequence to UI.

---

### Category 6: Graph Integrity Validation & Admin Governance

#### Q11: What structural algorithms does the Scenario Publication Validator employ?
**Answer**: The validator uses Depth-First Search (DFS) with a three-color cycle detection algorithm (White = unvisited, Gray = visiting, Black = visited) to enforce that scenarios are strictly Directed Acyclic Graphs (DAGs). Additionally, Breadth-First Search (BFS) verifies that all scenes are reachable from the starting node, and reverse reachability verifies that every path terminates at a valid outcome scene with complete feedback explanations.

---

### Category 7: Software Testing & Quality Assurance

#### Q12: Summarize your automated test suite and how isolation was achieved.
**Answer**: The test suite comprises 34 automated test cases executed via Vitest and Supertest across four files: `scoring.test.ts`, `validator.test.ts`, `api.test.ts`, and `more_tests.test.ts`. Test isolation is maintained by configuring a dedicated SQLite file (`test-scamquest.db`) that is migrated and seeded before test execution and unlinked after completion, preventing test bleed into development data.

#### Q13: What boundary and negative test cases were specifically designed and verified?
**Answer**: 
- **Negative tests**: Rejecting login with incorrect passwords (TC-14), rejecting non-admin access to publish routes (TC-30), rejecting duplicate decision submissions on finished attempts (TC-31).
- **Boundary tests**: Score normalization capping at 70 points under overflow values (TC-25), total score capped at 100 points (TC-26), confidence ratings bounded strictly to 1–5 (TC-32), cycle detection on looped scenario graphs (TC-09).

---

### Category 8: Security, Role Governance & Limitations

#### Q14: How are privilege escalation and attempt ownership attacks mitigated?
**Answer**:
1. **Registration Privilege Escalation**: In `POST /api/auth/register`, the user role is unconditionally set to `'student'` on the server regardless of incoming request payload attributes.
2. **Horizontal ID Manipulation**: All attempt routes (`/api/attempts/:id`) verify `attempt.user_id === req.user.id`. If a student attempts to inspect or mutate another student's attempt ID, the server returns HTTP 403 Forbidden.

#### Q15: What are the current limitations of ScamQuest, and how could it be expanded in future work?
**Answer**:
- **Current Limitations**: Operates on a single-node SQLite database; uses simulated static messages with RFC 2606 fictional domains; does not guarantee immunity from real-world spear phishing.
- **Future Enhancements**: Integration with institutional Single Sign-On (SAML/LTI standard for Canvas/Blackboard integration), adaptive difficulty scaling based on diagnostic failure rates, and multi-language localization for international student cohorts.
