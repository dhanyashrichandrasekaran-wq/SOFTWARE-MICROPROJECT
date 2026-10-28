# ScamQuest: Test Cases & Execution Specification

**Project**: ScamQuest (Software Engineering IA3 Microproject)  
**Test Framework**: Vitest v5.0.5 with Supertest v7.3.1 & Node Test Runner  
**Database**: Isolated SQLite Test Database (`test-scamquest.db`)  
**Total Automated Test Cases**: 34  
**Total Passed**: 34 (100% Pass Rate)  
**Total Failed**: 0  

---

## Test Cases Summary Table

| Test Case ID | Req ID | Test Objective | Category | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | FR-13 | Normalize decision score to max 70 points across optimal choices | Unit / Scoring | PASS |
| **TC-02** | FR-13 | Normalize decisions across branches with different decision counts | Unit / Scoring | PASS |
| **TC-03** | FR-13 | Handle suboptimal and partial choices correctly | Unit / Scoring | PASS |
| **TC-04** | FR-08 | Evaluate suspicious vs legitimate evidence identification | Unit / Scoring | PASS |
| **TC-05** | FR-13 | Normalize evidence score to max 30 points | Unit / Scoring | PASS |
| **TC-06** | FR-13 | Compute authoritative total score bounded between 0 and 100 | Unit / Scoring | PASS |
| **TC-07** | FR-17 | Validate correct acyclic scenario graph with reachable terminals | Unit / Validation | PASS |
| **TC-08** | FR-17 | Reject scenario with missing title or starting scene | Negative / Validation | PASS |
| **TC-09** | FR-17 | Detect and reject cycles/loops in scenario graph (DFS) | Boundary / Validation | PASS |
| **TC-10** | FR-17 | Detect and reject unreachable/orphaned scenes | Negative / Validation | PASS |
| **TC-11** | FR-17 | Detect and reject branches with no path to terminal outcome | Negative / Validation | PASS |
| **TC-12** | NFR-08 | Verify system health check and SQLite operational status | Integration / System | PASS |
| **TC-13** | FR-01 | Enforce student role on registration; block privilege escalation | Security / Auth | PASS |
| **TC-14** | FR-02 | Reject login with incorrect password | Negative / Auth | PASS |
| **TC-15** | FR-05 | Retrieve published scenarios for authenticated student | Functional / API | PASS |
| **TC-16** | FR-10 | Mask answer keys and hidden scoring from student scenario payload | Security / Integrity | PASS |
| **TC-17** | FR-14 | Start new attempt and automatically resume active attempt | Functional / State | PASS |
| **TC-18** | NFR-03 | Enforce attempt ownership; block cross-user attempt inspection | Security / RBAC | PASS |
| **TC-19** | FR-08 | Record evidence selection and recalculate score in real-time | Integration / Evidence | PASS |
| **TC-20** | FR-11 | Execute decision submission, confidence capture, and completion | Integration / Workflow | PASS |
| **TC-21** | FR-15, FR-16 | Initialize practice replay without modifying original attempt or score | Functional / Replay | PASS |
| **TC-22** | FR-05 | Retrieve student dashboard statistics and weakness breakdown | Functional / Dashboard | PASS |
| **TC-23** | FR-18 | Retrieve administrator telemetry and cohort failure rates | Functional / Admin | PASS |
| **TC-24** | FR-17 | Validate scenario graph via administrator endpoint | Integration / Admin | PASS |
| **TC-25** | FR-13 | Boundary test: Decision score normalization never exceeds 70 pts | Boundary / Scoring | PASS |
| **TC-26** | FR-13 | Boundary test: Total score capped at 100 pts under overflow inputs | Boundary / Scoring | PASS |
| **TC-27** | FR-13 | Boundary test: Total score correctly processes all zero scores | Boundary / Scoring | PASS |
| **TC-28** | FR-02 | Bcrypt hashing produces secure hashes and verifies correctly | Unit / Security | PASS |
| **TC-29** | FR-04 | Reject unauthenticated access to protected routes with HTTP 401 | Security / Auth | PASS |
| **TC-30** | FR-04 | Reject non-admin user from admin-only endpoints with HTTP 403 | Security / RBAC | PASS |
| **TC-31** | FR-11 | Reject duplicate decision submission on completed attempt with HTTP 400 | Negative / Decision | PASS |
| **TC-32** | FR-12 | Reject invalid confidence ratings outside 1–5 range with HTTP 400 | Boundary / Input | PASS |
| **TC-33** | FR-18 | Verify historical student attempts survive scenario archiving/updating | Integration / Lifecycle | PASS |
| **TC-34** | FR-03 | Verify logout endpoint clears authentication session cookie | Functional / Auth | PASS |

---

## Detailed Test Case Specifications

### TC-01: Normalize decision score to max 70 points
- **Associated Requirement**: FR-13
- **Objective**: Verify that 100% optimal choices normalize to exactly 70 decision points.
- **Preconditions**: Scoring service imported.
- **Procedure**: Invoke `calculateDecisionScore` with three optimal choices (`qualityScore = 10`).
- **Input Data**: `[{ qualityScore: 10 }, { qualityScore: 10 }, { qualityScore: 10 }]`
- **Expected Result**: Score = 70.0, raw = 30, maxRaw = 30.
- **Actual Result**: `score: 70, raw: 30, maxRaw: 30`.
- **Status**: PASS.

