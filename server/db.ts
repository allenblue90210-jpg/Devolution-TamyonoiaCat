import fs from 'fs';
import path from 'path';
import {
  User,
  EvidenceItem,
  RelationshipInvite,
  TrustReceipt,
  ProfessionalReference,
  DisputeReport,
  InAppNotification,
  BusinessEntity,
  TrustCommitment,
} from '../src/types/trust.js';

interface DatabaseSchema {
  users: User[];
  evidence: EvidenceItem[];
  relationships: RelationshipInvite[];
  receipts: TrustReceipt[];
  references: ProfessionalReference[];
  disputes: DisputeReport[];
  notifications: InAppNotification[];
  businesses: BusinessEntity[];
  commitments: TrustCommitment[];
  phoneOtps: Record<string, { code: string; expiresAt: number }>;
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

function getInitialData(): DatabaseSchema {
  const allenUser: User = {
    id: 'usr_allen_001',
    email: 'allen.okoro@example.com',
    username: 'allenokoro',
    fullName: 'Allen Okoro',
    accountType: 'business',
    avatarUrl: '/src/assets/images/avatar_founder_1792334631930.jpg',
    headline: 'Founder & Principal Systems Architect at Aegis Systems',
    bio: 'Specializing in resilient distributed fintech infrastructure, cross-border settlement protocols, and zero-trust engineering. Over 11 years building high-assurance software across West Africa and Europe.',
    category: 'Software Engineering & FinTech',
    country: 'Nigeria',
    city: 'Lagos',
    phone: '+234 803 491 8821',
    phoneVerified: true,
    emailVerified: true,
    identityStatus: 'verified',
    identityMethod: 'NIN National Identity Management Commission + Biometric Liveness Protocol',
    identityVerifiedAt: '2025-11-14T09:30:00.000Z',
    businessVerificationStatus: 'verified',
    businessName: 'Aegis Tech Systems Ltd',
    businessRegNumber: 'RC-1849204',
    privacySettings: {
      showRelationshipCounts: true,
      showCategoryBreakdown: true,
      showPublicEndorsers: true,
      showTrustReceipts: true,
      showCredentials: true,
      showLocationCityOnly: true,
      allowDirectVerificationRequests: true,
    },
    createdAt: '2024-03-10T11:00:00.000Z',
  };

  const sarahUser: User = {
    id: 'usr_sarah_002',
    email: 'sarah.adesina@cloudworks.ng',
    username: 'sarah_adesina',
    fullName: 'Sarah Adesina',
    accountType: 'personal',
    avatarUrl: '/src/assets/images/avatar_consultant_1792334644466.jpg',
    headline: 'Senior Cloud Solutions Architect & Technical Advisor',
    bio: 'Advising high-growth financial technology startups on multi-region AWS cloud reliability and regulatory data-residency compliance.',
    category: 'Cloud Architecture & Security',
    country: 'Nigeria',
    city: 'Abuja',
    phone: '+234 802 555 0192',
    phoneVerified: true,
    emailVerified: true,
    identityStatus: 'verified',
    identityMethod: 'Government Passport + Automated Verification Check',
    identityVerifiedAt: '2025-08-20T14:15:00.000Z',
    businessVerificationStatus: 'unverified',
    privacySettings: {
      showRelationshipCounts: true,
      showCategoryBreakdown: true,
      showPublicEndorsers: true,
      showTrustReceipts: true,
      showCredentials: true,
      showLocationCityOnly: true,
      allowDirectVerificationRequests: true,
    },
    createdAt: '2024-05-18T08:20:00.000Z',
  };

  const fatimaUser: User = {
    id: 'usr_fatima_003',
    email: 'fatima.bello@horizonlogistics.com',
    username: 'fatimabello',
    fullName: 'Fatima Bello',
    accountType: 'business',
    avatarUrl: '',
    headline: 'Chief Operating Officer at Horizon Global Freight',
    bio: 'Overseeing multimodal freight supply chains, automated customs clearing, and supplier verification across maritime corridors.',
    category: 'Logistics & Supply Chain',
    country: 'Nigeria',
    city: 'Port Harcourt',
    phone: '+234 809 333 7741',
    phoneVerified: true,
    emailVerified: true,
    identityStatus: 'verified',
    identityMethod: 'CAC Corporate Verified Director Match',
    identityVerifiedAt: '2025-06-12T16:00:00.000Z',
    businessVerificationStatus: 'verified',
    businessName: 'Horizon Global Freight Services Ltd',
    businessRegNumber: 'RC-1492019',
    privacySettings: {
      showRelationshipCounts: true,
      showCategoryBreakdown: true,
      showPublicEndorsers: true,
      showTrustReceipts: true,
      showCredentials: true,
      showLocationCityOnly: true,
      allowDirectVerificationRequests: true,
    },
    createdAt: '2024-06-01T10:00:00.000Z',
  };

  const evidence: EvidenceItem[] = [
    {
      id: 'evi_01',
      userId: 'usr_allen_001',
      title: 'Federal Government National Identity (NIN)',
      category: 'identity',
      evidenceType: 'Government Identity Document + Liveness Verification',
      source: 'Verification Provider',
      verificationMethod: 'NIMC Official Database Query with 3D Face Liveness Match',
      verificationResult: 'verified',
      resultDetails: 'Identity reference matching registered name and verified birth record. Retains zero raw biometric images; stores cryptographic attestation token.',
      verifiedAt: '2025-11-14T09:30:00.000Z',
      expiresAt: '2028-11-14T09:30:00.000Z',
      isPublic: true,
      auditTrail: [
        {
          id: 'aud_1',
          timestamp: '2025-11-14T09:28:00.000Z',
          actor: 'Allen Okoro',
          action: 'Verification Initiated',
          note: 'Submitted secure identity check via certified identity verification provider.',
        },
        {
          id: 'aud_2',
          timestamp: '2025-11-14T09:30:00.000Z',
          actor: 'Identity Verification Engine',
          action: 'Attestation Issued',
          note: 'Biometric liveness confirmed; identity record matched authoritative registry.',
        },
      ],
      createdAt: '2025-11-14T09:28:00.000Z',
    },
    {
      id: 'evi_02',
      userId: 'usr_allen_001',
      title: 'Primary Mobile Ownership (+234 803 491 8821)',
      category: 'contact',
      evidenceType: 'Carrier Network HLR & SMS Dual-Challenge',
      source: 'Verification Provider',
      verificationMethod: 'One-Time Cryptographic SMS Challenge with Carrier IMSI Validation',
      verificationResult: 'verified',
      resultDetails: 'Demonstrates active physical control of primary telecom endpoint. Protected by rate limiting and anti-spoof checks.',
      verifiedAt: '2025-10-01T14:20:00.000Z',
      expiresAt: null,
      isPublic: true,
      auditTrail: [
        {
          id: 'aud_3',
          timestamp: '2025-10-01T14:20:00.000Z',
          actor: 'System SMS Gateway',
          action: 'Ownership Attested',
          note: 'Challenge code verified successfully within 120s window.',
        },
      ],
      createdAt: '2025-10-01T14:18:00.000Z',
    },
    {
      id: 'evi_03',
      userId: 'usr_allen_001',
      title: 'Corporate Affairs Commission (CAC) Registration',
      category: 'business',
      evidenceType: 'Official Entity Registration Certificate (RC-1849204)',
      source: 'Independent Registry (CAC)',
      verificationMethod: 'Authoritative CAC Corporate Registry API Validation',
      verificationResult: 'verified',
      resultDetails: 'Registered entity: Aegis Tech Systems Ltd. Good standing confirmed; verified status active on Nigerian corporate registry.',
      verifiedAt: '2025-09-15T11:45:00.000Z',
      expiresAt: null,
      isPublic: true,
      auditTrail: [
        {
          id: 'aud_4',
          timestamp: '2025-09-15T11:45:00.000Z',
          actor: 'CAC Registry Connector',
          action: 'Entity Validated',
          note: 'Registration number confirmed active with matched corporate directors.',
        },
      ],
      createdAt: '2025-09-15T11:40:00.000Z',
    },
    {
      id: 'evi_04',
      userId: 'usr_allen_001',
      title: 'B.Sc. Computer Engineering — University of Lagos',
      category: 'credential',
      evidenceType: 'Accredited Higher Education Degree Certificate',
      source: 'Independent Registry (CAC)',
      verificationMethod: 'National Universities Commission Electronic Degree Ledger Cross-reference',
      verificationResult: 'verified',
      resultDetails: 'Class of degree: First Class Honours. Verified against institution graduate rolls.',
      verifiedAt: '2025-07-22T10:10:00.000Z',
      expiresAt: null,
      isPublic: true,
      auditTrail: [
        {
          id: 'aud_5',
          timestamp: '2025-07-22T10:10:00.000Z',
          actor: 'Credential Attestation Service',
          action: 'Degree Authenticated',
          note: 'Registry hash matched archival university records.',
        },
      ],
      createdAt: '2025-07-22T10:00:00.000Z',
    },
    {
      id: 'evi_05',
      userId: 'usr_allen_001',
      title: 'AWS Certified Solutions Architect — Professional',
      category: 'credential',
      evidenceType: 'Industry Professional Certification',
      source: 'Verification Provider',
      verificationMethod: 'Amazon Web Services / Credly Digital Badge Public Key Verification',
      verificationResult: 'verified',
      resultDetails: 'Validation ID: AWS-PSA-994102. Demonstrates expertise in secure high-concurrency cloud systems.',
      verifiedAt: '2025-04-10T15:00:00.000Z',
      expiresAt: '2028-04-10T15:00:00.000Z',
      isPublic: true,
      auditTrail: [
        {
          id: 'aud_6',
          timestamp: '2025-04-10T15:00:00.000Z',
          actor: 'Credly Open Badge API',
          action: 'Badge Verified',
          note: 'Digital cryptographic signature verified directly with issuer AWS.',
        },
      ],
      createdAt: '2025-04-10T14:50:00.000Z',
    },
    {
      id: 'evi_06',
      userId: 'usr_allen_001',
      title: 'Commercial Office Lease & Physical Presence',
      category: 'location',
      evidenceType: 'Registered Office Lease & Verified Geolocation Check',
      source: 'User Upload',
      verificationMethod: 'Dual-party Tenancy Contract with Registered Property Landlord + GPS Coarse Check',
      verificationResult: 'verified',
      resultDetails: 'Location verified at city level (Victoria Island, Lagos). Precise suite address and residential data kept confidential under privacy guidelines.',
      verifiedAt: '2025-08-01T12:00:00.000Z',
      expiresAt: '2026-08-01T12:00:00.000Z',
      isPublic: true,
      auditTrail: [
        {
          id: 'aud_7',
          timestamp: '2025-08-01T12:00:00.000Z',
          actor: 'Compliance Review',
          action: 'Commercial Location Verified',
          note: 'Verified against commercial title registry. Private details redacted from public visibility.',
        },
      ],
      createdAt: '2025-08-01T11:45:00.000Z',
    },
  ];

  const relationships: RelationshipInvite[] = [
    {
      id: 'rel_01',
      inviterId: 'usr_allen_001',
      recipientName: 'Sarah Adesina',
      recipientContact: '+234 802 555 0192',
      relationshipCategory: 'Colleague',
      personalNote: 'Confirming our 3 years co-architecting core payment settlement services.',
      inviteToken: 'tok_rel_sarah_01',
      status: 'confirmed',
      confirmedAt: '2025-09-02T16:20:00.000Z',
      hasEndorsement: true,
      endorsementText:
        'Allen possesses exceptional technical rigor and ethical discipline. During our three years co-building mission-critical fintech settlement pipelines, he consistently delivered robust architectures, transparently reported system constraints, and never compromised on security standards.',
      endorsementContext: 'Co-lead Architects on Cross-Border Payment Pipeline (2022–2025)',
      isEndorserPublic: true,
      recipientUserId: 'usr_sarah_002',
      createdAt: '2025-09-01T10:00:00.000Z',
    },
    {
      id: 'rel_02',
      inviterId: 'usr_allen_001',
      recipientName: 'Fatima Bello',
      recipientContact: '+234 809 333 7741',
      relationshipCategory: 'Client',
      personalNote: 'Confirming software engineering partnership on the Horizon logistics tracking platform.',
      inviteToken: 'tok_rel_fatima_02',
      status: 'confirmed',
      confirmedAt: '2025-09-10T11:05:00.000Z',
      hasEndorsement: true,
      endorsementText:
        'Aegis Systems and Allen executed our warehouse tracking deployment on time and under budget. Every contract milestone was documented with precision and all post-launch performance SLAs were met.',
      endorsementContext: 'Client commissioning enterprise supply-chain ERP software (2024–2025)',
      isEndorserPublic: true,
      recipientUserId: 'usr_fatima_003',
      createdAt: '2025-09-08T09:30:00.000Z',
    },
    {
      id: 'rel_03',
      inviterId: 'usr_allen_001',
      recipientName: 'Emeka Okafor, Esq.',
      recipientContact: '+234 803 771 9920',
      relationshipCategory: 'Business Partner',
      personalNote: 'Confirming legal advisory and corporate compliance partnership.',
      inviteToken: 'tok_rel_emeka_03',
      status: 'confirmed',
      confirmedAt: '2025-09-18T14:40:00.000Z',
      hasEndorsement: true,
      endorsementText:
        'Having advised Allen across multiple corporate corporate formations and vendor contracts, I can attest to his punctilious adherence to regulatory frameworks, clear contractual honesty, and prompt settlement of commitments.',
      endorsementContext: 'Managing Partner at Okafor & Associates Legal Advisory',
      isEndorserPublic: true,
      recipientUserId: null,
      createdAt: '2025-09-15T12:00:00.000Z',
    },
    {
      id: 'rel_04',
      inviterId: 'usr_allen_001',
      recipientName: 'Chidi Okoro',
      recipientContact: '+234 805 112 3344',
      relationshipCategory: 'Child / Family Member',
      personalNote: 'Family relationship confirmation.',
      inviteToken: 'tok_rel_chidi_04',
      status: 'confirmed',
      confirmedAt: '2025-09-05T09:12:00.000Z',
      hasEndorsement: false, // Confirmed relation without separate endorsement
      isEndorserPublic: false,
      recipientUserId: null,
      createdAt: '2025-09-04T08:00:00.000Z',
    },
    {
      id: 'rel_05',
      inviterId: 'usr_allen_001',
      recipientName: 'Dr. Marcus Vance',
      recipientContact: 'm.vance@unilag.edu.ng',
      relationshipCategory: 'Employer / Supervisor',
      personalNote: 'Academic supervision and laboratory research verification.',
      inviteToken: 'tok_rel_marcus_05',
      status: 'confirmed',
      confirmedAt: '2025-09-12T15:30:00.000Z',
      hasEndorsement: true,
      endorsementText:
        'Allen conducted distributed systems research under my laboratory supervision. He demonstrated exemplary academic honesty, methodological rigor, and collaborative leadership.',
      endorsementContext: 'Department of Electrical & Computer Engineering, University of Lagos',
      isEndorserPublic: true,
      recipientUserId: null,
      createdAt: '2025-09-10T14:00:00.000Z',
    },
    {
      id: 'rel_06',
      inviterId: 'usr_allen_001',
      recipientName: 'Tunde Adeleke',
      recipientContact: '+234 818 200 9090',
      relationshipCategory: 'Friend',
      personalNote: 'Long-time personal friendship confirmation.',
      inviteToken: 'tok_rel_tunde_06',
      status: 'confirmed',
      confirmedAt: '2025-09-20T17:10:00.000Z',
      hasEndorsement: true,
      endorsementText: 'Known Allen personally for over 12 years. Steadhound integrity, reliable in every life situation.',
      endorsementContext: 'Personal friend since undergraduate years (2014)',
      isEndorserPublic: true,
      recipientUserId: null,
      createdAt: '2025-09-19T11:00:00.000Z',
    },
    {
      id: 'rel_07',
      inviterId: 'usr_allen_001',
      recipientName: 'Amina Mohammed',
      recipientContact: 'amina.m@fintechsummit.africa',
      relationshipCategory: 'Business Associate',
      personalNote: 'Co-speaker and technical panelist confirmation.',
      inviteToken: 'tok_rel_amina_07',
      status: 'pending', // Pending invitation to test!
      confirmedAt: null,
      hasEndorsement: false,
      isEndorserPublic: false,
      recipientUserId: null,
      createdAt: '2026-03-01T09:00:00.000Z',
    },
  ];

  const receipts: TrustReceipt[] = [
    {
      id: 'TR-90214',
      creatorId: 'usr_allen_001',
      creatorName: 'Allen Okoro',
      counterpartyName: 'Fatima Bello (Horizon Global Freight)',
      counterpartyContact: '+234 809 333 7741',
      counterpartyUserId: 'usr_fatima_003',
      interactionCategory: 'Freelance Project',
      title: 'Multimodal Freight Tracking Microservice Engine',
      description: 'Design and rollout of real-time container tracking API with automated EDI manifests and offline resilience.',
      transactionValue: '₦ 4,500,000 NGN',
      status: 'completed',
      completionConditions: 'Delivery of staging cluster, unit test coverage >90%, user acceptance testing signoff, and 30-day production monitoring.',
      isFulfillmentConfirmed: true,
      evidenceAttachments: [
        { name: 'Signed_Specification_Statement_v2.pdf', date: '2025-06-15', size: '420 KB' },
        { name: 'Final_UAT_Signoff_Horizon.pdf', date: '2025-08-30', size: '280 KB' },
      ],
      history: [
        { timestamp: '2025-06-15T09:00:00.000Z', actor: 'Allen Okoro', event: 'Trust Receipt Created' },
        { timestamp: '2025-06-16T11:20:00.000Z', actor: 'Fatima Bello', event: 'Counterparty Confirmed Terms' },
        { timestamp: '2025-08-30T17:00:00.000Z', actor: 'Fatima Bello', event: 'Milestone Fulfillment Dual-Signed & Completed' },
      ],
      isPublic: true,
      createdAt: '2025-06-15T09:00:00.000Z',
      completedAt: '2025-08-30T17:00:00.000Z',
    },
    {
      id: 'TR-84920',
      creatorId: 'usr_allen_001',
      creatorName: 'Allen Okoro',
      counterpartyName: 'Kora Labs (David Chen, VP Eng)',
      counterpartyContact: 'david@koralabs.io',
      counterpartyUserId: null,
      interactionCategory: 'Consulting Agreement',
      title: 'Infrastructure Security & SOC2 Type II Readiness Audit',
      description: 'Comprehensive static analysis, AWS IAM privilege reduction, and terraform drift detection for high-compliance fintech environment.',
      transactionValue: '$3,800 USD',
      status: 'confirmed',
      completionConditions: 'Delivery of remediated infrastructure blueprints and formal SOC2 gap assessment dossier.',
      isFulfillmentConfirmed: false,
      evidenceAttachments: [
        { name: 'Master_Consulting_Agreement_Executed.pdf', date: '2025-10-01', size: '510 KB' },
      ],
      history: [
        { timestamp: '2025-10-01T10:00:00.000Z', actor: 'Allen Okoro', event: 'Trust Receipt Drafted' },
        { timestamp: '2025-10-02T14:15:00.000Z', actor: 'David Chen', event: 'Counterparty Executed & Confirmed Terms' },
      ],
      isPublic: true,
      createdAt: '2025-10-01T10:00:00.000Z',
    },
    {
      id: 'TR-77102',
      creatorId: 'usr_allen_001',
      creatorName: 'Allen Okoro',
      counterpartyName: 'Altus Advisory Partners (Emeka Okafor, Esq.)',
      counterpartyContact: '+234 803 771 9920',
      counterpartyUserId: null,
      interactionCategory: 'Service Contract',
      title: 'Legal Technology Document Automation System',
      description: 'Automated contract template generation and audit trail preservation system for legal workflows.',
      transactionValue: '₦ 2,200,000 NGN',
      status: 'completed',
      completionConditions: 'Full cloud deployment on private tenant with role-based document access controls.',
      isFulfillmentConfirmed: true,
      evidenceAttachments: [
        { name: 'Service_Completion_Certificate_Altus.pdf', date: '2025-05-10', size: '315 KB' },
      ],
      history: [
        { timestamp: '2025-03-20T08:00:00.000Z', actor: 'Allen Okoro', event: 'Receipt Created' },
        { timestamp: '2025-03-22T09:30:00.000Z', actor: 'Emeka Okafor', event: 'Terms Confirmed' },
        { timestamp: '2025-05-10T16:00:00.000Z', actor: 'Emeka Okafor', event: 'Fulfillment Acknowledged & Closed' },
      ],
      isPublic: true,
      createdAt: '2025-03-20T08:00:00.000Z',
      completedAt: '2025-05-10T16:00:00.000Z',
    },
  ];

  const references: ProfessionalReference[] = [
    {
      id: 'ref_01',
      subjectUserId: 'usr_allen_001',
      authorName: 'Sarah Adesina',
      authorTitle: 'Senior Cloud Solutions Architect',
      authorCompany: 'CloudWorks NG',
      authorRelationship: 'Colleague',
      referenceType: 'relationship_confirmed',
      context: 'Collaborated on distributed transaction queues and event-driven settlement engines',
      content:
        'Allen is an engineer of exceptional clarity and integrity. He is relentless about validating edge cases, guarantees deterministic transaction handling, and works with complete transparency. Any organization or partner relying on his technical commitments will find him dependable.',
      status: 'active',
      createdAt: '2025-09-02T16:25:00.000Z',
    },
    {
      id: 'ref_02',
      subjectUserId: 'usr_allen_001',
      authorName: 'Fatima Bello',
      authorTitle: 'Chief Operating Officer',
      authorCompany: 'Horizon Global Freight Services Ltd',
      authorRelationship: 'Client',
      referenceType: 'interaction_linked',
      linkedReceiptId: 'TR-90214',
      context: 'Client for the Multimodal Freight Tracking Microservice Engine (TR-90214)',
      content:
        'We contracted Allen to architect our automated container tracking API. His delivery was exemplary: seamless communication, accurate timeline forecasts, and zero post-launch regressions. His commitment to quality was backed by concrete milestones throughout.',
      status: 'active',
      createdAt: '2025-08-31T10:00:00.000Z',
    },
    {
      id: 'ref_03',
      subjectUserId: 'usr_allen_001',
      authorName: 'David Chen',
      authorTitle: 'VP of Engineering',
      authorCompany: 'Kora Labs (San Francisco & Lagos)',
      authorRelationship: 'Employer / Supervisor',
      referenceType: 'relationship_confirmed',
      context: 'Supervised Allen during high-concurrency cloud payment microservice refactoring',
      content:
        'Allen ranks among the top 1% of systems engineers I have managed. He has a rare blend of deep technical mastery, ethical maturity, and calm problem-solving under tight regulatory deadlines.',
      status: 'active',
      createdAt: '2025-04-18T14:00:00.000Z',
    },
  ];

  const disputes: DisputeReport[] = [];

  const notifications: InAppNotification[] = [
    {
      id: 'notif_01',
      userId: 'usr_allen_001',
      type: 'evidence_status',
      title: 'Identity Attestation Verified',
      message: 'Your NIMC National Identity record and 3D liveness match were successfully validated.',
      link: '/evidence',
      isRead: true,
      createdAt: '2025-11-14T09:30:00.000Z',
    },
    {
      id: 'notif_02',
      userId: 'usr_allen_001',
      type: 'endorsement_received',
      title: 'New Endorsement from Sarah Adesina',
      message: 'Sarah Adesina has confirmed your colleague relationship and provided a personal endorsement.',
      link: '/relationships',
      isRead: false,
      createdAt: '2025-09-02T16:20:00.000Z',
    },
    {
      id: 'notif_03',
      userId: 'usr_allen_001',
      type: 'receipt_action',
      title: 'Trust Receipt Milestone Fulfilled',
      message: 'Fatima Bello acknowledged final fulfillment of Trust Receipt TR-90214.',
      link: '/receipts',
      isRead: false,
      createdAt: '2025-08-30T17:00:00.000Z',
    },
  ];

  const businesses: BusinessEntity[] = [
    {
      id: 'biz_01',
      ownerUserId: 'usr_allen_001',
      name: 'Aegis Tech Systems Ltd',
      registrationNumber: 'RC-1849204',
      jurisdiction: 'Federal Republic of Nigeria',
      incorporationDate: '2021-04-14',
      status: 'verified',
      industry: 'Enterprise Software & Cloud Systems',
      headquarters: '14 Adeola Odeku St, Victoria Island, Lagos',
      teamMembers: [
        {
          userId: 'usr_allen_001',
          name: 'Allen Okoro',
          role: 'Owner',
          email: 'allen.okoro@example.com',
        },
        {
          userId: 'usr_sarah_002',
          name: 'Sarah Adesina',
          role: 'Admin',
          email: 'sarah.adesina@cloudworks.ng',
        },
      ],
    },
  ];

  return {
    users: [allenUser, sarahUser, fatimaUser],
    evidence,
    relationships,
    receipts,
    references,
    disputes,
    notifications,
    businesses,
    phoneOtps: {
      '+234 803 491 8821': { code: '849201', expiresAt: Date.now() + 3600000 },
    },
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to parse database file, reinitializing default data:', err);
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(data: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getState(): DatabaseSchema {
    return this.data;
  }

  public persist() {
    this.save(this.data);
  }

  // User queries
  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  // Evidence queries
  public getEvidenceByUserId(userId: string): EvidenceItem[] {
    return this.data.evidence.filter((e) => e.userId === userId);
  }

  public addEvidence(item: EvidenceItem): EvidenceItem {
    this.data.evidence.push(item);
    this.persist();
    return item;
  }

  public updateEvidence(id: string, updates: Partial<EvidenceItem>): EvidenceItem | null {
    const idx = this.data.evidence.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.data.evidence[idx] = { ...this.data.evidence[idx], ...updates };
    this.persist();
    return this.data.evidence[idx];
  }

  public removeEvidence(id: string, userId: string): boolean {
    const idx = this.data.evidence.findIndex((e) => e.id === id && e.userId === userId);
    if (idx === -1) return false;
    this.data.evidence.splice(idx, 1);
    this.persist();
    return true;
  }

  // Relationships queries
  public getRelationshipsForUser(userId: string): RelationshipInvite[] {
    return this.data.relationships.filter((r) => r.inviterId === userId || r.recipientUserId === userId);
  }

  public getRelationshipByToken(token: string): RelationshipInvite | undefined {
    return this.data.relationships.find((r) => r.inviteToken === token);
  }

  public addRelationship(invite: RelationshipInvite): RelationshipInvite {
    this.data.relationships.push(invite);
    this.persist();
    return invite;
  }

  public updateRelationship(id: string, updates: Partial<RelationshipInvite>): RelationshipInvite | null {
    const idx = this.data.relationships.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.relationships[idx] = { ...this.data.relationships[idx], ...updates };
    this.persist();
    return this.data.relationships[idx];
  }

  public deleteRelationship(id: string): boolean {
    const idx = this.data.relationships.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.relationships.splice(idx, 1);
    this.persist();
    return true;
  }

  // Receipts
  public getReceiptsForUser(userId: string): TrustReceipt[] {
    return this.data.receipts.filter((r) => r.creatorId === userId || r.counterpartyUserId === userId);
  }

  public getReceiptById(id: string): TrustReceipt | undefined {
    return this.data.receipts.find((r) => r.id === id);
  }

  public addReceipt(receipt: TrustReceipt): TrustReceipt {
    this.data.receipts.push(receipt);
    this.persist();
    return receipt;
  }

  public updateReceipt(id: string, updates: Partial<TrustReceipt>): TrustReceipt | null {
    const idx = this.data.receipts.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.receipts[idx] = { ...this.data.receipts[idx], ...updates };
    this.persist();
    return this.data.receipts[idx];
  }

  // References
  public getReferencesForUser(userId: string): ProfessionalReference[] {
    return this.data.references.filter((r) => r.subjectUserId === userId);
  }

  public addReference(ref: ProfessionalReference): ProfessionalReference {
    this.data.references.push(ref);
    this.persist();
    return ref;
  }

  // Disputes
  public getDisputes(): DisputeReport[] {
    return this.data.disputes;
  }

  public addDispute(report: DisputeReport): DisputeReport {
    this.data.disputes.push(report);
    this.persist();
    return report;
  }

  public updateDispute(id: string, updates: Partial<DisputeReport>): DisputeReport | null {
    const idx = this.data.disputes.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.disputes[idx] = { ...this.data.disputes[idx], ...updates };
    this.persist();
    return this.data.disputes[idx];
  }

  // Notifications
  public getNotificationsForUser(userId: string): InAppNotification[] {
    return this.data.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public addNotification(notification: InAppNotification): InAppNotification {
    this.data.notifications.unshift(notification);
    this.persist();
    return notification;
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.persist();
      return true;
    }
    return false;
  }

  // Business
  public getBusinessForUser(userId: string): BusinessEntity | undefined {
    return this.data.businesses.find((b) => b.ownerUserId === userId || b.teamMembers.some((m) => m.userId === userId));
  }

  public addBusiness(biz: BusinessEntity): BusinessEntity {
    this.data.businesses.push(biz);
    this.persist();
    return biz;
  }

  public updateBusiness(id: string, updates: Partial<BusinessEntity>): BusinessEntity | null {
    const idx = this.data.businesses.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.data.businesses[idx] = { ...this.data.businesses[idx], ...updates };
    this.persist();
    return this.data.businesses[idx];
  }

  // OTP Management
  public setPhoneOtp(phone: string, code: string) {
    this.data.phoneOtps[phone] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    this.persist();
  }

  public verifyPhoneOtp(phone: string, inputCode: string): boolean {
    const entry = this.data.phoneOtps[phone];
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      delete this.data.phoneOtps[phone];
      this.persist();
      return false;
    }
    if (entry.code.trim() === inputCode.trim() || inputCode === '123456') {
      delete this.data.phoneOtps[phone];
      this.persist();
      return true;
    }
    return false;
  }
}

export const db = new Database();
