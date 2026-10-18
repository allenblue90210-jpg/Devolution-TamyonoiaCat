import { User, EvidenceItem, RelationshipInvite, TrustReceipt, ProfessionalReference, DisputeReport, ReputationBreakdown } from '../src/types/trust.js';

/**
 * Server-authoritative Transparent Reputation Engine
 * Version: v1.4-verifiable-criteria
 *
 * Implements strict non-monolithic, multi-dimensional assessment.
 * Avoids vanity metrics, prevents purchased reputation, handles sparse data gracefully,
 * and maintains explicit mathematical transparency with clear warnings.
 */
export function calculateReputation(
  user: User,
  evidenceList: EvidenceItem[],
  relationships: RelationshipInvite[],
  receipts: TrustReceipt[],
  references: ProfessionalReference[],
  disputes: DisputeReport[]
): ReputationBreakdown {
  const confirmedRelationships = relationships.filter((r) => r.status === 'confirmed');
  const vouchedEndorsements = confirmedRelationships.filter((r) => r.hasEndorsement);

  const familyCount = confirmedRelationships.filter((r) =>
    ['Parent', 'Child / Family Member', 'Relative'].includes(r.relationshipCategory)
  ).length;

  const colleagueCount = confirmedRelationships.filter((r) =>
    ['Colleague', 'Former Colleague', 'Employer / Supervisor'].includes(r.relationshipCategory)
  ).length;

  const clientCount = confirmedRelationships.filter((r) =>
    ['Client', 'Business Associate', 'Business Partner'].includes(r.relationshipCategory)
  ).length;

  const otherCount = confirmedRelationships.filter((r) => r.relationshipCategory === 'Other' || r.relationshipCategory === 'Friend').length;

  const verifiedCredentials = evidenceList.filter(
    (e) => e.category === 'credential' && e.verificationResult === 'verified'
  );
  const registryBacked = evidenceList.filter(
    (e) => e.source.includes('Registry') || e.source.includes('Provider')
  );

  const completedReceipts = receipts.filter((r) => r.status === 'completed' && r.isFulfillmentConfirmed);
  const disputedReceipts = receipts.filter((r) => r.status === 'disputed');

  const interactionLinkedRefs = references.filter((r) => r.referenceType === 'interaction_linked' || Boolean(r.linkedReceiptId));

  const activeDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'investigating').length;
  const resolvedDisputes = disputes.filter((d) => d.status === 'resolved').length;

  // Evidentiary completeness tier
  let summaryLevel: ReputationBreakdown['summaryLevel'] = 'Insufficient Evidence';

  const totalPrimaryEvidenceCount =
    (user.identityStatus === 'verified' ? 1 : 0) +
    (user.phoneVerified ? 1 : 0) +
    (confirmedRelationships.length >= 2 ? 1 : 0) +
    (verifiedCredentials.length >= 1 ? 1 : 0) +
    (completedReceipts.length >= 1 ? 1 : 0);

  if (totalPrimaryEvidenceCount >= 4 && confirmedRelationships.length >= 3) {
    summaryLevel = 'High Evidentiary Depth';
  } else if (totalPrimaryEvidenceCount >= 2) {
    summaryLevel = 'Adequate Evidence';
  } else if (totalPrimaryEvidenceCount === 1) {
    summaryLevel = 'Preliminary Verification';
  } else {
    summaryLevel = 'Insufficient Evidence';
  }

  return {
    userId: user.id,
    summaryLevel,
    methodologyVersion: 'v1.4-verifiable-criteria',
    lastCalculatedAt: new Date().toISOString(),
    dimensions: {
      identityVerification: {
        status: user.identityStatus,
        verified: user.identityStatus === 'verified',
        method: user.identityMethod || 'Pending submission to independent identity verifier',
        weightDescription: 'Requires authoritative ID validation and liveness check. Never simulated or granted merely upon document upload.',
      },
      contactAuthenticity: {
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        rateLimited: true,
        weightDescription: 'Demonstrates active channel control. Strictly non-transferable and not equated with honesty.',
      },
      socialVerification: {
        confirmedCount: confirmedRelationships.length,
        familyCount,
        colleagueCount,
        clientCount,
        otherCount,
        vouchedEndorsementsCount: vouchedEndorsements.length,
        weightDescription: 'Derived strictly from two-sided confirmations. Personal endorsements are voluntary and separated from raw relationship validation.',
      },
      credentialIntegrity: {
        totalCredentials: verifiedCredentials.length,
        registryBacked: registryBacked.length,
        weightDescription: 'Distinguishes user-submitted assertions from independently attested qualifications.',
      },
      transactionalFulfillment: {
        totalReceipts: receipts.length,
        completedWithoutDispute: completedReceipts.length,
        disputedCount: disputedReceipts.length,
        weightDescription: 'Documented commitments with counterparty dual-signoff and confirmed fulfillment milestones.',
      },
      referenceCredibility: {
        totalReferences: references.length,
        interactionLinkedCount: interactionLinkedRefs.length,
        weightDescription: 'Professional testimonials tied to verifiable transactions or confirmed colleague relationships.',
      },
      riskAndDisputeStatus: {
        activeDisputes,
        resolvedDisputes,
        safetyFlag: activeDisputes > 0,
        weightDescription: 'Real-time record of active complaints, counter-evidence submissions, and mediation status.',
      },
    },
    transparentFormulaNotice:
      'This platform does not generate an opaque single credit or character score. Instead, credibility is demonstrated through granular evidence layers: confirmed identities, dual-signed relationship records, and documented fulfillment receipts.',
    disclaimer:
      'Identity and relationship confirmation verifies that designated checks were executed with designated parties. It does not constitute a financial credit score, legal warranty, or guarantee of future behavior.',
  };
}
