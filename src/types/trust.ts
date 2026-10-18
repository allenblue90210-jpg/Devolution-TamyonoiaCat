/**
 * Standalone Trust & Reputation Platform Types
 * Strictly enforces evidence-based data models, privacy boundaries, and auditability.
 */

export type AccountType = 'personal' | 'business';

export type IdentityStatus = 'unverified' | 'submitted' | 'verified' | 'failed' | 'expired';

export type RelationshipCategory =
  | 'Parent'
  | 'Child / Family Member'
  | 'Relative'
  | 'Friend'
  | 'Colleague'
  | 'Former Colleague'
  | 'Employer / Supervisor'
  | 'Client'
  | 'Business Associate'
  | 'Business Partner'
  | 'Other';

export type EvidenceCategory =
  | 'identity'
  | 'contact'
  | 'location'
  | 'business'
  | 'credential'
  | 'commitment'
  | 'other';

export type VerificationResult =
  | 'not_provided'
  | 'submitted'
  | 'verified'
  | 'unverified'
  | 'failed'
  | 'expired'
  | 'revoked';

export type ReceiptStatus = 'pending' | 'confirmed' | 'completed' | 'disputed' | 'cancelled';

export type CommitmentCategory =
  | 'Vehicle & Transportation'
  | 'Delivery & Logistics'
  | 'Financial & Lending'
  | 'Equipment & Machinery'
  | 'Professional Milestone'
  | 'Personal Promise'
  | 'Other';

export type CommitmentStatus =
  | 'pending_acceptance'
  | 'active'
  | 'fulfilled_pending_checkout'
  | 'completed'
  | 'overdue'
  | 'disputed'
  | 'cancelled';

export interface TrustCommitment {
  id: string; // e.g. TC-9014
  title: string;
  description: string;
  category: CommitmentCategory;
  otherCategoryDetails?: string;
  requesterId: string; // User A
  requesterName: string;
  requesterAvatar?: string;
  committerId: string; // User B
  committerName: string;
  committerAvatar?: string;
  deadline: string; // ISO string e.g. 2026-10-19T02:00:00.000Z
  committerPledgeNote?: string; // e.g. "I'll bring it by 2am"
  status: CommitmentStatus;
  trustRewardPoints: number; // e.g. +25
  penaltyRateDailyPercent: number; // e.g. 30 (daily deduction when overdue)
  penaltyCurrentDeductionPercent: number; // e.g. 30, 60
  isOverdue: boolean;
  daysOverdue: number;
  checkedOutByCommitterAt?: string | null;
  checkedOutByRequesterAt?: string | null;
  linkedReceiptId?: string | null;
  isPublic: boolean;
  createdAt: string;
  completedAt?: string | null;
}

export type ReferenceType =
  | 'relationship_confirmed'
  | 'interaction_linked'
  | 'credential_authenticated'
  | 'unverified_testimonial';

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  note: string;
}

export interface UserPrivacySettings {
  showRelationshipCounts: boolean;
  showCategoryBreakdown: boolean;
  showPublicEndorsers: boolean;
  showTrustReceipts: boolean;
  showCredentials: boolean;
  showLocationCityOnly: boolean;
  allowDirectVerificationRequests: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  accountType: AccountType;
  avatarUrl: string;
  headline: string;
  bio: string;
  category: string;
  country: string;
  city: string;
  phone: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  identityStatus: IdentityStatus;
  identityMethod: string;
  identityVerifiedAt: string | null;
  businessVerificationStatus: 'unverified' | 'submitted' | 'verified' | 'failed';
  businessName?: string;
  businessRegNumber?: string;
  privacySettings: UserPrivacySettings;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  userId: string;
  title: string;
  category: EvidenceCategory;
  evidenceType: string;
  source: 'User Upload' | 'Independent Registry (CAC)' | 'Verification Provider' | 'Counterparty Signed';
  verificationMethod: string;
  verificationResult: VerificationResult;
  resultDetails: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  isPublic: boolean;
  fileAttachment?: {
    name: string;
    size: string;
    mimeType: string;
  };
  auditTrail: AuditRecord[];
  createdAt: string;
}

export interface RelationshipInvite {
  id: string;
  inviterId: string;
  recipientName: string;
  recipientContact: string;
  relationshipCategory: RelationshipCategory;
  personalNote?: string;
  inviteToken: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'revoked' | 'blocked';
  confirmedAt: string | null;
  hasEndorsement: boolean;
  endorsementText?: string;
  endorsementContext?: string;
  isEndorserPublic: boolean;
  recipientUserId?: string | null;
  createdAt: string;
}

