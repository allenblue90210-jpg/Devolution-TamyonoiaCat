import React, { useState, useEffect } from 'react';
import { TrustReceipt, ReceiptStatus, User, ReceiptComment } from '../types/trust.js';
import { api } from '../services/api.js';
import { UserAvatar } from './UserAvatar.js';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Check,
  FileText,
  AlertCircle,
  ExternalLink,
  Shield,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  Globe,
  Lock,
  Tag,
  Star,
  MessageSquare,
  ThumbsUp,
  Timer,
  Send,
  Calendar,
  UserCheck,
  UserPlus,
  Search,
  Users,
} from 'lucide-react';
import { formatTransactionCurrency, CURRENCY_OPTIONS } from '../utils/currency.js';

interface TrustReceiptsViewProps {
  user: User;
  receipts: TrustReceipt[];
  availableUsers?: Array<{
    id: string;
    username: string;
    fullName: string;
    accountType: string;
    avatarUrl: string;
    email?: string;
  }>;
  onRefreshAllData?: () => void;
  onCreateReceipt: (data: Partial<TrustReceipt>) => Promise<void>;
  onConfirmReceipt: (id: string) => Promise<void>;
  onCompleteReceipt: (id: string) => Promise<void>;
  onDisputeReceipt: (id: string, reason: string, description: string) => Promise<void>;
  onBack?: () => void;
}

