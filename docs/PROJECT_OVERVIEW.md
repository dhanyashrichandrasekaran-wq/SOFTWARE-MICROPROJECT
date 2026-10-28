# ScamQuest: Project Overview

**Academic Subject**: Software Engineering IA3 Microproject  
**Project Title**: ScamQuest: An Interactive, Scenario-Based Digital Scam Awareness and Training System  
**Application Target**: Undergraduate and Postgraduate College Students, Security Instructors  
**Architecture**: React (TypeScript/Vite) Frontend, Express (Node.js/TypeScript) REST API, Local SQLite Persistence  

---

## 1. Problem Statement

College students increasingly rely on digital channels for academic administration, part-time employment, housing, peer collaboration, and campus communications. Consequently, cybercrime syndicates heavily target higher-education populations through targeted social engineering and phishing campaigns:

1. **Employment Advance-Fee Schemes**: High-paying, low-barrier "remote data assistant" positions that solicit upfront fees for background checks or equipment bonds.
2. **Merit Scholarship & Financial Aid Phishing**: Fraudulent grant notifications demanding Social Security Numbers (SSNs) and online banking credentials.
3. **Campus IT Credential Harvesting**: Urgent single sign-on (SSO) and Multi-Factor Authentication (MFA/Duo) expiration warnings coercing students onto lookalike domains.
4. **Student Classifieds & Marketplace Fraud**: Peer-to-peer laptop or textbook sales manipulated through fake Zelle confirmation emails and retail gift card demands.
5. **Account Takeover via Peer OTP Theft**: Compromised peer messaging accounts urgently requesting incoming 6-digit verification codes.
6. **Operational Disruption through False Positives**: An inability to differentiate genuine university communications from scams, leading to missed administrative deadlines or panic.

Conventional training methods—such as passive annual security emails or static bulleted pamphlets—suffer from low student engagement and fail to develop practical investigative skills.

---

## 2. Project Objectives

1. **Simulate Realistic Cyber Threat Environments**: Provide an interactive simulated inbox reproducing authentic email, SMS, chat, and student marketplace channels without exposing users to live external malicious payloads.
2. **Promote Active Evidence Triage**: Empower students to inspect email sender domains, technical headers (SPF/DKIM), cryptographic protocols (HTTP vs. HTTPS), and organization dossiers prior to decision-making.
3. **Enable Non-Destructive Alternate Outcome Replay**: Allow learners to safely explore alternate decision paths and observe negative consequences (e.g., account takeover, financial extortion) without penalizing or overwriting their official benchmark score.
4. **Enforce Deterministic, Authoritative Scoring**: Calculate scores strictly on the backend across two objective pillars: Decision Quality (0–70 points) and Evidence Triage (0–30 points).
5. **Provide Continuous Cohort Diagnostics**: Generate aggregated skill-weakness profiles for instructors to pinpoint specific cognitive vulnerabilities across student cohorts.

---

## 3. Target Users & Personas

| User Role | Persona Description | Core Use Cases |
| :--- | :--- | :--- |
| **Student Investigator** | Undergraduate/graduate student undergoing cybersecurity training. | Browse scenario catalog, investigate messages, mark suspicious clues, select branching choices, submit confidence ratings, review score breakdowns, and explore alternate replays. |
| **Security Administrator** | Faculty member, lab instructor, or university IT security officer. | Review cohort completion rates, diagnose common student vulnerabilities, create/edit scenarios, validate graph integrity prior to publishing, and archive outdated cases. |

---

## 4. Scope and Exclusions

### In Scope
- Six fully articulated, playable branching scenarios (5 scam vectors and 1 authentic campus notice).
- Deterministic score normalization across branches of varying depths.
- Practice replay engine branching from historical decision points.
- Local, self-contained SQLite database with automated relational migrations and seed data.
- Scenario graph publication validator enforcing acyclic topologies, reachability, and feedback presence.
- Safe plain-text URL inspector and entity verification dossiers.

### Out of Scope (Exclusions)
- Live external network connections or automated real-world inbox scraping.
- Generative AI/LLM models or third-party cloud APIs (runs 100% locally and deterministically).
- Live payment gateways or collection of real banking credentials/passwords.
- Production multi-tenant cloud orchestration (designed as a local educational microproject).

---

## 5. Proposed Distinctive Contribution

The primary technical and pedagogical contribution of **ScamQuest** is the **Alternate Outcome Replay Engine**. In conventional cyber-training tools, students who make an incorrect choice either fail immediately or must restart the entire simulation, discouraging exploratory learning. 

In ScamQuest:
1. Students complete an official, immutable attempt with an authoritative score recorded to their profile.
2. Upon scenario conclusion, the student can revisit any prior decision node and fork into a practice replay session (`is_replay = 1`).
3. The student observes the downstream consequence of alternate or riskier actions without risking their academic grade or leaderboard standing.

---

## 6. Known Limitations and Non-Claims

- **Non-Guarantee of Real-World Immunity**: Achieving a score of 100/100 within ScamQuest does not guarantee that a student will never succumb to sophisticated real-world spear-phishing attacks.
- **Fictional Domain Constraints**: All simulated domains strictly use reserved test domains (`example.com`, `example.edu`, `example.org`, `example.net`) per RFC 2606.
- **Single-Node Persistence**: Persistence relies on SQLite; concurrent high-throughput enterprise write-scaling is outside the microproject scope.
