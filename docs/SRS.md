# Software Requirements Specification (SRS)
## ScamQuest: Digital Scam Awareness and Training System

**Document Version**: 1.0.0  
**Status**: Approved Academic IA3 Deliverable  
**Standard Compliance**: Adapted from IEEE 830 / ISO/IEC/IEEE 29148  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **ScamQuest**, an interactive scenario-based cybersecurity awareness and training web application. This specification defines functional behaviors, performance benchmarks, safety constraints, and interface designs for students and instructors.

### 1.2 Scope
ScamQuest provides a simulated messaging and email environment wherein students review suspicious and legitimate digital communications, perform evidence analysis, take branching actions, and experience educational consequences. It includes administrative oversight, scenario integrity validation, and alternate outcome replay capabilities.

### 1.3 Definitions, Acronyms, and Abbreviations
- **MFA / 2FA**: Multi-Factor Authentication / Two-Factor Authentication.
- **OTP**: One-Time Password or verification code.
- **DKIM / SPF**: DomainKeys Identified Mail / Sender Policy Framework email authentication records.
- **SSO**: Single Sign-On campus identity gateway.
- **Acyclic Graph**: A directed graph containing no closed loops/cycles, ensuring all scenario branches progress deterministically toward terminal outcomes.
- **Replay Fork**: A practice branch instantiated from an existing completed attempt node without altering the parent attempt.

---

## 2. Overall Description

### 2.1 Product Perspective
ScamQuest operates as a self-contained full-stack client-server system. The frontend executes in modern web browsers (Chrome, Firefox, Safari, Edge), communicating via JSON over HTTP REST APIs with an Express.js application server backed by an ACID-compliant SQLite database.

```
+-----------------------------------------------------------+
|                    Browser Frontend                       |
|  (React 19, TypeScript, Tailwind CSS, Accessible HUD)     |
+-----------------------------+-----------------------------+
                              | JSON REST / HTTP Cookies
+-----------------------------v-----------------------------+
|                   Node.js Express Server                  |
|  - Auth & Role Middleware    - Deterministic Scoring      |
|  - Graph Validation Service  - Replay Fork Controller     |
+-----------------------------+-----------------------------+
                              | Foreign Keys & WAL Mode
+-----------------------------v-----------------------------+
|                   SQLite Database Engine                  |
|  (Users, Scenarios, Versions, Scenes, Choices, Attempts)  |
+-----------------------------------------------------------+
```

### 2.2 User Classes and Characteristics
1. **Student Learner**: College students with varied technical proficiency. Requires intuitive controls, clear evidence cues, readable contrast, and immediate educational feedback.
2. **Security Instructor / Administrator**: Faculty member or security officer responsible for managing educational scenarios, monitoring student accuracy, and reviewing diagnostic metrics.

### 2.3 Operating Environment & Constraints
- **Hardware**: Standard workstation/laptop (dual-core CPU, 2 GB RAM minimum).
- **Runtime**: Node.js v20+ with TypeScript execution (`tsx`).
- **Network**: Operates entirely offline on `localhost:3000`; zero cloud API or internet dependencies.
- **Data Safety**: All simulated hyperlinks use plain text and reserved RFC 2606 test domains (`example.com`, `example.edu`). No real passwords, credit cards, or external network requests are permitted.

---

## 3. Functional Requirements

### 3.1 User Authentication & Role Governance
- **FR-01 (Secure Registration)**: The system shall permit students to register with an email, name, and password (minimum 8 characters). The backend shall unconditionally assign the `student` role; user-supplied role inputs shall be ignored.
- **FR-02 (Password Hashing)**: The system shall hash passwords using `bcrypt` (salt rounds &ge; 10) before committing to storage. Passwords shall never be stored in plain text.
- **FR-03 (Session Handling)**: The system shall issue cryptographically signed session tokens (HMAC-SHA256) valid for 24 hours and transmitted via HTTP-only cookies or Bearer headers.
- **FR-04 (Role-Based Authorization)**: The system shall enforce endpoint authorization. Administrator routes (`/api/scenarios/:id/publish`, `/api/scenarios/:id/archive`, `/api/analytics/admin`) shall return HTTP 403 Forbidden to non-admin tokens.

