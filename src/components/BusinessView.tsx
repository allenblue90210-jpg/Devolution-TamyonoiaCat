import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BusinessEntity, User } from '../types/trust.js';
import { Building2, ShieldCheck, Users, Plus, Check, CheckCircle2, Clock, X, Lock, ArrowLeft } from 'lucide-react';

interface BusinessViewProps {
  user: User;
  onNavigateTab: (tab: string) => void;
  onBack?: () => void;
}

export const BusinessView: React.FC<BusinessViewProps> = ({ user, onNavigateTab, onBack }) => {
  const [business, setBusiness] = useState<BusinessEntity | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite member modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'Admin' | 'Compliance Officer' | 'Member'>('Member');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchBiz() {
      try {
        setLoading(true);
        const res = await api.getBusiness();
        setBusiness(res.business);
      } catch (err) {
        console.error('Failed to load business:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBiz();
  }, []);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName || !memberEmail) return;
    setSubmitting(true);
    try {
      const res = await api.inviteBusinessTeamMember(memberName, memberEmail, memberRole);
      setBusiness(res.business);
      setShowMemberModal(false);
      setMemberName('');
      setMemberEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-500">Loading business entity portal...</div>;
  }

  if (!business) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="flex justify-start mb-4">
          <button
            onClick={() => {
              if (onBack) onBack();
              else onNavigateTab('dashboard');
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
        </div>
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">No Business Entity Registered</h2>
        <p className="text-xs text-slate-500">
          This account is currently registered as a personal individual profile. You can register a corporate entity or switch to an authorized business profile.
        </p>
        <button
          onClick={() => onNavigateTab('settings')}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Manage Account Type
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Navigation Bar */}
      <div>
        <button
          onClick={() => {
            if (onBack) onBack();
            else onNavigateTab('dashboard');
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
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{business.name}</h1>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>CAC Registry Verified</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              {business.registrationNumber} · {business.jurisdiction}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowMemberModal(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Corporate Team Member</span>
        </button>
      </div>

      {/* Grid: Corporate Entity Details & Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Industry & Sector</span>
          <div className="font-bold text-slate-900 text-sm">{business.industry}</div>
          <div className="text-[11px] text-slate-500">Incorporated: {business.incorporationDate}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered Office</span>
          <div className="font-bold text-slate-900 text-sm">{business.headquarters}</div>
          <div className="text-[11px] text-slate-500">Commercial title cross-checked</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Regulatory Access</span>
          <div className="font-bold text-slate-900 text-sm">Strict Consent Enforced</div>
          <div className="text-[11px] text-slate-500">Zero unauthorized reputation queries</div>
        </div>
      </div>

      {/* Authorized Officers & Team Members */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Authorized Corporate Officers & Members ({business.teamMembers.length})
          </div>
          <span className="text-xs text-slate-400">Role-Based Access Control</span>
        </div>

        <div className="divide-y divide-slate-100">
          {business.teamMembers.map((m, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">{m.name}</div>
                <div className="text-slate-500 text-[11px] font-mono">{m.email}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
                  {m.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Authorize Corporate Member</h3>
              <button onClick={() => setShowMemberModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Babatunde Lawal"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="Admin">Admin (Full Receipt & Credential Rights)</option>
                  <option value="Compliance Officer">Compliance Officer (Audit & Verification Only)</option>
                  <option value="Member">Member (Receipt Signer)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Authorizing...' : 'Authorize Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
