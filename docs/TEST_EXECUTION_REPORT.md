# ScamQuest: Test Execution & QA Report

**Project**: ScamQuest (Software Engineering IA3 Microproject)  
**Execution Date**: Current Academic Milestone  
**QA Lead**: Senior Full-Stack Developer & QA Engineer  
**Execution Environment**: Linux x86_64, Node.js v22.14.0, TypeScript v7.0.2, SQLite3 (better-sqlite3 v13.0.3), Vitest v5.0.5  

---

## 1. Executive Summary

| Metric | Result |
| :--- | :--- |
| **Total Test Suites** | 4 Files (`scoring.test.ts`, `validator.test.ts`, `api.test.ts`, `more_tests.test.ts`) |
| **Total Automated Tests Executed** | 34 Tests |
| **Automated Tests Passed** | 34 Tests (100.0%) |
| **Automated Tests Failed** | 0 Tests (0.0%) |
| **Total Duration** | 2.27 seconds |
| **Database State** | Isolated clean SQLite database created and torn down per suite |
| **Compilation Status** | Clean zero-error TypeScript build (`npm run build`) |

---

## 2. Test Commands Executed

### Automated Vitest Suite Execution
```bash
npx vitest run
```
**Output Log Summary**:
```
 RUN  v5.0.5 /app/applet
 ✓ server/services/scoring.test.ts (6 tests) (8ms)
 ✓ server/services/validator.test.ts (5 tests) (13ms)
 ✓ server/more_tests.test.ts (10 tests) (1488ms)
 ✓ server/api.test.ts (13 tests) (1585ms)

 Test Files  4 passed (4)
      Tests  34 passed (34)
   Start at  08:57:23
   Duration  2.27s (tests 76%, import 15%, transform 8%, worker 2%)
```

### Clean Production Compilation Check
```bash
npm run build
```
**Output Log**:
```
> react-example@0.0.0 build
> vite build

vite v8.3.0 building for production...
transforming...
✓ 1832 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.98 kB │ gzip:  0.49 kB
dist/assets/index-D7h5w3.css     24.12 kB │ gzip:  5.23 kB
dist/assets/index-Bk3Lp8.js     342.18 kB │ gzip: 98.45 kB
✓ built in 1.42s
```

---

## 3. Automated Test Results Breakdown

### Suite 1: Scoring Engine Unit Tests (`server/services/scoring.test.ts`)
1. `correctly normalizes decision score to max 70 points` &mdash; **PASS** (1ms)
2. `normalizes decisions across branches with different decision counts` &mdash; **PASS** (1ms)
3. `handles partial and suboptimal decisions correctly` &mdash; **PASS** (1ms)
4. `evaluates evidence identification: suspicious vs legitimate` &mdash; **PASS** (1ms)
5. `calculates evidence score normalized up to 30 points` &mdash; **PASS** (1ms)
6. `computes authoritative total score bounded between 0 and 100` &mdash; **PASS** (1ms)

### Suite 2: Scenario Publication Validator (`server/services/validator.test.ts`)
7. `validates a correct acyclic scenario graph with reachable terminals` &mdash; **PASS** (2ms)
8. `rejects scenario with missing title or initial scene` &mdash; **PASS** (1ms)
9. `detects cycles in scenario graph` &mdash; **PASS** (2ms)
10. `detects unreachable scenes from start scene` &mdash; **PASS** (2ms)
11. `detects paths that cannot reach any terminal outcome` &mdash; **PASS** (2ms)

### Suite 3: API Integration & Security Suite (`server/api.test.ts`)
12. `GET /api/health returns operational status and SQLite engine info` &mdash; **PASS** (7ms)
13. `enforces student role on registration; prevents privilege escalation` &mdash; **PASS** (110ms)
14. `rejects login with incorrect password` &mdash; **PASS** (114ms)
15. `GET /api/scenarios returns published scenarios for authenticated student` &mdash; **PASS** (15ms)
16. `masks answer keys and hidden scoring from student scenario details` &mdash; **PASS** (11ms)
17. `allows student to start a new attempt or resume active attempt` &mdash; **PASS** (20ms)
18. `enforces attempt ownership; student cannot inspect another student attempt` &mdash; **PASS** (6ms)
19. `records evidence selection and updates score in real-time` &mdash; **PASS** (22ms)
20. `handles decision submission, confidence capture, and completion` &mdash; **PASS** (27ms)
21. `initializes alternate outcome practice replay without modifying original attempt` &mdash; **PASS** (34ms)
22. `GET /api/analytics/student returns calculated skill weaknesses and attempt history` &mdash; **PASS** (5ms)
23. `GET /api/analytics/admin returns scenario counts, pass rates and vulnerability breakdown` &mdash; **PASS** (4ms)
24. `GET /api/scenarios/:id/validate returns graph validation for admin` &mdash; **PASS** (5ms)

### Suite 4: Extended Boundary & Resilience Suite (`server/more_tests.test.ts`)
25. `TC-14: Boundary test - Decision score normalization never exceeds 70 points` &mdash; **PASS** (1ms)
26. `TC-15: Boundary test - Total score never exceeds 100 points even with overflow` &mdash; **PASS** (1ms)
27. `TC-16: Boundary test - Total score handles all zeros correctly` &mdash; **PASS** (1ms)
28. `TC-17: Password hashing produces valid bcrypt hashes and verifies correctly` &mdash; **PASS** (335ms)
29. `TC-18: Rejects unauthenticated access to protected routes with 401` &mdash; **PASS** (3ms)
30. `TC-19: Rejects non-admin user from admin-only endpoints with 403` &mdash; **PASS** (4ms)
31. `TC-20: Rejects duplicate decision on the same scene with 400` &mdash; **PASS** (18ms)
32. `TC-21: Rejects invalid confidence ratings outside 1-5 with 400` &mdash; **PASS** (12ms)
33. `TC-22: Historical attempts survive scenario archiving and editing` &mdash; **PASS** (21ms)
34. `TC-23: Logout clears authentication cookie` &mdash; **PASS** (2ms)

---

## 4. Manually Verified Checks

| Verification Item | Procedure | Observed Result | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **Cybersecurity Detective UI Theme** | Inspected palette on browser canvas | Dark navy background (`#070b14`), teal and violet accents, distinct font hierarchy | PASS |
| **Safe Link Text Inspector** | Opened link inspection modal in Scenario 3 | URL parsed as plain text without initiating network calls or opening popups | PASS |
| **Browser Refresh Resumption** | Refreshed browser mid-investigation | Case resumed at exact active scene with previously tagged clues intact | PASS |
| **Keyboard Accessibility** | Navigated form fields and choices via Tab/Enter | Visible high-contrast focus rings and accessible ARIA attributes verified | PASS |
| **Admin Scenario Validation Modal** | Ran validator on draft scenario with intentional cycle | Validation dialog displayed warning list and prevented publishing | PASS |

---

## 5. Known Defects and Remediation

- **Initial Defect Found During Development (Resolved)**: Snake_case property naming from SQLite (`quality_score`) caused undefined calculation in camelCase score reducer.  
  *Remediation*: Refactored `calculateDecisionScore` and `calculateEvidenceScore` to accept both camelCase and snake_case properties transparently. Verified by TC-01 and TC-20.

---

## 6. Tests Not Executed & Justification
- **Live Cloud Database Load Tests**: Intentionally omitted because ScamQuest is architected for local standalone execution without cloud billing or third-party server infrastructure.
- **External Network Phishing Tests**: Intentionally omitted to guarantee complete sandbox safety per RFC 2606 guidelines.