### 3.2 Scenario Catalog & Filtering
- **FR-05 (Scenario Presentation)**: The system shall present all published scenarios displaying title, category, difficulty rating, estimated duration, and personal completion status.
- **FR-06 (Multi-Factor Filtering)**: The system shall filter scenario lists by category, difficulty level, and text query without requiring full page reload.

### 3.3 Investigation & Triage Mechanics
- **FR-07 (Simulated Messaging Channels)**: The system shall render message scenarios in dedicated simulated channel views (Email, SMS, Peer Chat, Marketplace).
- **FR-08 (Evidence Clue Triage)**: The system shall allow students to tag evidence items as either "Suspicious" or "Legitimate", updating evidence scores in real time.
- **FR-09 (Safe Link & Dossier Inspection)**: The system shall provide an in-sandbox plain-text URL inspector and organization dossier tool without triggering external browser navigation.
- **FR-10 (Information Masking)**: The system shall redact answer keys, clue explanations, choice quality scores, and optimal flags from client API responses during active attempts.

### 3.4 Branching Decisions & Authoritative Scoring
- **FR-11 (Branching Decision Execution)**: The system shall advance student attempts across scenario scenes based on selected choices. Terminal scenes shall terminate the attempt.
- **FR-12 (Metacognitive Confidence Rating)**: The system shall prompt students to submit a confidence rating (integer 1 to 5) before finalizing terminal decisions. The rating shall be recorded for analysis but shall not alter the score.
- **FR-13 (Authoritative Deterministic Scoring)**: The server shall authoritatively compute total scores (0–100 points) comprised of:
  $$\text{Total Score} = \text{Decision Quality (0–70 pts)} + \text{Evidence Triage (0–30 pts)}$$
  Decision quality shall be normalized across branches of variable depth:
  $$\text{Decision Score} = \min\left(70, \frac{\sum \max(0, Q_i)}{N \times 10} \times 70\right)$$
- **FR-14 (Save and Automatic Resume)**: The system shall persist attempt state upon every decision or evidence selection. Unfinished attempts shall automatically resume upon subsequent logins or browser refreshes.

### 3.5 Alternate Outcome Practice Replay
- **FR-15 (Replay Fork Instantiation)**: Upon completing an official attempt, the system shall allow the user to instantiate an alternate replay attempt (`is_replay = 1`) branching from any non-terminal visited scene.
- **FR-16 (Score Preservation)**: The system shall strictly isolate replay attempts from the user's official attempt record, ensuring official scores, grade benchmarks, and dashboard statistics remain unmodified.

### 3.6 Scenario Governance & Graph Publication Validation
- **FR-17 (Scenario Integrity Validation)**: The system shall validate scenario graphs before publication. The validator shall reject:
  1. Missing title or initial scene.
  2. Choices targeting non-existent scene IDs.
  3. Orphaned/unreachable scenes.
  4. Branches lacking a path to a terminal outcome.
  5. Cycles/loops (enforcing Directed Acyclic Graphs via DFS).
  6. Empty choice labels or missing feedback explanations.
- **FR-18 (Draft and Archive Lifecycle)**: The system shall support Draft, Published, and Archived lifecycle states. Archiving a scenario shall preserve all existing student historical attempts.

---

## 4. Nonfunctional Requirements

### 4.1 Performance Requirements
- **NFR-01 (API Response Latency)**: Decision submissions, evidence selections, and scene transitions shall complete with a server response latency &lt; 150 ms under a local test workload of 50 concurrent requests, measured via automated integration benchmarks.
- **NFR-02 (Database Transaction Duration)**: SQLite ACID transactions shall commit in &lt; 25 ms in WAL mode on standard NVMe/SATA storage.

### 4.2 Security Requirements
- **NFR-03 (Attempt Ownership Isolation)**: Students shall be prohibited from viewing or modifying attempts created by other users; violations shall return HTTP 403.
- **NFR-04 (Input Sanitization)**: All incoming payloads shall be sanitized and bounded to prevent SQL injection (via parameterized queries) and Cross-Site Scripting (XSS).

