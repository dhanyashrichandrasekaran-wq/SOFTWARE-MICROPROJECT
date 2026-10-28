# ScamQuest: Requirements Traceability Matrix (RTM)

**Project**: ScamQuest (Software Engineering IA3 Microproject)  
**Standard**: IEEE 830 / ISO/IEC/IEEE 29148 Traceability Standard  
**Scope**: Full bidirectional mapping from Software Requirements &rarr; Architecture & Implementation &rarr; UML Models &rarr; Test Cases.

---

## Traceability Mapping Table

| Req ID | Requirement Description | Implemented Module / API | Related UML Diagram | Test Case IDs |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Student registration with role boundary enforcement | `server/routes/auth.ts`<br>`POST /api/auth/register` | Use Case: UC-01<br>Class: User | TC-13 |
| **FR-02** | Bcrypt password hashing & credential verification | `server/services/auth.ts`<br>`hashPassword()`, `verifyPassword()` | Class: User<br>Sequence: Step 3 | TC-14, TC-28 |
| **FR-03** | Cryptographic session token creation & validation | `server/services/auth.ts`<br>`createToken()`, `verifyToken()` | Sequence: Step 3<br>Class: User | TC-12, TC-34 |
| **FR-04** | Role-based authorization & permission middleware | `server/services/auth.ts`<br>`requireAuth()`, `requireAdmin()` | Use Case: UC-12<br>Class: UserRole | TC-29, TC-30 |
| **FR-05** | Scenario catalog presentation & filtering | `server/routes/scenarios.ts`<br>`GET /api/scenarios` | Use Case: UC-03<br>Class: Scenario | TC-15, TC-22 |
| **FR-06** | Multi-factor filtering (category, difficulty, query) | `src/components/ScenarioLibrary.tsx` | Use Case: UC-03<br>Activity: Step 1 | TC-15 |
| **FR-07** | Simulated messaging channels (email, sms, chat, marketplace) | `src/components/InvestigationRoom.tsx`<br>`server/routes/scenarios.ts` | Class: Scene<br>Activity: Step 2 | TC-15, TC-20 |
| **FR-08** | Evidence clue tagging (Suspicious / Legitimate) | `server/routes/attempts.ts`<br>`POST /api/attempts/:id/evidence` | Use Case: UC-06<br>Class: EvidenceSelection | TC-04, TC-05, TC-19 |
| **FR-09** | Safe in-sandbox plain-text URL & dossier inspector | `src/components/InvestigationRoom.tsx` | Use Case: UC-05<br>Activity: Fork 1-3 | TC-15, TC-20 |
| **FR-10** | Answer key and scoring masking for student safety | `server/routes/scenarios.ts`<br>`GET /api/scenarios/:id` | Class: ScenarioVersion<br>Sequence: Step 6 | TC-16 |
| **FR-11** | Branching decision execution & scene transitions | `server/routes/attempts.ts`<br>`POST /api/attempts/:id/decision` | Sequence: Steps 1-17<br>State Machine: InProgress | TC-20, TC-31 |
| **FR-12** | Metacognitive confidence rating prompt (1 to 5) | `server/routes/attempts.ts`<br>`POST /api/attempts/:id/confidence` | State Machine: AwaitingFinal<br>Use Case: UC-07 | TC-20, TC-32 |
| **FR-13** | Deterministic authoritative scoring (0–100 pts) | `server/services/scoring.ts`<br>`calculateDecisionScore()`, `computeTotalScore()` | Class: ScoringService<br>Sequence: Steps 10-15 | TC-01, TC-02, TC-03, TC-06, TC-25, TC-26, TC-27 |
| **FR-14** | State persistence and automatic resume across refreshes | `server/routes/attempts.ts`<br>`POST /api/attempts/start` | Activity: Decision loop<br>State Machine: Created | TC-17 |
| **FR-15** | Alternate outcome practice replay instantiation | `server/routes/attempts.ts`<br>`POST /api/attempts/:id/replay` | Use Case: UC-10<br>State Machine: PracticeReplay | TC-21 |
| **FR-16** | Replay score isolation (official score preservation) | `server/routes/attempts.ts`<br>`is_replay = 1` logic | Class: Attempt (Self-Ref)<br>Sequence: Alternate Flow | TC-21 |
| **FR-17** | Scenario graph publication validation (acyclic, reachable) | `server/services/validator.ts`<br>`validateScenarioForPublication()` | Use Case: UC-13<br>Class: GraphValidator | TC-07, TC-08, TC-09, TC-10, TC-11, TC-24 |
| **FR-18** | Scenario draft, publish, and archiving lifecycle | `server/routes/scenarios.ts`<br>`POST /api/scenarios/:id/archive` | Use Case: UC-14, UC-15<br>Class: ScenarioStatus | TC-23, TC-33 |
| **NFR-01** | Sub-150ms response latency on decision execution | `server/routes/attempts.ts` | Sequence Diagram | TC-20 (Executed in 27ms) |
| **NFR-02** | Transaction execution duration < 25ms in WAL mode | `server/db.ts` | Sequence: Step 5-15 | TC-20, TC-21 (Commit < 5ms) |
| **NFR-03** | Attempt ownership isolation (cross-tenant safety) | `server/routes/attempts.ts` | Class: User - Attempt | TC-18 |
| **NFR-04** | Parameterized query SQL injection defense | `server/db.ts`, `server/seed.ts` | Data: SQLite Engine | TC-13, TC-14, TC-18 |
| **NFR-05** | Accessible contrast & keyboard navigation | `src/index.css`, `src/components/*` | UI Presentation | Manual & DOM verified |
| **NFR-06** | Multi-modal status cues (no color-alone meaning) | `src/components/InvestigationRoom.tsx` | Activity Diagram | UI verified |
| **NFR-07** | Automated test coverage &ge; 30 meaningful tests | `server/*.test.ts` (34 test cases) | Test Execution Suite | All 34 tests PASS |
| **NFR-08** | 100% offline local standalone execution (zero paid/AI APIs) | Entire client/server codebase | System Architecture | Verified via `localhost:3000` |

---

## Verification Summary
- **100% of Functional Requirements (FR-01 through FR-18)** are mapped directly to concrete backend controllers, services, database tables, and automated test cases.
- **100% of Nonfunctional Requirements (NFR-01 through NFR-08)** are satisfied and verified by automated execution benchmarks or design proofs.
- Zero unverified or orphaned requirements exist in the codebase.
