import { getDb } from './db';
import { hashPassword } from './services/auth';

export async function seedDatabase(dbPath?: string): Promise<void> {
  const db = getDb(dbPath);

  // 1. Seed Users (INSERT OR IGNORE to avoid duplicate key conflicts)
  const adminHash = await hashPassword('AdminPass123!');
  const studentHash = await hashPassword('StudentPass123!');
  const coordHash = await hashPassword('CoordPass123!');

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, name, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  insertUser.run('usr-admin-01', 'admin@scamquest.edu', 'Prof. Eleanor Vance (Security Admin)', adminHash, 'admin');
  insertUser.run('usr-coord-01', 'coordinator.sarah@scamquest.edu', 'Sarah Jenkins (Coordinator)', coordHash, 'admin');
  insertUser.run('usr-student-01', 'alex.student@scamquest.edu', 'Alex Rivera', studentHash, 'student');
  insertUser.run('usr-student-02', 'sam.student@scamquest.edu', 'Sam Chen', studentHash, 'student');

  // Check if scenarios already seeded
  const scenCount = db.prepare('SELECT COUNT(*) as count FROM scenarios').get() as { count: number };
  if (scenCount.count >= 6) {
    return; // Already fully seeded
  }

  // Helper transaction wrapper for scenarios
  const seedScenarios = db.transaction(() => {
    // -------------------------------------------------------------
    // SCENARIO 1: Internship Offer Scam
    // -------------------------------------------------------------
    db.prepare(`
      INSERT INTO scenarios (id, slug, title, category, difficulty, estimated_minutes, description, status, current_version_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `).run(
      'scen-01',
      'internship-registration-fee',
      'Campus Career Hub: Vertex Global Remote Paid Internship',
      'Employment Scams',
      'Beginner',
      5,
      'You receive an unsolicited high-paying remote internship offer from Vertex Global Consulting. Investigate sender authenticity, onboarding terms, and upfront fee demands before accepting.',
      'ver-01'
    );

    db.prepare(`
      INSERT INTO scenario_versions (id, scenario_id, version_number, initial_scene_id, passing_score, is_published)
      VALUES (?, ?, 1, ?, 70, 1)
    `).run('ver-01', 'scen-01', 'scn-01-s1');

    // Scenes
    const insertScene = db.prepare(`
      INSERT INTO scenes (id, version_id, scene_key, title, sender_name, sender_address, sender_avatar, subject, timestamp_label, body_content, channel_type, is_terminal, terminal_outcome_type, terminal_explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // S1: Initial Offer Email
    insertScene.run(
      'scn-01-s1',
      'ver-01',
      'initial_offer',
      'Urgent Internship Selection Notice',
      'Marcus Drake (Talent Acquisition)',
      'recruiting@vertexglobal-careers.com',
      'briefcase',
      'OFFER LETTER: Remote Data & Operations Intern ($48.50/hr)',
      'Today, 09:14 AM',
      `Dear Student,\n\nWe reviewed your university profile and are pleased to offer you immediate placement as a Remote Operations Intern with Vertex Global. Compensation is $48.50/hour (20 hrs/week flexible).\n\nNo technical interview is required based on your institutional standing. However, to finalize your onboarding batch, you must complete enrollment within 24 hours.\n\nPlease review your welcome package and confirm your acceptance.`,
      'email',
      0,
      null,
      null
    );

    // S2: Onboarding Terms & Equipment Fee Request
    insertScene.run(
      'scn-01-s2',
      'ver-01',
      'deposit_request',
      'Onboarding Protocol & Home Office Setup',
      'Marcus Drake (Talent Acquisition)',
      'recruiting@vertexglobal-careers.com',
      'briefcase',
      'RE: Welcome Package & Pre-employment IT Bond ($150 Refundable)',
      'Today, 09:45 AM',
      `Excellent choice. To dispatch your corporate MacBook Pro and encrypted token, our vendor partner requires a one-time refundable insurance deposit of $150.00 via Zelle or cryptocurrency voucher.\n\nThis amount will be reimbursed on your first bi-weekly paycheck. Please remit immediately using payment reference #VG-8902 to avoid forfeiting your spot.`,
      'email',
      0,
      null,
      null
    );

    // S3-A: Terminal - Compromised / Scammed
    insertScene.run(
      'scn-01-s3a',
      'ver-01',
      'scam_compromise',
      'Financial Loss: Advance-Fee Scam',
      'Campus Security Notification',
      'alerts@university-security.example.edu',
      'alert-triangle',
      'INCIDENT REPORT: Fraudulent Employment Scheme',
      'Next Day, 11:00 AM',
      `You transferred $150 via Zelle. The sender immediately blocked your emails, the tracking number provided was fraudulent, and Vertex Global confirmed no such recruitment exists. Legitimate employers never require candidates to pay upfront fees for work equipment or background checks.`,
      'email',
      1,
      'compromise',
      'You fell victim to an advance-fee employment scam. Legitimate companies provide equipment directly or reimburse approved expenses without asking candidates to send money upfront.'
    );

    // S3-B: Verification Branch - Career Center Safe Resolution
    insertScene.run(
      'scn-01-s3b',
      'ver-01',
      'safe_verification',
      'Career Center Out-of-Band Verification',
      'University Career Center',
      'careers@campus.example.edu',
      'check-circle',
      'VERIFICATION CONFIRMED: Fraudulent Employer Alert',
      'Today, 11:30 AM',
      `Thank you for consulting our office before remitting funds. We cross-referenced Vertex Global: the official company domain is 'vertexglobal.example.com', while this scammer registered 'vertexglobal-careers.com' last week. We have reported the sender domain to university firewalls. Your vigilance protected you from financial loss.`,
      'email',
      1,
      'success',
      'Excellent investigation! You checked the domain registration, recognized that legitimate companies never require job candidates to pay upfront equipment fees, and verified the offer through official campus channels.'
    );

    // Evidence for Scenario 1
    const insertEvidence = db.prepare(`
      INSERT INTO evidence (id, version_id, scene_id, clue_key, label, description, category, is_legitimate, explanation, score_points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvidence.run(
      'ev-01-1',
      'ver-01',
      'scn-01-s1',
      'lookalike_domain',
      'Lookalike Sender Domain',
      'Domain is vertexglobal-careers.com rather than official vertexglobal.example.com',
      'domain',
      0,
      'Scammers often register lookalike domains with suffixes like -careers, -hr, or -portal to mimic legitimate corporations.',
      5
    );

    insertEvidence.run(
      'ev-01-2',
      'ver-01',
      'scn-01-s1',
      'no_interview_high_pay',
      'No Interview for High Hourly Rate',
      'Offers $48.50/hr with zero technical interview or standard vetting process',
      'urgency',
      0,
      'Extremely high pay without an interview or formal application is a classic phishing hook designed to provoke hasty acceptance.',
      5
    );

    insertEvidence.run(
      'ev-01-3',
      'ver-01',
      'scn-01-s2',
      'upfront_deposit_fee',
      'Advance Equipment Deposit Demanded',
      'Demands $150 refundable deposit via Zelle or cryptocurrency voucher',
      'financial',
      0,
      'No reputable employer demands that job applicants send non-reversible money transfers for equipment before starting employment.',
      10
    );

    insertEvidence.run(
      'ev-01-4',
      'ver-01',
      'scn-01-s1',
      'artificial_deadline',
      '24-Hour Artificial Urgency Deadline',
      'Forces student to confirm within 24 hours or forfeit placement',
      'urgency',
      0,
      'Artificial deadlines create pressure so victims act emotionally before they have time to verify credentials.',
      5
    );

    // Choices for Scenario 1
    const insertChoice = db.prepare(`
      INSERT INTO choices (id, version_id, from_scene_id, next_scene_id, choice_key, label, description, quality_score, feedback_text, is_optimal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // S1 choices
    insertChoice.run(
      'ch-01-1',
      'ver-01',
      'scn-01-s1',
      'scn-01-s2',
      'ask_for_details',
      'Request full welcome packet & onboarding contract',
      'Ask the recruiter for official terms of employment and corporate equipment policy before deciding.',
      8,
      'Good caution. Requesting official terms forces the scammer to reveal their payment demands.',
      0
    );

    insertChoice.run(
      'ch-01-2',
      'ver-01',
      'scn-01-s1',
      'scn-01-s3b',
      'verify_with_career_center',
      'Verify employer credentials with Campus Career Center',
      'Forward the email to the university Career Services office to check if Vertex Global is an approved employer.',
      10,
      'Optimal response. Verifying through an established campus authority uncovers fraudulent recruiting campaigns safely.',
      1
    );

    insertChoice.run(
      'ch-01-3',
      'ver-01',
      'scn-01-s1',
      'scn-01-s2',
      'accept_immediately',
      'Accept immediately to lock in the $48.50/hr rate',
      'Reply with enthusiasm and promise to complete all instructions right away.',
      2,
      'Risky! Accepting high-paying jobs without verifying employer credentials exposes you to advance-fee fraud.',
      0
    );

    // S2 choices
    insertChoice.run(
      'ch-01-4',
      'ver-01',
      'scn-01-s2',
      'scn-01-s3a',
      'pay_deposit_zelle',
      'Send $150 via Zelle as requested',
      'Transfer the funds quickly so your company laptop and welcome kit can be dispatched.',
      0,
      'Critical mistake! Sending money via irreversible peer-to-peer apps directly surrenders funds to cybercriminals.',
      0
    );

    insertChoice.run(
      'ch-01-5',
      'ver-01',
      'scn-01-s2',
      'scn-01-s3b',
      'refuse_and_report',
      'Refuse payment and report to Campus IT & Career Services',
      'State that university policy prohibits upfront candidate fees, report the domain, and terminate contact.',
      10,
      'Outstanding defense! Recognizing advance-fee fraud and reporting it prevents further community exploitation.',
      1
    );

    // -------------------------------------------------------------
    // SCENARIO 2: Scholarship & Financial Aid Scam
    // -------------------------------------------------------------
    db.prepare(`
      INSERT INTO scenarios (id, slug, title, category, difficulty, estimated_minutes, description, status, current_version_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `).run(
      'scen-02',
      'scholarship-sensitive-info',
      'State Higher-Ed Foundation: Merit Grant Award Verification',
      'Scholarship & Financial Aid',
      'Intermediate',
      6,
      'You receive an unsolicited notification claiming you were chosen for a $5,000 regional merit scholarship. Inspect identity verification demands and portal security.',
      'ver-02'
    );

    db.prepare(`
      INSERT INTO scenario_versions (id, scenario_id, version_number, initial_scene_id, passing_score, is_published)
      VALUES (?, ?, 1, ?, 70, 1)
    `).run('ver-02', 'scen-02', 'scn-02-s1');

    insertScene.run(
      'scn-02-s1',
      'ver-02',
      'scholarship_announcement',
      'Official Grant Notification ($5,000)',
      'Office of Merit Disbursements',
      'awards@highered-stategrant.example.org',
      'award',
      'CONGRATULATIONS: 2026 Academic Achievement Grant Disbursal Notice',
      'Yesterday, 04:20 PM',
      `Dear Scholar,\n\nWe are pleased to inform you that your academic record was nominated for the 2026 Higher Education Regional Merit Award ($5,000.00 cash grant).\n\nBecause this allocation closes at the end of the fiscal quarter, please claim your grant by visiting our disbursement portal and validating your institutional eligibility.`,
      'email',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-02-s2',
      'ver-02',
      'identity_form',
      'Disbursement Portal: Identity & Direct Deposit Form',
      'Disbursement Gateway',
      'verification@highered-stategrant.example.org',
      'shield-alert',
      'SECURE PORTAL: Complete KYC & Bank Account Verification',
      'Today, 08:30 AM',
      `To comply with state audit requirements, please submit:\n1. Full Legal Name & Date of Birth\n2. Social Security Number (SSN)\n3. Primary Online Banking Username and Temporary Password (for Instant Deposit Routing Verification)\n\nNote: Failure to submit within 48 hours results in forfeiture to an alternate candidate.`,
      'email',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-02-s3a',
      'ver-02',
      'identity_theft_compromise',
      'Account Takeover: Identity Theft Incident',
      'Financial Institution Fraud Unit',
      'fraud-alerts@nationalbank.example.com',
      'alert-octagon',
      'SECURITY ALERT: Unauthorized Login & Wire Attempt Blocked',
      'Today, 10:15 AM',
      `Your online banking credentials and SSN were used from an untrusted overseas IP address to initiate an unauthorized fund transfer. Your bank accounts have been frozen. A legitimate scholarship will NEVER ask for banking passwords or credentials to disburse funds.`,
      'email',
      1,
      'compromise',
      'Catastrophic compromise: Providing banking passwords or login credentials grants attackers full control of your finances. Real financial institutions disburse aid via standard routing numbers or official bursar accounts, never login passwords.'
    );

    insertScene.run(
      'scn-02-s3b',
      'ver-02',
      'scholarship_safe',
      'Financial Aid Office Verification',
      'University Financial Aid Office',
      'finaid@campus.example.edu',
      'check-circle',
      'CONFIRMATION: Unofficial Scholarship Phishing Scheme Identified',
      'Today, 11:00 AM',
      `Good catch! We reviewed the email. The 'State Higher Education Regional Merit Award' is a fictional entity. Legitimate scholarships disburse funds directly to your student account via the University Bursar and never solicit banking passwords or SSNs via web forms.`,
      'email',
      1,
      'success',
      'Great work! You correctly recognized that no legitimate scholarship requires banking passwords or sensitive identity credentials to disburse an award.'
    );

    // Evidence for Scenario 2
    insertEvidence.run(
      'ev-02-1',
      'ver-02',
      'scn-02-s1',
      'unapplied_scholarship',
      'Unapplied Scholarship Award',
      'Claims award of $5,000 for a grant you never applied for or entered',
      'urgency',
      0,
      'Unsolicited awards for competitions or grants you never entered are almost universally phishing lures.',
      5
    );

    insertEvidence.run(
      'ev-02-2',
      'ver-02',
      'scn-02-s2',
      'bank_login_solicitation',
      'Online Banking Login & Password Demanded',
      'Asks for bank username and password under the guise of "instant routing validation"',
      'credential',
      0,
      'No legitimate entity EVER requires your banking login credentials or password to deposit money. Direct deposit only requires routing and account numbers.',
      10
    );

    insertEvidence.run(
      'ev-02-3',
      'ver-02',
      'scn-02-s2',
      'ssn_collection_unsecured',
      'Unverified SSN Collection',
      'Requests full SSN via an external web form without verified institutional governance',
      'financial',
      0,
      'SSNs should only be provided through authenticated university or government portals, never third-party links.',
      10
    );

    // Choices for Scenario 2
    insertChoice.run(
      'ch-02-1',
      'ver-02',
      'scn-02-s1',
      'scn-02-s2',
      'inspect_portal_requirements',
      'Inspect the disbursement portal requirements',
      'Open the portal details to review what documentation they require.',
      6,
      'Careful inspection is good, but keep your guard up when examining requested fields.',
      0
    );

    insertChoice.run(
      'ch-02-2',
      'ver-02',
      'scn-02-s1',
      'scn-02-s3b',
      'cross_check_finaid',
      'Cross-check with Campus Financial Aid Office',
      'Contact your campus financial aid counselor to check if this grant is legitimate.',
      10,
      'Superb approach. Official university financial aid counselors can verify any legitimate institutional award.',
      1
    );

    insertChoice.run(
      'ch-02-3',
      'ver-02',
      'scn-02-s2',
      'scn-02-s3a',
      'submit_credentials',
      'Fill out the form with banking credentials to receive the $5,000',
      'Provide your SSN and online banking login to expedite payment before the deadline.',
      0,
      'Severe mistake! Submitting banking passwords gives criminals direct access to siphon your funds.',
      0
    );

    insertChoice.run(
      'ch-02-4',
      'ver-02',
      'scn-02-s2',
      'scn-02-s3b',
      'report_phishing_bursar',
      'Abort form, report phishing, and notify Campus Security',
      'Close the page, document the URL, and submit a security report to campus IT and financial aid.',
      10,
      'Perfect defense! Recognizing credential theft demands and alerting campus authorities protects everyone.',
      1
    );

    // -------------------------------------------------------------
    // SCENARIO 3: Fake Campus IT Password Reset / MFA Alert
    // -------------------------------------------------------------
    db.prepare(`
      INSERT INTO scenarios (id, slug, title, category, difficulty, estimated_minutes, description, status, current_version_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `).run(
      'scen-03',
      'fake-campus-it-mfa-alert',
      'University IT Services: Mandatory Duo/SSO Re-authentication',
      'IT & Credential Phishing',
      'Beginner',
      5,
      'A high-priority alert warns your campus single sign-on (SSO) and Duo 2FA tokens will expire in 3 hours. Analyze headers and portal links before taking action.',
      'ver-03'
    );

    db.prepare(`
      INSERT INTO scenario_versions (id, scenario_id, version_number, initial_scene_id, passing_score, is_published)
      VALUES (?, ?, 1, ?, 70, 1)
    `).run('ver-03', 'scen-03', 'scn-03-s1');

    insertScene.run(
      'scn-03-s1',
      'ver-03',
      'urgent_mfa_warning',
      'Urgent IT Notification: MFA Token Expiry',
      'University IT Helpdesk (Automated)',
      'it-support@campus-securityportal.example.net',
      'lock',
      'ACTION REQUIRED: Re-sync Campus Duo MFA & SSO Credentials [3 Hours Remaining]',
      'Today, 07:15 AM',
      `ATTENTION STUDENT:\n\nOur identity systems detected an outdated security certificate on your Duo Multi-Factor Authentication profile. In accordance with university cyber policy §14.2, all students must re-authenticate their identity within 3 hours.\n\nFailure to synchronize will lock your Canvas, email, and campus Wi-Fi access ahead of final exam registration.\n\nClick below to re-verify your university credentials:\nhttp://login.campus-securityportal.example.net/auth/sso-verify`,
      'email',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-03-s2',
      'ver-03',
      'spoofed_login_portal',
      'Inspecting the Authentication Portal',
      'Security Gateway',
      'security@campus-securityportal.example.net',
      'key',
      'SSO Re-authentication Portal',
      'Today, 07:22 AM',
      `You inspect the login page. It replicates the university brand colors and crest. However:\n- The browser address bar shows: 'http://login.campus-securityportal.example.net'\n- The connection is unencrypted (HTTP, no valid SSL padlock)\n- The form asks for University ID, current password, and Duo bypass passcode.\n\nWhat is your next step?`,
      'email',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-03-s3a',
      'ver-03',
      'account_hijacked',
      'Account Compromise: Campus SSO Breach',
      'Campus Information Security Office',
      'infosec@campus.example.edu',
      'shield-x',
      'SECURITY NOTICE: Compromised Account Quarantined',
      'Today, 08:45 AM',
      `Your campus account was locked after attackers logged in from an unknown proxy to download your academic files and send 2,400 spam emails across campus. You must visit the physical IT desk with photo ID to reset your credentials.`,
      'email',
      1,
      'compromise',
      'You entered your credentials on a spoofed website. Lookalike domains like campus-securityportal.example.net do not belong to the university. Real campus portals reside strictly on campus.example.edu.'
    );

    insertScene.run(
      'scn-03-s3b',
      'ver-03',
      'it_safe_resolution',
      'Verified via Official IT Knowledge Base',
      'Official Campus IT Helpdesk',
      'helpdesk@campus.example.edu',
      'check-circle',
      'RESOLVED: Phishing Domain Blacklisted',
      'Today, 08:30 AM',
      `Superb reporting! You recognized the non-.edu domain ('campus-securityportal.example.net') and avoided entering your SSO password. Our security operations center has blocked this domain university-wide. Official campus IT will never send unencrypted HTTP links or threaten account deletion with a 3-hour timer.`,
      'email',
      1,
      'success',
      'Flawless detection! You checked the URL domain structure, noticed the lack of HTTPS, recognized extreme urgency tactics, and reported the incident through authentic IT channels.'
    );

    // Evidence for Scenario 3
    insertEvidence.run(
      'ev-03-1',
      'ver-03',
      'scn-03-s1',
      'non_edu_domain',
      'Non-.EDU Sender & URL Domain',
      'Address uses campus-securityportal.example.net instead of campus.example.edu',
      'domain',
      0,
      'All legitimate institutional services use the university official .edu domain, never commercial .net or .org domains.',
      10
    );

    insertEvidence.run(
      'ev-03-2',
      'ver-03',
      'scn-03-s1',
      'extreme_urgency_threat',
      'Three-Hour Account Lockout Threat',
      'Threatens disconnection from Canvas and Wi-Fi within 3 hours',
      'urgency',
      0,
      'Urgency panic is intended to prevent users from checking with the genuine IT helpdesk.',
      5
    );

    insertEvidence.run(
      'ev-03-3',
      'ver-03',
      'scn-03-s2',
      'http_unencrypted_login',
      'Unencrypted HTTP Protocol',
      'Login portal uses http:// instead of secure https:// encryption',
      'credential',
      0,
      'Modern authentication gateways never use unencrypted HTTP for transmitting passwords or 2FA codes.',
      10
    );

    // Choices for Scenario 3
    insertChoice.run(
      'ch-03-1',
      'ver-03',
      'scn-03-s1',
      'scn-03-s2',
      'inspect_url_text',
      'Inspect the link URL carefully before clicking',
      'Examine the link domain structure and security protocol.',
      10,
      'Excellent discipline. Inspecting URLs before navigating reveals spoofed domains.',
      1
    );

    insertChoice.run(
      'ch-03-2',
      'ver-03',
      'scn-03-s1',
      'scn-03-s3b',
      'navigate_official_portal',
      'Bypass the email and log in directly through the official campus bookmark',
      'Open your verified browser bookmark for portal.campus.example.edu to check for any real notifications.',
      10,
      'Best practice! Navigating directly via known trusted bookmarks completely neutralizes phishing links.',
      1
    );

    insertChoice.run(
      'ch-03-3',
      'ver-03',
      'scn-03-s2',
      'scn-03-s3a',
      'enter_sso_pass',
      'Submit university credentials on the page to avoid lockout',
      'Enter your username, password, and Duo code to clear the warning.',
      0,
      'Critical compromise! You submitted your university credentials directly to cyber attackers.',
      0
    );

    insertChoice.run(
      'ch-03-4',
      'ver-03',
      'scn-03-s2',
      'scn-03-s3b',
      'forward_phish_desk',
      'Forward email to phishing@campus.example.edu and delete',
      'Alert campus security operations and remove the suspicious email from your inbox.',
      10,
      'Outstanding! Forwarding to the campus security desk triggers automated protective filters for all students.',
      1
    );

    // -------------------------------------------------------------
    // SCENARIO 4: Marketplace Escrow & Courier Scam
    // -------------------------------------------------------------
    db.prepare(`
      INSERT INTO scenarios (id, slug, title, category, difficulty, estimated_minutes, description, status, current_version_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `).run(
      'scen-04',
      'marketplace-escrow-scam',
      'Campus Exchange: MacBook Pro Sale Escrow Scam',
      'Marketplace & E-Commerce',
      'Intermediate',
      6,
      'You list your used laptop for sale on the campus classifieds board. A prospective buyer asks to switch to personal email and off-platform courier escrow.',
      'ver-04'
    );

    db.prepare(`
      INSERT INTO scenario_versions (id, scenario_id, version_number, initial_scene_id, passing_score, is_published)
      VALUES (?, ?, 1, ?, 70, 1)
    `).run('ver-04', 'scen-04', 'scn-04-s1');

    insertScene.run(
      'scn-04-s1',
      'ver-04',
      'buyer_inquiry',
      'Marketplace Chat: Buyer Inquiry',
      'David Miller (Buyer)',
      'dmiller883@gmail.example.com',
      'shopping-bag',
      'Inquiry: 2023 MacBook Pro 14" (Campus Classifieds)',
      'Yesterday, 06:10 PM',
      `Hi! Is your MacBook still available? I am ready to buy it immediately for your full asking price of $850.\n\nHowever, I am currently stationed at an out-of-state training base so I cannot meet in person. My private courier will collect it from your dorm. Can you message me at my personal email so we can coordinate payment via Zelle or cashier check?`,
      'marketplace',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-04-s2',
      'ver-04',
      'fake_zelle_receipt',
      'Fake Payment Notification & Courier Insurance',
      'Zelle Payment Desk (Spoofed)',
      'service-clearance@zelle-transfer-alerts.example.com',
      'dollar-sign',
      'PAYMENT PENDING: $850.00 + $100.00 Courier Escrow Fee',
      'Today, 10:05 AM',
      `Dear Seller,\n\nDavid Miller has sent you $950.00 via Zelle ($850 item price + $100 courier insurance).\n\nIMPORTANT STATUS: To unlock the $950.00 into your account, you must purchase a $100 Apple or Steam Gift Card for the courier insurance policy and email photos of the card codes to this address. Once verified, the full $950.00 will immediately credit to your balance.`,
      'email',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-04-s3a',
      'ver-04',
      'marketplace_loss',
      'Double Financial Loss: Gift Card & Item Lost',
      'Campus Police Incident Report',
      'dispatch@campus-police.example.edu',
      'alert-triangle',
      'CASE FILED: Classifieds Fraud & Gift Card Theft',
      'Today, 03:00 PM',
      `You purchased and sent the $100 gift card codes. The scammer vanished, the supposed $950 payment never existed (the Zelle email was spoofed from a free domain), and the courier was fake. Real payment platforms never hold funds hostage pending gift card purchases.`,
      'email',
      1,
      'compromise',
      'You encountered the classic fake payment & gift card overpayment scam. Payment processors never require purchasing retail gift cards to release incoming funds.'
    );

    insertScene.run(
      'scn-04-s3b',
      'ver-04',
      'marketplace_safe',
      'Safe Campus Exchange Protocol',
      'Campus Safety & Student Affairs',
      'community@campus.example.edu',
      'check-circle',
      'TRANSACTION PROTECTED: Campus Safe Exchange Zone Utilized',
      'Today, 02:30 PM',
      `Smart decision! You insisted on meeting in the 24/7 monitored Campus Police Safe Exchange Zone and refused to take communications off the official student marketplace. The scammer refused to meet and deleted their profile. You preserved your laptop and your money.`,
      'marketplace',
      1,
      'success',
      'Excellent awareness! You identified off-platform redirection, refused overpayment/gift card escrow demands, and utilized secure campus exchange protocols.'
    );

    // Evidence for Scenario 4
    insertEvidence.run(
      'ev-04-1',
      'ver-04',
      'scn-04-s1',
      'off_platform_redirection',
      'Insistence on Moving Off-Platform',
      'Buyer insists on taking conversation off the campus classifieds platform to personal email',
      'sender',
      0,
      'Scammers urge victims off-platform to escape automated fraud detection and buyer protection policies.',
      5
    );

    insertEvidence.run(
      'ev-04-2',
      'ver-04',
      'scn-04-s1',
      'third_party_courier_story',
      'Out-of-Town Third-Party Courier Story',
      'Excuses inability to meet in person with military base or emergency deployment narrative',
      'urgency',
      0,
      'The "out-of-town buyer sending a courier" is one of the most widespread marketplace scam templates.',
      5
    );

    insertEvidence.run(
      'ev-04-3',
      'ver-04',
      'scn-04-s2',
      'gift_card_insurance_demand',
      'Gift Card Demanded to Release Funds',
      'Claims payment is pending until seller buys a $100 gift card to verify courier insurance',
      'financial',
      0,
      'No legitimate banking system or payment app requires gift cards to release funds. Gift card requests are 100% fraudulent.',
      10
    );

    // Choices for Scenario 4
    insertChoice.run(
      'ch-04-1',
      'ver-04',
      'scn-04-s1',
      'scn-04-s3b',
      'insist_on_campus_safe_zone',
      'Insist on in-person cash exchange at Campus Police Safe Zone',
      'Inform the buyer that per campus guidelines, transactions must occur in person at the campus police station.',
      10,
      'Optimal safe protocol! Genuine local student buyers will agree; fraudsters will back out immediately.',
      1
    );

    insertChoice.run(
      'ch-04-2',
      'ver-04',
      'scn-04-s1',
      'scn-04-s2',
      'agree_email_coordination',
      'Agree to coordinate payment via personal email and courier',
      'Move to email to accommodate the buyer and get the full $850 sale.',
      4,
      'Caution: Stepping outside the campus platform removes transaction protection.',
      0
    );

    insertChoice.run(
      'ch-04-3',
      'ver-04',
      'scn-04-s2',
      'scn-04-s3a',
      'buy_gift_card',
      'Buy the $100 gift card to unlock the $950 payment',
      'Purchase the card and send the photo codes as instructed.',
      0,
      'Disastrous choice! Gift cards are non-refundable cash equivalents. You have handed funds directly to the criminal.',
      0
    );

    insertChoice.run(
      'ch-04-4',
      'ver-04',
      'scn-04-s2',
      'scn-04-s3b',
      'report_marketplace_fraud',
      'Block the buyer and report the account to campus marketplace admins',
      'Report the fake Zelle confirmation email and attempted extortion.',
      10,
      'Superb response! You shut down the fraud attempt and helped protect other student sellers.',
      1
    );

    // -------------------------------------------------------------
    // SCENARIO 5: Impersonated Class-Group Admin Asking for OTP
    // -------------------------------------------------------------
    db.prepare(`
      INSERT INTO scenarios (id, slug, title, category, difficulty, estimated_minutes, description, status, current_version_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `).run(
      'scen-05',
      'whatsapp-otp-takeover',
      'Senior Project Group Admin: Transfer Code Verification',
      'Social Engineering & Account Takeover',
      'Advanced',
      6,
      'You receive an urgent text from your capstone project partner claiming they are locked out of your project group and need a 6-digit code sent to your phone.',
      'ver-05'
    );

    db.prepare(`
      INSERT INTO scenario_versions (id, scenario_id, version_number, initial_scene_id, passing_score, is_published)
      VALUES (?, ?, 1, ?, 70, 1)
    `).run('ver-05', 'scen-05', 'scn-05-s1');

    insertScene.run(
      'scn-05-s1',
      'ver-05',
      'sms_from_partner',
      'Urgent SMS from Project Lead',
      'Maya Lin (Classmate / Lead)',
      '+1 (555) 019-4822',
      'message-square',
      'SMS: Capstone Group Verification Emergency',
      'Today, 02:15 PM',
      `Hey! So sorry to bother you right now, I had my phone reset and got locked out of our CS401 Senior Capstone WhatsApp repository. I tried to recover the group admin rights and WhatsApp said it sent a 6-digit backup authorization code to your phone number as a co-admin.\n\nCould you screenshot the code or reply with the numbers real quick? The professor is reviewing our progress in 20 minutes!`,
      'sms',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-05-s2',
      'ver-05',
      'incoming_security_sms',
      'Incoming System SMS on Your Phone',
      'Messaging Platform Security',
      'VerifyAuth (220-00)',
      'smartphone',
      'SMS: Your Verification Code',
      'Today, 02:16 PM',
      `You look at your phone's notification banner. An official SMS just arrived:\n\n[WhatsApp Security]: "Your account registration code is 842-195. DO NOT share this code with anyone. If you did not request this, your account may be under attack."\n\nNotice that the code is for YOUR phone number and YOUR account, not Maya's.`,
      'sms',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-05-s3a',
      'ver-05',
      'otp_hijack_compromise',
      'Account Hijacked: Total Identity & Chat Lockout',
      'Security Incident Notification',
      'system-alerts@messaging.example.com',
      'shield-off',
      'ALERT: Your Account Has Been Registered on a New Device',
      'Today, 02:30 PM',
      `You gave the 6-digit code to the caller. The attacker used it to register your WhatsApp account onto their device, activated two-step PIN protection to lock you out permanently, and began messaging your contacts requesting emergency loans. Maya's account was already compromised earlier today.`,
      'sms',
      1,
      'compromise',
      'You surrendered your One-Time Password (OTP). Attackers use hijacked accounts of friends to manipulate victims into giving up their own account verification codes.'
    );

    insertScene.run(
      'scn-05-s3b',
      'ver-05',
      'otp_defended_safely',
      'Out-of-Band Call: Compromise Thwarted',
      'Direct Voice Call with Maya',
      'Direct Cellular Call',
      'check-circle',
      'VOICE CALL: Maya Confirms Her Account Was Hacked',
      'Today, 02:25 PM',
      `You called Maya on her known personal cellular number. She answered in shock: "My account got hacked an hour ago! I didn't send you any message!" By refusing to share the OTP and verifying out-of-band, you saved your account and alerted the entire capstone team to the breach.`,
      'chat',
      1,
      'success',
      'Masterful cybersecurity awareness! You remembered that OTP codes are strictly for YOUR account and never shareable, and verified suspicious peer requests via a secondary out-of-band channel.'
    );

    // Evidence for Scenario 5
    insertEvidence.run(
      'ev-05-1',
      'ver-05',
      'scn-05-s2',
      'otp_warning_explicit',
      'Explicit "DO NOT SHARE" Warning in SMS',
      'System SMS explicitly instructs: DO NOT share this code with anyone',
      'credential',
      0,
      'System SMS messages containing "Do not share with anyone" mean exactly that—even friends, family, or supposed IT administrators.',
      10
    );

    insertEvidence.run(
      'ev-05-2',
      'ver-05',
      'scn-05-s1',
      'peer_urgency_panic',
      'Urgency Panic Explaining Professor Review',
      'Pressures with a 20-minute deadline regarding professor review',
      'urgency',
      0,
      'Social engineers impersonate friends or authority figures in artificial crises to stop you from thinking critically.',
      5
    );

    insertEvidence.run(
      'ev-05-3',
      'ver-05',
      'scn-05-s2',
      'code_targeted_own_account',
      'Code Triggered on Your Own Phone Account',
      'The code received was for your own account registration, not a group admin code',
      'credential',
      0,
      'Verification codes generated for an account belong solely to that account holder. An attacker is attempting to log into YOUR profile.',
      10
    );

    // Choices for Scenario 5
    insertChoice.run(
      'ch-05-1',
      'ver-05',
      'scn-05-s1',
      'scn-05-s2',
      'inspect_incoming_code_text',
      'Inspect the exact text and sender of the incoming SMS code',
      'Check the wording of the SMS message that arrived on your phone.',
      10,
      'Excellent instinct. Checking the exact wording of the incoming code reveals whose account is being accessed.',
      1
    );

    insertChoice.run(
      'ch-05-2',
      'ver-05',
      'scn-05-s1',
      'scn-05-s3b',
      'call_maya_voice',
      'Call Maya directly on phone to verify before replying',
      'Place a voice phone call to your classmate to confirm if she really sent the text.',
      10,
      'Optimal security protocol! An out-of-band phone call immediately disarms account impersonation schemes.',
      1
    );

    insertChoice.run(
      'ch-05-3',
      'ver-05',
      'scn-05-s2',
      'scn-05-s3a',
      'send_code_to_maya',
      'Send Maya the 6-digit code (842-195) to help her out',
      'Text the code quickly so your team does not miss the professor review.',
      0,
      'Fatal mistake! Never forward an OTP. You gave the attacker the key to seize your own account.',
      0
    );

    insertChoice.run(
      'ch-05-4',
      'ver-05',
      'scn-05-s2',
      'scn-05-s3b',
      'refuse_code_and_warn_team',
      'Refuse to share code and alert class Discord/Canvas group',
      'State that sharing OTPs is a security breach, change your account security settings, and warn classmates.',
      10,
      'Superb defense! Protecting your credentials and warning peers prevents an account-takeover contagion.',
      1
    );

    // -------------------------------------------------------------
    // SCENARIO 6: Legitimate Campus Announcement (Do Not False-Report)
    // -------------------------------------------------------------
    db.prepare(`
      INSERT INTO scenarios (id, slug, title, category, difficulty, estimated_minutes, description, status, current_version_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
    `).run(
      'scen-06',
      'legitimate-campus-announcement',
      'Campus Health & Registrar: Annual Health Record Verification',
      'Authentic Communications',
      'Intermediate',
      5,
      'You receive an email from the university registrar regarding annual immunization compliance and upcoming course registration. Investigate whether to report or accept.',
      'ver-06'
    );

    db.prepare(`
      INSERT INTO scenario_versions (id, scenario_id, version_number, initial_scene_id, passing_score, is_published)
      VALUES (?, ?, 1, ?, 70, 1)
    `).run('ver-06', 'scen-06', 'scn-06-s1');

    insertScene.run(
      'scn-06-s1',
      'ver-06',
      'authentic_registrar_notice',
      'Official University Notice: Immunization Compliance',
      'Office of the Registrar & Student Health',
      'registrar@campus.example.edu',
      'file-text',
      'REMINDER: Spring 2027 Registration Hold & Health Record Verification',
      'Today, 10:00 AM',
      `Dear Student,\n\nIn preparation for the Spring 2027 registration cycle opening next month, please verify that your required MMR immunization records are current in the Student Health Portal.\n\nTo view your status:\n1. Open your browser and log into https://portal.campus.example.edu/health\n2. Or call Student Health Center directly at (555) 012-4000.\n\nNo payment or credit card is required. If your records are already verified, no further action is necessary.`,
      'email',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-06-s2',
      'ver-06',
      'header_inspection',
      'Inspecting Email Headers & Institutional Links',
      'Security Header Inspector',
      'registrar@campus.example.edu',
      'shield-check',
      'Technical Header & Domain Audit',
      'Today, 10:05 AM',
      `You inspect the technical details:\n- Sender domain: campus.example.edu (matches genuine university domain)\n- SPF: PASS (IP authorized by university mail exchange)\n- DKIM: PASS (signature valid for d=campus.example.edu)\n- Links: Points directly to https://portal.campus.example.edu with valid university wildcard SSL certificate\n- No payment, gift card, password, or third-party transfer is requested.\n\nHow do you proceed?`,
      'email',
      0,
      null,
      null
    );

    insertScene.run(
      'scn-06-s3a',
      'ver-06',
      'false_positive_mistake',
      'False Alarm: Unwarranted Panic & Blocked Notice',
      'IT Security Feedback',
      'security@campus.example.edu',
      'info',
      'FEEDBACK: Reported Item Was Legitimate University Notice',
      'Today, 11:15 AM',
      `You flagged this message as malicious phishing and blocked the registrar. Consequently, your email client filtered legitimate course registration deadlines, leading to a hold on your class enrollment. Security awareness means discriminating real threats from authentic university communications, not reporting every email.`,
      'email',
      1,
      'warning',
      'False positive: You reported a legitimate university communication. Effective cybersecurity training teaches discrimination between genuine messages and deceptive scams, preventing operational paralysis.'
    );

    insertScene.run(
      'scn-06-s3b',
      'ver-06',
      'verified_authentic_success',
      'Correctly Verified & Processed Authentic Communication',
      'Student Health Portal',
      'health@campus.example.edu',
      'check-circle',
      'SUCCESS: Immunization Status Confirmed for Spring Registration',
      'Today, 10:45 AM',
      `Outstanding analysis! You checked SPF/DKIM headers, confirmed the official campus.example.edu domain, verified the HTTPS certificate, noticed the absence of pressure tactics or fee requests, and safely completed your registration requirement.`,
      'email',
      1,
      'success',
      'Superb discernment! Cybersecurity detective work requires identifying true legitimate communications as accurately as spotting scams, preventing false positives that disrupt academic workflows.'
    );

    // Evidence for Scenario 6 (Legitimate items)
    insertEvidence.run(
      'ev-06-1',
      'ver-06',
      'scn-06-s1',
      'valid_edu_sender',
      'Legitimate University .EDU Sender Address',
      'Sent from official registrar@campus.example.edu address',
      'authentic_channel',
      1, // 1 = Legitimate!
      'Authentic university emails originate directly from official institutional domains with valid DNS records.',
      10
    );

    insertEvidence.run(
      'ev-06-2',
      'ver-06',
      'scn-06-s2',
      'valid_spf_dkim',
      'Valid SPF and DKIM Cryptographic Signatures',
      'Email headers pass SPF and DKIM authentication with no spoofing indicators',
      'authentic_channel',
      1, // 1 = Legitimate!
      'Passing SPF and DKIM verifies that the email was actually sent by the university mail server and was not forged.',
      10
    );

    insertEvidence.run(
      'ev-06-3',
      'ver-06',
      'scn-06-s1',
      'no_payment_or_credentials',
      'Explicit Statement That No Payment or Passwords Are Required',
      'Message explicitly mentions no fees are required and provides the official directory telephone number',
      'authentic_channel',
      1, // 1 = Legitimate!
      'Legitimate administrative notices clearly explain procedures and direct users to established student directory contacts without demands for money.',
      10
    );

    // Choices for Scenario 6
    insertChoice.run(
      'ch-06-1',
      'ver-06',
      'scn-06-s1',
      'scn-06-s2',
      'inspect_headers',
      'Inspect email headers and link domains',
      'Review SPF/DKIM authentication and check the destination URL before taking action.',
      10,
      'Excellent investigation method! Examining headers and URL destinations is the foundation of digital triage.',
      1
    );

    insertChoice.run(
      'ch-06-2',
      'ver-06',
      'scn-06-s1',
      'scn-06-s3a',
      'report_as_phishing_blindly',
      'Report email as phishing immediately because it mentions a registration hold',
      'Flag the message as junk and block registrar@campus.example.edu.',
      2,
      'Imprudent reaction! Simply seeing words like "Hold" or "Deadline" is not grounds to classify authentic university notices as scams.',
      0
    );

    insertChoice.run(
      'ch-06-3',
      'ver-06',
      'scn-06-s2',
      'scn-06-s3b',
      'verify_and_complete',
      'Accept as legitimate and access Student Health portal safely',
      'Navigate to the verified portal link to confirm your health records are up to date.',
      10,
      'Perfect! You correctly confirmed this message is safe and legitimate.',
      1
    );

    insertChoice.run(
      'ch-06-4',
      'ver-06',
      'scn-06-s2',
      'scn-06-s3a',
      'block_and_delete',
      'Delete and report to IT as a scam',
      'Submit a false report to university IT security.',
      2,
      'False alarm. Over-reporting genuine notices wastes security analyst time and can cause you to miss crucial deadlines.',
      0
    );

    // -------------------------------------------------------------
    // SEED SAMPLE ATTEMPT HISTORY FOR ALEX (STUDENT 1)
    // -------------------------------------------------------------
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    const twoDaysAgoPlus12m = new Date(Date.now() - 2 * 86400000 + 12 * 60000).toISOString();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    // Completed attempt on Scenario 1 with a high score (90)
    db.prepare(`
      INSERT INTO attempts (id, user_id, scenario_id, version_id, current_scene_id, status, confidence_rating, decision_score, evidence_score, total_score, is_replay, parent_attempt_id, started_at, completed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'completed', 4, 70.0, 20.0, 90.0, 0, NULL, ?, ?, ?)
    `).run('att-seed-01', 'usr-student-01', 'scen-01', 'ver-01', 'scn-01-s3b', twoDaysAgo, twoDaysAgoPlus12m, twoDaysAgoPlus12m);

    db.prepare(`
      INSERT INTO attempt_decisions (id, attempt_id, scene_id, choice_id, quality_score, feedback_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('dec-seed-01', 'att-seed-01', 'scn-01-s1', 'ch-01-2', 10, 'Optimal response. Verifying through an established campus authority uncovers fraudulent recruiting campaigns safely.', twoDaysAgo);

    db.prepare(`
      INSERT INTO evidence_selections (id, attempt_id, evidence_id, selected_as_suspicious, is_correct, score_awarded, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('evsel-seed-01', 'att-seed-01', 'ev-01-1', 1, 1, 5, twoDaysAgo);

    db.prepare(`
      INSERT INTO evidence_selections (id, attempt_id, evidence_id, selected_as_suspicious, is_correct, score_awarded, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('evsel-seed-02', 'att-seed-01', 'ev-01-2', 1, 1, 5, twoDaysAgo);

    // In-progress attempt on Scenario 3 (so Save & Resume can be immediately demonstrated!)
    db.prepare(`
      INSERT INTO attempts (id, user_id, scenario_id, version_id, current_scene_id, status, confidence_rating, decision_score, evidence_score, total_score, is_replay, parent_attempt_id, started_at, completed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'in_progress', NULL, 35.0, 10.0, 45.0, 0, NULL, ?, NULL, ?)
    `).run('att-seed-02', 'usr-student-01', 'scen-03', 'ver-03', 'scn-03-s2', oneHourAgo, oneHourAgo);

    db.prepare(`
      INSERT INTO attempt_decisions (id, attempt_id, scene_id, choice_id, quality_score, feedback_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('dec-seed-02', 'att-seed-02', 'scn-03-s1', 'ch-03-1', 10, 'Excellent discipline. Inspecting URLs before navigating reveals spoofed domains.', oneHourAgo);

    db.prepare(`
      INSERT INTO evidence_selections (id, attempt_id, evidence_id, selected_as_suspicious, is_correct, score_awarded, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('evsel-seed-03', 'att-seed-02', 'ev-03-1', 1, 1, 10, oneHourAgo);
  });

  seedScenarios();
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    console.log('ScamQuest database seeded successfully.');
    process.exit(0);
  }).catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
}