### 4.3 Usability and Accessibility
- **NFR-05 (Accessibility & Contrast)**: UI elements shall satisfy WCAG 2.1 Level AA color contrast standards (&ge; 4.5:1 for body text). Interactive elements shall feature visible focus indicators.
- **NFR-06 (Multi-Modal Indicators)**: System states (success, warning, error) shall not rely on color alone; icons, textual labels, and ARIA attributes shall accompany all alerts.

### 4.4 Reliability & Maintainability
- **NFR-07 (Automated Test Coverage)**: The codebase shall maintain at least 30 automated test cases with 100% passing results covering unit rules, integration flows, and edge cases.
- **NFR-08 (Zero External Dependency)**: After installation, the application shall run completely disconnected from the internet, requiring zero external cloud subscriptions or API keys.

---

## 5. Data Requirements & Schema Specifications

- **DR-01 (Users Table)**: `id (PK)`, `email (UNIQUE)`, `name`, `password_hash`, `role ('student'|'admin')`, `created_at`.
- **DR-02 (Scenarios Table)**: `id (PK)`, `slug (UNIQUE)`, `title`, `category`, `difficulty`, `estimated_minutes`, `description`, `status ('draft'|'published'|'archived')`, `current_version_id`, `created_at`, `updated_at`.
- **DR-03 (Scenes Table)**: `id (PK)`, `version_id (FK)`, `scene_key`, `title`, `sender_name`, `sender_address`, `subject`, `timestamp_label`, `body_content`, `channel_type`, `is_terminal`, `terminal_outcome_type`, `terminal_explanation`.
- **DR-04 (Choices Table)**: `id (PK)`, `version_id (FK)`, `from_scene_id (FK)`, `next_scene_id (FK)`, `choice_key`, `label`, `description`, `quality_score`, `feedback_text`, `is_optimal`.
- **DR-05 (Attempts Table)**: `id (PK)`, `user_id (FK)`, `scenario_id (FK)`, `version_id (FK)`, `current_scene_id`, `status`, `confidence_rating`, `decision_score`, `evidence_score`, `total_score`, `is_replay`, `parent_attempt_id (FK)`, `started_at`, `completed_at`.

---

## 6. Detailed Use Cases

### Use Case UC-01: Investigate and Complete Scenario Attempt
- **Actor**: Student Investigator
- **Preconditions**: Student is authenticated; scenario is in `published` status.
- **Main Flow**:
  1. Student selects scenario from library.
  2. System initializes or resumes attempt, displaying initial scene message.
  3. Student examines sender details and inspects link URL safely.
  4. Student tags identified clues in Evidence panel as "Suspicious" or "Legitimate".
  5. Student selects an action choice. System records decision and renders consequence.
  6. Prior to final decision, system prompts for confidence rating (1–5).
  7. Student submits confidence rating and final choice.
  8. System evaluates terminal scene, computes authoritative scores, and displays outcome explanation.
- **Postconditions**: Attempt status transitions to `completed`; score and analytics update on dashboard.

### Use Case UC-02: Alternate Outcome Practice Replay
- **Actor**: Student Investigator
- **Preconditions**: Student has at least one `completed` attempt on target scenario.
- **Main Flow**:
  1. Student navigates to completed scenario and reviews decision audit trail.
  2. Student selects "Fork Step X: Explore Alternate Replay".
  3. System creates new attempt record marked `is_replay = 1` linked to parent attempt.
  4. Student selects an alternate, riskier, or suboptimal branch.
  5. System presents alternate branching narrative and consequence.
- **Postconditions**: Original attempt and official score remain unmodified; student gains experiential feedback on alternate failure modes.

### Use Case UC-03: Scenario Validation and Publication
- **Actor**: Security Administrator
- **Preconditions**: Administrator is authenticated.
- **Main Flow**:
  1. Administrator creates or modifies scenario scenes, choices, and evidence cards.
  2. Administrator clicks "Validate Scenario".
  3. System executes graph integrity verification (cycle detection, terminal reachability, feedback check).
  4. If errors are detected, system displays itemized violation list; publishing is blocked.
  5. If validation passes, administrator clicks "Publish to Library".
- **Postconditions**: Scenario status changes to `published`; available to students.
