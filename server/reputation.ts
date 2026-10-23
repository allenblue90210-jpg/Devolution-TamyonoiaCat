import { User, EvidenceItem, RelationshipInvite, TrustReceipt, ProfessionalReference, DisputeReport, ReputationBreakdown, TrustCommitment } from '../src/types/trust.js';

/**
 * Server-authoritative Transparent Reputation Engine
 * Version: v1.4-verifiable-criteria
 *
 * Implements strict non-monolithic, multi-dimensional assessment with
 * time-locked commitment tracking and daily -30% penalty enforcement for breaches.
 */
export function calculateReputation(
  user: User,
  evidenceList: EvidenceItem[],
  relationships: RelationshipInvite[],
  receipts: TrustReceipt[],
  references: ProfessionalReference[],
  disputes: DisputeReport[],
  commitments: TrustCommitment[] = []
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

  // Commitment Analytics & Penalties
  const userCommitmentsAsCommitter = commitments.filter((c) => c.committerId === user.id);
  const totalCommitments = userCommitmentsAsCommitter.length;
  const completedOnTime = userCommitmentsAsCommitter.filter((c) => c.status === 'completed' && !c.isOverdue).length;
  const activeCount = userCommitmentsAsCommitter.filter((c) => c.status === 'active' || c.status === 'fulfilled_pending_checkout').length;
  const overdueCommitments = userCommitmentsAsCommitter.filter((c) => c.status === 'overdue' || c.isOverdue);
  const overdueCount = overdueCommitments.length;

  const onTimeDeliveryRate = totalCommitments > 0
    ? Math.round((completedOnTime / totalCommitments) * 100)
    : 0;

  // Base Trust Score Calculation (0 - 100 scale)
  let calculatedScore = 20; // baseline identity stake
  if (user.identityStatus === 'verified') calculatedScore += 25;
  else if (user.identityStatus === 'submitted') calculatedScore += 10;
  if (user.phoneVerified) calculatedScore += 8;
  if (user.emailVerified) calculatedScore += 7;
  calculatedScore += Math.min(20, confirmedRelationships.length * 4);
  calculatedScore += Math.min(10, verifiedCredentials.length * 5);
  calculatedScore += Math.min(10, completedReceipts.length * 5);

  if (completedOnTime > 0) {
    calculatedScore += Math.min(10, completedOnTime * 3);
  }

  calculatedScore -= activeDisputes * 15;
  calculatedScore = Math.max(10, Math.min(100, calculatedScore));

  // DAILY OVERDUE PENALTY (-30% per day overdue on unfulfilled commitments)
  let totalPenaltyPercent = 0;
  let penaltyNotice: string | null = null;

  if (overdueCount > 0) {
    const now = Date.now();
    let maxDaysOverdue = 1;
    let worstCommitmentTitle = '';

    for (const c of overdueCommitments) {
      const deadlineMs = new Date(c.deadline).getTime();
      const diffDays = Math.max(1, Math.ceil((now - deadlineMs) / (1000 * 60 * 60 * 24)));
      if (diffDays >= maxDaysOverdue) {
        maxDaysOverdue = diffDays;
        worstCommitmentTitle = c.title;
      }
    }

    // -30% deducted per day overdue (compounds up to 90% max penalty)
    totalPenaltyPercent = Math.min(90, maxDaysOverdue * 30);
    const scoreDeduction = Math.round((calculatedScore * totalPenaltyPercent) / 100);
    calculatedScore = Math.max(5, calculatedScore - scoreDeduction);
    penaltyNotice = `Active Default Breach: '${worstCommitmentTitle}' is ${maxDaysOverdue} day(s) overdue. Daily -${totalPenaltyPercent}% penalty deducted from trust score.`;
  }

  let trustGrade: ReputationBreakdown['trustGrade'] = 'A Verified & Reliable';
  if (overdueCount > 0 || totalPenaltyPercent > 0) {
    trustGrade = 'D Penalized / High Risk';
  } else if (calculatedScore >= 90) {
    trustGrade = 'A+ Exemplary';
  } else if (calculatedScore >= 80) {
    trustGrade = 'A Verified & Reliable';
  } else if (calculatedScore >= 65) {
    trustGrade = 'B Good Standing';
  } else {
    trustGrade = 'C Conditional';
  }

  return {
    userId: user.id,
    summaryLevel,
    methodologyVersion: 'v1.4-verifiable-criteria',
    lastCalculatedAt: new Date().toISOString(),
    trustScore: calculatedScore,
    trustGrade,
    penaltyPercent: totalPenaltyPercent,
    penaltyActive: overdueCount > 0,
    penaltyNotice,
    commitmentsSummary: {
      total: totalCommitments,
      completedOnTime,
      activeCount,
      overdueCount,
      onTimeDeliveryRate,
    },
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
      'Transparent formula: Baseline identity attestation (25 pts) + contact verification (15 pts) + confirmed relationships (20 pts) + verified credentials (10 pts) + documented receipts (10 pts) + commitment on-time fulfillment (10 pts). Unfulfilled overdue commitments trigger an automatic -30% daily reputation decay until rectified or settled.',
    disclaimer:
      'Identity, relationship, and commitment confirmations verify that designated checks and dual sign-offs were executed with verified counterparties. It operates as an evidence-based reliability ledger.',
  };
}
