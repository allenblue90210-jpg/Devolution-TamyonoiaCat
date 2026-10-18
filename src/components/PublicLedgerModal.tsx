import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  TrustCommitment,
  TrustReceipt,
  User,
  CommitmentCategory,
} from '../types/trust.js';
import {
  Globe,
  Lock,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
  Receipt,
  Plus,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  FileText,
  Building2,
  Timer,
  Send,
  HelpCircle,
  Sparkles,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';

interface PublicLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSelectProfile: (username: string) => void;
  availableUsers: Array<{ id: string; username: string; fullName: string; accountType: string; avatarUrl: string }>;
  onRefreshData?: () => void;
}

export const PublicLedgerModal: React.FC<PublicLedgerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectProfile,
  availableUsers,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'commitments' | 'receipts' | 'mine'>('commitments');
  const [commitmentFilter, setCommitmentFilter] = useState<'all' | 'from_people' | 'by_me' | 'public'>('all');
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'public' | 'private' | 'from_people' | 'by_me'>('all');

  const [commitments, setCommitments] = useState<TrustCommitment[]>([]);
  const [receipts, setReceipts] = useState<TrustReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Quick Post Commitment Modal state
  const [showPostCommitment, setShowPostCommitment] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postCategory, setPostCategory] = useState<CommitmentCategory>('Vehicle & Transportation');
  const [postCommitterId, setPostCommitterId] = useState('');
  const [postDeadlineDate, setPostDeadlineDate] = useState('');
  const [postDeadlineTime, setPostDeadlineTime] = useState('02:00');
  const [postRewardPoints, setPostRewardPoints] = useState(25);
  const [postIsPublic, setPostIsPublic] = useState(true);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Post Receipt Modal state
  const [showPostReceipt, setShowPostReceipt] = useState(false);
  const [recCounterpartyName, setRecCounterpartyName] = useState('');
  const [recCounterpartyContact, setRecCounterpartyContact] = useState('');
  const [recCategory, setRecCategory] = useState<TrustReceipt['interactionCategory']>('Freelance Project');
  const [recTitle, setRecTitle] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recValue, setRecValue] = useState('');
  const [recConditions, setRecConditions] = useState('');
  const [recIsPublic, setRecIsPublic] = useState(true);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  // Ticking countdown clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Public Data & User's Records
  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const [comRes, myComRes, recRes, myRecRes] = await Promise.all([
        api.getPublicCommitments(),
        currentUser ? api.getCommitments('mine') : Promise.resolve({ commitments: [] }),
        api.getPublicReceipts(),
        currentUser ? api.getReceipts() : Promise.resolve({ receipts: [] }),
      ]);

      // Deduplicate commitments
      const comMap = new Map<string, TrustCommitment>();
      (comRes.commitments || []).forEach((c) => comMap.set(c.id, c));
      (myComRes.commitments || []).forEach((c) => comMap.set(c.id, c));
      setCommitments(Array.from(comMap.values()));

      // Deduplicate receipts (includes public network receipts + user's private receipts)
      const recMap = new Map<string, TrustReceipt>();
      (recRes.receipts || []).forEach((r) => recMap.set(r.id, r));
      (myRecRes.receipts || []).forEach((r) => recMap.set(r.id, r));
      setReceipts(Array.from(recMap.values()));
    } catch (err) {
      console.error('Failed to load public ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLedgerData();
    }
  }, [isOpen]);

  // Global Escape Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showPostCommitment) setShowPostCommitment(false);
        else if (showPostReceipt) setShowPostReceipt(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showPostCommitment, showPostReceipt, onClose]);

  if (!isOpen) return null;

  // Handle Create Public Commitment
  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!postTitle || !postDescription || !postDeadlineDate || !postDeadlineTime) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmittingPost(true);
    try {
      const combinedDeadline = new Date(`${postDeadlineDate}T${postDeadlineTime}:00`).toISOString();
      await api.createCommitment({
        title: postTitle,
        description: postDescription,
        category: postCategory,
        committerId: postCommitterId || (availableUsers.find((u) => u.id !== currentUser.id)?.id || 'usr_sarah_002'),
        deadline: combinedDeadline,
        trustRewardPoints: postRewardPoints,
        isPublic: postIsPublic,
      });

      setShowPostCommitment(false);
      setPostTitle('');
      setPostDescription('');
      setToastMessage(
        postIsPublic
          ? 'Public commitment posted and broadcasted to the public ledger!'
          : 'Private commitment recorded between you and the counterparty.'
      );
      setTimeout(() => setToastMessage(null), 4500);
      await loadLedgerData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to create commitment');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Handle Create Trust Receipt
  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!recCounterpartyName || !recCounterpartyContact || !recTitle || !recConditions) {
      alert('Please fill in counterparty name, contact, title, and completion conditions.');
      return;
    }

    setSubmittingReceipt(true);
    try {
      await api.createReceipt({
        counterpartyName: recCounterpartyName,
        counterpartyContact: recCounterpartyContact,
        interactionCategory: recCategory,
        title: recTitle,
        description: recDescription,
        transactionValue: recValue || undefined,
        completionConditions: recConditions,
        isPublic: recIsPublic,
      });

      setShowPostReceipt(false);
      setRecCounterpartyName('');
      setRecCounterpartyContact('');
      setRecTitle('');
      setRecDescription('');
      setRecConditions('');
      setToastMessage(
        `Trust receipt generated as ${recIsPublic ? 'PUBLIC (Open Ledger)' : 'PRIVATE (Confidential Bilateral)'}!`
      );
      setTimeout(() => setToastMessage(null), 4500);
      await loadLedgerData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to create trust receipt');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  // Toggle Visibility
  const handleToggleReceiptPrivacy = async (id: string, currentPublic: boolean) => {
    try {
      const res = await api.toggleReceiptVisibility(id, !currentPublic);
      setReceipts((prev) => prev.map((r) => (r.id === id ? res.receipt : r)));
      setToastMessage(
        `Receipt #${id} visibility set to ${!currentPublic ? 'Public Ledger (Open)' : 'Private (Confidential)'}`
      );
      setTimeout(() => setToastMessage(null), 3500);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility');
    }
  };

  const handleToggleCommitmentPrivacy = async (id: string, currentPublic: boolean) => {
    try {
      const res = await api.toggleCommitmentVisibility(id, !currentPublic);
      setCommitments((prev) => prev.map((c) => (c.id === id ? res.commitment : c)));
      setToastMessage(
        `Commitment #${id} visibility updated to ${!currentPublic ? 'Public (Open Ledger)' : 'Private'}`
      );
      setTimeout(() => setToastMessage(null), 3500);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility');
    }
  };

  // Helpers for commitment countdown
  const getCountdown = (deadlineIso: string, status: string) => {
    const diff = new Date(deadlineIso).getTime() - currentTime;
    if (status === 'completed') return { text: 'Fulfilled on time', isOverdue: false, urgent: false };
    if (diff <= 0) {
      const overdueMs = Math.abs(diff);
      const days = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((overdueMs / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((overdueMs / (1000 * 60)) % 60);
      return { text: `${days}d ${hours}h ${mins}m overdue`, isOverdue: true, urgent: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    return {
      text: days > 0 ? `${days}d ${hours}h ${mins}m ${secs}s` : `${hours}h ${mins}m ${secs}s`,
      isOverdue: false,
      urgent: diff < 6 * 60 * 60 * 1000,
    };
  };

  // Filtering Commitments
  const filteredCommitments = commitments.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.committerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;

    let matchesSub = true;
    if (commitmentFilter === 'from_people' && currentUser) {
      matchesSub = c.requesterId === currentUser.id;
    } else if (commitmentFilter === 'by_me' && currentUser) {
      matchesSub = c.committerId === currentUser.id;
    } else if (commitmentFilter === 'public') {
      matchesSub = c.isPublic === true;
    }

    const matchesMine =
      activeTab !== 'mine' || (currentUser && (c.requesterId === currentUser.id || c.committerId === currentUser.id));
    return matchesSearch && matchesCategory && matchesSub && matchesMine;
  });

  // Filtering Receipts
  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.interactionCategory === selectedCategory;

    let matchesSub = true;
    if (receiptFilter === 'public') {
      matchesSub = r.isPublic === true;
    } else if (receiptFilter === 'private') {
      matchesSub = r.isPublic === false;
    } else if (receiptFilter === 'from_people' && currentUser) {
      matchesSub =
        r.counterpartyUserId === currentUser.id ||
        r.counterpartyName.toLowerCase().includes(currentUser.fullName.toLowerCase());
    } else if (receiptFilter === 'by_me' && currentUser) {
      matchesSub = r.creatorId === currentUser.id;
    }

    const matchesMine =
      activeTab !== 'mine' || (currentUser && (r.creatorId === currentUser.id || r.counterpartyUserId === currentUser.id));
    return matchesSearch && matchesCategory && matchesSub && matchesMine;
  });

  const publicReceiptsCount = receipts.filter((r) => r.isPublic).length;
  const privateReceiptsCount = receipts.filter((r) => !r.isPublic).length;
  const publicCommitmentsCount = commitments.filter((c) => c.isPublic).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Public Trust Ledger"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Globe className="w-5 h-5 text-indigo-600" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Public Evidentiary Ledger
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Network
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Public Commitments & Trust Receipts
              </h2>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                Inspect public commitments posted across the network, post your own time-locked commitments for people to see, or inspect bilateral trust receipts. Note that trust receipts support both <strong>Public</strong> and <strong>Private</strong> attestations.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy Distinction Explainer Card */}
          <div className="mt-4 p-3.5 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-emerald-50/70 border border-indigo-100/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Notice: Public vs. Private Attestations</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {publicCommitmentsCount} Public Commitments · {publicReceiptsCount} Public Receipts · {privateReceiptsCount} Private Receipts
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200/80 flex items-start gap-2">
                <Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-900 block font-semibold">Public Trust Receipts & Commitments:</strong>
                  <span className="text-slate-600 text-[11px] leading-tight block mt-0.5">
                    Attested openly on the ledger. Anyone in the network can verify fulfilled commitments, commercial delivery milestones, and counterparty sign-offs.
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200/80 flex items-start gap-2">
                <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block font-semibold">Private Trust Receipts:</strong>
                  <span className="text-slate-600 text-[11px] leading-tight block mt-0.5">
                    Cryptographically dual-signed and confidential between counterparties. Not visible to the public unless you or the counterparty toggle it to Public.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notice */}
          {toastMessage && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Main Tabs + Post Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('commitments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'commitments'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Public Commitments</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
                  {filteredCommitments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('receipts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'receipts'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Trust Receipts</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
                  {filteredReceipts.length}
                </span>
              </button>

              {currentUser && (
                <button
                  onClick={() => setActiveTab('mine')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'mine'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Our Records & Pacts</span>
                </button>
              )}
            </div>

            {/* Post CTA Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPostCommitment(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Public Commitment</span>
              </button>

              <button
                onClick={() => setShowPostReceipt(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>Issue Trust Receipt</span>
              </button>
            </div>
          </div>

          {/* Sub-Filters & Search Bar */}
          <div className="mt-3 space-y-2.5">
            {/* Sub-Filter Pills */}
            {activeTab === 'commitments' && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">Filter:</span>
                <button
                  onClick={() => setCommitmentFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    commitmentFilter === 'all'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Commitments
                </button>
                <button
                  onClick={() => setCommitmentFilter('public')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    commitmentFilter === 'public'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Public Only</span>
                </button>
                {currentUser && (
                  <>
                    <button
                      onClick={() => setCommitmentFilter('from_people')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        commitmentFilter === 'from_people'
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      From People to Us
                    </button>
                    <button
                      onClick={() => setCommitmentFilter('by_me')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        commitmentFilter === 'by_me'
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      By Us to People
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === 'receipts' && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">Receipt Type:</span>
                <button
                  onClick={() => setReceiptFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    receiptFilter === 'all'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Receipts
                </button>
                <button
                  onClick={() => setReceiptFilter('public')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    receiptFilter === 'public'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Public Receipts ({publicReceiptsCount})</span>
                </button>
                <button
                  onClick={() => setReceiptFilter('private')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    receiptFilter === 'private'
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Private Receipts ({privateReceiptsCount})</span>
                </button>
                {currentUser && (
                  <>
                    <button
                      onClick={() => setReceiptFilter('from_people')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        receiptFilter === 'from_people'
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      From People to Us
                    </button>
                    <button
                      onClick={() => setReceiptFilter('by_me')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        receiptFilter === 'by_me'
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Issued by Us
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Search Bar & Category Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, counterparty, description, or keyword..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="Vehicle & Transportation">Vehicle & Transportation</option>
                <option value="Delivery & Logistics">Delivery & Logistics</option>
                <option value="Financial & Lending">Financial & Lending</option>
                <option value="Equipment & Machinery">Equipment & Machinery</option>
                <option value="Professional Milestone">Professional Milestone</option>
                <option value="Freelance Project">Freelance Project</option>
                <option value="Goods Sale & Delivery">Goods Sale & Delivery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Body / Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <div>Fetching attested records from the public ledger...</div>
            </div>
          ) : activeTab === 'commitments' ? (
            /* Public Commitments List */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  Showing {filteredCommitments.length} commitment{filteredCommitments.length === 1 ? '' : 's'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  All contracts time-locked with real-time default penalties
                </span>
              </div>

              {filteredCommitments.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-xl border border-slate-100">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">No commitments found</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No active commitments match your criteria. You can post a public commitment right now to broadcast it to the network!
                  </p>
                  <button
                    onClick={() => setShowPostCommitment(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-2xs cursor-pointer"
                  >
                    Post a Public Commitment Now
                  </button>
                </div>
              ) : (
                filteredCommitments.map((commitment) => {
                  const countdown = getCountdown(commitment.deadline, commitment.status);
                  return (
                    <div
                      key={commitment.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-indigo-200 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {commitment.category}
                            </span>
                            {commitment.isPublic ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Globe className="w-3 h-3 text-emerald-600" />
                                <span>Public Commitment</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                <Lock className="w-3 h-3 text-slate-600" />
                                <span>Private Commitment</span>
                              </span>
                            )}
                            <span className="text-xs font-mono text-slate-400">#{commitment.id}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900">{commitment.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                            {commitment.description}
                          </p>
                        </div>

                        {/* Live Countdown & Points */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-right shrink-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Fulfillment Deadline
                          </div>
                          <div
                            className={`font-mono text-xs sm:text-sm font-bold mt-0.5 ${
                              countdown.isOverdue
                                ? 'text-red-600'
                                : countdown.urgent
                                ? 'text-amber-600 animate-pulse'
                                : 'text-slate-800'
                            }`}
                          >
                            {countdown.text}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            +{commitment.trustRewardPoints} trust pts upon handover
                          </div>
                        </div>
                      </div>

                      {/* Committer & Requester Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Committed By:</span>
                          <button
                            onClick={() => {
                              const found = availableUsers.find((u) => u.id === commitment.committerId);
                              onSelectProfile(found ? found.username : commitment.committerName.toLowerCase().replace(/\s+/g, ''));
                              onClose();
                            }}
                            className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>{commitment.committerName}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">For / Requested By:</span>
                          <span className="font-semibold text-slate-800">{commitment.requesterName}</span>
                        </div>
                      </div>

                      {/* Status / History / Verification */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Status:</span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold capitalize ${
                              commitment.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : commitment.status === 'overdue'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {commitment.status}
                          </span>
                        </div>

                        {/* Privacy Toggle Action for owner/committer */}
                        {currentUser &&
                          (commitment.requesterId === currentUser.id || commitment.committerId === currentUser.id) && (
                            <button
                              onClick={() => handleToggleCommitmentPrivacy(commitment.id, commitment.isPublic)}
                              className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium transition-colors cursor-pointer"
                            >
                              {commitment.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{commitment.isPublic ? 'Make Private' : 'Publish to Public Ledger'}</span>
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === 'receipts' ? (
            /* Trust Receipts List (Public & Private) */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  Showing {filteredReceipts.length} trust receipt{filteredReceipts.length === 1 ? '' : 's'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Dual-signed bilateral cryptographic receipts
                </span>
              </div>

              {filteredReceipts.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-xl border border-slate-100">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">No trust receipts found</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Trust receipts can be issued as either <strong>Public</strong> (published openly on the ledger) or <strong>Private</strong> (kept confidential between you and the counterparty).
                  </p>
                  <button
                    onClick={() => setShowPostReceipt(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-2xs cursor-pointer"
                  >
                    Issue New Trust Receipt
                  </button>
                </div>
              ) : (
                filteredReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-indigo-200 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {receipt.interactionCategory}
                          </span>
                          {receipt.isPublic ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Globe className="w-3 h-3 text-emerald-600" />
                              <span>Public Trust Receipt (Open Ledger)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-600" />
                              <span>Private Trust Receipt (Confidential)</span>
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-400 font-semibold">{receipt.id}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{receipt.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {receipt.description || 'Completed engagement with confirmed deliverables.'}
                        </p>
                      </div>

                      {receipt.transactionValue && (
                        <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-right shrink-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                            Transaction Value
                          </div>
                          <div className="font-mono text-sm sm:text-base font-bold text-emerald-900 mt-0.5">
                            {receipt.transactionValue}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Parties Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400">Originator / Issuer:</span>{' '}
                        <button
                          onClick={() => {
                            onSelectProfile(receipt.creatorName.toLowerCase().replace(/\s+/g, ''));
                            onClose();
                          }}
                          className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                        >
                          {receipt.creatorName}
                        </button>
                      </div>
                      <div>
                        <span className="text-slate-400">Counterparty:</span>{' '}
                        <button
                          onClick={() => {
                            onSelectProfile(receipt.counterpartyName.toLowerCase().replace(/\s+/g, ''));
                            onClose();
                          }}
                          className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                        >
                          {receipt.counterpartyName}
                        </button>
                      </div>
                    </div>

                    {/* Conditions & Sign-off history */}
                    {receipt.completionConditions && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <div className="font-semibold text-slate-900 mb-0.5">Conditions of Satisfaction:</div>
                        <p className="text-slate-600 leading-relaxed">{receipt.completionConditions}</p>
                      </div>
                    )}

                    {/* Sign-off audit trail */}
                    {receipt.history && receipt.history.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Dual-Signature Audit Trail:
                        </div>
                        <div className="space-y-1">
                          {receipt.history.map((h, i) => (
                            <div
                              key={i}
                              className="text-[11px] font-mono text-slate-600 flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded border border-slate-100"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-slate-800">{h.actor}:</span>
                              <span className="truncate">{h.event}</span>
                              <span className="text-slate-400 ml-auto shrink-0">
                                {new Date(h.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Privacy Toggle Action */}
                    {currentUser &&
                      (receipt.creatorId === currentUser.id ||
                        receipt.counterpartyUserId === currentUser.id) && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="text-[11px] text-slate-500">
                            You are a confirmed party on this receipt. You can change its visibility anytime:
                          </span>
                          <button
                            onClick={() => handleToggleReceiptPrivacy(receipt.id, receipt.isPublic)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          >
                            {receipt.isPublic ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                <span>Switch to Private Receipt</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Publish to Public Ledger</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Our Records / Activity Combined View */
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Our Time-Locked Commitments</span>
                </h3>
                <div className="space-y-3">
                  {filteredCommitments.filter(
                    (c) => currentUser && (c.requesterId === currentUser.id || c.committerId === currentUser.id)
                  ).length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                      No commitments recorded for your account yet.
                    </div>
                  ) : (
                    filteredCommitments
                      .filter((c) => currentUser && (c.requesterId === currentUser.id || c.committerId === currentUser.id))
                      .map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{c.title}</span>
                              {c.isPublic ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                  Public
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                  Private
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {c.committerId === currentUser?.id ? 'You committed to: ' : 'Committed to you by: '}
                              <strong>{c.committerId === currentUser?.id ? c.requesterName : c.committerName}</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleCommitmentPrivacy(c.id, c.isPublic)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0 cursor-pointer"
                          >
                            {c.isPublic ? 'Make Private' : 'Make Public'}
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Our Bilateral Trust Receipts (Public & Private)</span>
                </h3>
                <div className="space-y-3">
                  {filteredReceipts.filter(
                    (r) =>
                      currentUser &&
                      (r.creatorId === currentUser.id || r.counterpartyUserId === currentUser.id)
                  ).length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                      No trust receipts recorded for your account yet.
                    </div>
                  ) : (
                    filteredReceipts
                      .filter(
                        (r) =>
                          currentUser &&
                          (r.creatorId === currentUser.id || r.counterpartyUserId === currentUser.id)
                      )
                      .map((r) => (
                        <div
                          key={r.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{r.title}</span>
                              {r.isPublic ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-emerald-600" />
                                  Public Receipt
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-slate-600" />
                                  Private Receipt
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              Counterparty: <strong>{r.counterpartyName}</strong>
                              {r.transactionValue && ` · Value: ${r.transactionValue}`}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleReceiptPrivacy(r.id, r.isPublic)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0 cursor-pointer"
                          >
                            {r.isPublic ? 'Make Private' : 'Make Public'}
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Public entries carry cryptographic integrity and are linked to identity verification.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded hover:bg-slate-200 cursor-pointer"
          >
            Close Ledger
          </button>
        </div>
      </div>

      {/* Nested Modal: Post Public Commitment */}
      {showPostCommitment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 overflow-y-auto p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in duration-150"
        >
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  New Public Time-Locked Pact
                </span>
                <h3 className="text-lg font-bold text-slate-900">Post Public Commitment</h3>
              </div>
              <button
                onClick={() => setShowPostCommitment(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommitment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pact / Commitment Title *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Complete Phase 2 smart contract deployment on staging"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as CommitmentCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="Vehicle & Transportation">Vehicle & Transportation</option>
                  <option value="Delivery & Logistics">Delivery & Logistics</option>
                  <option value="Financial & Lending">Financial & Lending</option>
                  <option value="Equipment & Machinery">Equipment & Machinery</option>
                  <option value="Professional Milestone">Professional Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Committer / Beneficiary
                </label>
                <select
                  value={postCommitterId}
                  onChange={(e) => setPostCommitterId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="">Select counterparty persona</option>
                  {availableUsers
                    .filter((u) => u.id !== currentUser?.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (@{u.username})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commitment Description & Terms *</label>
                <textarea
                  required
                  rows={3}
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  placeholder="State the clear, non-negotiable delivery criteria and handover protocol..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={postDeadlineDate}
                    onChange={(e) => setPostDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline Time *</label>
                  <input
                    type="time"
                    required
                    value={postDeadlineTime}
                    onChange={(e) => setPostDeadlineTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Public Visibility Toggle Card */}
              <div
                onClick={() => setPostIsPublic(!postIsPublic)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  postIsPublic
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {postIsPublic ? <Globe className="w-4 h-4 text-indigo-600" /> : <Lock className="w-4 h-4 text-slate-600" />}
                    <span>{postIsPublic ? 'Public Commitment (Open Ledger)' : 'Private Commitment (Bilateral)'}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-tight">
                    {postIsPublic
                      ? 'Visible to everyone on the public commitments feed. Demonstrates transparency.'
                      : 'Only visible between you and the assigned committer.'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={postIsPublic}
                  onChange={(e) => setPostIsPublic(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostCommitment(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingPost ? 'Publishing...' : 'Publish Commitment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nested Modal: Create Trust Receipt */}
      {showPostReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 overflow-y-auto p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in duration-150"
        >
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Bilateral Attestation
                </span>
                <h3 className="text-lg font-bold text-slate-900">Issue New Trust Receipt</h3>
              </div>
              <button
                onClick={() => setShowPostReceipt(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Title *</label>
                <input
                  type="text"
                  required
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="e.g. Delivery of Industrial Generator & Complete Sign-off"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Counterparty Full Name *</label>
                  <input
                    type="text"
                    required
                    value={recCounterpartyName}
                    onChange={(e) => setRecCounterpartyName(e.target.value)}
                    placeholder="e.g. Fatima Bello"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Counterparty Email / Phone *</label>
                  <input
                    type="text"
                    required
                    value={recCounterpartyContact}
                    onChange={(e) => setRecCounterpartyContact(e.target.value)}
                    placeholder="e.g. fatima@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={recCategory}
                    onChange={(e) => setRecCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  >
                    <option value="Freelance Project">Freelance Project</option>
                    <option value="Goods Sale & Delivery">Goods Sale & Delivery</option>
                    <option value="Contract Services">Contract Services</option>
                    <option value="Vehicle Purchase/Lease">Vehicle Purchase/Lease</option>
                    <option value="Financial Loan/Settlement">Financial Loan/Settlement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Value (Optional)</label>
                  <input
                    type="text"
                    value={recValue}
                    onChange={(e) => setRecValue(e.target.value)}
                    placeholder="e.g. ₦ 4,500,000 NGN"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={recDescription}
                  onChange={(e) => setRecDescription(e.target.value)}
                  placeholder="Summary of services, deliverables, or goods transferred..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conditions of Satisfaction *
                </label>
                <textarea
                  required
                  rows={2}
                  value={recConditions}
                  onChange={(e) => setRecConditions(e.target.value)}
                  placeholder="Describe exact conditions required for bilateral dual sign-off..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              {/* Public vs Private Receipt Toggle Card */}
              <div
                onClick={() => setRecIsPublic(!recIsPublic)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  recIsPublic
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    {recIsPublic ? <Globe className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-600" />}
                    <span>{recIsPublic ? 'Public Trust Receipt (Open Ledger)' : 'Private Trust Receipt (Bilateral Only)'}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-tight">
                    {recIsPublic
                      ? 'Note: Public receipts appear on the public evidentiary ledger for prospective clients and partners to inspect.'
                      : 'Note: Private receipts remain completely confidential between you and the counterparty with zero public exposure.'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={recIsPublic}
                  onChange={(e) => setRecIsPublic(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostReceipt(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReceipt}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingReceipt ? 'Issuing...' : 'Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
