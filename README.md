# ScamQuest: Interactive Digital Scam Awareness & Training System

**Software Engineering IA3 Academic Microproject**  
**Architecture**: React 19 + TypeScript + Vite | Express.js + TypeScript | SQLite3 (`better-sqlite3`)  
**Design Contribution**: Branching Scenario Investigations & Non-Destructive Alternate Outcome Replay Engine  

---

## 1. Project Overview

**ScamQuest** is an interactive, scenario-based cybersecurity awareness and training web application designed for undergraduate and graduate college students. Students investigate realistic deceptive messages across simulated digital communication channels (Email, SMS, Peer Chat, and Student Marketplace), inspect technical evidence clues, execute branching decisions, and observe realistic consequences without risk.

### Distinctive Pedagogical Feature: Alternate Outcome Replay
After completing an official attempt, the student can revisit any historical decision node and fork into a practice replay session (`is_replay = 1`). Students can explore what a riskier or catastrophic decision would have caused (such as account takeover or financial extortion) without penalizing, resetting, or altering their official certified score.

---

## 2. Prerequisites & Supported Runtime

- **Node.js**: `v20.0.0` or higher (`v22.x` recommended)
- **Package Manager**: `npm` (v10+)
- **Operating System**: Linux, macOS, or Windows (WSL2 recommended)
- **External Dependencies**: Zero external cloud services, API keys, or internet access required after installation.

---

## 3. Installation & Setup

1. **Clone or Navigate to the Project Root**:
   ```bash
   cd /app/applet
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` (optional; defaults work automatically on `localhost:3000`):
   ```bash
   cp .env.example .env
   ```

4. **Initialize and Seed the Database**:
   The SQLite database (`scamquest.db`) automatically initializes its schema and seeds all 6 scenarios and demo accounts on server startup. You can also manually run the seed script:
   ```bash
   npx tsx server/seed.ts
   ```

---

## 4. Execution Commands

### Development Server (Recommended)
Starts the integrated full-stack server (Express backend mounting Vite frontend middleware) on port 3000:
```bash
npm run dev
```
Open your browser to: **`http://localhost:3000`**

### Production Build & Execution
Build the production bundle and launch the optimized Express production server:
```bash
npm run build
npm run start
```

### Automated Testing Suite
Execute the 34 automated unit, integration, and boundary test cases via Vitest:
```bash
npm test
```
Or run in watch mode:
```bash
npx vitest
```

---

## 5. Seeded Scenarios & Demo Accounts

### Included Playable Scenarios
1. **Employment Scams**: *Campus Career Hub: Vertex Global Remote Paid Internship* ($150 advance equipment deposit demand).
2. **Scholarship & Financial Aid**: *State Higher-Ed Foundation: Merit Grant Award Verification* (Soliciting SSN and online banking passwords).
3. **IT & Credential Phishing**: *University IT Services: Mandatory Duo/SSO Re-authentication* (Spoofed lookalike portal with 3-hour timer).
4. **Marketplace & E-Commerce**: *Campus Exchange: MacBook Pro Sale Escrow Scam* (Off-platform communication and $100 courier gift card demand).
5. **Social Engineering & Account Takeover**: *Senior Project Group Admin: Transfer Code Verification* (Impersonated classmate requesting 6-digit WhatsApp OTP).
6. **Authentic Communications**: *Campus Health & Registrar: Annual Health Record Verification* (Legitimate university notice; tests false-positive discrimination).

### Evaluation Credentials (Development Only)

| Role | Name | Email | Password | Pre-seeded State |
| :--- | :--- | :--- | :--- | :--- |
| **Student 1** | Alex Rivera | `alex.student@scamquest.edu` | `StudentPass123!` | Pre-seeded completed attempt on Scenario 1 (Score 90) and active attempt on Scenario 3 for immediate Save & Resume evaluation. |
| **Student 2** | Sam Chen | `sam.student@scamquest.edu` | `StudentPass123!` | Fresh, unattempted student account for testing clean-slate onboarding. |
| **Administrator** | Prof. Eleanor Vance | `admin@scamquest.edu` | `AdminPass123!` | Full instructor privileges: Cohort telemetry, scenario creation, and graph integrity validator. |

*Quick Access Note: The login screen and navigation header include one-click evaluator persona buttons to switch between personas seamlessly during demonstrations.*

---

## 6. Project Directory Structure

