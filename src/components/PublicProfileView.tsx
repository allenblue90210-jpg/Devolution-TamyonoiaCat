import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { User, EvidenceItem, ProfessionalReference, ReputationBreakdown, TrustCommitment } from '../types/trust.js';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Receipt,
  Award,
  Share2,
  QrCode,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X,
  Lock,
  Building2,
  Calendar,
  MessageSquare,
  FileCheck,
  Clock,
  Timer,
  Flame,
  TrendingUp,
} from 'lucide-react';

interface PublicProfileViewProps {
  username: string;
  onNavigateTab: (tab: string) => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  username,
  onNavigateTab,
}) => {
  const [data, setData] = useState<{
    user: User;
    relationshipCounts: any;
    publicEndorsers: any[];
    publicEvidence: EvidenceItem[];
    publicReceipts: any[];
    publicCommitments?: TrustCommitment[];
    references: ProfessionalReference[];
    reputation: ReputationBreakdown;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showQrModal, setShowQrModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dispute form
  const [disputeReason, setDisputeReason] = useState('impersonation');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await api.getProfileByUsername(username);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Profile not found');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReportProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !disputeDescription) return;
    try {
      await api.submitDispute({
        targetType: 'profile',
        targetId: data.user.id,
        reason: disputeReason,
        description: disputeDescription,
      });
      setDisputeSuccess(true);
      setTimeout(() => {
        setShowDisputeModal(false);
        setDisputeSuccess(false);
        setDisputeDescription('');
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-500">
        Loading verifiable public trust profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-sm font-bold text-slate-900">Profile Not Found</div>
        <p className="text-xs text-slate-500">The requested profile username "@{username}" does not exist or has private visibility.</p>
        <button
          onClick={() => onNavigateTab('directory')}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Explore Verified Directory
        </button>
      </div>
    );
  }

  const { user, relationshipCounts, publicEndorsers, publicEvidence, publicReceipts, references, reputation } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-2xl border border-slate-200">
                {user.fullName.charAt(0)}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
                {user.identityStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Identity Attested</span>
                  </span>
                )}
                {user.businessVerificationStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>CAC Corporate Verified</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">{user.headline}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono pt-1">
                <span>@{user.username}</span>
                <span aria-hidden="true">·</span>
                <span>{user.city}, {user.country}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">Member since {new Date(user.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Copy Profile URL"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="View QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="px-3 py-2 text-xs text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Profile</span>
            </button>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
            {user.bio}
          </div>
        )}

        {/* Public Trust Score & Reliability Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            reputation.penaltyActive
              ? 'bg-red-50/80 border-red-300'
              : 'bg-gradient-to-r from-indigo-50/60 via-slate-50 to-white border-indigo-100'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-extrabold text-white shadow-xs shrink-0 ${
                reputation.penaltyActive
                  ? 'bg-red-600'
                  : (reputation.trustScore || 85) >= 90
                  ? 'bg-emerald-600'
                  : 'bg-indigo-600'
              }`}
            >
              <span className="text-xl leading-none font-mono">{reputation.trustScore ?? 85}</span>
              <span className="text-[9px] uppercase tracking-wider text-white/80">Score</span>
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {reputation.trustGrade || 'A Verified & Reliable'}
                </span>
                {reputation.penaltyActive ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-600" />
                    -{reputation.penaltyPercent}% Breach Penalty Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    High Standing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {reputation.penaltyNotice ||
                  'Public verifiable reliability score grounded in validated identity credentials, dual-confirmed relationships, and on-time fulfillment track record.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 font-mono">
                {reputation.commitmentsSummary?.onTimeDeliveryRate ?? 100}% On-Time
              </div>
              <div className="text-[11px] text-slate-500">
                {reputation.commitmentsSummary?.completedOnTime ?? 0} fulfilled pacts
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('commitments')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Make Commitment</span>
            </button>
          </div>
        </div>

        {/* Verified Claims Summary Row */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {relationshipCounts?.total || 0}
            </div>
            <div className="text-[11px] text-slate-500">Confirmed Relations</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-lg font-bold font-mono tabular-nums text-indigo-700">
              {data.publicCommitments?.length ?? 0}
            </div>
            <div className="text-[11px] text-slate-500">Public Commitments</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {publicReceipts.length}
            </div>
            <div className="text-[11px] text-slate-500">Dual-Signed Receipts</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {publicEvidence.length}
            </div>
            <div className="text-[11px] text-slate-500">Verified Credentials</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {references.length}
            </div>
            <div className="text-[11px] text-slate-500">Peer References</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Evidentiary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 cols: Endorsements, Receipts, References */}
        <div className="lg:col-span-7 space-y-6">
          {/* Confirmed Relationships Breakdown */}
          {relationshipCounts && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Confirmed Relationships</h2>
                </div>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {relationshipCounts.total} independently verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Colleagues</span>
                  <span className="font-bold font-mono tabular-nums text-slate-900">
                    {relationshipCounts.colleagues}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Clients / Partners</span>
                  <span className="font-bold font-mono tabular-nums text-slate-900">
                    {relationshipCounts.clients}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Family Members</span>
                  <span className="font-bold font-mono tabular-nums text-slate-900">
                    {relationshipCounts.family}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Friends</span>
                  <span className="font-bold font-mono tabular-nums text-slate-900">
                    {relationshipCounts.friends}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block">Other Human Ties</span>
                  <span className="font-bold font-mono tabular-nums text-slate-900">
                    {relationshipCounts.other}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-100">
                  <span className="text-indigo-900 text-[11px] block">Voluntary Endorsements</span>
                  <span className="font-bold font-mono tabular-nums text-indigo-700">
                    {publicEndorsers.length}
                  </span>
                </div>
              </div>

              {/* Public Endorsers list */}
              {publicEndorsers.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-700">Consented Public Endorsers:</div>
                  <div className="space-y-3">
                    {publicEndorsers.map((end) => (
                      <div key={end.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{end.name}</span>
                          <span className="text-indigo-700 font-medium text-[11px] font-mono">
                            {end.category}
                          </span>
                        </div>
                        <p className="text-slate-700 italic leading-relaxed">
                          "{end.endorsement}"
                        </p>
                        <div className="text-[11px] text-slate-400">Context: {end.context}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Public Commitments & Escrowed Pacts */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Public Commitments & Escrowed Pacts</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {data.publicCommitments?.length || 0} pacts
              </span>
            </div>

            <div className="space-y-3">
              {!data.publicCommitments || data.publicCommitments.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No public commitments published on this profile yet.
                </div>
              ) : (
                data.publicCommitments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                      cmt.status === 'completed'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : cmt.status === 'overdue' || cmt.isOverdue
                        ? 'bg-red-50/60 border-red-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-indigo-700 shrink-0">{cmt.id}</span>
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
                          ? 'Completed on time'
                          : cmt.status === 'overdue' || cmt.isOverdue
                          ? 'OVERDUE (-30% daily decay)'
                          : 'Active Timer'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {cmt.description}
                    </p>

                    {cmt.committerPledgeNote && (
                      <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-slate-200/60 font-mono">
                        Pledged: "{cmt.committerPledgeNote}"
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Target: {new Date(cmt.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="text-slate-600">
                        Requester: {cmt.requesterName} · Committer: {cmt.committerName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigateTab('commitments')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Full Commitments Board</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Completed Trust Receipts */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Documented Trust Receipts</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {publicReceipts.length} dual-signed
              </span>
            </div>

            <div className="space-y-3">
              {publicReceipts.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No public trust receipts published on this profile.
                </div>
              ) : (
                publicReceipts.map((rc) => (
                  <div key={rc.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">{rc.id}</span>
                        <span className="font-bold text-slate-900">{rc.title}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Fulfilled</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                      <span>Category: {rc.interactionCategory}</span>
                      <span aria-hidden="true">·</span>
                      <span>Counterparty: {rc.counterpartyName}</span>
                      {rc.transactionValue && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono font-semibold text-slate-800">{rc.transactionValue}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Professional References */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Professional References ({references.length})</h2>
            </div>

            <div className="space-y-4">
              {references.map((rf) => (
                <div key={rf.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{rf.authorName}</span>
                      <span className="text-slate-500 text-[11px] block">{rf.authorTitle} · {rf.authorCompany}</span>
                    </div>
                    <span className="text-indigo-700 font-mono text-[11px] font-medium">
                      {rf.authorRelationship}
                    </span>
                  </div>
                  <p className="text-slate-700 italic leading-relaxed">
                    "{rf.content}"
                  </p>
                  <div className="text-[11px] text-slate-400">Context: {rf.context}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Verified Credentials & Evidentiary Attestation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Identity & Legal Attestation */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Attested Credentials & Ledger</h2>
            </div>

            <div className="space-y-2.5">
              {publicEvidence.map((ev) => (
                <div key={ev.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ev.title}</span>
                    <span className="text-emerald-700 text-[10px] font-mono font-bold">VERIFIED</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Method: {ev.verificationMethod}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Source: {ev.source}
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Guarantee Box */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-600" />
                <span>Zero Private Exposure Protocol</span>
              </div>
              <p>
                Private telephone numbers, residential street coordinates, and government ID document scans are never published on this profile.
              </p>
            </div>
          </div>

          {/* Reputation Breakdown Notice */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-slate-500 text-[11px]">
                Reputation Assessment
              </span>
              <span className="font-bold text-indigo-700">{reputation.summaryLevel}</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {reputation.transparentFormulaNotice}
            </p>
            <button
              onClick={() => onNavigateTab('reputation')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1"
            >
              <span>Inspect Transparent Reputation Engine</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Profile QR Attestation</span>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stylized SVG QR Code */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 inline-block">
              <svg className="w-40 h-40 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                <rect x="0" y="0" width="30" height="30" rx="3" fill="#0f172a" />
                <rect x="5" y="5" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="10" y="10" width="10" height="10" rx="1" fill="#4338ca" />

                <rect x="70" y="0" width="30" height="30" rx="3" fill="#0f172a" />
                <rect x="75" y="5" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="80" y="10" width="10" height="10" rx="1" fill="#4338ca" />

                <rect x="0" y="70" width="30" height="30" rx="3" fill="#0f172a" />
                <rect x="5" y="75" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="10" y="80" width="10" height="10" rx="1" fill="#4338ca" />

                {/* Pattern dots */}
                <rect x="40" y="10" width="8" height="8" rx="1" fill="#0f172a" />
                <rect x="52" y="10" width="8" height="8" rx="1" fill="#4338ca" />
                <rect x="40" y="22" width="8" height="8" rx="1" fill="#0f172a" />
                <rect x="40" y="40" width="8" height="8" rx="1" fill="#4338ca" />
                <rect x="52" y="40" width="8" height="8" rx="1" fill="#0f172a" />
                <rect x="20" y="40" width="8" height="8" rx="1" fill="#0f172a" />
                <rect x="70" y="40" width="8" height="8" rx="1" fill="#4338ca" />
                <rect x="40" y="60" width="8" height="8" rx="1" fill="#0f172a" />
                <rect x="52" y="60" width="8" height="8" rx="1" fill="#4338ca" />
                <rect x="70" y="60" width="8" height="8" rx="1" fill="#0f172a" />
                <rect x="82" y="60" width="8" height="8" rx="1" fill="#4338ca" />
                <rect x="40" y="80" width="8" height="8" rx="1" fill="#4338ca" />
                <rect x="52" y="80" width="8" height="8" rx="1" fill="#0f172a" />
                <rect x="70" y="80" width="8" height="8" rx="1" fill="#0f172a" />
              </svg>
            </div>

            <div className="text-xs text-slate-600">
              Scan to load <span className="font-bold text-slate-900">@{user.username}</span>'s verified credentials.
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Report Profile Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Report Inaccuracy or Dispute</span>
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {disputeSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-lg text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div className="font-bold">Report Filed Successfully</div>
                <p>This report has been registered in the mediation log for review.</p>
              </div>
            ) : (
              <form onSubmit={handleReportProfile} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Report</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="impersonation">Impersonation / Fake Identity</option>
                    <option value="fabricated_evidence">Fabricated Credentials or Evidence</option>
                    <option value="unfulfilled_commitment">Unfulfilled Transaction Commitment</option>
                    <option value="coercion">Coercion / Harassment</option>
                    <option value="other">Other Violation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Explanation</label>
                  <textarea
                    required
                    rows={3}
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Provide specific facts, dates, and evidence links..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
