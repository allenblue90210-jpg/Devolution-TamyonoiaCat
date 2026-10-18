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
  availableUsers,
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
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('02:00');
  const [rewardPoints, setRewardPoints] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Accepting / Writing Pledge
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [pledgeNote, setPledgeNote] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);

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
    if (availableUsers.length > 0) {
      const otherUser = availableUsers.find((u) => u.id !== currentUser?.id) || availableUsers[0];
      if (otherUser) setTargetCommitterId(otherUser.id);
    }
  }, [availableUsers, currentUser]);

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
        committerId: targetCommitterId,
        deadline: combinedDeadline,
        trustRewardPoints: rewardPoints,
        isPublic: true,
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setOtherCategoryDetails('');
      setActionSuccessMessage('Time-locked commitment request created and broadcasted!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadCommitments();
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create commitment request');
    } finally {
      setSubmitting(false);
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

  const handleCheckoutCommitment = async (id: string) => {
    try {
      const res = await api.checkoutCommitment(id);
      setActionSuccessMessage(
        `Dual checkout confirmed! Dual-signed Trust Receipt ${res.receipt.id} generated and reputation boosted by +${res.pointsAwarded} pts!`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
      await loadCommitments();
      onRefreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to checkout commitment');
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Request Commitment</span>
          </button>
        </div>
      </div>

      {/* Trust Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    </div>
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
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAcceptingId(null)}
                          className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAcceptCommitment(c.id)}
                          disabled={acceptLoading}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs disabled:opacity-50"
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
                        className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
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
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Accept & Write Pledge</span>
                      </button>
                    )}

                    {/* Step 2: User B marks fulfilled */}
                    {c.status === 'active' && isCommitter && (
                      <button
                        onClick={() => handleFulfillCommitment(c.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Handed Over / Fulfilled</span>
                      </button>
                    )}

                    {/* Step 3: User A confirms dual checkout */}
                    {isRequester && (c.status === 'fulfilled_pending_checkout' || c.status === 'active' || c.status === 'overdue') && (
                      <button
                        onClick={() => handleCheckoutCommitment(c.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Dual Checkout & Verify</span>
                      </button>
                    )}

                    {/* Public Profile Link */}
                    <button
                      onClick={() => onSelectTab(`profile-${c.committerId === 'usr_sarah_002' ? 'sarah_adesina' : 'fatimabello'}`)}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 ml-auto"
                    >
                      <span>Public Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
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
                  <h2 className="text-base font-bold text-slate-900">Create Commitment Request</h2>
                  <p className="text-xs text-slate-500">Post a time-locked trust pact with counterparty checkout.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommitment} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Commitment Request Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Return loaner vehicle / Deliver Audi RS5 / Handover server keys"
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

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Committer Counterparty (User B) *
                  </label>
                  <select
                    value={targetCommitterId}
                    onChange={(e) => setTargetCommitterId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                  </input>
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
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
    </div>
  );
};