export interface TrustReceipt {
  id: string; // e.g. TR-89241
  creatorId: string;
  creatorName: string;
  counterpartyName: string;
  counterpartyContact: string;
  counterpartyUserId?: string | null;
  interactionCategory:
    | 'Freelance Project'
    | 'Goods Sale & Delivery'
    | 'Consulting Agreement'
    | 'Loan / Micro-credit Repayment'
    | 'Property Lease'
    | 'Joint Venture'
    | 'Service Contract'
    | 'Other';
  otherCategoryDetails?: string;
  title: string;
  description: string;
  transactionValue?: string;
  status: ReceiptStatus;
  completionConditions: string;
  isFulfillmentConfirmed: boolean;
  evidenceAttachments: Array<{
    name: string;
    date: string;
    size?: string;
  }>;
  history: Array<{
    timestamp: string;
    actor: string;
    event: string;
  }>;
  isPublic: boolean;
  createdAt: string;
  completedAt?: string | null;
}

export interface ProfessionalReference {
  id: string;
  subjectUserId: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  authorRelationship: RelationshipCategory;
  referenceType: ReferenceType;
  context: string;
  content: string;
  linkedReceiptId?: string;
  status: 'active' | 'flagged' | 'under_review';
  createdAt: string;
}

export interface DisputeReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'profile' | 'receipt' | 'endorsement' | 'evidence';
  targetId: string;
  reason: 'impersonation' | 'fabricated_evidence' | 'unfulfilled_commitment' | 'coercion' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolutionNote?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  type:
    | 'relationship_invite'
    | 'relationship_confirmed'
    | 'endorsement_received'
    | 'receipt_action'
    | 'evidence_status'
    | 'dispute_alert'
    | 'system_update';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface BusinessEntity {
  id: string;
  ownerUserId: string;
  name: string;
  registrationNumber: string;
  jurisdiction: string;
  incorporationDate: string;
  status: 'submitted' | 'verified' | 'unverified';
  industry: string;
  headquarters: string;
  teamMembers: Array<{
    userId: string;
    name: string;
    role: 'Owner' | 'Admin' | 'Compliance Officer' | 'Member';
    email: string;
  }>;
}

export interface ReputationBreakdown {
  userId: string;
  summaryLevel: 'Adequate Evidence' | 'High Evidentiary Depth' | 'Preliminary Verification' | 'Insufficient Evidence';
  methodologyVersion: 'v1.4-verifiable-criteria';
  lastCalculatedAt: string;
  dimensions: {
    identityVerification: {
      status: string;
      verified: boolean;
      method: string;
      weightDescription: string;
    };
    contactAuthenticity: {
      phoneVerified: boolean;
      emailVerified: boolean;
      rateLimited: boolean;
      weightDescription: string;
    };
    socialVerification: {
      confirmedCount: number;
      familyCount: number;
      colleagueCount: number;
      clientCount: number;
      otherCount: number;
      vouchedEndorsementsCount: number;
      weightDescription: string;
    };
    credentialIntegrity: {
      totalCredentials: number;
      registryBacked: number;
      weightDescription: string;
    };
    transactionalFulfillment: {
      totalReceipts: number;
      completedWithoutDispute: number;
      disputedCount: number;
      weightDescription: string;
    };
    referenceCredibility: {
      totalReferences: number;
      interactionLinkedCount: number;
      weightDescription: string;
    };
    riskAndDisputeStatus: {
      activeDisputes: number;
      resolvedDisputes: number;
      safetyFlag: boolean;
      weightDescription: string;
    };
  };
  trustScore: number; // 0 - 100 calculated score
  trustGrade: 'A+ Exemplary' | 'A Verified & Reliable' | 'B Good Standing' | 'C Conditional' | 'D Penalized / High Risk';
  penaltyPercent: number; // e.g. 0, 30, 60
  penaltyActive: boolean;
  penaltyNotice: string | null;
  commitmentsSummary: {
    total: number;
    completedOnTime: number;
    activeCount: number;
    overdueCount: number;
    onTimeDeliveryRate: number; // e.g. 96 (%)
  };
  transparentFormulaNotice: string;
  disclaimer: string;
}
