import React, { useState, useEffect } from 'react';
import { User, RememberRecord, RememberWordTag } from '../types/trust.js';
import { api } from '../services/api.js';
import {
  Bookmark,
  ShieldCheck,
  AlertTriangle,
  Scale,
  FileText,
  Search,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  UserCheck,
  Building2,
  Calendar,
  Tag,
  Paperclip,
  Check,
  X,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  Lock,
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileCheck,
  Briefcase,
  ShieldAlert,
} from 'lucide-react';

interface RememberViewProps {
  currentUser: User | null;
  availableUsers: Array<{ id: string; username: string; fullName: string; accountType: string; avatarUrl: string }>;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
  onSelectProfile?: (username: string) => void;
}

const PRESET_TAGS: RememberWordTag[] = ['Business', 'Crime', 'Fraud', 'Contract', 'Reliability'];

export const RememberView: React.FC<RememberViewProps> = ({
  currentUser,
  availableUsers,
  onBack,
  onNavigateTab,
  onSelectProfile,
}) => {
  const [records, setRecords] = useState<RememberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'pending_review' | 'disputed' | 'my_submissions' | 'assigned_to_me'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetType, setTargetType] = useState<'user' | 'custom'>('user');
  const [selectedTargetUserId, setSelectedTargetUserId] = useState('');
  const [customTargetName, setCustomTargetName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTags, setSelectedTags] = useState<RememberWordTag[]>(['Business', 'Contract']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceType, setEvidenceType] = useState('Signed Legal Contract & Telemetry Log');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [reviewerQualification, setReviewerQualification] = useState('');
  const [severity, setSeverity] = useState<RememberRecord['severityOrImpact']>('Medium Substantive');

  // Review & Corroborate Modals
  const [selectedRecordForReview, setSelectedRecordForReview] = useState<RememberRecord | null>(null);
  const [reviewVerdict, setReviewVerdict] = useState<'verified_corroborated' | 'contested' | 'under_review'>('verified_corroborated');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [selectedRecordForCorroboration, setSelectedRecordForCorroboration] = useState<RememberRecord | null>(null);
  const [corroborationVerdict, setCorroborationVerdict] = useState<'corroborated' | 'neutral' | 'refuted'>('corroborated');
  const [corroborationNote, setCorroborationNote] = useState('');
  const [corroborationEvidence, setCorroborationEvidence] = useState('');
  const [corroborationSubmitting, setCorroborationSubmitting] = useState(false);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await api.getRememberRecords({
        tag: activeTag === 'all' ? undefined : activeTag,
        filter: activeFilter === 'all' || activeFilter === 'my_submissions' || activeFilter === 'assigned_to_me' ? undefined : activeFilter,
        q: searchQuery,
      });
      setRecords(res.records || []);
    } catch (err) {
      console.error('Failed to load remember records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [activeTag, activeFilter, searchQuery]);

  useEffect(() => {
    if (availableUsers.length > 0) {
      const otherUser = availableUsers.find((u) => u.id !== currentUser?.id) || availableUsers[0];
      if (otherUser) {
        setSelectedTargetUserId(otherUser.id);
        const secondOther = availableUsers.find((u) => u.id !== currentUser?.id && u.id !== otherUser.id) || otherUser;
        setSelectedReviewerId(secondOther.id);
        setReviewerQualification('Appointed independent technical and compliance authority with access to audit logs.');
      }
    }
  }, [availableUsers, currentUser]);

  const toggleTag = (tag: RememberWordTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const clean = customTagInput.trim();
      if (!selectedTags.includes(clean)) {
        setSelectedTags((prev) => [...prev, clean]);
      }
      setCustomTagInput('');
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the title and memory description.');
      return;
    }

    let targetName = customTargetName.trim();
    let targetId: string | undefined = undefined;

    if (targetType === 'user') {
      const u = availableUsers.find((user) => user.id === selectedTargetUserId);
      if (u) {
        targetName = u.fullName;
        targetId = u.id;
      }
    }

    if (!targetName) {
      alert('Please specify the person or business being recorded.');
      return;
    }

    const reviewer = availableUsers.find((u) => u.id === selectedReviewerId);

    try {
      setSubmitting(true);
      await api.createRememberRecord({
        targetId,
        targetName,
        title: title.trim(),
        description: description.trim(),
        tags: selectedTags.length > 0 ? selectedTags : ['Business'],
        incidentDate,
        severityOrImpact: severity,
        evidenceItems: evidenceName.trim()
          ? [
              {
                name: evidenceName.trim(),
                type: evidenceType,
                size: '1.2 MB',
                date: incidentDate,
                notes: evidenceNotes.trim() || 'Attached evidentiary artifact for independent review.',
              },
            ]
          : [],
        attachedReviewer: {
          userId: reviewer?.id || availableUsers.find(u => u.id !== currentUser?.id)?.id || 'usr_reviewer_01',
          name: reviewer?.fullName || 'Designated Expert Reviewer',
          avatarUrl: reviewer?.avatarUrl,
          headline: 'Enterprise Security & Compliance Auditor',
          qualificationNote:
            reviewerQualification.trim() ||
            'Selected as authoritative peer with direct knowledge of transaction telemetry.',
          status: 'pending',
        },
        isPublic: true,
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setEvidenceName('');
      setEvidenceNotes('');
      setCustomTargetName('');
      showToast('Evidentiary record permanently written to Remember ledger and sent to designated reviewer!');
      await loadRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to submit remember record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForReview || !reviewComment.trim()) {
      alert('Please enter your formal assessment notes.');
      return;
    }

    try {
      setReviewSubmitting(true);
      await api.reviewRememberRecord(
        selectedRecordForReview.id,
        reviewVerdict,
        reviewComment.trim(),
        reviewRating
      );
      setSelectedRecordForReview(null);
      setReviewComment('');
      showToast('Formal review verdict and assessment synchronized to the public ledger!');
      await loadRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitCorroboration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForCorroboration || !corroborationNote.trim()) {
      alert('Please enter your corroboration observations.');
      return;
    }

    try {
      setCorroborationSubmitting(true);
      await api.corroborateRememberRecord(
        selectedRecordForCorroboration.id,
        corroborationVerdict,
        corroborationNote.trim(),
        corroborationEvidence.trim() || undefined
      );
      setSelectedRecordForCorroboration(null);
      setCorroborationNote('');
      setCorroborationEvidence('');
      showToast('Corroboration witness evidence added to record!');
      await loadRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to submit corroboration.');
    } finally {
      setCorroborationSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'my_submissions') {
      return r.authorId === currentUser?.id;
    }
    if (activeFilter === 'assigned_to_me') {
      return r.attachedReviewer.userId === currentUser?.id;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (onBack) onBack();
            else if (onNavigateTab) onNavigateTab('dashboard');
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record to Remember</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <span>Permanent Evidentiary Ledger</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-400">Position-Reviewed Memories</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Remember
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            A permanent evidence-based record system. Log commercial contracts, crime reports, fraud attempts, business milestones, and verified reliability. Attach authoritative reviewers who were in a direct position to verify the facts.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-right shrink-0 min-w-[200px]">
          <div className="text-[11px] text-slate-500 font-medium">Ledger Status</div>
          <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
            {records.length} Recorded Memories
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Designated Peer Review · Cryptographic Trail
          </div>
        </div>
      </div>

      {/* Preset Keyword Words Strip: Business, Crime, Fraud, Contract, Reliability */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Filter by Attached Words:
            </span>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, target, reviewer, or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Word Tag Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => setActiveTag('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTag === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            All Words
          </button>
          {PRESET_TAGS.map((tag) => {
            const isSelected = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Secondary Sub-Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Scope:</span>
          {[
            { id: 'all', label: 'All Records' },
            { id: 'verified', label: 'Verified by Reviewer' },
            { id: 'pending_review', label: 'Pending Review' },
            { id: 'disputed', label: 'Contested / Disputed' },
            { id: 'my_submissions', label: 'Logged by Me' },
            { id: 'assigned_to_me', label: 'Assigned to Me for Review' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records List View */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          Loading verified remember ledger entries...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Remember Records Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No memories match your selected word filter or search query. You can add the first evidentiary memory to the ledger.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Memory</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const isAssignedReviewer = currentUser?.id === record.attachedReviewer.userId;
            const isAuthor = currentUser?.id === record.authorId;

            return (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-2xs hover:border-slate-300 transition-all"
              >
                {/* Header row: ID, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-indigo-700">{record.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>Incident Date: <strong className="text-slate-800 font-mono">{record.incidentDate}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Logged by <strong className="text-slate-800">{record.authorName}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status indicator */}
                    {record.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified by Reviewer</span>
                      </span>
                    ) : record.status === 'disputed' ? (
                      <span className="inline-flex items-center gap-1 text-red-700 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>Contested by Reviewer</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Awaiting Reviewer Corroboration</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      {record.veracityScore}% Veracity
                    </span>
                  </div>
                </div>

                {/* Primary Content: Title & Target Subject */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {record.title}
                    </h2>

                    <div className="text-xs text-slate-600">
                      Subject:{' '}
                      <strong className="text-slate-900 font-semibold">
                        {record.targetName}
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {record.description}
                  </p>
                </div>

                {/* Attached Words / Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                    Attached Words:
                  </span>
                  {record.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        tag === 'Fraud' || tag === 'Crime'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : tag === 'Reliability'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tag === 'Contract'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Attached Evidence Items */}
                {record.evidenceItems.length > 0 && (
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span>Attached Evidence Artifacts ({record.evidenceItems.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {record.evidenceItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-md border border-slate-200 text-xs flex flex-col justify-between"
                        >
                          <div className="font-semibold text-slate-900 truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>{item.type}</span>
                            <span className="font-mono">{item.size || 'Attested'}</span>
                          </div>
                          {item.notes && (
                            <p className="text-[10px] text-slate-600 mt-1 italic border-t border-slate-100 pt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Designated Reviewer in Good Position to Review */}
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                        Person in Position to Review
                      </span>
                    </div>

                    <div className="text-xs">
                      {record.attachedReviewer.status === 'verified_corroborated' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Corroborated by Reviewer</span>
                        </span>
                      ) : record.attachedReviewer.status === 'contested' ? (
                        <span className="text-red-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Contested by Reviewer</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Reviewer Response</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-indigo-100">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {record.attachedReviewer.avatarUrl ? (
                        <img
                          src={record.attachedReviewer.avatarUrl}
                          alt={record.attachedReviewer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        record.attachedReviewer.name.substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-baseline justify-between">
                        <div className="text-xs font-bold text-slate-900">
                          {record.attachedReviewer.name}
                        </div>
                        {record.attachedReviewer.ratingScore && (
                          <div className="text-xs font-mono font-bold text-indigo-700">
                            Rating: {record.attachedReviewer.ratingScore} / 5 ★
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {record.attachedReviewer.headline || 'Designated Reviewer & Domain Witness'}
                      </div>
                      <div className="text-[11px] text-indigo-900 bg-indigo-50/70 p-1.5 rounded mt-1">
                        <strong>Why in good position to review:</strong> {record.attachedReviewer.qualificationNote}
                      </div>

                      {/* Reviewer's Verdict Notes if already submitted */}
                      {record.attachedReviewer.verdictComment && (
                        <div className="pt-2 text-xs text-slate-800 border-t border-slate-100 mt-2">
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            Reviewer Assessment Note:
                          </div>
                          <p className="mt-0.5 italic">"{record.attachedReviewer.verdictComment}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* If current user is the designated reviewer, give them direct action to submit review */}
                  {isAssignedReviewer && record.attachedReviewer.status === 'pending' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setSelectedRecordForReview(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Submit Your Review as Designated Reviewer</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Community Corroborations list */}
                {record.corroborations && record.corroborations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-800">
                      Peer & Witness Corroborations ({record.corroborations.length})
                    </div>
                    <div className="space-y-2">
                      {record.corroborations.map((c) => (
                        <div key={c.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{c.authorName}</span>
                            <span
                              className={`text-[11px] font-bold ${
                                c.verdict === 'corroborated' ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {c.verdict === 'corroborated' ? 'Corroborated Facts' : 'Refuted'}
                            </span>
                          </div>
                          <p className="text-slate-600">{c.note}</p>
                          {c.evidenceName && (
                            <div className="text-[10px] text-indigo-700 font-mono">
                              Artifact: {c.evidenceName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer action bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Impact: <strong className="text-slate-700">{record.severityOrImpact}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRecordForCorroboration(record)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3 h-3 text-slate-500" />
                      <span>Corroborate as Witness</span>
                    </button>

                    {isAssignedReviewer && record.attachedReviewer.status !== 'pending' && (
                      <button
                        onClick={() => setSelectedRecordForReview(record)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        <span>Update Review Verdict</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW REMEMBER RECORD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 my-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Log Evidence to Remember Ledger
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              {/* Target Subject Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Who is this record about? (Person or Business)
                </label>
                <div className="flex items-center gap-3 text-xs mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'user'}
                      onChange={() => setTargetType('user')}
                      className="text-indigo-600"
                    />
                    <span>Network Member</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'custom'}
                      onChange={() => setTargetType('custom')}
                      className="text-indigo-600"
                    />
                    <span>External Person / Corporation</span>
                  </label>
                </div>

                {targetType === 'user' ? (
                  <select
                    value={selectedTargetUserId}
                    onChange={(e) => setSelectedTargetUserId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (@{u.username}) — {u.accountType}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Apex Hardware Supplies Ltd, John Doe, etc."
                    value={customTargetName}
                    onChange={(e) => setCustomTargetName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Record Title</label>
                <input
                  type="text"
                  placeholder="e.g. Full Cloud Infrastructure SLA Fulfillment or Loan Default"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Factual Description & Memory Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the facts, dates, what occurred, promises made or breached, and outcomes."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Incident Date & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Incident Date</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Impact Classification</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Exemplary Positive">Exemplary Positive (Honor & Reliability)</option>
                    <option value="Medium Substantive">Medium Substantive (Commercial Operation)</option>
                    <option value="High Critical">High Critical (Crime / Fraud / Default)</option>
                  </select>
                </div>
              </div>

              {/* Attached Words Selector (Mandatory presets: Business, Crime, Fraud, Contract, Reliability) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <label className="text-xs font-bold text-slate-900 block">
                  Attach Words / Classification Tags
                </label>
                <p className="text-[11px] text-slate-500">
                  Select all that apply to categorize this memory:
                </p>

                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map((tag) => {
                    const isChecked = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {isChecked ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>

                {/* Custom tag addition */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom word (press Enter)..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleAddCustomTag}
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customTagInput.trim() && !selectedTags.includes(customTagInput.trim())) {
                        setSelectedTags((prev) => [...prev, customTagInput.trim()]);
                        setCustomTagInput('');
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                  >
                    Add Word
                  </button>
                </div>
              </div>

              {/* Evidence Artifact Attachment */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <label className="text-xs font-bold text-slate-900 block">
                  Put Evidence Artifacts
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Evidence filename (e.g. executed_contract.pdf)"
                    value={evidenceName}
                    onChange={(e) => setEvidenceName(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-800"
                  />
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-800"
                  >
                    <option value="Signed Legal Contract">Signed Legal Contract</option>
                    <option value="Police Incident Report (FIR)">Police Incident Report (FIR)</option>
                    <option value="Bank Payment Advice & Statement">Bank Payment Advice & Statement</option>
                    <option value="CAC Corporate Registry Extract">CAC Corporate Registry Extract</option>
                    <option value="Telemetry & Inspection Certificate">Telemetry & Inspection Certificate</option>
                    <option value="Chat & Correspondence Forensics">Chat & Correspondence Forensics</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Verification notes or hash (e.g. SHA-256 attested by notary)"
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-800"
                />
              </div>

              {/* Attach Somebody in Good Position to Review (Key User Requirement!) */}
              <div className="space-y-2 bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Attach Somebody in a Good Position to Review</span>
                </div>
                <p className="text-[11px] text-indigo-800">
                  Designate an authoritative peer, auditor, or direct witness from the network who has the position or access to independently review and corroborate this evidence:
                </p>

                <div className="space-y-2">
                  <select
                    value={selectedReviewerId}
                    onChange={(e) => setSelectedReviewerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-indigo-200 rounded-lg text-slate-900 font-medium"
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (@{u.username}) — {(u as any).category || u.accountType}
                      </option>
                    ))}
                  </select>

                  <textarea
                    rows={2}
                    placeholder="Why is this person in a good position to review? (e.g. 'Oversaw physical asset handover at Lekki facility' or 'Handled official escrow wire')"
                    value={reviewerQualification}
                    onChange={(e) => setReviewerQualification(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded text-slate-800 placeholder-indigo-400"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs cursor-pointer"
                >
                  {submitting ? 'Writing to Ledger...' : 'Commit to Remember Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT REVIEW VERDICT MODAL (For Attached Reviewer) */}
      {selectedRecordForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Reviewer Assessment & Verdict
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecordForReview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">{selectedRecordForReview.title}</div>
              <div className="text-slate-600">Subject: {selectedRecordForReview.targetName}</div>
              <div className="text-[11px] text-indigo-800 font-medium">
                Your designated qualification: {selectedRecordForReview.attachedReviewer.qualificationNote}
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Your Official Verdict</label>
                <select
                  value={reviewVerdict}
                  onChange={(e) => setReviewVerdict(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="verified_corroborated">Verified & Corroborated (Evidence Checked)</option>
                  <option value="under_review">Under Active Review (Investigating Further)</option>
                  <option value="contested">Contested / Inaccurate (Refute Evidence)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Reviewer Confidence Score</label>
                <div className="flex items-center gap-3">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`px-3 py-1 text-xs font-mono font-bold rounded border cursor-pointer ${
                        reviewRating === star
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Official Reviewer Findings & Verification Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail your independent inspection of the evidence artifacts, what you verified directly, and your professional conclusion."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
                >
                  {reviewSubmitting ? 'Recording...' : 'Submit Official Verdict'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORROBORATE AS WITNESS MODAL */}
      {selectedRecordForCorroboration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Corroborate Evidence as Witness
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecordForCorroboration(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">{selectedRecordForCorroboration.title}</div>
              <div className="text-slate-600">Subject: {selectedRecordForCorroboration.targetName}</div>
            </div>

            <form onSubmit={handleSubmitCorroboration} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Your Position</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCorroborationVerdict('corroborated')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded border cursor-pointer ${
                      corroborationVerdict === 'corroborated'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Corroborate (Confirm Facts)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCorroborationVerdict('refuted')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded border cursor-pointer ${
                      corroborationVerdict === 'refuted'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Refute (Contest Facts)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Witness Observations & Corroborating Statement
                </label>
                <textarea
                  rows={3}
                  placeholder="State what you witnessed or know firsthand regarding this incident."
                  value={corroborationNote}
                  onChange={(e) => setCorroborationNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Supporting Evidence (Optional)</label>
                <input
                  type="text"
                  placeholder="Supporting document name or transaction reference"
                  value={corroborationEvidence}
                  onChange={(e) => setCorroborationEvidence(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForCorroboration(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={corroborationSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
                >
                  {corroborationSubmitting ? 'Logging...' : 'Submit Corroboration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
