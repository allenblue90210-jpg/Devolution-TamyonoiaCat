import React, { useState, useEffect } from 'react';
import { User, TrustCommitment, CommitmentCategory } from '../types/trust.js';
import { api } from '../services/api.js';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  ExternalLink,
  Car,
  Package,
  Coins,
  Wrench,
  Briefcase,
  HeartHandshake,
  Check,
  Send,
  Timer,
  UserCheck,
  Flame,
  FileText,
  ArrowLeft,
  Tag,
  Eye,
  Users,
  Globe,
  MessageSquare,
  Star,
  ThumbsUp,
  MessageCircle,
  X,
  Search,
} from 'lucide-react';

interface CommitmentsViewProps {
  currentUser: User | null;
  onSelectTab: (tab: string) => void;
  availableUsers: Array<{ id: string; username: string; fullName: string; accountType: string; avatarUrl: string }>;
  onRefreshAllData: () => void;
  onBack?: () => void;
}

export const CommitmentsView: React.FC<CommitmentsViewProps> = ({
  currentUser,
  onSelectTab,
  availableUsers = [],
  onRefreshAllData,
  onBack,
}) => {
  const [commitments, setCommitments] = useState<TrustCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'action_needed' | 'completed' | 'overdue' | 'other'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Form State for New Commitment Request
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CommitmentCategory>('Vehicle & Transportation');
  const [otherCategoryDetails, setOtherCategoryDetails] = useState('');
  const [targetCommitterId, setTargetCommitterId] = useState('');
  const [externalCommitterName, setExternalCommitterName] = useState('');
  const [counterpartySearch, setCounterpartySearch] = useState('');
  const [hasManuallyClearedCounterparty, setHasManuallyClearedCounterparty] = useState(false);
  const [selectedCounterpartyUser, setSelectedCounterpartyUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    accountType?: string;
    avatarUrl?: string;
  } | null>(null);
  const [commitRole, setCommitRole] = useState<'promisor' | 'requester'>('promisor');
  const [customPledgeText, setCustomPledgeText] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('02:00');
  const [rewardPoints, setRewardPoints] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  // Edit / Reassign Counterparty on existing commitment
  const [editingCommitment, setEditingCommitment] = useState<TrustCommitment | null>(null);
  const [editCounterpartySearch, setEditCounterpartySearch] = useState('');
  const [editSelectedUser, setEditSelectedUser] = useState<any>(null);
  const [editExternalName, setEditExternalName] = useState('');
  const [isUpdatingCounterparty, setIsUpdatingCounterparty] = useState(false);

  // Form State for Accepting / Writing Pledge
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [pledgeNote, setPledgeNote] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);

  // State for Comments per commitment
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentRatingTags, setCommentRatingTags] = useState<Record<string, 100 | 50 | null>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // State for Dual Checkout Rating Selection (100% or 50%)
  const [checkoutRatings, setCheckoutRatings] = useState<Record<string, 100 | 50>>({});

  // Finish & Rate Modal State for ongoing tasks
  const [finishingCommitment, setFinishingCommitment] = useState<TrustCommitment | null>(null);
  const [finishStarRating, setFinishStarRating] = useState<number>(5);
  const [finishRatingPercent, setFinishRatingPercent] = useState<100 | 50>(100);
  const [finishRatingBadge, setFinishRatingBadge] = useState<string>('100% Exemplary Good Faith Handover');
  const [finishComment, setFinishComment] = useState<string>('');
  const [isSubmittingFinish, setIsSubmittingFinish] = useState(false);

  const getCounterpartyForTask = (c: TrustCommitment) => {
    if (c.committerId && c.committerId !== currentUser?.id) {
      return {
        id: c.committerId,
        name: c.committerName || 'Committer',
        avatar: c.committerAvatar,
        role: 'Committer / Performer',
      };
    }
    if (c.requesterId && c.requesterId !== currentUser?.id) {
      return {
        id: c.requesterId,
        name: c.requesterName || 'Task Requester',
        avatar: c.requesterAvatar,
        role: 'Task Requester / Creator',
      };
    }
    if (c.promisedUserId && c.promisedUserId !== currentUser?.id) {
      return {
        id: c.promisedUserId,
        name: c.promisedUserName || c.committerName || 'Promised Counterparty',
        avatar: c.promisedUserAvatar || c.committerAvatar,
        role: 'Promised Counterparty',
      };
    }
    return {
      id: c.committerId || 'counterparty',
      name: c.committerName || c.promisedUserName || 'Counterparty',
      avatar: c.committerAvatar,
      role: 'Counterparty',
    };
  };

  const handleOpenFinishModal = (c: TrustCommitment) => {
    setFinishingCommitment(c);
    setFinishStarRating(5);
    setFinishRatingPercent(100);
    setFinishRatingBadge('100% Exemplary Good Faith Handover');
    setFinishComment('');
  };

  const handleConfirmFinishAndRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishingCommitment) return;
    try {
      setIsSubmittingFinish(true);
      const otherParty = getCounterpartyForTask(finishingCommitment);
      const targetUserId = otherParty.id;

      const res = await api.checkoutCommitment(
        finishingCommitment.id,
        finishRatingPercent,
        finishRatingBadge,
        {
          starRating: finishStarRating,
          comment: finishComment,
          ratedUserId: targetUserId,
        }
      );

      setCommitments((prev) =>
        prev.map((c) => (c.id === finishingCommitment.id ? { ...c, ...res.commitment, status: 'completed' } : c))
      );
      setFinishingCommitment(null);
      setActionSuccessMessage(
        `Task marked finished! Attested Trust Receipt #${res.receipt.id} generated and ${otherParty.name} received your ${finishStarRating}★ rating (+${res.pointsAwarded} Trust Points)!`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
      await loadCommitments();
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete task and submit rating');
    } finally {
      setIsSubmittingFinish(false);
    }
  };

  // Rate Pact Modal State
  const [showRatePactModal, setShowRatePactModal] = useState(false);
  const [ratePactTarget, setRatePactTarget] = useState<TrustCommitment | null>(null);
  const [ratePactStars, setRatePactStars] = useState<number>(5);
  const [ratePactPercent, setRatePactPercent] = useState<number>(100);
  const [ratePactBadge, setRatePactBadge] = useState<string>('100% Exemplary Good Faith Handover');
  const [ratePactComment, setRatePactComment] = useState<string>('');
  const [submittingPactRating, setSubmittingPactRating] = useState(false);

  const handleOpenRatePactModal = (c: TrustCommitment) => {
    setRatePactTarget(c);
    setRatePactStars(5);
    setRatePactPercent(100);
    setRatePactBadge('100% Exemplary Good Faith Handover');
    setRatePactComment('');
    setShowRatePactModal(true);
  };

  const handleSubmitPactRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratePactTarget) return;
    try {
      setSubmittingPactRating(true);
      const res = await api.ratePactReview(
        ratePactTarget.id,
        ratePactStars,
        ratePactPercent,
        ratePactBadge,
        ratePactComment
      );
      setCommitments((prev) =>
        prev.map((c) => (c.id === ratePactTarget.id ? res.commitment : c))
      );
      setShowRatePactModal(false);
      setActionSuccessMessage(`Pact #${ratePactTarget.id} rated at ${ratePactStars} ★ (${ratePactBadge}) & synchronized to ledger!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit pact rating');
    } finally {
      setSubmittingPactRating(false);
    }
  };

  // Live Clock Tick for Real-Time Countdown
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadCommitments = async () => {
    try {
      setLoading(true);
      const res = await api.getCommitments('all');
      setCommitments(res.commitments);
    } catch (err: any) {
      console.error('Failed to load commitments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommitments();
  }, [currentUser?.id]);

  // Set default deadline to tomorrow 2:00 AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setDeadlineDate(dateStr);
  }, []);

  // Initialize default counterparty only when modal opens and user hasn't cleared it
  useEffect(() => {
    if (showCreateModal && !hasManuallyClearedCounterparty && !selectedCounterpartyUser && !targetCommitterId) {
      if (availableUsers.length > 0) {
        const otherUser = availableUsers.find((u) => u.id !== currentUser?.id) || availableUsers[0];
        if (otherUser) {
          setTargetCommitterId(otherUser.id);
          setSelectedCounterpartyUser(otherUser);
        }
      }
    }
  }, [showCreateModal, availableUsers, currentUser]);

  const setCommitmentDeadlinePreset = (preset: '2h' | '6h' | 'tomorrow_2am' | '24h' | '3d' | '7d') => {
    const d = new Date();
    if (preset === '2h') {
      d.setHours(d.getHours() + 2);
    } else if (preset === '6h') {
      d.setHours(d.getHours() + 6);
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

  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadlineDate || !deadlineTime) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const combinedDeadline = new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString();
      await api.createCommitment({
        title,
        description,
        category,
        otherCategoryDetails: category === 'Other' ? otherCategoryDetails : undefined,
        committerId: targetCommitterId === 'other' ? undefined : targetCommitterId,
        committerName: targetCommitterId === 'other' ? (externalCommitterName || 'External Counterparty') : undefined,
        deadline: combinedDeadline,
        trustRewardPoints: rewardPoints,
        creatorRole: commitRole,
        pledgeNote: commitRole === 'promisor'
          ? (customPledgeText.trim() || `I promise to fulfill: ${title} by deadline`)
          : undefined,
        isPublic: true,
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setOtherCategoryDetails('');
      setExternalCommitterName('');
      setCustomPledgeText('');
      setActionSuccessMessage(
        commitRole === 'promisor'
          ? 'Time-locked promise committed! Active countdown initiated on ledger.'
          : 'Commitment request created and sent to counterparty!'
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadCommitments();
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create commitment request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCommitmentCounterparty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommitment) return;

    const chosenUser = editSelectedUser;
    const isOther = chosenUser?.id === 'other' || (!chosenUser && editExternalName.trim());
    const finalName = chosenUser && chosenUser.id !== 'other'
      ? chosenUser.fullName
      : (editExternalName.trim() || editCounterpartySearch.trim());

    if (!finalName) {
      alert('Please select a network member or enter an external counterparty name.');
      return;
    }

    try {
      setIsUpdatingCounterparty(true);
      await api.updateCommitment(editingCommitment.id, {
        counterpartyUserId: isOther ? 'other' : chosenUser?.id,
        counterpartyName: finalName,
      });

      setEditingCommitment(null);
      setEditSelectedUser(null);
      setEditCounterpartySearch('');
      setEditExternalName('');
      setActionSuccessMessage(`Counterparty successfully changed to "${finalName}"!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadCommitments();
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update counterparty');
    } finally {
      setIsUpdatingCounterparty(false);
    }
  };

  const handleAcceptCommitment = async (id: string) => {
    if (!pledgeNote.trim()) {
      alert('Please enter your confirmed pledge note (e.g. "I\'ll bring it by 2am").');
      return;
    }

    try {
      setAcceptLoading(true);
      await api.acceptCommitment(id, pledgeNote);
      setAcceptingId(null);
      setPledgeNote('');
      setActionSuccessMessage('Commitment pledge signed! Active countdown timer initiated.');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadCommitments();
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept commitment');
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleFulfillCommitment = async (id: string) => {
    try {
      await api.fulfillCommitment(id);
      setActionSuccessMessage('Marked as fulfilled/handed over. Awaiting counterparty checkout verification.');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadCommitments();
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update commitment');
    }
  };

  const handleCheckoutCommitment = async (id: string, ratingPercent: 100 | 50 = 100) => {
    try {
      const badge = ratingPercent === 100 ? '100% Exemplary Good Faith Handover' : '50% Partial / Settled with Caveats';
      const res = await api.checkoutCommitment(id, ratingPercent, badge);
      setActionSuccessMessage(
        `Dual checkout confirmed at ${ratingPercent}% Rating! Dual-signed Trust Receipt ${res.receipt.id} generated and reputation boosted by +${res.pointsAwarded} pts!`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
      await loadCommitments();
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to checkout commitment');
    }
  };

  const handleRateCommitment = async (id: string, ratingPercent: 100 | 50) => {
    try {
      const badge = ratingPercent === 100 ? '100% Flawless Honor' : '50% Partial / Settled with Caveats';
      const res = await api.rateCommitment(id, ratingPercent, badge);
      setCommitments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...res.commitment, ratingPercent, ratingBadge: badge } : c))
      );
      setActionSuccessMessage(`Pact rated at ${ratingPercent}% (${badge})!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to rate pact');
    }
  };

  const toggleComments = (id: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddComment = async (commitmentId: string) => {
    const text = (commentInputs[commitmentId] || '').trim();
    if (!text) {
      alert('Please enter a comment or progress update for this pact.');
      return;
    }
    const ratingTag = commentRatingTags[commitmentId] ?? null;

    try {
      setCommentSubmitting((prev) => ({ ...prev, [commitmentId]: true }));
      const res = await api.addCommitmentComment(commitmentId, text, ratingTag);
      setCommitments((prev) =>
        prev.map((c) => (c.id === commitmentId ? { ...c, comments: res.commitment.comments } : c))
      );
      setCommentInputs((prev) => ({ ...prev, [commitmentId]: '' }));
      setExpandedComments((prev) => ({ ...prev, [commitmentId]: true }));
      setActionSuccessMessage('Comment added to pact & synchronized to ledger!');
      setTimeout(() => setActionSuccessMessage(null), 3500);
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [commitmentId]: false }));
    }
  };

  const handleRecordImpression = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.recordCommitmentImpression(id, 'witness');
      setCommitments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...res.commitment, hasWitnessed: true } : c))
      );
      setActionSuccessMessage(res.message);
      setTimeout(() => setActionSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to record impression:', err);
    }
  };

  // Helper: category icon
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Vehicle & Transportation':
        return <Car className="w-4 h-4 text-indigo-600" />;
      case 'Delivery & Logistics':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'Financial & Lending':
        return <Coins className="w-4 h-4 text-emerald-600" />;
      case 'Equipment & Machinery':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'Professional Milestone':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'Other':
        return <Tag className="w-4 h-4 text-purple-600" />;
      default:
        return <HeartHandshake className="w-4 h-4 text-slate-600" />;
    }
  };

  // Helper: Live Countdown Formatter
  const getCountdown = (deadlineIso: string, status: string) => {
    const deadlineMs = new Date(deadlineIso).getTime();
    const diff = deadlineMs - currentTime;

    if (status === 'completed') {
      return { text: 'Fulfilled on time', isOverdue: false, urgent: false };
    }

    if (diff <= 0) {
      const overdueMs = Math.abs(diff);
      const days = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((overdueMs / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((overdueMs / (1000 * 60)) % 60);
      return {
        text: `${days}d ${hours}h ${mins}m overdue`,
        isOverdue: true,
        daysOverdue: Math.max(1, Math.ceil(overdueMs / (1000 * 60 * 60 * 24))),
        urgent: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const urgent = diff < 6 * 60 * 60 * 1000; // less than 6 hours
    const text = days > 0 ? `${days}d ${hours}h ${mins}m ${secs}s` : `${hours}h ${mins}m ${secs}s`;

    return { text, isOverdue: false, urgent };
  };

  // Metrics
  const totalCount = commitments.length;
  const activeCount = commitments.filter((c) => c.status === 'active' || c.status === 'fulfilled_pending_checkout').length;
  const completedCount = commitments.filter((c) => c.status === 'completed').length;
  const overdueCount = commitments.filter((c) => c.status === 'overdue' || (c.status !== 'completed' && new Date(c.deadline).getTime() < currentTime)).length;
  const otherCount = commitments.filter((c) => c.category === 'Other').length;
  const onTimeRate = totalCount > 0 ? Math.round((completedCount / Math.max(1, completedCount + overdueCount)) * 100) : 100;
  const totalPublicImpressions = commitments
    .filter((c) => c.isPublic)
    .reduce((acc, c) => acc + (c.impressions ?? 1420), 0);

  // Filtered List
  const filteredCommitments = commitments.filter((c) => {
    const isPastDeadline = new Date(c.deadline).getTime() < currentTime && c.status !== 'completed';
    if (activeFilter === 'active') return c.status === 'active' && !isPastDeadline;
    if (activeFilter === 'action_needed') {
      const isCommitter = c.committerId === currentUser?.id;
      const isRequester = c.requesterId === currentUser?.id;
      return (
        (isCommitter && c.status === 'pending_acceptance') ||
        (isCommitter && c.status === 'active') ||
        (isRequester && c.status === 'fulfilled_pending_checkout')
      );
    }
    if (activeFilter === 'completed') return c.status === 'completed';
    if (activeFilter === 'overdue') return c.status === 'overdue' || isPastDeadline;
    if (activeFilter === 'other') return c.category === 'Other';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Toast Notice */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-600" />
              Time-Locked Trust Contracts
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-600" />
              -30% Daily Default Penalty
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Commitments & Escrowed Pacts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Post and accept time-bound commitments with verifiable counterparties (e.g., returning vehicles, delivering equipment, milestone handovers). When completed by the countdown deadline, both parties check out to boost trust ratings. If unfulfilled, an automatic <strong className="text-red-700 font-semibold">-30% daily reputation penalty</strong> is deducted.
          </p>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create New Trust Pact</span>
          </button>
          <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalPublicImpressions.toLocaleString()} Live Public Impressions</span>
          </div>
        </div>
      </div>

      {/* Trust Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>On-Time Fulfillment</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {onTimeRate}%
          </div>
          <p className="text-[11px] text-slate-500">Across all network pacts</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active Countdown Timers</span>
            <Timer className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-500">Live contracts in progress</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Completed & Attested</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {completedCount}
          </div>
          <p className="text-[11px] text-slate-500">Dual-signed receipts issued</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Public Impressions</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 tabular-nums">
            {totalPublicImpressions > 1000 ? `${(totalPublicImpressions / 1000).toFixed(1)}k` : totalPublicImpressions}
          </div>
          <p className="text-[11px] text-slate-500">Audience reach on public pacts</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Overdue / Defaulted</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className={`text-2xl font-extrabold tabular-nums ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <p className="text-[11px] text-slate-500">
            {overdueCount > 0 ? '-30% daily decay active' : 'Zero active defaults'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs border-b border-slate-200">
        {[
          { id: 'all', label: `All Commitments (${totalCount})` },
          { id: 'active', label: `Active Timers (${activeCount})` },
          { id: 'action_needed', label: 'Action Needed' },
          { id: 'completed', label: `Completed (${completedCount})` },
          { id: 'overdue', label: `Overdue / Defaulted (${overdueCount})` },
          { id: 'other', label: `Other Pacts (${otherCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Commitments Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Loading commitments ledger...
        </div>
      ) : filteredCommitments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Commitments in this View</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create a commitment request (like a loaner vehicle return or service milestone) to start an escrowed trust pact with live timer tracking.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
          >
            Create First Commitment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCommitments.map((c) => {
            const countdown = getCountdown(c.deadline, c.status);
            const isCommitter = c.committerId === currentUser?.id;
            const isRequester = c.requesterId === currentUser?.id;
            const isAcceptingThis = acceptingId === c.id;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border transition-all duration-200 p-6 flex flex-col justify-between space-y-5 shadow-xs ${
                  countdown.isOverdue
                    ? 'border-red-300 ring-2 ring-red-100'
                    : c.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : countdown.urgent
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top: Category, ID & Countdown Badge */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      {getCategoryIcon(c.category)}
                      {c.category === 'Other' ? (
                        <span className="font-semibold text-purple-700">
                          {c.otherCategoryDetails ? `Other: ${c.otherCategoryDetails}` : 'Other (Custom)'}
                        </span>
                      ) : (
                        <span>{c.category}</span>
                      )}
                      <span className="text-slate-300 font-mono">·</span>
                      <span className="font-mono text-slate-500 text-[11px]">{c.id}</span>
                      <span className="text-slate-300 font-mono">·</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        (c.ratingPercent ?? 100) === 100
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{c.ratingPercent ?? 100}% Rating</span>
                      </span>
                      {c.isPublic ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>{(c.impressions ?? 1420).toLocaleString()} impressions</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          Private
                        </span>
                      )}
                    </div>

                    {/* Status Pill with Live Timer */}
                    <div>
                      {c.status === 'completed' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Completed & Attested
                        </span>
                      ) : countdown.isOverdue ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          OVERDUE ({countdown.text})
                        </span>
                      ) : c.status === 'pending_acceptance' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Awaiting Pledge
                        </span>
                      ) : c.status === 'fulfilled_pending_checkout' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          Ready for Checkout
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                            countdown.urgent
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          <Timer className={`w-3.5 h-3.5 ${countdown.urgent ? 'text-amber-600 animate-spin' : 'text-indigo-600'}`} />
                          <span>{countdown.text}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                </div>

                {/* Counterparty Relationship Bar */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    {/* User A: Requester */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {c.requesterAvatar ? (
                          <img src={c.requesterAvatar} alt={c.requesterName} className="w-full h-full object-cover" />
                        ) : (
                          c.requesterName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Requester (User A)</div>
                        <button
                          onClick={() => onSelectTab(`profile-${c.requesterId === 'usr_allen_001' ? 'allenokoro' : c.requesterId}`)}
                          className="font-bold text-slate-900 truncate hover:text-indigo-600 block text-left"
                        >
                          {c.requesterName}
                        </button>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

                    {/* User B: Committer */}
                    <div className="flex items-center gap-2 min-w-0 text-right">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Committer (User B)</div>
                        <button
                          onClick={() => onSelectTab(`profile-${c.committerId === 'usr_sarah_002' ? 'sarah_adesina' : 'fatimabello'}`)}
                          className="font-bold text-slate-900 truncate hover:text-indigo-600 block text-right"
                        >
                          {c.committerName}
                        </button>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {c.committerAvatar ? (
                          <img src={c.committerAvatar} alt={c.committerName} className="w-full h-full object-cover" />
                        ) : (
                          c.committerName.charAt(0)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Committer Signed Pledge */}
                  {c.committerPledgeNote ? (
                    <div className="pt-2 border-t border-slate-200 text-slate-700 text-[11px]">
                      <span className="font-semibold text-slate-900">Signed Pledge: </span>
                      <span className="italic font-mono">"{c.committerPledgeNote}"</span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200 text-slate-400 italic text-[11px]">
                      Awaiting User B ({c.committerName}) to write signed commitment pledge & confirm delivery hour.
                    </div>
                  )}

                  {/* Deadline & Stake Info */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Target Deadline: </span>
                      <strong className="text-slate-800">
                        {new Date(c.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-semibold">+{c.trustRewardPoints} Trust Pts</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-red-700 font-semibold">-30% / day on default</span>
                      <span className="text-slate-300">|</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        (c.ratingPercent ?? 100) === 100
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {c.ratingPercent ?? 100}% Rating ({c.ratingBadge || ((c.ratingPercent ?? 100) === 100 ? 'Exemplary Honor' : 'Partial / Settled')})
                      </span>
                    </div>

                    {c.status !== 'completed' && c.status !== 'cancelled' && (
                      <div className="w-full pt-1.5 flex justify-end border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommitment(c);
                            setEditSelectedUser(null);
                            setEditCounterpartySearch('');
                            setEditExternalName('');
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Change Counterparty</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overdue Warning Callout */}
                {countdown.isOverdue && c.status !== 'completed' && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-red-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Trust Score Deduction Active (-{Math.min(90, (countdown.daysOverdue || 1) * 30)}%)</span>
                    </div>
                    <p className="text-[11px] text-red-700 leading-normal">
                      This commitment missed its agreed deadline by {countdown.daysOverdue} day(s). The committer's public trust rating has received a daily -30% compounding penalty until fulfilled and checked out.
                    </p>
                  </div>
                )}

                {/* Pact Comments & Witness Log Section */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleComments(c.id)}
                      className="font-bold text-slate-800 flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Comments & Witness Log ({c.comments?.length || 0})</span>
                      <span className="text-[10px] text-indigo-600 font-semibold underline">
                        {expandedComments[c.id] ? 'Hide' : 'View & Comment'}
                      </span>
                    </button>
                    <span className="text-[10px] text-slate-500">
                      Anchored to pact #{c.id}
                    </span>
                  </div>

                  {expandedComments[c.id] && (
                    <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                      {/* Comments List */}
                      {c.comments && c.comments.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {c.comments.map((cmt) => (
                            <div key={cmt.id} className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1 shadow-2xs">
                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{cmt.authorName}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    {cmt.authorRole}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                                  {cmt.ratingPercent && (
                                    <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                      cmt.ratingPercent === 100
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}>
                                      {cmt.ratingPercent}% Rating
                                    </span>
                                  )}
                                  <span>{new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                              <p className="text-slate-700 text-xs leading-relaxed">{cmt.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] py-1">
                          No comments posted yet. Be the first to post a handover update or witness note.
                        </p>
                      )}

                      {/* Add Comment Input Form */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">Add Pact Comment:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Attach Rating:</span>
                            <button
                              type="button"
                              onClick={() => setCommentRatingTags((prev) => ({
                                ...prev,
                                [c.id]: prev[c.id] === 100 ? null : 100,
                              }))}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                commentRatingTags[c.id] === 100
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-1 ring-emerald-400'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              100% Rating
                            </button>
                            <button
                              type="button"
                              onClick={() => setCommentRatingTags((prev) => ({
                                ...prev,
                                [c.id]: prev[c.id] === 50 ? null : 50,
                              }))}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                commentRatingTags[c.id] === 50
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
                            value={commentInputs[c.id] || ''}
                            onChange={(e) => setCommentInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(c.id);
                              }
                            }}
                            placeholder="Write a progress note, handover update, or witness commentary..."
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(c.id)}
                            disabled={commentSubmitting[c.id] || !commentInputs[c.id]?.trim()}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                          >
                            {commentSubmitting[c.id] ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  {/* Committer Accepting Pledge Form */}
                  {isAcceptingThis ? (
                    <div className="space-y-2.5 p-3 rounded-lg bg-indigo-50/60 border border-indigo-200 text-xs">
                      <div className="font-bold text-indigo-950 flex items-center gap-1">
                        <Send className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Confirm Pledge & Delivery Time</span>
                      </div>
                      <input
                        type="text"
                        value={pledgeNote}
                        onChange={(e) => setPledgeNote(e.target.value)}
                        placeholder="e.g. 'I will bring the car by 2:00 AM parked in front of gate'"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAcceptingId(null)}
                          className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAcceptCommitment(c.id)}
                          disabled={acceptLoading}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs disabled:opacity-50 cursor-pointer"
                        >
                          {acceptLoading ? 'Signing...' : 'Sign & Start Timer'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons Workflow */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* If completed, view Trust Receipt */}
                    {c.status === 'completed' && c.linkedReceiptId && (
                      <button
                        onClick={() => onSelectTab('receipts')}
                        className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Attested Receipt {c.linkedReceiptId}</span>
                      </button>
                    )}

                    {/* Step 1: User B accepts pending request */}
                    {c.status === 'pending_acceptance' && isCommitter && !isAcceptingThis && (
                      <button
                        onClick={() => {
                          setAcceptingId(c.id);
                          setPledgeNote("I'll bring it by 2am as requested.");
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Accept & Write Pledge</span>
                      </button>
                    )}

                    {/* Step 2: User B marks fulfilled */}
                    {c.status === 'active' && isCommitter && (
                      <button
                        onClick={() => handleFulfillCommitment(c.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Handed Over / Fulfilled</span>
                      </button>
                    )}

                    {/* Rate Pact Options (100% or 50%) */}
                    <div className="flex items-center gap-1.5 text-xs py-1">
                      <span className="text-[11px] font-semibold text-slate-600">Rate Pact:</span>
                      <button
                        type="button"
                        onClick={() => handleRateCommitment(c.id, 100)}
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold border transition-all cursor-pointer ${
                          (c.ratingPercent ?? 100) === 100
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                        title="Rate 100% (Exemplary Full Honor)"
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateCommitment(c.id, 50)}
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold border transition-all cursor-pointer ${
                          c.ratingPercent === 50
                            ? 'bg-amber-100 text-amber-900 border-amber-400 ring-1 ring-amber-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                        }`}
                        title="Rate 50% (Partial / Settled)"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRatePactModal(c)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer flex items-center gap-1"
                        title="Submit Full Peer Rating with Review Commentary"
                      >
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Review & Rate</span>
                      </button>
                    </div>

                    {/* Public Profile Link */}
                    <button
                      onClick={() => onSelectTab(`profile-${c.committerId === 'usr_sarah_002' ? 'sarah_adesina' : 'fatimabello'}`)}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <span>Public Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Ongoing Task: Mark Finished & Rate */}
                  {c.status !== 'completed' && c.status !== 'cancelled' && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-300 space-y-2.5 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                              <span>Has {getCounterpartyForTask(c).name} fulfilled this task?</span>
                              {c.status === 'fulfilled_pending_checkout' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs">
                                  Handover Ready
                                </span>
                              ) : c.status === 'active' ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                                  Ongoing Task
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-emerald-800">
                              Mark finished to verify completion and submit your peer rating for {getCounterpartyForTask(c).name}.
                            </p>
                          </div>
                        </div>

                        {/* PRIMARY BUTTON: Mark Finished & Rate */}
                        <button
                          type="button"
                          onClick={() => handleOpenFinishModal(c)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer shrink-0"
                        >
                          <Check className="w-4 h-4 text-white" />
                          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                          <span>Mark Finished & Rate</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PUBLIC IMPRESSIONS & OBSERVER WITNESS ROW — LOCATED DIRECTLY BELOW THE GREEN BUTTON(S) */}
                  {c.isPublic && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs shadow-2xs">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-950" title="Total public impressions on open ledger">
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{(c.impressions ?? 1420).toLocaleString()} impressions</span>
                        </span>
                        <span className="text-emerald-300">·</span>
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium" title="Network observers witnessing this pact">
                          <Users className="w-3.5 h-3.5 text-slate-600" />
                          <span>{c.witnessCount ?? 24} witnesses</span>
                        </span>
                        <span className="text-emerald-300">·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{c.positiveImpressions ?? 18} credible ({c.ratingPercent ?? 100}% confidence)</span>
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleRecordImpression(c.id, e)}
                        disabled={c.hasWitnessed}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          c.hasWitnessed
                            ? 'bg-emerald-200 text-emerald-900 border border-emerald-300 cursor-default'
                            : 'bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300 hover:border-emerald-600 shadow-2xs'
                        }`}
                        title={c.hasWitnessed ? 'You have recorded an impression on this public pact' : 'Witness this public pact (+1 Impression)'}
                      >
                        <Eye className="w-3 h-3" />
                        <span>{c.hasWitnessed ? 'Witnessed ✓' : 'Witness Pact (+1 Impression)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Commitment Request */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-indigo-600" />
                    <span>Create Time-Locked Commitment Pact</span>
                  </h2>
                  <p className="text-xs text-slate-500">Post a timed commitment, specify the user promised, and set an active countdown timer.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommitment} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
              {/* Role Toggle: Who is making the promise? */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2">
                <span className="block text-indigo-950 font-bold text-xs">Who is making this commitment promise?</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCommitRole('promisor')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      commitRole === 'promisor'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>I am Promising (Committer)</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 leading-tight ${commitRole === 'promisor' ? 'text-indigo-100' : 'text-slate-500'}`}>
                      I am pledging to deliver to another user on time. Timer runs immediately!
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommitRole('requester')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      commitRole === 'requester'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Users className="w-3.5 h-3.5" />
                      <span>Someone Promising Me</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 leading-tight ${commitRole === 'requester' ? 'text-indigo-100' : 'text-slate-500'}`}>
                      Request another user to make and sign this commitment pact.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {commitRole === 'promisor' ? 'Promise / Commitment Title *' : 'Commitment Request Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Return loaner vehicle / Deliver Audi RS5 / Handover server keys / Deliver code by 2am"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Vehicle & Transportation">Vehicle & Transportation</option>
                    <option value="Delivery & Logistics">Delivery & Logistics</option>
                    <option value="Financial & Lending">Financial & Lending</option>
                    <option value="Equipment & Machinery">Equipment & Machinery</option>
                    <option value="Professional Milestone">Professional Milestone</option>
                    <option value="Personal Promise">Personal Promise</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-semibold text-xs flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{commitRole === 'promisor' ? 'Person I Promised (Counterparty) *' : 'Committer Counterparty (User B) *'}</span>
                    </label>
                    {selectedCounterpartyUser ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHasManuallyClearedCounterparty(true);
                          setSelectedCounterpartyUser(null);
                          setTargetCommitterId('');
                          setCounterpartySearch('');
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                      >
                        Change / Search
                      </button>
                    ) : targetCommitterId === 'other' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetCommitterId('');
                          setExternalCommitterName('');
                          setCounterpartySearch('');
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                      >
                        Search Network Members
                      </button>
                    ) : null}
                  </div>

                  {selectedCounterpartyUser ? (
                    <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedCounterpartyUser.avatarUrl ? (
                          <img
                            src={selectedCounterpartyUser.avatarUrl}
                            alt={selectedCounterpartyUser.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-indigo-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-xs">
                            {selectedCounterpartyUser.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                            <span>{selectedCounterpartyUser.fullName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Verified Member</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            @{selectedCounterpartyUser.username}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHasManuallyClearedCounterparty(true);
                          setSelectedCounterpartyUser(null);
                          setTargetCommitterId('');
                          setCounterpartySearch('');
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer shrink-0"
                        title="Remove selection to search other members"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : targetCommitterId === 'other' ? (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>External Counterparty (Custom Person)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCommitterId('');
                            setExternalCommitterName('');
                            setCounterpartySearch('');
                          }}
                          className="text-[11px] text-indigo-600 hover:underline font-medium cursor-pointer"
                        >
                          Pick from network
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={externalCommitterName}
                        onChange={(e) => setExternalCommitterName(e.target.value)}
                        placeholder="Enter counterparty full name & optional contact details..."
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-xs text-slate-900"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={counterpartySearch}
                          onChange={(e) => setCounterpartySearch(e.target.value)}
                          placeholder="Search people by name, @username, or role..."
                          className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs text-slate-900"
                          autoFocus
                        />
                        {counterpartySearch && (
                          <button
                            type="button"
                            onClick={() => setCounterpartySearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown results with all available people */}
                      <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xs divide-y divide-slate-100 text-xs">
                        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Select Network Member</span>
                          <span>Click row to assign</span>
                        </div>
                        {availableUsers
                          .filter((u) => {
                            if (u.id === currentUser?.id) return false;
                            if (!counterpartySearch.trim()) return true;
                            const q = counterpartySearch.toLowerCase();
                            return (
                              u.fullName.toLowerCase().includes(q) ||
                              u.username.toLowerCase().includes(q) ||
                              ((u as any).email && (u as any).email.toLowerCase().includes(q)) ||
                              ((u as any).category && (u as any).category.toLowerCase().includes(q))
                            );
                          })
                          .map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setSelectedCounterpartyUser(u);
                                setTargetCommitterId(u.id);
                                setHasManuallyClearedCounterparty(false);
                                setCounterpartySearch('');
                              }}
                              className="w-full p-2.5 flex items-center justify-between hover:bg-indigo-50/80 text-left transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {u.avatarUrl ? (
                                  <img
                                    src={u.avatarUrl}
                                    alt={u.fullName}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                    {u.fullName.charAt(0)}
                                  </div>
                                )}
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

                        {/* External option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCounterpartyUser(null);
                            setTargetCommitterId('other');
                            if (counterpartySearch.trim()) {
                              setExternalCommitterName(counterpartySearch.trim());
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 text-indigo-700 font-semibold flex items-center justify-between cursor-pointer border-t border-slate-200 text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span>
                              {counterpartySearch.trim()
                                ? `Use external name: "${counterpartySearch.trim()}"`
                                : 'Or specify external person / custom counterparty'}
                            </span>
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                            Custom
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {commitRole === 'promisor' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-emerald-950 font-bold mb-0.5 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Your Confirmed Pledge Note (Promise Terms) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customPledgeText}
                    onChange={(e) => setCustomPledgeText(e.target.value)}
                    placeholder="e.g. I'll bring it by 2am, parked safely in Lekki Phase 1 with full tank and keys handed to security."
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
                  />
                  <p className="text-[11px] text-emerald-700">
                    This pledge note locks your active promise and initiates the real-time countdown timer immediately upon posting.
                  </p>
                </div>
              )}

              {targetCommitterId === 'other' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-1 animate-in fade-in duration-150">
                  <label className="block text-indigo-950 font-semibold mb-1 text-xs">
                    Counterparty Name & Contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={externalCommitterName}
                    onChange={(e) => setExternalCommitterName(e.target.value)}
                    placeholder="e.g. Samuel Adekunle (samuel@example.com / +234 802 000 1122)"
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                  />
                  <p className="text-[11px] text-indigo-700">
                    Specify the external counterparty for this commitment pact.
                  </p>
                </div>
              )}

              {category === 'Other' && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-1 animate-in fade-in duration-150">
                  <label className="block text-purple-950 font-semibold mb-1 text-xs">
                    Specify "Other" Commitment Type / Pact *
                  </label>
                  <input
                    type="text"
                    required
                    value={otherCategoryDetails}
                    onChange={(e) => setOtherCategoryDetails(e.target.value)}
                    placeholder="e.g. Rare Artifact Custody, Temporary Office Key Return, Pet Care Escrow..."
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-xs"
                  />
                  <p className="text-[11px] text-purple-700">
                    Defines custom classification for this time-locked commitment pact.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Detailed Terms & Instructions *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Loaner Mercedes C300 must be returned with full tank of premium gas, parked in bay #4, and inspected for exterior scratches."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Deadline Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Deadline Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Quick Presets for Commitment Deadline */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setCommitmentDeadlinePreset('2h')}
                    className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +2 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommitmentDeadlinePreset('6h')}
                    className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +6 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommitmentDeadlinePreset('tomorrow_2am')}
                    className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Tomorrow 2:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommitmentDeadlinePreset('24h')}
                    className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommitmentDeadlinePreset('3d')}
                    className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommitmentDeadlinePreset('7d')}
                    className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    +1 Week
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Penalty & Trust Mechanics</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-normal">
                  Fulfilling on time boosts both parties' trust ratings (+{rewardPoints} pts). If User B fails to fulfill by the deadline, an automatic <strong>-30% daily reputation decay</strong> is penalized until checkout.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating Pact...' : 'Post Commitment Pact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate & Review Pact Modal */}
      {showRatePactModal && ratePactTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Rate & Review Pact #{ratePactTarget.id}
                </h3>
              </div>
              <button
                onClick={() => setShowRatePactModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">{ratePactTarget.title}</div>
              <div className="text-slate-600">Committer: {ratePactTarget.committerName} · Requester: {ratePactTarget.requesterName}</div>
            </div>

            <form onSubmit={handleSubmitPactRating} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Star Score</label>
                <div className="flex items-center gap-2">
                  {[5, 4, 3, 2, 1].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => {
                        setRatePactStars(s);
                        setRatePactPercent(s >= 4 ? 100 : 50);
                      }}
                      className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                        ratePactStars === s
                          ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Fulfillment Rating Score</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRatePactPercent(100);
                      setRatePactBadge('100% Exemplary Good Faith Handover');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      ratePactPercent === 100
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    100% Full Honor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRatePactPercent(50);
                      setRatePactBadge('50% Partial / Settled with Minor Caveats');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      ratePactPercent === 50
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    50% Partial Settle
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Rating Badge</label>
                <select
                  value={ratePactBadge}
                  onChange={(e) => setRatePactBadge(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                >
                  <option value="100% Exemplary Good Faith Handover">100% Exemplary Good Faith Handover</option>
                  <option value="100% Flawless Honor Pledged">100% Flawless Honor Pledged</option>
                  <option value="Prompt On-Time Delivery">Prompt On-Time Delivery</option>
                  <option value="50% Partial / Settled with Minor Caveats">50% Partial / Settled with Minor Caveats</option>
                  <option value="Default Averted / Remedial Fulfilled">Default Averted / Remedial Fulfilled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Review Commentary & Observations</label>
                <textarea
                  rows={3}
                  placeholder="Detail your firsthand observations of fulfillment fidelity, punctuality, and adherence to pledge."
                  value={ratePactComment}
                  onChange={(e) => setRatePactComment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRatePactModal(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPactRating}
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs cursor-pointer"
                >
                  {submittingPactRating ? 'Recording...' : 'Submit Rating & Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Task Finished & Rate Counterparty Modal */}
      {finishingCommitment && (() => {
        const otherParty = getCounterpartyForTask(finishingCommitment);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Mark Task Finished & Rate</h3>
                    <p className="text-[11px] text-slate-500">Sign off completion and attest counterparty honor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFinishingCommitment(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task Details Banner */}
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-indigo-700 font-bold">{finishingCommitment.id}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    + {finishingCommitment.trustRewardPoints || 25} Trust Points
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{finishingCommitment.title}</div>
                <p className="text-slate-600 text-[11px] line-clamp-2">{finishingCommitment.description}</p>
              </div>

              {/* Counterparty being rated */}
              <div className="mb-4 p-3.5 bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-purple-50/40 rounded-xl border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {otherParty.avatar ? (
                    <img src={otherParty.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-2xs" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                      {otherParty.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Rating Counterparty</div>
                    <div className="font-bold text-slate-900 text-sm">{otherParty.name}</div>
                    <div className="text-[11px] text-slate-500">{otherParty.role}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                  Fulfillment Verified
                </span>
              </div>

              <form onSubmit={handleConfirmFinishAndRate} className="space-y-4 text-xs">
                {/* 1-5 Star Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Performance Rating *</span>
                    <span className="text-amber-600 font-bold font-mono">
                      {finishStarRating} of 5 Stars
                    </span>
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFinishStarRating(star)}
                        className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= finishStarRating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fulfillment Score (100% or 50%) */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Attested Fulfillment Honor</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFinishRatingPercent(100);
                        setFinishRatingBadge('100% Exemplary Good Faith Handover');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        finishRatingPercent === 100
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs">100% Full Honor</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Delivered fully to satisfaction & on-time.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFinishRatingPercent(50);
                        setFinishRatingBadge('50% Partial / Settled with Minor Caveats');
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        finishRatingPercent === 50
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 text-amber-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs">50% Partial Settle</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Completed with accepted delays or caveats.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Rating Badge Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Good Faith Endorsement Badge</label>
                  <select
                    value={finishRatingBadge}
                    onChange={(e) => setFinishRatingBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="100% Exemplary Good Faith Handover">100% Exemplary Good Faith Handover</option>
                    <option value="100% Flawless Honor Pledged">100% Flawless Honor Pledged</option>
                    <option value="Prompt On-Time Delivery">Prompt On-Time Delivery</option>
                    <option value="Exemplary Work Quality">Exemplary Work Quality</option>
                    <option value="50% Partial / Settled with Minor Caveats">50% Partial / Settled with Minor Caveats</option>
                    <option value="Default Averted / Remedial Fulfilled">Default Averted / Remedial Fulfilled</option>
                  </select>
                </div>

                {/* Review Note / Comment */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Review Note & Feedback for {otherParty.name} (Optional)</label>
                  <textarea
                    rows={3}
                    value={finishComment}
                    onChange={(e) => setFinishComment(e.target.value)}
                    placeholder={`Describe ${otherParty.name}'s fulfillment, punctuality, and handover condition. This public feedback will be recorded on their verified profile ledger.`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFinishingCommitment(null)}
                    className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFinish}
                    className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmittingFinish ? 'Marking Finished...' : 'Confirm Finished & Submit Rating'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Change / Reassign Counterparty Modal */}
      {editingCommitment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Change Counterparty</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCommitment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Commitment:</span>
              <span className="font-bold text-slate-900 block truncate">{editingCommitment.title}</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">
                Current Counterparty: <strong>{editingCommitment.creatorRole === 'promisor' ? editingCommitment.requesterName : editingCommitment.committerName}</strong>
              </span>
            </div>

            <form onSubmit={handleUpdateCommitmentCounterparty} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Search & Select New Counterparty</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={editCounterpartySearch}
                    onChange={(e) => setEditCounterpartySearch(e.target.value)}
                    placeholder="Search people by name, @username, or role..."
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-xs text-slate-900"
                    autoFocus
                  />
                  {editCounterpartySearch && (
                    <button
                      type="button"
                      onClick={() => setEditCounterpartySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Selected preview */}
              {editSelectedUser && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center text-xs">
                      {editSelectedUser.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{editSelectedUser.fullName}</div>
                      {editSelectedUser.username && (
                        <div className="text-[10px] text-slate-500">@{editSelectedUser.username}</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditSelectedUser(null)}
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
                    if (u.id === currentUser?.id) return false;
                    if (!editCounterpartySearch.trim()) return true;
                    const q = editCounterpartySearch.toLowerCase();
                    return u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                  })
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setEditSelectedUser(u);
                        setEditExternalName('');
                      }}
                      className={`w-full p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                        editSelectedUser?.id === u.id ? 'bg-indigo-50 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <span className="truncate block">{u.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold px-2 py-0.5 rounded bg-indigo-50">
                        {editSelectedUser?.id === u.id ? 'Selected' : 'Assign'}
                      </span>
                    </button>
                  ))}

                {/* External person button */}
                <div className="p-2.5 bg-slate-50 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600">Or type custom external counterparty name:</div>
                  <input
                    type="text"
                    value={editExternalName}
                    onChange={(e) => {
                      setEditExternalName(e.target.value);
                      setEditSelectedUser({ id: 'other', fullName: e.target.value });
                    }}
                    placeholder="e.g. Victor Okafor"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCommitment(null)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCounterparty || (!editSelectedUser && !editExternalName.trim())}
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs cursor-pointer"
                >
                  {isUpdatingCounterparty ? 'Updating...' : 'Update Counterparty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