export const TrustReceiptsView: React.FC<TrustReceiptsViewProps> = ({
  user,
  receipts,
  availableUsers = [],
  onRefreshAllData,
  onCreateReceipt,
  onConfirmReceipt,
  onCompleteReceipt,
  onDisputeReceipt,
  onBack,
}) => {
  const [localReceipts, setLocalReceipts] = useState<TrustReceipt[]>(receipts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<TrustReceipt | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Receipt Rating Modal State
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratingReceipt, setRatingReceipt] = useState<TrustReceipt | null>(null);
  const [rateScore, setRateScore] = useState<number>(5);
  const [rateBadge, setRateBadge] = useState<string>('Full Fulfillment Verified');
  const [rateComment, setRateComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comments State (per receipt)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentRatingTags, setCommentRatingTags] = useState<Record<string, 100 | 50 | null>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // Live Clock Tick for Real-Time Countdown
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLocalReceipts(receipts);
  }, [receipts]);

  // Form states for create
  const [counterpartyType, setCounterpartyType] = useState<'registered' | 'external'>('registered');
  const [targetCounterpartyId, setTargetCounterpartyId] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyContact, setCounterpartyContact] = useState('');
  const [receiptCounterpartySearch, setReceiptCounterpartySearch] = useState('');
  const [interactionCategory, setInteractionCategory] = useState<TrustReceipt['interactionCategory']>('Freelance Project');
  const [otherCategoryDetails, setOtherCategoryDetails] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currencySign, setCurrencySign] = useState('₦');
  const [transactionValue, setTransactionValue] = useState('');
  const [completionConditions, setCompletionConditions] = useState('');
  const [isTimed, setIsTimed] = useState(true);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasUserClearedReceiptCounterparty, setHasUserClearedReceiptCounterparty] = useState(false);

  // Edit Counterparty on existing receipt
  const [editingReceipt, setEditingReceipt] = useState<TrustReceipt | null>(null);
  const [editReceiptSearch, setEditReceiptSearch] = useState('');
  const [editReceiptSelectedUser, setEditReceiptSelectedUser] = useState<any>(null);
  const [editReceiptExternalName, setEditReceiptExternalName] = useState('');
  const [isUpdatingReceiptCounterparty, setIsUpdatingReceiptCounterparty] = useState(false);

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Unfulfilled Deliverables');
  const [disputeDesc, setDisputeDesc] = useState('');

  // Auto-select other user when create modal opens if not manually cleared
  useEffect(() => {
    if (showCreateModal && !hasUserClearedReceiptCounterparty && !targetCounterpartyId) {
      if (availableUsers.length > 0) {
        const otherUser = availableUsers.find((u) => u.id !== user.id) || availableUsers[0];
        if (otherUser) {
          setTargetCounterpartyId(otherUser.id);
          setCounterpartyName(otherUser.fullName);
          setCounterpartyContact(otherUser.email || `${otherUser.username}@devolution.network`);
        }
      }
    }
  }, [showCreateModal, availableUsers, user.id]);

  // Initial default deadline: tomorrow 18:00
  useEffect(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setDeadlineDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleSelectCounterpartyUser = (userId: string) => {
    setHasUserClearedReceiptCounterparty(false);
    setTargetCounterpartyId(userId);
    if (userId === 'other') {
      setCounterpartyType('external');
      setCounterpartyName('');
      setCounterpartyContact('');
    } else {
      setCounterpartyType('registered');
      const found = availableUsers.find((u) => u.id === userId);
      if (found) {
        setCounterpartyName(found.fullName);
        setCounterpartyContact(found.email || `${found.username}@devolution.network`);
      }
    }
  };

  const setDeadlinePreset = (preset: '2h' | 'today_6pm' | 'tomorrow_2am' | '24h' | '3d' | '7d') => {
    const d = new Date();
    if (preset === '2h') {
      d.setHours(d.getHours() + 2);
    } else if (preset === 'today_6pm') {
      d.setHours(18, 0, 0, 0);
      if (d.getTime() < Date.now()) {
        d.setDate(d.getDate() + 1);
      }
    } else if (preset === 'tomorrow_2am') {
      d.setDate(d.getDate() + 1);
      d.setHours(2, 0, 0, 0);
    } else if (preset === '24h') {
      d.setHours(d.getHours() + 24);
    } else if (preset === '3d') {
      d.setDate(d.getDate() + 3);
    } else if (preset === '7d') {
      d.setDate(d.getDate() + 7);
    }
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    setDeadlineDate(dateStr);
    setDeadlineTime(timeStr);
  };

  const formatCountdown = (deadlineStr?: string | null, status?: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr).getTime();
    if (isNaN(deadline)) return null;
    const diff = deadline - currentTime;

    if (status === 'completed') {
      return { text: 'Fulfilled on time', isOverdue: false, isCompleted: true, urgent: false };
    }

    if (diff <= 0) {
      const overdueMins = Math.floor(Math.abs(diff) / (1000 * 60));
      const hours = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      const days = Math.floor(hours / 24);
      if (days > 0) {
        return { text: `Overdue by ${days}d ${hours % 24}h`, isOverdue: true, isCompleted: false, urgent: true };
      }
      return { text: `Overdue by ${hours > 0 ? `${hours}h ` : ''}${mins}m`, isOverdue: true, isCompleted: false, urgent: true };
    }

    const totalMins = Math.floor(diff / (1000 * 60));
    const days = Math.floor(totalMins / (60 * 24));
    const hours = Math.floor((totalMins % (60 * 24)) / 60);
    const mins = totalMins % 60;
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return { text: `${days}d ${hours}h left`, isOverdue: false, isCompleted: false, urgent: false };
    }
    if (hours > 0) {
      return { text: `${hours}h ${mins}m left`, isOverdue: false, isCompleted: false, urgent: hours < 3 };
    }
    return { text: `${mins}m ${secs}s left`, isOverdue: false, isCompleted: false, urgent: true };
  };

  const filteredReceipts = localReceipts.filter((r) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'other') return r.interactionCategory === 'Other';
    return r.status === filterStatus;
  });

  const toggleComments = (id: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddComment = async (receiptId: string) => {
    const text = (commentInputs[receiptId] || '').trim();
    if (!text) {
      alert('Please enter a comment or progress update for this receipt.');
      return;
    }
    const ratingTag = commentRatingTags[receiptId] ?? null;

    try {
      setCommentSubmitting((prev) => ({ ...prev, [receiptId]: true }));
      const res = await api.addReceiptComment(receiptId, text, ratingTag);
      setLocalReceipts((prev) =>
        prev.map((r) => (r.id === receiptId ? res.receipt : r))
      );
      if (selectedReceipt?.id === receiptId) {
        setSelectedReceipt(res.receipt);
      }
      setCommentInputs((prev) => ({ ...prev, [receiptId]: '' }));
      setExpandedComments((prev) => ({ ...prev, [receiptId]: true }));
      setToastMessage('Comment posted to Trust Receipt & synchronized to ledger!');
      setTimeout(() => setToastMessage(null), 3500);
      if (onRefreshAllData) onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [receiptId]: false }));
    }
  };

  const handleOpenRateModal = (rc: TrustReceipt, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRatingReceipt(rc);
    setRateScore(5);
    setRateBadge('Full Fulfillment Verified');
    setRateComment('');
    setShowRateModal(true);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingReceipt) return;
    try {
      setSubmittingRating(true);
      const res = await api.rateReceipt(ratingReceipt.id, rateScore, rateBadge, rateComment);
      setLocalReceipts((prev) =>
        prev.map((r) => (r.id === ratingReceipt.id ? res.receipt : r))
      );
      if (selectedReceipt?.id === ratingReceipt.id) {
        setSelectedReceipt(res.receipt);
      }
      setShowRateModal(false);
      setToastMessage(`Receipt #${ratingReceipt.id} rated at ${rateScore} ★ (${rateBadge})!`);
      setTimeout(() => setToastMessage(null), 4000);
      if (onRefreshAllData) onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !counterpartyName || !completionConditions) {
      alert('Please fill out all required fields: Title, Counterparty, and Completion Conditions.');
      return;
    }
    setSubmitting(true);
    const formattedValue = transactionValue.trim()
      ? formatTransactionCurrency(transactionValue, currencySign)
      : undefined;

    const formattedDeadline = isTimed && deadlineDate && deadlineTime
      ? new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString()
      : undefined;

    const selectedUser = availableUsers.find((u) => u.id === targetCounterpartyId);

    try {
      const safeContact = counterpartyContact.trim() || `${counterpartyName.toLowerCase().replace(/\s+/g, '.')}@devolution.network`;
      await onCreateReceipt({
        counterpartyUserId: targetCounterpartyId && targetCounterpartyId !== 'other' ? targetCounterpartyId : undefined,
        counterpartyAvatar: selectedUser?.avatarUrl,
        counterpartyName: counterpartyName.trim(),
        counterpartyContact: safeContact,
        deadline: formattedDeadline,
        interactionCategory,
        otherCategoryDetails: interactionCategory === 'Other' ? otherCategoryDetails : undefined,
        title: title.trim(),
        description: description.trim(),
        transactionValue: formattedValue,
        completionConditions: completionConditions.trim(),
        isPublic,
        evidenceAttachments: [
          {
            name: `${title.toLowerCase().replace(/\s+/g, '_')}_spec.pdf`,
            date: new Date().toISOString().split('T')[0],
            size: '280 KB',
          },
        ],
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setTransactionValue('');
      setCompletionConditions('');
      setOtherCategoryDetails('');
      setToastMessage('Timed Trust Receipt created and broadcasted to counterparty!');
      setTimeout(() => setToastMessage(null), 4000);
      if (onRefreshAllData) onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create trust receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReceiptCounterparty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;

    const chosen = editReceiptSelectedUser;
    const isOther = chosen?.id === 'other' || (!chosen && editReceiptExternalName.trim());
    const finalName = chosen && chosen.id !== 'other'
      ? chosen.fullName
      : (editReceiptExternalName.trim() || editReceiptSearch.trim());

    if (!finalName) {
      alert('Please select a network member or enter an external counterparty name.');
      return;
    }

    try {
      setIsUpdatingReceiptCounterparty(true);
      await api.updateReceipt(editingReceipt.id, {
        counterpartyUserId: isOther ? 'other' : chosen?.id,
        counterpartyName: finalName,
        counterpartyContact: chosen?.email || `${finalName.toLowerCase().replace(/\s+/g, '.')}@devolution.network`,
        counterpartyAvatar: chosen?.avatarUrl || '',
      });

      setEditingReceipt(null);
      setEditReceiptSelectedUser(null);
      setEditReceiptSearch('');
      setEditReceiptExternalName('');
      setToastMessage(`Counterparty updated to "${finalName}" successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      if (onRefreshAllData) onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update counterparty');
    } finally {
      setIsUpdatingReceiptCounterparty(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt || !disputeDesc.trim()) return;
    try {
      await onDisputeReceipt(selectedReceipt.id, disputeReason, disputeDesc);
      setShowDisputeModal(false);
      setSelectedReceipt(null);
      setDisputeDesc('');
      setToastMessage('Dispute recorded and flagged on ledger.');
      setTimeout(() => setToastMessage(null), 4000);
      if (onRefreshAllData) onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to file dispute.');
    }
  };

  const getStatusBadge = (status: ReceiptStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Counterparty Signed</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Dual Fulfilled</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>Disputed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <X className="w-3 h-3 text-slate-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Awaiting Signature</span>
          </span>
        );
    }
  };

  const tabs = [
    { id: 'all', label: 'All Receipts', count: localReceipts.length },
    { id: 'pending', label: 'Pending Signature', count: localReceipts.filter((r) => r.status === 'pending').length },
    { id: 'confirmed', label: 'In Progress / Signed', count: localReceipts.filter((r) => r.status === 'confirmed').length },
    { id: 'completed', label: 'Fulfilled & Settled', count: localReceipts.filter((r) => r.status === 'completed').length },
    { id: 'disputed', label: 'Disputed', count: localReceipts.filter((r) => r.status === 'disputed').length },
    { id: 'other', label: 'Other Classification', count: localReceipts.filter((r) => r.interactionCategory === 'Other').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-indigo-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 -ml-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <span>Bilateral Trust Receipts & Timed Promises</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Cryptographically anchored milestone receipts and timed commitments. Any receipt dropped or confirmed is permanently recorded on the immutable ledger with SHA-256 verification and synchronized to GitHub.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Drop & Record Trust Receipt</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono tabular-nums text-[11px] opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Receipts List */}
      <div className="space-y-4">
        {filteredReceipts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No trust receipts found in this view.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer"
            >
              Post First Timed Receipt
            </button>
          </div>
        ) : (
          filteredReceipts.map((rc) => {
            const countdown = formatCountdown(rc.deadline, rc.status);
            const isCommentsOpen = Boolean(expandedComments[rc.id]);

            return (
              <div
                key={rc.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 overflow-hidden shadow-xs transition-all"
              >
                {/* Main Card Header & Details */}
                <div
                  onClick={() => setSelectedReceipt(rc)}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs cursor-pointer"
                >
                  <div className="space-y-2 max-w-2xl flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 text-xs">{rc.id}</span>
                      <span className="font-bold text-slate-900 text-sm">{rc.title}</span>
                      {getStatusBadge(rc.status)}

                      {/* Timed Promise Countdown Badge */}
                      {rc.deadline && countdown && (
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            countdown.isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : countdown.isOverdue
                              ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                              : countdown.urgent
                              ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          <Clock className="w-3 h-3 text-indigo-600" />
                          <span>{countdown.text}</span>
                        </span>
                      )}

                      {rc.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>Public</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Private</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                      {rc.interactionCategory === 'Other' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          <Tag className="w-3 h-3 text-purple-600" />
                          <span>{rc.otherCategoryDetails ? `Other: ${rc.otherCategoryDetails}` : 'Other (Custom)'}</span>
                        </span>
                      ) : (
                        <span className="font-medium text-slate-700">{rc.interactionCategory}</span>
                      )}

                      <span aria-hidden="true">·</span>

                      {/* Promised User / Counterparty */}
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        {rc.counterpartyAvatar ? (
                          <img
                            src={rc.counterpartyAvatar}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        )}
                        <span>Promised: <strong>{rc.counterpartyName}</strong></span>
                      </span>

                      {rc.transactionValue && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono font-semibold text-slate-900">
                            {formatTransactionCurrency(rc.transactionValue)}
                          </span>
                        </>
                      )}

                      {rc.deadline && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600 font-mono">
                            Target: {new Date(rc.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}

                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-400">
                        Created {new Date(rc.createdAt).toLocaleDateString()}
                      </span>

                      {rc.averageRating && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{rc.averageRating} ★</span>
                            <span className="text-slate-400 font-normal">
                              ({rc.ratingsCount || rc.ratings?.length || 1})
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                      {rc.completionConditions}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Toggle Comments Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComments(rc.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isCommentsOpen
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Comments ({rc.comments?.length || 0})</span>
                    </button>

                    {rc.status !== 'completed' && rc.status !== 'disputed' && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onCompleteReceipt(rc.id);
                          handleOpenRateModal(rc, e);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span>Mark Finished & Rate</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleOpenRateModal(rc, e)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-600" />
                      <span>Rate</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReceipt(rc);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Inspect Ledger
                    </button>
                  </div>
                </div>

                {/* Inline Expandable Comments Thread (for that user or any user to post) */}
                {isCommentsOpen && (
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        <span>Receipt Discussion & Progress Thread ({rc.comments?.length || 0})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Open for promised user, creator, or any verified member
                      </span>
                    </div>

                    {/* Comments List */}
                    {rc.comments && rc.comments.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {rc.comments.map((cmt) => (
                          <div
                            key={cmt.id}
                            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <div className="flex items-center gap-2">
                                {cmt.authorAvatar ? (
                                  <img
                                    src={cmt.authorAvatar}
                                    alt=""
                                    className="w-5 h-5 rounded-full object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                    {cmt.authorName[0]}
                                  </div>
                                )}
                                <span className="font-bold text-slate-900">{cmt.authorName}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
                                    cmt.authorRole === 'Creator'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : cmt.authorRole === 'Promised Counterparty'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {cmt.authorRole}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                                {cmt.ratingPercent && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                      cmt.ratingPercent === 100
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}
                                  >
                                    {cmt.ratingPercent}% Rating
                                  </span>
                                )}
                                <span>
                                  {new Date(cmt.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed pl-7">{cmt.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px] py-2 bg-white/70 p-3 rounded-lg border border-dashed border-slate-200">
                        No comments posted yet. The promised user, creator, or any verified network member can post progress updates, delivery notes, or witness comments here.
                      </p>
                    )}

                    {/* Add Comment Input Form */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">Post Comment / Status Note:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Attach Rating:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCommentRatingTags((prev) => ({
                                ...prev,
                                [rc.id]: prev[rc.id] === 100 ? null : 100,
                              }))
                            }
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              commentRatingTags[rc.id] === 100
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-1 ring-emerald-400'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            100% Rating
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCommentRatingTags((prev) => ({
                                ...prev,
                                [rc.id]: prev[rc.id] === 50 ? null : 50,
                              }))
                            }
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              commentRatingTags[rc.id] === 50
                                ? 'bg-amber-100 text-amber-900 border-amber-400 ring-1 ring-amber-400'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            50% Rating
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentInputs[rc.id] || ''}
                          onChange={(e) => setCommentInputs((prev) => ({ ...prev, [rc.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(rc.id);
                            }
                          }}
                          placeholder="Type an update, delivery confirmation, or witness note (Press Enter to post)..."
                          className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={commentSubmitting[rc.id] || !commentInputs[rc.id]?.trim()}
                          onClick={() => handleAddComment(rc.id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{commentSubmitting[rc.id] ? 'Posting...' : 'Post'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Receipt Ledger Drawer / Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    {selectedReceipt.id}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Bilateral Trust Receipt
                  </span>
                  {selectedReceipt.deadline && formatCountdown(selectedReceipt.deadline, selectedReceipt.status) && (
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                        formatCountdown(selectedReceipt.deadline, selectedReceipt.status)?.isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : formatCountdown(selectedReceipt.deadline, selectedReceipt.status)?.isOverdue
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-indigo-600" />
                      <span>{formatCountdown(selectedReceipt.deadline, selectedReceipt.status)?.text}</span>
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedReceipt.title}</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedReceipt.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block">Category:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.interactionCategory === 'Other'
                      ? `Other: ${selectedReceipt.otherCategoryDetails || 'Custom Agreement'}`
                      : selectedReceipt.interactionCategory}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Transaction Value:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceipt.transactionValue || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Initiated By:</span>
                  <span className="font-medium text-slate-800">{selectedReceipt.creatorName}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 block">Promised Counterparty:</span>
                    {selectedReceipt.status === 'pending' && selectedReceipt.creatorId === user.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReceipt(selectedReceipt);
                          setEditReceiptSelectedUser(null);
                          setEditReceiptSearch('');
                          setEditReceiptExternalName('');
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                      >
                        Change Counterparty
                      </button>
                    )}
                  </div>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    {selectedReceipt.counterpartyAvatar && (
                      <img
                        src={selectedReceipt.counterpartyAvatar}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover border border-slate-200"
                      />
                    )}
                    <span>{selectedReceipt.counterpartyName}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Timed Deadline:</span>
                  <span className="font-medium text-slate-800">
                    {selectedReceipt.deadline ? new Date(selectedReceipt.deadline).toLocaleString() : 'Open / Untimed'}
                  </span>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">Scope of Commitment & Terms</div>
                <p className="text-slate-600 bg-white p-3 rounded border border-slate-200 leading-relaxed">
                  {selectedReceipt.description || 'Standard mutual agreement terms.'}
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">Defined Completion Conditions</div>
                <p className="text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed font-mono text-[11px]">
                  {selectedReceipt.completionConditions}
                </p>
              </div>

              {selectedReceipt.evidenceAttachments?.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-700 mb-2">Attached Milestone Records</div>
                  <div className="space-y-1.5">
                    {selectedReceipt.evidenceAttachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-medium text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{att.name}</span>
                        </span>
                        <span className="font-mono text-slate-400">{att.size || '320 KB'} · {att.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="font-semibold text-slate-700 mb-2">Immutable Milestone History</div>
                <div className="space-y-2">
                  {selectedReceipt.history?.map((h, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-100 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{h.event}</span>
                        <span className="font-mono tabular-nums text-slate-400">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-500">Signoff actor: {h.actor}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments & Activity Section inside Modal */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Receipt Discussion Thread ({selectedReceipt.comments?.length || 0})</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Open to all network participants</span>
                </div>

                {selectedReceipt.comments && selectedReceipt.comments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedReceipt.comments.map((cmt) => (
                      <div key={cmt.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {cmt.authorAvatar ? (
                              <img src={cmt.authorAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                            ) : null}
                            <span className="font-bold text-slate-900">{cmt.authorName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-200 text-slate-700">
                              {cmt.authorRole}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs">{cmt.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">
                    No comments posted yet. The promised user, creator, or any member can post below.
                  </p>
                )}

                {/* Comment Input in modal */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[selectedReceipt.id] || ''}
                    onChange={(e) => setCommentInputs((prev) => ({ ...prev, [selectedReceipt.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(selectedReceipt.id);
                      }
                    }}
                    placeholder="Write a comment or progress verification..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={commentSubmitting[selectedReceipt.id] || !commentInputs[selectedReceipt.id]?.trim()}
                    onClick={() => handleAddComment(selectedReceipt.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Peer Ratings & Reviews Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Peer Ratings & Reviews ({selectedReceipt.ratings?.length || 0})</span>
                  </div>
                  {selectedReceipt.averageRating && (
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Average: {selectedReceipt.averageRating} / 5 ★
                    </span>
                  )}
                </div>

                {selectedReceipt.ratings && selectedReceipt.ratings.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedReceipt.ratings.map((rt) => (
                      <div key={rt.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-slate-900">{rt.authorName}</span>
                          <div className="flex items-center gap-1 text-amber-600 font-mono font-bold">
                            <span>{rt.rating} ★</span>
                            {rt.badge && (
                              <span className="text-[10px] text-slate-500 font-normal">· {rt.badge}</span>
                            )}
                          </div>
                        </div>
                        {rt.comment && <p className="text-slate-700 text-xs">{rt.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">
                    No ratings submitted for this receipt yet. Rate this transaction below.
                  </p>
                )}
              </div>
            </div>

            {/* Bilateral Action Controls */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium cursor-pointer"
                >
                  Raise Dispute / Flag
                </button>

                <button
                  onClick={() => handleOpenRateModal(selectedReceipt)}
                  className="px-3 py-1.5 text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-amber-600" />
                  <span>Rate & Review Receipt</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedReceipt.status === 'pending' && (
                  <button
                    onClick={async () => {
                      await onConfirmReceipt(selectedReceipt.id);
                      setSelectedReceipt(null);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sign Counterparty Acceptance</span>
                  </button>
                )}

                {selectedReceipt.status === 'confirmed' && (
                  <button
                    onClick={async () => {
                      await onCompleteReceipt(selectedReceipt.id);
                      setSelectedReceipt(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Attest Final Fulfillment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Trust Receipt Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Create Bilateral Trust Receipt</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Add the user you promised, set a timed countdown deadline, and open a public comment log.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Commitment / Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Return loaner vehicle / Deliver payment API / Complete frontend milestone"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* USER HE PROMISED (Counterparty Selector) */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>The User You Promised / Counterparty *</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCounterpartyType('registered')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        counterpartyType === 'registered'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Network Member
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCounterpartyType('external');
                        setTargetCounterpartyId('other');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        counterpartyType === 'external'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      External
                    </button>
                  </div>
                </div>

                {counterpartyType === 'registered' ? (
                  <div className="space-y-1.5">
                    {targetCounterpartyId && targetCounterpartyId !== 'other' ? (
                      (() => {
                        const sel = availableUsers.find((u) => u.id === targetCounterpartyId);
                        return (
                          <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar
                                src={sel?.avatarUrl}
                                name={counterpartyName || 'User'}
                                className="w-8 h-8 rounded-full border border-indigo-200 shrink-0"
                                iconClassName="w-4 h-4 text-slate-500"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                                  <span>{counterpartyName}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span>Verified</span>
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono truncate">
                                  {counterpartyContact}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setHasUserClearedReceiptCounterparty(true);
                                setTargetCounterpartyId('');
                                setCounterpartyName('');
                                setCounterpartyContact('');
                                setReceiptCounterpartySearch('');
                              }}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={receiptCounterpartySearch}
                            onChange={(e) => setReceiptCounterpartySearch(e.target.value)}
                            placeholder="Search people by name, @username, or email..."
                            className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs text-slate-900"
                            autoFocus
                          />
                          {receiptCounterpartySearch && (
                            <button
                              type="button"
                              onClick={() => setReceiptCounterpartySearch('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Search Suggestions with all available people */}
                        <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xs divide-y divide-slate-100 text-xs">
                          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Select Network Member</span>
                            <span>Click row to assign</span>
                          </div>
                          {availableUsers
                            .filter((u) => {
                              if (u.id === user.id) return false;
                              if (!receiptCounterpartySearch.trim()) return true;
                              const q = receiptCounterpartySearch.toLowerCase();
                              return (
                                u.fullName.toLowerCase().includes(q) ||
                                u.username.toLowerCase().includes(q) ||
                                ((u as any).email && (u as any).email.toLowerCase().includes(q))
                              );
                            })
                            .map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleSelectCounterpartyUser(u.id)}
                                className="w-full p-2.5 flex items-center justify-between hover:bg-indigo-50/80 text-left transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <UserAvatar
                                    src={u.avatarUrl}
                                    name={u.fullName}
                                    className="w-7 h-7 rounded-full shrink-0 border border-slate-200"
                                    iconClassName="w-3.5 h-3.5 text-slate-500"
                                  />
                                  <div className="min-w-0">
                                    <span className="font-semibold text-slate-900 truncate block group-hover:text-indigo-600">
                                      {u.fullName}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono block">
                                      @{u.username}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[11px] text-indigo-600 font-semibold px-2 py-1 rounded bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                                  Select
                                </span>
                              </button>
                            ))}

                          <button
                            type="button"
                            onClick={() => {
                              setCounterpartyType('external');
                              setTargetCounterpartyId('other');
                              if (receiptCounterpartySearch.trim()) {
                                setCounterpartyName(receiptCounterpartySearch.trim());
                              }
                            }}
                            className="w-full p-2 bg-slate-50 hover:bg-slate-100 text-indigo-700 font-semibold flex items-center justify-between cursor-pointer border-t border-slate-200 text-[11px]"
                          >
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              {receiptCounterpartySearch.trim()
                                ? `Use external name: "${receiptCounterpartySearch.trim()}"`
                                : 'Specify external person / custom counterparty'}
                            </span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono">
                              External
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-indigo-700 mt-1">
                      The selected user will be notified and can sign off and post comments directly on this receipt.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={counterpartyName}
                        onChange={(e) => setCounterpartyName(e.target.value)}
                        placeholder="e.g. Samuel Adekunle"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email / Phone *</label>
                      <input
                        type="text"
                        required
                        value={counterpartyContact}
                        onChange={(e) => setCounterpartyContact(e.target.value)}
                        placeholder="samuel@example.com"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* KEEP IT TIMED (Timed Promise & Deadline) */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-600" />
                    <span>Keep It Timed (Promise Deadline)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTimed}
                      onChange={(e) => setIsTimed(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Active Timer</span>
                  </label>
                </div>

                {isTimed && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Deadline Date *
                        </label>
                        <input
                          type="date"
                          required={isTimed}
                          value={deadlineDate}
                          onChange={(e) => setDeadlineDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Deadline Time *
                        </label>
                        <input
                          type="time"
                          required={isTimed}
                          value={deadlineTime}
                          onChange={(e) => setDeadlineTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-500 font-medium">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset('2h')}
                        className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        +2 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset('today_6pm')}
                        className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Today 6 PM
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset('tomorrow_2am')}
                        className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Tomorrow 2 AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset('24h')}
                        className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        +24 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset('3d')}
                        className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        +3 Days
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interaction Category</label>
                  <select
                    value={interactionCategory}
                    onChange={(e) => setInteractionCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Freelance Project">Freelance Project</option>
                    <option value="Goods Sale & Delivery">Goods Sale & Delivery</option>
                    <option value="Consulting Agreement">Consulting Agreement</option>
                    <option value="Service Contract">Service Contract</option>
                    <option value="Loan / Micro-credit Repayment">Loan / Micro-credit Repayment</option>
                    <option value="Property Lease">Property Lease</option>
                    <option value="Joint Venture">Joint Venture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction Value (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionValue}
                    onChange={(e) => setTransactionValue(e.target.value)}
                    placeholder="e.g. ₦ 2,500,000 NGN or $3,500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {interactionCategory === 'Other' && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-1 animate-in fade-in duration-150">
                  <label className="block font-semibold text-purple-950 mb-1">
                    Specify "Other" Category / Interaction Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={otherCategoryDetails}
                    onChange={(e) => setOtherCategoryDetails(e.target.value)}
                    placeholder="e.g. Rare Equipment Custody, Art Commission..."
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scope of Agreement / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key deliverables, promise conditions, or delivery specifications..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Defined Completion Conditions (Crucial) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={completionConditions}
                  onChange={(e) => setCompletionConditions(e.target.value)}
                  placeholder="e.g. Full source code delivered on GitHub and verified by 6:00 PM; vehicle parked with full fuel tank."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="receipt-public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="receipt-public" className="text-slate-700 font-medium cursor-pointer">
                  Publish to Open Verifiable Ledger (Enables community comments & public audit)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Creating Receipt...' : 'Post Timed Trust Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Receipt Modal */}
      {showRateModal && ratingReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rate & Review Trust Receipt</h3>
                <p className="text-xs text-slate-500">Receipt #{ratingReceipt.id} · {ratingReceipt.title}</p>
              </div>
              <button
                onClick={() => setShowRateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rating Score</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRateScore(star)}
                      className="p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rateScore
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-mono font-bold text-slate-700 ml-2">{rateScore} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Verification Badge</label>
                <select
                  value={rateBadge}
                  onChange={(e) => setRateBadge(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="Full Fulfillment Verified">Full Fulfillment Verified</option>
                  <option value="Prompt & Reliable Execution">Prompt & Reliable Execution</option>
                  <option value="Exemplary Good Faith">Exemplary Good Faith</option>
                  <option value="Minor Delay / Accepted Handover">Minor Delay / Accepted Handover</option>
                  <option value="Disputed / Partial Delivery">Disputed / Partial Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Review Note (Optional)</label>
                <textarea
                  rows={3}
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                  placeholder="Describe your counterparty experience, punctuality, and condition of deliverables..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                  <span>{submittingRating ? 'Submitting...' : 'Submit Rating'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Dispute Modal */}
      {showDisputeModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-red-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Raise Formal Dispute</span>
                </h3>
                <p className="text-xs text-slate-500">Flag receipt #{selectedReceipt.id} for network review</p>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRaiseDispute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dispute Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="Unfulfilled Deliverables">Unfulfilled Deliverables / Breach of Promise</option>
                  <option value="Overdue Without Communication">Overdue Without Communication</option>
                  <option value="Damaged or Incomplete Handover">Damaged or Incomplete Handover</option>
                  <option value="Fraudulent or Forged Conditions">Fraudulent or Forged Conditions</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Provide explicit facts and evidentiary context regarding the breach..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Submit Dispute</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Counterparty Modal */}
      {editingReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Change Counterparty</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a registered network participant or specify an external counterparty for Receipt #{editingReceipt.id}
                </p>
              </div>
              <button
                onClick={() => setEditingReceipt(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateReceiptCounterparty} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Search Network Members</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={editReceiptSearch}
                    onChange={(e) => setEditReceiptSearch(e.target.value)}
                    placeholder="Search by name, @username, or email..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {editReceiptSelectedUser && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      src={editReceiptSelectedUser.avatarUrl}
                      name={editReceiptSelectedUser.fullName}
                      className="w-7 h-7 rounded-full"
                      iconClassName="w-3.5 h-3.5 text-slate-500"
                    />
                    <div>
                      <div className="font-bold text-indigo-950">{editReceiptSelectedUser.fullName}</div>
                      <div className="text-[10px] text-indigo-700">
                        {editReceiptSelectedUser.username ? `@${editReceiptSelectedUser.username}` : 'Custom Counterparty'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditReceiptSelectedUser(null);
                      setEditReceiptExternalName('');
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* People list */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
                {availableUsers
                  .filter((u) => {
                    if (u.id === user.id) return false;
                    if (!editReceiptSearch.trim()) return true;
                    const q = editReceiptSearch.toLowerCase();
                    return (
                      u.fullName.toLowerCase().includes(q) ||
                      u.username.toLowerCase().includes(q) ||
                      (u.email && u.email.toLowerCase().includes(q))
                    );
                  })
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setEditReceiptSelectedUser(u);
                        setEditReceiptExternalName('');
                      }}
                      className={`w-full p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                        editReceiptSelectedUser?.id === u.id ? 'bg-indigo-50 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar
                          src={u.avatarUrl}
                          name={u.fullName}
                          className="w-6 h-6 rounded-full shrink-0"
                          iconClassName="w-3 h-3 text-slate-500"
                        />
                        <div className="truncate">
                          <span className="truncate block font-semibold text-slate-800">{u.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold px-2 py-0.5 rounded bg-indigo-50">
                        {editReceiptSelectedUser?.id === u.id ? 'Selected' : 'Select'}
                      </span>
                    </button>
                  ))}

                {/* External person button */}
                <div className="p-2.5 bg-slate-50 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600">Or type custom external counterparty name:</div>
                  <input
                    type="text"
                    value={editReceiptExternalName}
                    onChange={(e) => {
                      setEditReceiptExternalName(e.target.value);
                      setEditReceiptSelectedUser({ id: 'other', fullName: e.target.value });
                    }}
                    placeholder="e.g. Victor Okafor"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReceipt(null)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingReceiptCounterparty || (!editReceiptSelectedUser && !editReceiptExternalName.trim())}
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs cursor-pointer"
                >
                  {isUpdatingReceiptCounterparty ? 'Updating...' : 'Update Counterparty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
