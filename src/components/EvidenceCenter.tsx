import React, { useState } from 'react';
import { EvidenceItem, EvidenceCategory, VerificationResult, User } from '../types/trust.js';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Phone,
  Building2,
  Award,
  MapPin,
  Clock,
  ExternalLink,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface EvidenceCenterProps {
  user: User;
  evidence: EvidenceItem[];
  onAddEvidence: (data: Partial<EvidenceItem>) => Promise<void>;
  onToggleVisibility: (id: string, currentPublic: boolean) => Promise<void>;
  onDeleteEvidence: (id: string) => Promise<void>;
  onOpenPhoneModal: () => void;
  onOpenIdentityModal: () => void;
}

export const EvidenceCenter: React.FC<EvidenceCenterProps> = ({
  user,
  evidence,
  onAddEvidence,
  onToggleVisibility,
  onDeleteEvidence,
  onOpenPhoneModal,
  onOpenIdentityModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAuditItem, setSelectedAuditItem] = useState<EvidenceItem | null>(null);

  // Form states for new evidence
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EvidenceCategory>('credential');
  const [newEvidenceType, setNewEvidenceType] = useState('Professional Certification');
  const [newSource, setNewSource] = useState<'User Upload' | 'Independent Registry (CAC)' | 'Verification Provider' | 'Counterparty Signed'>('User Upload');
  const [newMethod, setNewMethod] = useState('Compliance Registry Review');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories: Array<{ id: string; label: string; count: number }> = [
    { id: 'all', label: 'All Records', count: evidence.length },
    { id: 'identity', label: 'Identity & Legal', count: evidence.filter((e) => e.category === 'identity').length },
    { id: 'contact', label: 'Contact Control', count: evidence.filter((e) => e.category === 'contact').length },
    { id: 'credential', label: 'Credentials & Degrees', count: evidence.filter((e) => e.category === 'credential').length },
    { id: 'business', label: 'Business & Registry', count: evidence.filter((e) => e.category === 'business').length },
    { id: 'location', label: 'Physical & Location', count: evidence.filter((e) => e.category === 'location').length },
    { id: 'commitment', label: 'Contracts & Commitments', count: evidence.filter((e) => e.category === 'commitment').length },
  ];

  const filteredEvidence =
    selectedCategory === 'all'
      ? evidence
      : evidence.filter((e) => e.category === selectedCategory);

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setSubmitting(true);
    try {
      await onAddEvidence({
        title: newTitle,
        category: newCategory,
        evidenceType: newEvidenceType,
        source: newSource,
        verificationMethod: newMethod,
        isPublic: newIsPublic,
        fileAttachment: {
          name: `${newTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          size: '320 KB',
          mimeType: 'application/pdf',
        },
      });
      setShowAddModal(false);
      setNewTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  const getResultBadge = (result: VerificationResult) => {
    switch (result) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 text-indigo-700 font-medium text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Submitted (Pending)</span>
          </span>
        );
      case 'failed':
        return <span className="text-red-700 font-medium text-xs">Verification Failed</span>;
      case 'expired':
        return <span className="text-amber-700 font-medium text-xs">Expired</span>;
      case 'revoked':
        return <span className="text-slate-500 font-medium text-xs">Revoked</span>;
      default:
        return <span className="text-slate-500 text-xs">Unverified</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Attestation Architecture
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trust Evidence Center</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Manage verifiable documents, official registry queries, and cryptographic attestations. We never store raw government ID images on public servers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenPhoneModal}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Verify Phone (OTP)</span>
          </button>
          <button
            onClick={onOpenIdentityModal}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Identity Provider Check</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Attach Evidence</span>
          </button>
        </div>
      </div>

      {/* Category Segmented Control (Interactive Filter Buttons) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{cat.label}</span>
            <span className="font-mono tabular-nums text-[11px] opacity-75">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Evidence Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Attested Claims & Documents ({filteredEvidence.length})
          </div>
          <div className="text-xs text-slate-400">
            Click any row to inspect immutable cryptographic audit trail
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredEvidence.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No evidence records in this category.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                Log First Record
              </button>
            </div>
          ) : (
            filteredEvidence.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs cursor-pointer"
                onClick={() => setSelectedAuditItem(item)}
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    {getResultBadge(item.verificationResult)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                    <span className="font-medium text-slate-700">{item.evidenceType}</span>
                    <span aria-hidden="true">·</span>
                    <span>Source: {item.source}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {item.verifiedAt ? `Attested ${new Date(item.verifiedAt).toLocaleDateString()}` : 'Pending Attestation'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-1">
                    {item.resultDetails}
                  </p>
                </div>

                <div
                  className="flex items-center gap-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Public / Private toggle button */}
                  <button
                    onClick={() => onToggleVisibility(item.id, item.isPublic)}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors border ${
                      item.isPublic
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                    title={item.isPublic ? 'Visible on public profile' : 'Hidden from public'}
                  >
                    {item.isPublic ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-amber-600" />}
                    <span>{item.isPublic ? 'Public Claim' : 'Private (Owner Only)'}</span>
                  </button>

                  {/* Audit Trail Button */}
                  <button
                    onClick={() => setSelectedAuditItem(item)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100"
                    title="View Audit Trail"
                  >
                    <FileCheck className="w-4 h-4" />
                  </button>

                  {/* Revoke / Delete Button */}
                  <button
                    onClick={() => {
                      if (confirm(`Revoke evidence '${item.title}'?`)) {
                        onDeleteEvidence(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                    title="Revoke / Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Trail Inspection Modal */}
      {selectedAuditItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Cryptographic Audit Trail
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedAuditItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditItem(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">Record ID:</span> {selectedAuditItem.id}
                </div>
                <div>
                  <span className="text-slate-400">Category:</span> {selectedAuditItem.category}
                </div>
                <div>
                  <span className="text-slate-400">Source:</span> {selectedAuditItem.source}
                </div>
                <div>
                  <span className="text-slate-400">Method:</span> {selectedAuditItem.verificationMethod}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">Attestation Verification Status</div>
                <p className="text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-200">
                  {selectedAuditItem.resultDetails}
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-2">Immutable Event Log</div>
                <div className="space-y-2">
                  {selectedAuditItem.auditTrail?.map((log, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="font-mono tabular-nums text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Actor: <span className="font-medium text-slate-700">{log.actor}</span> — {log.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAuditItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attach Verifiable Evidence</h3>
                <p className="text-xs text-slate-500">Record a claim or credential for verification review.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Evidence Title / Document Name
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CAC Certificate of Incorporation or University B.Sc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as EvidenceCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="credential">Credential & Education</option>
                    <option value="business">Business & Registration</option>
                    <option value="location">Physical & Location</option>
                    <option value="commitment">Contract & Commitment</option>
                    <option value="contact">Contact Endpoint</option>
                    <option value="identity">Identity Attestation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Evidence Type</label>
                  <input
                    type="text"
                    required
                    value={newEvidenceType}
                    onChange={(e) => setNewEvidenceType(e.target.value)}
                    placeholder="e.g. Higher Education Degree"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="User Upload">User Document Upload</option>
                    <option value="Independent Registry (CAC)">Authoritative Registry Cross-Check</option>
                    <option value="Verification Provider">Certified Identity Provider</option>
                    <option value="Counterparty Signed">Dual-Party Counterparty Signature</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verification Method</label>
                  <input
                    type="text"
                    required
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    placeholder="e.g. Portal Database Query"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Public Display Authorization</span>
                  <input
                    type="checkbox"
                    checked={newIsPublic}
                    onChange={(e) => setNewIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  When enabled, this claim (excluding private file bytes or home addresses) will be displayed on your public trust profile.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Log & Queue for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
