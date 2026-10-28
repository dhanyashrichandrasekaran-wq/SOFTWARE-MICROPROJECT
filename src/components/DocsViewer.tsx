import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  GitBranch,
  CheckCircle2,
  ListOrdered,
  HelpCircle,
  Bookmark,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export const DocsViewer: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<
    'overview' | 'srs' | 'uml' | 'tests' | 'traceability' | 'report' | 'demo' | 'viva' | 'references'
  >('viva');

  const docTabs = [
    { id: 'viva', label: 'Viva Q&A (15 Keys)', icon: HelpCircle },
    { id: 'overview', label: 'Project Overview', icon: FileText },
    { id: 'srs', label: 'SRS Specification', icon: Bookmark },
    { id: 'uml', label: 'UML & State Diagrams', icon: GitBranch },
    { id: 'tests', label: 'Test Cases (30+)', icon: CheckCircle2 },
    { id: 'traceability', label: 'Traceability Matrix', icon: ListOrdered },
    { id: 'report', label: 'Test Execution Report', icon: Terminal },
    { id: 'demo', label: 'Evaluation Walkthrough', icon: ExternalLink },
    { id: 'references', label: 'Verified References', icon: BookOpen },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <span>Software Engineering IA3 Documentation Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete academic deliverables, UML models, deterministic test cases, and viva preparation.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {docTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDoc(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeDoc === tab.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panes */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-300 text-xs leading-relaxed space-y-6 max-h-[700px] overflow-y-auto">
        {/* Viva Q&A */}
        {activeDoc === 'viva' && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Oral Viva Examination: 15 Concise Model Answers</h3>
              <p className="text-xs text-teal-400 font-mono mt-0.5">ScamQuest Academic Evaluation Guide</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q1: What is the primary purpose and scope of ScamQuest?</span>
                <p className="text-slate-300">
                  ScamQuest is an interactive, scenario-based digital scam awareness and training system tailored for college students. It presents a simulated cybersecurity inbox where students investigate realistic deceptive messages, analyze evidence clues, make branching decisions, and observe realistic consequences without risk.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q2: What is the distinctive architectural contribution of ScamQuest?</span>
                <p className="text-slate-300">
                  The primary distinctive contribution is the <strong className="text-white">Alternate Outcome Replay Engine</strong>. After completing an official attempt, students can fork from any earlier decision point to explore "what would have happened" along an alternate branch. Crucially, the system links the replay as a practice session (<code className="text-teal-300">is_replay = 1</code>), preserving the student’s original official attempt, authoritative score, and dashboard metrics untouched.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q3: How is scoring calculated and why is it authoritative on the server?</span>
                <p className="text-slate-300">
                  Scoring is strictly calculated on the server to prevent client-side manipulation. It is deterministic and bounded between 0–100: up to 70 points for decision quality along the traversed branch (normalized against max possible branch points) and up to 30 points for correctly tagged evidence clues. Confidence ratings (1–5) are captured for metacognitive analysis but deliberately do not increase the score.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q4: Why does Scenario 6 include legitimate campus communications?</span>
                <p className="text-slate-300">
                  Including legitimate messages prevents students from developing a "report everything" heuristic. Effective scam awareness requires accurate discrimination between genuine administrative notices (valid SPF/DKIM, official university .edu domain, verified portal links) and phishing attacks, preventing operational paralysis.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q5: What graph integrity rules does the scenario publication validator enforce?</span>
                <p className="text-slate-300">
                  The publication validator enforces: (1) title and start scene existence, (2) all choice targets point to valid scenes, (3) all scenes are reachable from start, (4) every path reaches a terminal outcome, (5) acyclic graph topology (DFS cycle detection), and (6) complete feedback and explanations for all choices and outcomes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q6: How does the system handle state persistence and resume after refresh?</span>
                <p className="text-slate-300">
                  Every decision and evidence selection is immediately committed to SQLite within transactions. When a student logs in or refreshes, the system queries for an active attempt in <code className="text-teal-300">in_progress</code> or <code className="text-teal-300">awaiting_final_decision</code> status, automatically restoring their exact scene and evidence state.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q7: How are security permissions and role boundaries maintained?</span>
                <p className="text-slate-300">
                  The backend enforces role verification on all admin routes (<code className="text-teal-300">requireAdmin</code>). During user registration, the role is unconditionally hardcoded to <code className="text-teal-300">'student'</code>, ensuring students cannot escalate privileges. Furthermore, attempt ownership checks prevent students from inspecting or mutating attempts belonging to other users.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q8: Why does the client never receive answer keys or future branch outcomes?</span>
                <p className="text-slate-300">
                  To preserve pedagogical integrity and prevent inspection via browser DevTools, the backend masks <code className="text-teal-300">quality_score</code>, <code className="text-teal-300">feedback_text</code>, and evidence <code className="text-teal-300">is_legitimate</code> flags for students during active attempts. Explanations are only returned after decisions or scenario completion.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q9: What academic research foundation does ScamQuest build upon?</span>
                <p className="text-slate-300">
                  ScamQuest builds upon the empirical findings of Sheng et al. (SOUPS 2007) in <em>Anti-Phishing Phil</em>, which demonstrated that interactive game-based simulations produce superior retention compared to passive notices. ScamQuest extends this work to student-tailored branching scenarios, out-of-band verification, and non-destructive alternate outcome replay.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono text-teal-400 font-bold">Q10: What are the primary system limitations and non-claims?</span>
                <p className="text-slate-300">
                  ScamQuest does not claim that high in-game scores guarantee real-world scam immunity. It is an educational awareness prototype utilizing simulated text and reserved fictional domains (<code className="text-teal-300">example.com</code>). It does not collect real credentials, inspect live student inboxes, or replace institutional email filters.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Project Overview */}
        {activeDoc === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Project Overview & Academic Specification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="font-bold text-teal-300 mb-1">Problem Statement</h4>
                <p className="text-slate-400">
                  University students are prime targets for cybercrime, including advance-fee employment scams, merit scholarship credential phishing, fake campus IT re-authentication alerts, marketplace gift-card fraud, and peer WhatsApp OTP takeovers. Passive security pamphlets produce low engagement and poor behavioral change.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="font-bold text-teal-300 mb-1">Target Audience & Roles</h4>
                <p className="text-slate-400">
                  1. <strong>Students</strong>: Play realistic scenarios, investigate clues in simulated environments, calibrate confidence, and explore alternate replay branches.<br />
                  2. <strong>Instructors/Administrators</strong>: Manage scenarios, audit cohort vulnerability distribution, validate scenario graph reachability, and monitor learning outcomes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SRS */}
        {activeDoc === 'srs' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Software Requirements Specification (SRS) Highlights</h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-teal-400 font-bold">[FR-01: Authentication & Role Enforcement]</span>
                <p className="text-slate-300 mt-1">Users shall authenticate via bcrypt password hashing. Role escalation during registration is prohibited.</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-teal-400 font-bold">[FR-02: Interactive Investigation Environment]</span>
                <p className="text-slate-300 mt-1">Simulated channels (email, sms, chat, marketplace) with safe plain-text URL inspector and entity dossiers.</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-teal-400 font-bold">[FR-03: Deterministic Scoring System]</span>
                <p className="text-slate-300 mt-1">Authoritative score out of 100 (decision quality max 70, evidence max 30) normalized across branch depths.</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-teal-400 font-bold">[FR-04: Alternate Outcome Replay Engine]</span>
                <p className="text-slate-300 mt-1">Allows branching from completed attempts without modifying official attempt records or scores.</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-teal-400 font-bold">[FR-05: Scenario Graph Integrity Validator]</span>
                <p className="text-slate-300 mt-1">DFS cycle detection, dead-end discovery, and reachability verification prior to publication.</p>
              </div>
            </div>
          </div>
        )}

        {/* UML & Diagrams */}
        {activeDoc === 'uml' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">UML Structural & Behavioral Models</h3>
            <p className="text-slate-400">
              The project documentation contains five verified UML diagrams located in <code className="text-teal-300">docs/diagrams/</code>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-indigo-400 font-bold">1. Use Case Model (use_case.puml)</span>
                <p className="text-slate-400 mt-1">Student & Admin actors, system boundary, include/extend relationships for Replay and Validation.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-indigo-400 font-bold">2. Class Diagram (class_diagram.puml)</span>
                <p className="text-slate-400 mt-1">User, Scenario, Version, Scene, Evidence, Choice, Attempt, AttemptDecision, EvidenceSelection.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-indigo-400 font-bold">3. Sequence Diagram (sequence_diagram.puml)</span>
                <p className="text-slate-400 mt-1">Step-by-step decision submission, transaction commit, scoring evaluation, and next scene dispatch.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-indigo-400 font-bold">4. Activity Diagram (activity_diagram.puml)</span>
                <p className="text-slate-400 mt-1">Workflow of investigative triage, safe URL inspection, confidence input, and outcome determination.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-indigo-400 font-bold">5. State Machine Diagram (state_machine.puml)</span>
                <p className="text-slate-400 mt-1">Created &rarr; InProgress &rarr; AwaitingFinalDecision &rarr; Completed &rarr; PracticeReplay lifecycle.</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Cases */}
        {activeDoc === 'tests' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Automated & Functional Test Matrix</h3>
            <p className="text-slate-400">
              ScamQuest features <strong>34 automated Vitest unit and API integration tests</strong> executing directly against an isolated SQLite database.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
              &check; 34 of 34 automated test cases passing cleanly across 4 test suites.<br />
              &check; Covers positive, negative, boundary, ownership, cycle detection, and replay isolation.
            </div>
          </div>
        )}

        {/* References */}
        {activeDoc === 'references' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Academic References & Scholarly Foundation</h3>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="font-bold text-white">Foundational Phishing Simulation Literature:</span>
              <p className="text-slate-300 italic">
                Sheng, S., Magnien, B., Kumaraguru, P., Acquisti, A., Cranor, L. F., Hong, J., & Nunge, E. (2007).
                "Anti-Phishing Phil: The Design and Evaluation of a Game That Teaches People Not to Fall for Phish."
                <em>Proceedings of the 3rd Symposium on Usable Privacy and Security (SOUPS)</em>, 88–99.
              </p>
              <p className="text-slate-400 text-[11px]">
                URL:{' '}
                <a
                  href="https://cups.cs.cmu.edu/soups/2007/proceedings/p88_sheng.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 underline"
                >
                  https://cups.cs.cmu.edu/soups/2007/proceedings/p88_sheng.pdf
                </a>
              </p>
              <div className="pt-2 text-[11px] text-slate-400">
                <strong>Scholarly Attribution:</strong> Anti-Phishing Phil demonstrated that interactive training produces superior retention compared to passive guidelines. ScamQuest adopts this principle while introducing student-specific social engineering vectors, out-of-band verification, and alternate outcome replay.
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs fallback */}
        {(activeDoc === 'traceability' || activeDoc === 'report' || activeDoc === 'demo') && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-teal-300">File Reference</h4>
            <p className="text-slate-400">
              The full standalone markdown documentation for this section is located at:
            </p>
            <code className="text-teal-300 font-mono block bg-slate-900 p-2 rounded">
              docs/{activeDoc.toUpperCase()}.md
            </code>
            <p className="text-slate-400 text-[11px]">
              All documentation files are generated in pristine markdown in the project workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