```
├── docs/                                  # Complete Academic Documentation Suite
│   ├── PROJECT_OVERVIEW.md                # Problem statement, scope, and objectives
│   ├── SRS.md                             # Software Requirements Specification (IEEE 830)
│   ├── UML.md                             # Comprehensive UML architecture descriptions
│   ├── diagrams/                          # Five PlantUML source files
│   │   ├── use_case.puml                  # Use case model with system boundary
│   │   ├── class_diagram.puml             # Domain classes, attributes, and associations
│   │   ├── sequence_diagram.puml          # Transactional decision & scoring flow
│   │   ├── activity_diagram.puml          # Investigative triage workflow
│   │   └── state_machine.puml             # Attempt lifecycle state transitions
│   ├── TEST_CASES.md                      # 34 detailed test cases with execution results
│   ├── TRACEABILITY_MATRIX.md             # Bidirectional requirements traceability
│   ├── TEST_EXECUTION_REPORT.md           # QA execution report with automated breakdown
│   ├── DEMO_GUIDE.md                      # 5-7 minute walkthrough script with exact inputs
│   ├── VIVA_PREPARATION.md                # 15 model answers to examiner questions
│   └── REFERENCES.md                      # Verified literature (Anti-Phishing Phil, SOUPS 2007)
├── server/                                # Backend Express Server & Services
│   ├── db.ts                              # SQLite database connection & schema DDL
│   ├── seed.ts                            # Seed data for scenarios, users, and attempts
│   ├── api.test.ts                        # Supertest API integration suite
│   ├── more_tests.test.ts                 # Boundary and security integration tests
│   ├── routes/                            # Express REST route controllers
│   │   ├── auth.ts                        # Register, login, profile, logout
│   │   ├── scenarios.ts                   # Scenario retrieval, authoring, and archiving
│   │   ├── attempts.ts                    # Decision execution, evidence triage, and replay
│   │   └── analytics.ts                   # Student & administrator dashboard telemetry
│   └── services/                          # Core business logic services
│       ├── auth.ts                        # Password hashing and HMAC session tokens
│       ├── scoring.ts                     # Deterministic authoritative scoring engine
│       ├── scoring.test.ts                # Unit tests for score normalization
│       ├── validator.ts                   # Scenario publication graph integrity validator
│       └── validator.test.ts              # Unit tests for acyclic graph verification
├── src/                                   # Frontend React Application
│   ├── components/                        # UI Components (Cybersecurity Detective theme)
│   │   ├── Navbar.tsx                     # Top navigation with persona quick-switcher
│   │   ├── StudentDashboard.tsx           # Telemetry, resume banner, skill diagnostics
│   │   ├── ScenarioLibrary.tsx            # Scenario catalog with multi-factor filters
│   │   ├── InvestigationRoom.tsx          # Simulated inbox, evidence triage, decisions
│   │   ├── AdminDashboard.tsx             # Scenario governance & graph validator modal
│   │   ├── DocsViewer.tsx                 # In-app SE documentation and viva browser
│   │   └── AuthModal.tsx                  # Login and registration with demo buttons
│   ├── context/                           # React Context providers (AuthContext)
│   ├── services/                          # Typed API client (`api.ts`)
│   ├── types/                             # TypeScript shared interfaces
│   ├── App.tsx                            # Root application view router
│   ├── main.tsx                           # React DOM entry point
│   └── index.css                          # Tailwind CSS styling and theme configuration
├── index.html                             # HTML entry point with synchronized metadata
├── metadata.json                          # Applet configuration and permissions
├── package.json                           # Scripts and dependencies
├── tsconfig.json                          # TypeScript compiler settings
├── vite.config.ts                         # Vite configuration
└── vitest.config.ts                       # Vitest test runner configuration
```

---

## 7. Troubleshooting

- **Port 3000 in Use**: If port 3000 is occupied, set `PORT=3001 npm run dev`.
- **Database Reset**: To completely reset the SQLite database to factory state:
  ```bash
  rm -f scamquest.db*
  npx tsx server/seed.ts
  ```
- **Tests Re-run**: All tests execute against an isolated database (`test-scamquest.db`) that cleans up after itself automatically:
  ```bash
  npm test
  ```

---

## 8. Limitations and Non-Claims

- **Educational Simulation**: ScamQuest is an educational training system. High scores in the simulation do not guarantee immunity from sophisticated real-world spear phishing.
- **Fictional Test Domains**: In accordance with RFC 2606, all simulated links strictly use reserved test domains (`example.com`, `example.edu`, `example.org`, `example.net`). No live external websites are contacted.
- **Single-Node Embedded SQLite**: The persistence engine is optimized for local laboratory evaluation rather than multi-region distributed cloud clustering.
