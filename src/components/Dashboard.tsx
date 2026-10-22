import React from 'react';
import { api } from '../services/api.js';
import {
  User,
  EvidenceItem,
  RelationshipInvite,
  TrustReceipt,
  ProfessionalReference,
  InAppNotification,
  ReputationBreakdown,
  TrustCommitment,
} from '../types/trust.js';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Receipt,
  Award,
  ExternalLink,
  ArrowRight,
  Plus,
  Phone,
  Building2,
  FileText,
  Copy,
  Check,
  Clock,
  Timer,
  Flame,
  Globe,
  Camera,
  Sparkles,
  Search,
} from 'lucide-react';

interface DashboardProps {
  user: User;
  evidence: EvidenceItem[];
  relationships: RelationshipInvite[];
  receipts: TrustReceipt[];
  commitments?: TrustCommitment[];
  references: ProfessionalReference[];
  notifications: InAppNotification[];
  reputation: ReputationBreakdown | null;
  onNavigateTab: (tab: string) => void;
  onOpenAddEvidence: () => void;
  onOpenInviteModal: () => void;
  onOpenNewReceiptModal: () => void;
  onOpenPublicLedger?: () => void;
  onOpenAvatarUpload?: () => void;
  onOpenSearch?: () => void;
  onRefreshData?: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  evidence,
  relationships,
  receipts,
  commitments = [],
  references,
  notifications,
  reputation,
  onNavigateTab,
  onOpenAddEvidence,
  onOpenInviteModal,
  onOpenNewReceiptModal,
  onOpenPublicLedger,
  onOpenAvatarUpload,
  onOpenSearch,
  onRefreshData,
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [verifyingIdentity, setVerifyingIdentity] = React.useState(false);
  const [verifyMessage, setVerifyMessage] = React.useState<string | null>(null);

  const handleQuickVerifyIdentity = async () => {
    setVerifyingIdentity(true);
    setVerifyMessage(null);
    try {
      const res = await api.quickVerifyIdentity();
      setVerifyMessage(res.message || 'Identity successfully attested (+25 Trust Points)!');
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      setVerifyMessage(err.message || 'Verification attempt failed.');
    } finally {
      setVerifyingIdentity(false);
    }
  };

  const confirmedRelationships = relationships.filter((r) => r.status === 'confirmed');
  const pendingRelationships = relationships.filter((r) => r.status === 'pending');
  const confirmedEndorsements = confirmedRelationships.filter((r) => r.hasEndorsement);
  const completedReceipts = receipts.filter((r) => r.status === 'completed');
  const pendingReceipts = receipts.filter((r) => r.status === 'pending');
  const verifiedCredentials = evidence.filter(
    (e) => (e.category === 'credential' || e.category === 'business') && e.verificationResult === 'verified'
  );

  // Compute profile completeness
  const completenessSteps = [
    { label: 'Basic Profile & Bio', complete: Boolean(user.bio && user.category) },
    { label: 'Profile Picture / Avatar', complete: Boolean(user.avatarUrl) },
    { label: 'Confirmed Relationships (2+)', complete: confirmedRelationships.length >= 2 },
    { label: 'Verified Credentials', complete: verifiedCredentials.length >= 1 },
    { label: 'Documented Trust Receipt', complete: completedReceipts.length >= 1 },
  ];
  const completedStepsCount = completenessSteps.filter((s) => s.complete).length;
  const completenessPercent = Math.round((completedStepsCount / completenessSteps.length) * 100);

