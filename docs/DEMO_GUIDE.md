# ScamQuest: 5–7 Minute Evaluation & Demo Guide

**Target Audience**: Academic Evaluators, External Examiners, Course Instructors  
**Walkthrough Duration**: 5 to 7 Minutes  
**Demonstration Focus**: End-to-end investigation, evidence triage, authoritative feedback, alternate practice replay score preservation, save & resume persistence, and administrative graph validation.

---

## Pre-Demo Checklist

1. Application dev server running at `http://localhost:3000` (`npm run dev`).
2. SQLite database automatically seeded with 6 scenarios and demo accounts.
3. Supported demo accounts:
   - **Student 1 (Seeded History)**: `alex.student@scamquest.edu` / `StudentPass123!`
   - **Student 2 (Clean Slate)**: `sam.student@scamquest.edu` / `StudentPass123!`
   - **Administrator**: `admin@scamquest.edu` / `AdminPass123!`

---

## Step-by-Step Walkthrough (7 Minutes)

### Minute 0:00 &ndash; 1:00: Overview & Student Login
1. Open browser to `http://localhost:3000`.
2. Notice the cybersecurity detective theme: dark navy background, teal and violet accents, and clear pedagogical IA3 labeling.
3. Click the quick demo button **"Alex Rivera (Student 1)"** (or enter `alex.student@scamquest.edu` / `StudentPass123!`).
4. **Observer Key Takeaways**:
   - The Student Dashboard renders real database metrics immediately.
   - Point out **"Skill Weakness Diagnostics"**: Note how missed clues in prior cases dynamically reveal cognitive vulnerabilities (e.g., *Sender & Domain Spoofing* vs. *Psychological Urgency*).
   - Point out the **"Active Case In Progress"** resume banner for Scenario 3 (Fake Campus IT Alert).

---

### Minute 1:00 &ndash; 3:00: Case Investigation & Evidence Triage
1. Click **"Scenarios"** in the top navigation.
2. Select **"Campus Career Hub: Vertex Global Remote Paid Internship"**.
3. Point out the **Simulated Email Client**:
   - Sender: `Marcus Drake <recruiting@vertexglobal-careers.com>`
   - High hourly pay ($48.50/hr) with no technical interview.
   - Click **"Sender Dossier"**: Observe that legitimate campus recruiting uses `vertexglobal.example.com`, whereas the scammer registered `vertexglobal-careers.com`.
4. Navigate to the **Evidence & Clue Triage** panel on the right:
   - Click **"Suspicious"** on *Lookalike Sender Domain*.
   - Click **"Suspicious"** on *No Interview for High Hourly Rate*.
   - Click **"Suspicious"** on *24-Hour Artificial Urgency Deadline*.
   - Notice the live **Evidence Triage Score** incrementing in real time (`15 / 30 pts`).
5. Select the action: **"Request full welcome packet & onboarding contract"**.
6. Scene advances to the second message: The recruiter now demands a **"$150 Refundable Equipment Deposit via Zelle"**.
7. Tag *Advance Equipment Deposit Demanded* as **"Suspicious"**.

---

### Minute 3:00 &ndash; 4:15: Confidence Rating & Authoritative Feedback
1. Select the safe action: **"Refuse payment and report to Campus IT & Career Services"**.
2. **Confidence Check Modal Pops Up**:
   - The system prompts: *"Rate how confident you feel in this assessment (1 to 5)"*.
   - Select rating **5 (Definitive certainty)** and click **"Confirm & Submit"**.
3. **Review Final Outcome & Feedback**:
   - Outcome: **Optimal Threat Mitigation** (Career Center confirms fraudulent recruiting ring).
   - Score: **100 / 100 points** (Decision Quality: 70/70, Evidence Triage: 30/30).
   - Point out that confidence rating (5/5) is logged for cognitive calibration, but did not artificially inflate the score.
   - Review the detailed decision audit trail and practical defensive takeaways.

---

### Minute 4:15 &ndash; 5:15: Flagship Feature &mdash; Alternate Outcome Replay
1. Scroll down to **"Explore Alternate Replay"**.
2. Explain to the examiner: *"In standard systems, exploring a bad choice destroys your score. In ScamQuest, Alternate Replay forks an isolated practice branch without changing the official score."*
3. Click **"Fork Step 2: Onboarding Protocol..."**.
4. Notice the header banner updates with an animated badge: **"Practice Replay Active (Official Score Locked)"**.
5. Deliberately make the disastrous choice: **"Send $150 via Zelle as requested"**.
6. The terminal consequence renders: **Financial Loss: Advance-Fee Scam**.
7. Click **"&larr; Exit Case"** and return to the **Dashboard**:
   - Point out that Alex's score on Scenario 1 remains **90/100 (or 100/100)**!
   - The official record, grade benchmark, and dashboard metrics were completely untouched by the replay test.

---

### Minute 5:15 &ndash; 6:00: Save & Resume Demonstration
1. On the Student Dashboard, point out the amber banner: **"Active Case In Progress: University IT Services: Mandatory Duo/SSO Re-authentication"**.
2. Click **"Resume Case Now"**.
3. The application immediately restores Scene 2 (*Inspecting the Authentication Portal*) with previous evidence tags pre-loaded.
4. Click **"Safely Inspect URL"**:
   - The Safe URL Breakdown tool analyzes `http://login.campus-securityportal.example.net` without opening popups or making live internet requests.
   - Highlights: Non-.edu domain, Unencrypted HTTP warning.
5. Conclude the scenario safely by selecting **"Forward email to phishing@campus.example.edu and delete"**.

---

### Minute 6:00 &ndash; 7:00: Administrator Hub & Scenario Validation
1. Click the top-right profile dropdown and switch persona to **"Prof. Eleanor Vance (Security Admin)"**.
2. Click **"Admin Hub"** in the navigation bar.
3. **Examine Cohort Analytics**:
   - View total attempts, cohort pass rate (%), and average score.
   - Review **"Cohort Phishing Vulnerability Distribution"** identifying systemic weaknesses across students.
4. **Demonstrate Scenario Integrity Validator**:
   - In the Scenario Governance table, click **"Validate"** on any scenario.
   - The validation modal executes graph checks and confirms: *Acyclic topology verified, all scenes reachable from start node, all branches lead to valid terminal endings, and feedback is fully populated.*
5. Conclude the demonstration and open the floor for oral viva questions.
