import React, { useState } from 'react';
import { RelationshipInvite, RelationshipCategory, User } from '../types/trust.js';
import {
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  MessageSquare,
  Shield,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';

interface RelationshipsViewProps {
  user: User;
  relationships: RelationshipInvite[];
  onInviteContact: (data: {
    recipientName: string;
    recipientContact: string;
    relationshipCategory: RelationshipCategory;
    personalNote?: string;
  }) => Promise<{ inviteUrl: string }>;
  onDeleteRelationship: (id: string) => Promise<void>;
  onOpenInviteFlow: (token: string) => void;
  onBack?: () => void;
}

export const RelationshipsView: React.FC<RelationshipsViewProps> = ({
  user,
  relationships,
  onInviteContact,
  onDeleteRelationship,
  onOpenInviteFlow,
  onBack,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [category, setCategory] = useState<RelationshipCategory>('Colleague');
  const [personalNote, setPersonalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);

  const categories: RelationshipCategory[] = [
    'Parent',
    'Child / Family Member',
    'Relative',
    'Friend',
    'Colleague',
    'Former Colleague',
    'Employer / Supervisor',
    'Client',
    'Business Associate',
    'Business Partner',
    'Other',
  ];

  const confirmed = relationships.filter((r) => r.status === 'confirmed');
  const pending = relationships.filter((r) => r.status === 'pending');
  const withEndorsement = confirmed.filter((r) => r.hasEndorsement);

  const filteredConfirmed =
    filterCategory === 'all'
      ? confirmed
      : confirmed.filter((r) => r.relationshipCategory === filterCategory);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientContact) return;
    setSubmitting(true);
    try {
      const res = await onInviteContact({
        recipientName,
        recipientContact,
        relationshipCategory: category,
        personalNote,
      });
      setGeneratedInviteUrl(res.inviteUrl);
      setRecipientName('');
      setRecipientContact('');
      setPersonalNote('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = (url: string, token: string) => {
    const fullUrl = `${window.location.origin}/#invite-${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Decoupled Social Verification
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Human Relationship Web
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Invite real-world contacts to verify your connection. Relationship confirmation is strictly separated from personal endorsements: contacts can verify knowing you without vouching.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedInviteUrl(null);
            setShowInviteModal(true);
          }}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Invite New Contact</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-1">Confirmed Connections</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {confirmed.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Two-sided validated</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-1">Voluntary Endorsements</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600">
            {withEndorsement.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Contextual character vouches</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-1">Pending Invitations</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
            {pending.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting recipient action</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-1">Anti-Manipulation Rule</div>
          <div className="text-xs font-bold text-slate-900 mt-2">Decoupled & Audited</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero reciprocal score inflation</div>
        </div>
      </div>

      {/* Pending Invitations Tray (with instant sandbox testing affordance!) */}
      {pending.length > 0 && (
        <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Pending Invitations Dispatched ({pending.length})</span>
            </div>
            <span className="text-[11px] text-amber-800">
              Recipients must confirm via their secure token
            </span>
          </div>

          <div className="divide-y divide-amber-200/60 bg-white rounded-lg border border-amber-200/80">
            {pending.map((p) => (
              <div
                key={p.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{p.recipientName}</div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                    <span>{p.recipientContact}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-indigo-700">{p.relationshipCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Dispatched {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(p.inviteToken, p.inviteToken)}
                    className="px-2.5 py-1.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 font-medium transition-colors"
                  >
                    {copiedToken === p.inviteToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken === p.inviteToken ? 'Copied' : 'Copy Invite Link'}</span>
                  </button>

                  {/* Immediate Sandbox Test Button */}
                  <button
                    onClick={() => onOpenInviteFlow(p.inviteToken)}
                    className="px-2.5 py-1.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <span>Test Recipient Flow</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteRelationship(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                    title="Revoke Invitation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Relationships Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Confirmed Relationships ({confirmed.length})
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                filterCategory === 'all'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {['Colleague', 'Client', 'Business Partner', 'Employer / Supervisor', 'Parent', 'Friend'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                    filterCategory === cat
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredConfirmed.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No confirmed connections under this category filter.
            </div>
          ) : (
            filteredConfirmed.map((rel) => (
              <div key={rel.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rel.recipientName}</span>
                    <span className="text-indigo-700 font-medium">({rel.relationshipCategory})</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Confirmed</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="font-mono tabular-nums">
                      Confirmed {new Date(rel.confirmedAt || rel.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove/block connection with ${rel.recipientName}?`)) {
                          onDeleteRelationship(rel.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                      title="Revoke / Block Connection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Voluntary Endorsement (if provided) */}
                {rel.hasEndorsement ? (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Voluntary Personal Endorsement</span>
                      </span>
                      <span className="text-slate-400">
                        {rel.isEndorserPublic ? 'Public Attribution Consented' : 'Attribution Private'}
                      </span>
                    </div>
                    <p className="text-slate-700 italic leading-relaxed">
                      "{rel.endorsementText}"
                    </p>
                    {rel.endorsementContext && (
                      <div className="text-[11px] text-slate-500">
                        Context: <span className="font-medium text-slate-700">{rel.endorsementContext}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    Relationship confirmed; recipient chose not to submit a personal character endorsement.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite Contact Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Invite a Contact to Confirm Relationship</h3>
                <p className="text-xs text-slate-500">
                  Send a private invitation link to someone who knows you in a real capacity.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {generatedInviteUrl ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Invitation Successfully Generated!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Share this secure one-time link with your contact. They can open it to review your claimed relationship and choose whether to vouch for you.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700">One-Time Recipient Token Link</div>
                  <div className="font-mono text-xs text-indigo-700 break-all bg-white p-2 rounded border border-slate-200">
                    {window.location.origin}/#{generatedInviteUrl.replace('/', '')}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyLink(generatedInviteUrl, 'generated')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium flex items-center gap-1 text-xs"
                    >
                      {copiedToken === 'generated' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken === 'generated' ? 'Copied' : 'Copy Link'}</span>
                    </button>
                    <button
                      onClick={() => {
                        const token = generatedInviteUrl.replace('/invite/', '');
                        setShowInviteModal(false);
                        onOpenInviteFlow(token);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1 text-xs"
                    >
                      <span>Test Recipient View Directly</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact's Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Dr. Ngozi Eze or Sarah Johnson"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phone Number or Email
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientContact}
                      onChange={(e) => setRecipientContact(e.target.value)}
                      placeholder="+234 802... or name@org.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Relationship Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as RelationshipCategory)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Personal Note / Context (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    placeholder="e.g. Please confirm our 2-year collaboration on the logistics platform."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700">Anti-Spam & Consent Standard:</div>
                  <p>
                    You confirm you have an established real-world relationship and authorization to invite this individual. Unsolicited invitations and automated scraping are strictly prohibited.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Generating...' : 'Generate Secure Invitation'}
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