  const handleCopyProfileUrl = () => {
    const url = `${window.location.origin}/#profile-${user.username}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* User Avatar with Quick Upload Trigger */}
            <div
              onClick={onOpenAvatarUpload}
              className="relative group cursor-pointer shrink-0"
              title="Click to upload profile picture"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-2 ring-indigo-100 overflow-hidden bg-slate-100 shadow-xs flex items-center justify-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                    {user.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-5 h-5 drop-shadow" />
              </div>
              <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 text-white ring-2 ring-white shadow-xs group-hover:bg-indigo-700 transition-colors">
                <Camera className="w-3 h-3" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{user.fullName}</h1>
                <span className="inline-flex items-center gap-1 text-xs text-indigo-700 font-medium bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Verified Profile</span>
                </span>
              </div>
              <p className="text-xs text-slate-600">{user.headline}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                <span>@{user.username}</span>
                <span aria-hidden="true">·</span>
                <span>{user.city}, {user.country}</span>
                {user.businessName && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-600 font-sans font-medium">{user.businessName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenAvatarUpload && (
              <button
                onClick={onOpenAvatarUpload}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Upload profile picture"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload Photo</span>
              </button>
            )}
            <button
              onClick={handleCopyProfileUrl}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Public Link'}</span>
            </button>
            <button
              onClick={() => onNavigateTab(`profile-${user.username}`)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>View Public Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Completeness Tracker */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">Evidentiary Completeness Level</span>
            <span className="font-mono tabular-nums text-slate-900 font-bold">{completenessPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
            {completenessSteps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 ${
                  step.complete ? 'text-emerald-700 font-medium' : 'text-slate-400'
                }`}
              >
                {step.complete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Person & Business Search Card */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-white rounded-xl border border-indigo-100 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Lookup Any Person or Business Profile
            </h3>
            <p className="text-xs text-slate-600">
              Find colleagues, clients, or counterparties by name, @username, skill, or city to view their verified ledger profile.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg shadow-2xs font-medium text-xs flex items-center justify-between sm:justify-start gap-3 transition-all cursor-pointer group shrink-0"
        >
          <span className="flex items-center gap-2 text-slate-500 group-hover:text-indigo-600">
            <Search className="w-4 h-4 text-indigo-500" />
            <span>Search person (e.g. @allen, Sarah, Austin)...</span>
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Recently Registered Account Activation Banner */}
      {(user.identityStatus === 'unverified' || evidence.length === 0 || (reputation?.trustScore ?? 0) < 50) && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-xl border border-emerald-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  New Account Trust Activation
                </h3>
                <p className="text-xs text-slate-600">
                  Your profile is live in the public ledger and synchronized with Supabase. Complete these quick steps to boost your verified score from baseline to 80+:
                </p>
              </div>
            </div>

            {user.identityStatus === 'unverified' && (
              <button
                type="button"
                onClick={handleQuickVerifyIdentity}
                disabled={verifyingIdentity}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{verifyingIdentity ? 'Attesting ID...' : 'Attest Real Identity (+25 Pts)'}</span>
              </button>
            )}
          </div>

          {verifyMessage && (
            <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs rounded-lg font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{verifyMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div
              onClick={() => onNavigateTab('evidence')}
              className="bg-white p-3 rounded-lg border border-emerald-200/80 hover:border-emerald-400 hover:shadow-2xs transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between font-semibold text-slate-900 text-xs">
                <span>1. Attach Credentials</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">+20 Pts</span>
              </div>
              <p className="text-[11px] text-slate-500">Upload degree, license, or CAC registration proof.</p>
            </div>

            <div
              onClick={onOpenInviteModal}
              className="bg-white p-3 rounded-lg border border-emerald-200/80 hover:border-emerald-400 hover:shadow-2xs transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between font-semibold text-slate-900 text-xs">
                <span>2. Confirm Real Relationships</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">+20 Pts</span>
              </div>
              <p className="text-[11px] text-slate-500">Invite a real colleague, friend, or partner to attest.</p>
            </div>

            <div
              onClick={onOpenNewReceiptModal}
              className="bg-white p-3 rounded-lg border border-emerald-200/80 hover:border-emerald-400 hover:shadow-2xs transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between font-semibold text-slate-900 text-xs">
                <span>3. Issue First Trust Receipt</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">+15 Pts</span>
              </div>
              <p className="text-[11px] text-slate-500">Document a delivery, contract, or completed transaction.</p>
            </div>
          </div>
        </div>
      )}

      {/* Trust Score & Time-Locked Commitment Alert Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs ${
          reputation?.penaltyActive
            ? 'bg-red-50/80 border-red-300'
            : 'bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border-indigo-100'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-extrabold text-white shadow-xs shrink-0 ${
              reputation?.penaltyActive
                ? 'bg-red-600'
                : (reputation?.trustScore ?? 85) >= 90
                ? 'bg-emerald-600'
                : 'bg-indigo-600'
            }`}
          >
            <span className="text-xl leading-none font-mono">{reputation?.trustScore ?? 85}</span>
            <span className="text-[9px] uppercase tracking-wider text-white/80">Score</span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                {reputation?.trustGrade || 'A Verified & Reliable'}
              </span>
              {reputation?.penaltyActive ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-600" />
                  -{reputation.penaltyPercent}% Penalty Active for Overdue Pact
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {reputation?.commitmentsSummary?.onTimeDeliveryRate ?? 100}% On-Time Delivery
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-normal">
              {reputation?.penaltyNotice ||
                'Public trust reputation calculated from verified identity claims, counterparty endorsements, and on-time commitment fulfillments. Missed deadlines trigger an automatic -30% daily reputation deduction.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('commitments')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Manage Commitments</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (High Density Tabular Numerals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Confirmed Relationships</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {confirmedRelationships.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {confirmedEndorsements.length} voluntary endorsements
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Completed Receipts</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {completedReceipts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pendingReceipts.length} in progress or pending
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Verified Credentials</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {verifiedCredentials.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Official registry cross-checked
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Evidentiary Depth</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {reputation?.summaryLevel || 'Adequate Evidence'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            0 unresolved disputes
          </div>
        </div>
      </div>

      {/* Action Shortcut Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Trust Evidence Center
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              Add Credentials & Documents
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Attach business registrations, university degrees, or residential address proof.
            </p>
          </div>
          <button
            onClick={onOpenAddEvidence}
            className="w-full py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Evidence</span>
          </button>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Social Verification
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              Invite People Who Know You
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Invite colleagues, former supervisors, clients, or family members to confirm your relationship.
            </p>
          </div>
          <button
            onClick={onOpenInviteModal}
            className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite a Contact</span>
          </button>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Commitment Tracking
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              Issue a Trust Receipt
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Document freelance projects, goods sales, or contracts with dual-signed public/private terms.
            </p>
          </div>
          <button
            onClick={onOpenNewReceiptModal}
            className="w-full py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Trust Receipt</span>
          </button>
        </div>

        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/90 to-blue-50/70 border border-indigo-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Public Evidentiary Ledger
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Live
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              Public Commitments & Receipts
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Post public commitments for people to inspect, or browse public & private trust receipts across the network.
            </p>
          </div>
          <button
            onClick={onOpenPublicLedger}
            className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open Public Ledger</span>
          </button>
        </div>
      </div>

      {/* Account Standing & Network Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">Account Standing & Network Status</div>
          <span className="text-xs text-slate-500">Verified Peer Ledger</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Relationships Standing */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Social Verification</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{confirmedRelationships.length} Confirmed</span>
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1">
                {confirmedEndorsements.length} peer endorsement{confirmedEndorsements.length === 1 ? '' : 's'} on record.
              </p>
            </div>
            <button
              onClick={onOpenInviteModal}
              className="w-full py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold transition-colors"
            >
              Invite Contact
            </button>
          </div>

          {/* Trust Receipts Standing */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Fulfilled Commitments</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{completedReceipts.length} Fulfilled</span>
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1">
                {pendingReceipts.length} in progress or awaiting dual signature.
              </p>
            </div>
            <button
              onClick={onOpenNewReceiptModal}
              className="w-full py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-semibold transition-colors"
            >
              Issue Receipt
            </button>
          </div>

          {/* Business Entity Standing */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Business Registry</span>
                {user.businessVerificationStatus === 'verified' ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Active Standing</span>
                  </span>
                ) : (
                  <span className="text-slate-500">Personal Account</span>
                )}
              </div>
              <p className="text-slate-500 text-[11px] mt-1">
                {user.businessName ? `${user.businessName} (${user.businessRegNumber || 'RC Pending'})` : 'Independent Member'}
              </p>
            </div>
            {user.accountType === 'business' ? (
              <button
                onClick={() => onNavigateTab('business')}
                className="w-full py-1.5 bg-slate-200 text-slate-800 rounded text-xs font-semibold hover:bg-slate-300"
              >
                Manage Entity
              </button>
            ) : (
              <button
                onClick={onOpenAddEvidence}
                className="w-full py-1.5 bg-slate-200 text-slate-800 rounded text-xs font-semibold hover:bg-slate-300"
              >
                Attach Credentials
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Section: Public Commitments & Bilateral Trust Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Commitments Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Active Commitments & Pacts</h2>
                <p className="text-[11px] text-slate-500">Time-locked promises with active deadline timers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('commitments')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View Board ({commitments.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {commitments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <p>No active commitments currently logged.</p>
                <button
                  onClick={() => onNavigateTab('commitments')}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold"
                >
                  Post First Commitment
                </button>
              </div>
            ) : (
              commitments.slice(0, 3).map((cmt) => (
                <div
                  key={cmt.id}
                  onClick={() => onNavigateTab('commitments')}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-all text-xs space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-bold text-indigo-700 text-[11px] shrink-0">{cmt.id}</span>
                      <span className="font-bold text-slate-900 truncate">{cmt.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        cmt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cmt.status === 'overdue' || cmt.isOverdue
                          ? 'bg-red-100 text-red-800 animate-pulse'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {cmt.status === 'completed'
                        ? 'Completed'
                        : cmt.status === 'overdue' || cmt.isOverdue
                        ? 'OVERDUE'
                        : 'Active Timer'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="truncate">
                      Counterparty: <strong className="text-slate-700">{cmt.promisedUserName || cmt.requesterName || cmt.committerName}</strong>
                    </span>
                    <span className="font-mono text-[10px] shrink-0">
                      Due: {new Date(cmt.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigateTab('commitments')}
            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Public Commitment</span>
          </button>
        </div>

        {/* Bilateral Trust Receipts Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Documented Trust Receipts</h2>
                <p className="text-[11px] text-slate-500">Dual-signed transaction milestones on the ledger</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('receipts')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({receipts.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {receipts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <p>No trust receipts found.</p>
                <button
                  onClick={onOpenNewReceiptModal}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold"
                >
                  Issue First Receipt
                </button>
              </div>
            ) : (
              receipts.slice(0, 3).map((rc) => (
                <div
                  key={rc.id}
                  onClick={() => onNavigateTab('receipts')}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-all text-xs space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-bold text-indigo-700 text-[11px] shrink-0">{rc.id}</span>
                      <span className="font-bold text-slate-900 truncate">{rc.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        rc.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rc.status === 'completed' ? 'Fulfilled' : 'Pending Signature'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="truncate">
                      Counterparty: <strong className="text-slate-700">{rc.counterpartyName}</strong>
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 shrink-0">
                      {rc.interactionCategory}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={onOpenNewReceiptModal}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Timed Trust Receipt</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Activity / Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Confirmed Relationships */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Confirmed Relationships & Endorsements</h2>
            <button
              onClick={() => onNavigateTab('relationships')}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All ({relationships.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {confirmedRelationships.slice(0, 4).map((rel) => (
              <div key={rel.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-900">{rel.recipientName}</div>
                  <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium text-slate-700">{rel.relationshipCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      Confirmed {new Date(rel.confirmedAt || rel.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rel.hasEndorsement && (
                    <p className="text-slate-600 italic mt-1.5 text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                      "{rel.endorsementText}"
                    </p>
                  )}
                </div>
                {rel.hasEndorsement && (
                  <span className="text-[10px] font-mono font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded whitespace-nowrap">
                    Vouched
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & System Audit Log */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Verification Events</h2>
            <span className="text-xs font-mono text-slate-400">Audit Ledger</span>
          </div>

          <div className="space-y-3">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className="text-xs p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between font-semibold text-slate-900 mb-0.5">
                  <span>{n.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