### TC-02: Normalize decisions across branches with different decision counts
- **Associated Requirement**: FR-13
- **Objective**: Verify that score normalization eliminates branch length bias.
- **Preconditions**: Scoring service initialized.
- **Procedure**: Compare 2-step optimal branch against 4-step optimal branch.
- **Input Data**: Branch A (2x10), Branch B (4x10).
- **Expected Result**: Both branches normalize to exactly 70.0 points.
- **Actual Result**: `branchA.score == 70` and `branchB.score == 70`.
- **Status**: PASS.

### TC-09: Detect and reject cycles/loops in scenario graph
- **Associated Requirement**: FR-17
- **Objective**: Ensure DFS validator prevents cyclic scenario loops.
- **Preconditions**: Validator service loaded.
- **Procedure**: Pass scenario graph where scene 3 links back to scene 1.
- **Input Data**: Graph with edges S1&rarr;S2, S2&rarr;S3, S3&rarr;S1.
- **Expected Result**: `valid: false`, error contains "Cycle detected in scenario graph".
- **Actual Result**: `valid: false`, error: `Cycle detected in scenario graph: Start -> Step 2 -> Step 3 -> Start`.
- **Status**: PASS.

### TC-13: Enforce student role on registration
- **Associated Requirement**: FR-01
- **Objective**: Prevent privilege escalation during registration.
- **Preconditions**: Server running.
- **Procedure**: `POST /api/auth/register` with body `{ role: "admin" }`.
- **Input Data**: `{ email: "attacker@scamquest.edu", role: "admin" }`.
- **Expected Result**: User created with `role = "student"`.
- **Actual Result**: HTTP 201 Created, `res.body.user.role === 'student'`.
- **Status**: PASS.

### TC-16: Mask answer keys from student scenario payload
- **Associated Requirement**: FR-10
- **Objective**: Prevent students from inspecting DevTools for clue answers or choice scores.
- **Preconditions**: Authenticated student session token.
- **Procedure**: `GET /api/scenarios/scen-01`.
- **Input Data**: Student Bearer token.
- **Expected Result**: `is_legitimate`, `explanation`, `quality_score`, `feedback_text` undefined.
- **Actual Result**: All four sensitive fields undefined in payload.
- **Status**: PASS.

### TC-17: Start new attempt and automatically resume active attempt
- **Associated Requirement**: FR-14
- **Objective**: Verify that re-opening an active scenario resumes rather than duplicates attempt.
- **Preconditions**: Authenticated student account.
- **Procedure**: Call `POST /api/attempts/start` twice for the same scenario.
- **Input Data**: `{ scenarioId: "scen-02" }`.
- **Expected Result**: Call 1 returns 201 (new attempt); Call 2 returns 200 with `resumed: true` and identical `attemptId`.
- **Actual Result**: `resumed: true`, identical attempt ID returned.
- **Status**: PASS.

### TC-18: Enforce attempt ownership isolation
- **Associated Requirement**: NFR-03
- **Objective**: Block cross-tenant inspection of attempts by ID manipulation.
- **Preconditions**: Student 1 has seeded attempt `att-seed-01`. Student 2 authenticated.
- **Procedure**: Student 2 requests `GET /api/attempts/att-seed-01`.
- **Input Data**: Student 2 Bearer token with Student 1's attempt ID.
- **Expected Result**: HTTP 403 Forbidden with "Forbidden. You do not own this attempt."
- **Actual Result**: HTTP 403, error message verified.
- **Status**: PASS.

### TC-21: Practice replay preserves original attempt and score
- **Associated Requirement**: FR-15, FR-16
- **Objective**: Confirm that alternate replay creates isolated session without modifying original score.
- **Preconditions**: Student has completed attempt `att-seed-01` with score 90.0.
- **Procedure**: Call `POST /api/attempts/att-seed-01/replay`, submit alternate bad choice, then re-query original attempt.
- **Input Data**: `{ forkSceneId: "scn-01-s1" }`, followed by choice `ch-01-1`.
- **Expected Result**: Replay attempt has `is_replay: 1`; original attempt retains `total_score: 90.0` and `is_replay: 0`.
- **Actual Result**: Original attempt score unchanged at 90.0; replay attempt isolated.
- **Status**: PASS.

### TC-31: Reject duplicate decision on completed attempt
- **Associated Requirement**: FR-11
- **Objective**: Prevent score tampering or duplicate submissions on finished attempts.
- **Preconditions**: Attempt is in `completed` status.
- **Procedure**: Submit decision choice to completed attempt.
- **Input Data**: `POST /api/attempts/:id/decision`.
- **Expected Result**: HTTP 400 Bad Request with "Attempt is already completed."
- **Actual Result**: HTTP 400, duplicate execution rejected.
- **Status**: PASS.

### TC-33: Historical attempts survive scenario archiving
- **Associated Requirement**: FR-18
- **Objective**: Ensure administrative archiving does not purge student learning records.
- **Preconditions**: Attempt exists on `scen-01`. Admin archives `scen-01`.
- **Procedure**: Query attempt record after `POST /api/scenarios/scen-01/archive`.
- **Input Data**: `att-seed-01` on archived scenario.
- **Expected Result**: Attempt record remains queryable with intact score.
- **Actual Result**: HTTP 200, attempt details and score 90.0 preserved intact.
- **Status**: PASS.
