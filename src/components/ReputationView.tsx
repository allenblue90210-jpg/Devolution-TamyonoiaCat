import React from 'react';
import { ReputationBreakdown, User } from '../types/trust.js';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  Users,
  Receipt,
  Award,
  HelpCircle,
  Clock,
  Lock,
  ArrowLeft,
} from 'lucide-react';

interface ReputationViewProps {
  user: User;
  reputation: ReputationBreakdown | null;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ReputationView: React.FC<ReputationViewProps> = ({ user, reputation, onBack, onNavigateTab }) => {
  if (!reputation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Calculating transparent reputation dimensions...
      </div>
    );
  }

  const { dimensions, summaryLevel, methodologyVersion, lastCalculatedAt, transparentFormulaNotice, disclaimer } = reputation;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation Back Bar */}
      <div>
        <button
          onClick={() => {
            if (onBack) onBack();
            else if (onNavigateTab) onNavigateTab('dashboard');
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            <span>Methodology: {methodologyVersion}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-400">
              Evaluated {new Date(lastCalculatedAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transparent Evidentiary Engine
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Unlike opaque algorithms or arbitrary 3-digit credit scores, Devolution breaks reputation down into independently verifiable evidence dimensions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-right shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">Evidentiary Classification</div>
          <div className="text-lg font-bold text-indigo-700 font-sans mt-0.5">{summaryLevel}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Zero Arbitrary Popularity Hype</div>
        </div>
      </div>

      {/* Mandatory Disclaimer & Boundary */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
        <div className="font-bold flex items-center gap-1.5 text-amber-950">
          <Scale className="w-4 h-4 text-amber-700" />
          <span>Statutory Limitation & Regulatory Notice</span>
        </div>
        <p className="text-amber-800 leading-relaxed text-[11px]">
          {disclaimer}
        </p>
      </div>

      {/* 6 Evidentiary Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dimension 1: Identity & Legal Attestation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">01. Identity Attestation</h3>
            </div>
            <span className={`text-xs font-mono font-bold ${dimensions.identityVerification.verified ? 'text-emerald-700' : 'text-slate-400'}`}>
              {dimensions.identityVerification.verified ? 'ATTESTED' : 'PENDING'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {dimensions.identityVerification.weightDescription}
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
            Recorded method: <span className="font-medium text-slate-800">{dimensions.identityVerification.method}</span>
          </div>
        </div>

        {/* Dimension 2: Contact Authenticity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">02. Contact Channel Control</h3>
            </div>
            <span className={`text-xs font-mono font-bold ${dimensions.contactAuthenticity.phoneVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
              {dimensions.contactAuthenticity.phoneVerified ? 'CARRIER VERIFIED' : 'UNVERIFIED'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {dimensions.contactAuthenticity.weightDescription}
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 font-mono">
            HLR Anti-Spoof Shield: Active · Rate-limited one-time challenges
          </div>
        </div>

        {/* Dimension 3: Social & Peer Web */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">03. Dual-Confirmed Peer Ties</h3>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 tabular-nums">
              {dimensions.socialVerification.confirmedCount} CONFIRMED
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {dimensions.socialVerification.weightDescription}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">Colleagues</span>
              <span className="font-bold font-mono text-slate-800">{dimensions.socialVerification.colleagueCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Clients / Partners</span>
              <span className="font-bold font-mono text-slate-800">{dimensions.socialVerification.clientCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Endorsements</span>
              <span className="font-bold font-mono text-indigo-700">{dimensions.socialVerification.vouchedEndorsementsCount}</span>
            </div>
          </div>
        </div>

        {/* Dimension 4: Transactional Fulfillment (Trust Receipts) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">04. Documented Fulfillment</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
              {dimensions.transactionalFulfillment.completedWithoutDispute} COMPLETED
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {dimensions.transactionalFulfillment.weightDescription}
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 font-mono">
            {dimensions.transactionalFulfillment.totalReceipts} total logged receipts · {dimensions.transactionalFulfillment.disputedCount} disputes
          </div>
        </div>

        {/* Dimension 5: Credential & Registry Integrity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">05. Accredited Qualifications</h3>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 tabular-nums">
              {dimensions.credentialIntegrity.totalCredentials} VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {dimensions.credentialIntegrity.weightDescription}
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
            {dimensions.credentialIntegrity.registryBacked} cross-referenced against authoritative registries (CAC, universities, AWS)
          </div>
        </div>

        {/* Dimension 6: Dispute & Risk Factor */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${dimensions.riskAndDisputeStatus.safetyFlag ? 'text-red-600' : 'text-slate-400'}`} />
              <h3 className="text-sm font-bold text-slate-900">06. Dispute & Mediation Status</h3>
            </div>
            <span className={`text-xs font-mono font-bold ${dimensions.riskAndDisputeStatus.activeDisputes === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {dimensions.riskAndDisputeStatus.activeDisputes === 0 ? 'CLEAN RECORD' : `${dimensions.riskAndDisputeStatus.activeDisputes} ACTIVE DISPUTE`}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {dimensions.riskAndDisputeStatus.weightDescription}
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 font-mono">
            {dimensions.riskAndDisputeStatus.resolvedDisputes} historical disputes mediated & resolved
          </div>
        </div>
      </div>

      {/* Formula Transparency Architecture */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 text-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Core Engine Principles
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">1. No Sparse Penalty</div>
            <p className="text-[11px]">
              Users with 2-3 genuine records are not punished. We categorize by evidentiary depth, refusing to reward spam or mass accounts.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">2. Non-Purchasable Status</div>
            <p className="text-[11px]">
              No paid boost tokens or synthetic badges exist. Status reflects cryptographically provable actions and dual-signed receipts only.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-900">3. Decoupled Context</div>
            <p className="text-[11px]">
              A doctor’s medical credentials, a contractor’s delivery receipts, and a friend’s confirmation remain strictly categorized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
