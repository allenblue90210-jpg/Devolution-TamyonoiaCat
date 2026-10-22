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
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Building2,
  Users,
  Sparkles,
  Filter,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  Compass,
  MapPin,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

interface PublicLedgerScreenProps {
  currentUser: User | null;
  onSelectProfile: (username: string) => void;
  availableUsers: Array<{ id: string; username: string; fullName: string; accountType: string; avatarUrl: string }>;
  onRefreshData?: () => void;
  onBack?: () => void;
}

export const PublicLedgerScreen: React.FC<PublicLedgerScreenProps> = ({
  currentUser,
  onSelectProfile,
  availableUsers,
  onRefreshData,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'people' | 'commitments' | 'receipts' | 'overview'>('people');
  const [people, setPeople] = useState<any[]>([]);
  const [commitments, setCommitments] = useState<TrustCommitment[]>([]);
  const [receipts, setReceipts] = useState<TrustReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-filters
  const [commitmentFilter, setCommitmentFilter] = useState<'all' | 'public' | 'from_people' | 'by_me'>('all');
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'public' | 'private' | 'from_people' | 'by_me'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Post Commitment modal state
  const [showPostCommitment, setShowPostCommitment] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postCategory, setPostCategory] = useState<CommitmentCategory>('Vehicle & Transportation');
  const [postOtherCategoryDetails, setPostOtherCategoryDetails] = useState('');
  const [postCommitterId, setPostCommitterId] = useState('');
  const [postExternalCommitterName, setPostExternalCommitterName] = useState('');
  const [postDeadlineDate, setPostDeadlineDate] = useState('');
  const [postDeadlineTime, setPostDeadlineTime] = useState('02:00');
  const [postRewardPoints, setPostRewardPoints] = useState(25);
  const [postIsPublic, setPostIsPublic] = useState(true);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Issue Trust Receipt modal state
  const [showPostReceipt, setShowPostReceipt] = useState(false);
  const [recCounterpartyName, setRecCounterpartyName] = useState('');
  const [recCounterpartyContact, setRecCounterpartyContact] = useState('');
  const [recCategory, setRecCategory] = useState<TrustReceipt['interactionCategory']>('Freelance Project');
  const [recOtherCategoryDetails, setRecOtherCategoryDetails] = useState('');
  const [recTitle, setRecTitle] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recValue, setRecValue] = useState('');
  const [recConditions, setRecConditions] = useState('');
  const [recIsPublic, setRecIsPublic] = useState(true);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  // Live countdown timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch People, Commitments, and Receipts
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profilesRes, comRes, myComRes, recRes, myRecRes] = await Promise.all([
        api.getProfiles({ q: '' }),
        api.getPublicCommitments(),
        currentUser ? api.getCommitments('mine') : Promise.resolve({ commitments: [] }),
        api.getPublicReceipts(),
        currentUser ? api.getReceipts() : Promise.resolve({ receipts: [] }),
      ]);

      setPeople(profilesRes.profiles || []);

      // Deduplicate commitments
      const comMap = new Map<string, TrustCommitment>();
      (comRes.commitments || []).forEach((c) => comMap.set(c.id, c));
      (myComRes.commitments || []).forEach((c) => comMap.set(c.id, c));
      setCommitments(Array.from(comMap.values()));

      // Deduplicate receipts (public + user's private receipts)
      const recMap = new Map<string, TrustReceipt>();
      (recRes.receipts || []).forEach((r) => recMap.set(r.id, r));
      (myRecRes.receipts || []).forEach((r) => recMap.set(r.id, r));
      setReceipts(Array.from(recMap.values()));
    } catch (err) {
      console.error('Failed to load public ledger screen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

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
        otherCategoryDetails: postCategory === 'Other' ? postOtherCategoryDetails : undefined,
        committerId: postCommitterId === 'other' ? undefined : (postCommitterId || (availableUsers.find((u) => u.id !== currentUser.id)?.id || '')),
        committerName: postCommitterId === 'other' ? (postExternalCommitterName || 'External Counterparty') : undefined,
        deadline: combinedDeadline,
        trustRewardPoints: postRewardPoints,
        isPublic: postIsPublic,
      });

      setShowPostCommitment(false);
      setPostTitle('');
      setPostDescription('');
      setPostOtherCategoryDetails('');
      setPostExternalCommitterName('');
      setToastMessage(
        postIsPublic
          ? 'Public commitment posted and broadcasted to the public ledger!'
          : 'Private commitment recorded between you and the counterparty.'
      );
      setTimeout(() => setToastMessage(null), 4500);
      await loadAllData();
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
        otherCategoryDetails: recCategory === 'Other' ? recOtherCategoryDetails : undefined,
        title: recTitle,
        description: recDescription,
        transactionValue: recValue || undefined,
        completionConditions: recConditions,
        isPublic: recIsPublic,
      });

      setShowPostReceipt(false);
      setRecCounterpartyName('');
      setRecCounterpartyContact('');
      setRecOtherCategoryDetails('');
      setRecTitle('');
      setRecDescription('');
      setRecConditions('');
      setToastMessage(
        `Trust receipt generated as ${recIsPublic ? 'PUBLIC (Open Ledger)' : 'PRIVATE (Confidential Bilateral)'}!`
      );
      setTimeout(() => setToastMessage(null), 4500);
      await loadAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to create trust receipt');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  // Toggle Visibility for Receipts
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

  // Toggle Visibility for Commitments
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

  // Record Public Impression / Witness
  const handleRecordImpression = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.recordCommitmentImpression(id, 'witness');
      setCommitments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...res.commitment, hasWitnessed: true } : c))
      );
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 3500);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Failed to record impression:', err);
    }
  };

  // Countdown Helper
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

  // Filter People
  const filteredPeople = people.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.headline && p.headline.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter Commitments
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

    return matchesSearch && matchesCategory && matchesSub;
  });

  // Filter Receipts
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

    return matchesSearch && matchesCategory && matchesSub;
  });

  const publicReceiptsCount = receipts.filter((r) => r.isPublic).length;
  const privateReceiptsCount = receipts.filter((r) => !r.isPublic).length;
  const publicCommitmentsCount = commitments.filter((c) => c.isPublic).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Screen Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <Globe className="w-5 h-5 text-indigo-600" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Public Evidentiary Ledger & Network Screen
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Network
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Verified People, Public Commitments & Trust Receipts
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Explore verified members across the trust network, monitor and post public commitments, or inspect bilateral trust receipts. Note: trust receipts support both <strong>Public</strong> (attested on open ledger) and <strong>Private</strong> (confidential between counterparties) records.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowPostCommitment(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Public Commitment</span>
            </button>
            <button
              onClick={() => setShowPostReceipt(true)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-slate-500" />
              <span>Issue Trust Receipt</span>
            </button>
          </div>
        </div>

        {/* Protocol Notice Banner: Public vs Private Trust Receipts */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-emerald-50/80 border border-indigo-100 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Notice on Trust Receipts & Commitments: Public vs. Private</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {people.length} Verified People · {publicCommitmentsCount} Public Commitments · {publicReceiptsCount} Public Receipts · {privateReceiptsCount} Private Receipts
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-white/95 rounded-lg border border-emerald-200/90 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Public Trust Receipts (Open Ledger)</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Openly attested on the public ledger. Anyone verifying a person or company can inspect verified completed engagements, transaction milestones, and satisfaction conditions.
              </p>
            </div>
            <div className="p-3 bg-white/95 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Private Trust Receipts (Bilateral / Confidential)</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Dual-signed and binding between you and your counterparty, but concealed from the public directory. Useful for confidential corporate contracts, NDAs, or sensitive client settlements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('people')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'people'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>People in Network</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
              {filteredPeople.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('commitments')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'commitments'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Public Commitments</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
              {filteredCommitments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'receipts'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Trust Receipts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
              {filteredReceipts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Network Feed Overview</span>
          </button>
        </div>

        {/* Global Search and Category Filter within this screen */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, pacts, or receipts..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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
            <option value="Other">Other (Custom Pacts & Receipts)</option>
          </select>
        </div>
      </div>

      {/* Screen Body Content */}
      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400 space-y-2">
          <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div>Loading verified people, commitments, and receipts from network...</div>
        </div>
      ) : activeTab === 'people' ? (
        /* =========================================================================
           TAB 1: PEOPLE IN THE NETWORK
           ========================================================================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Showing {filteredPeople.length} verified person{filteredPeople.length === 1 ? '' : 's'} across network
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Identity attested via authoritative registry queries
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={person.fullName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base border border-indigo-100">
                        {person.fullName.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{person.fullName}</h3>
                        {person.identityStatus === 'verified' && (
                          <span title="Verified Identity" className="inline-flex">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">@{person.username}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {person.city}, {person.country}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {person.headline || 'Independent verified professional on the Devolution Network.'}
                  </p>

                  {/* Verification & Metrics Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                      {person.category || 'General'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {person.confirmedRelationshipsCount || 0} relationships
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                      {person.completedReceiptsCount || 0} receipts
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onSelectProfile(person.username)}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>View Public Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'commitments' ? (
        /* =========================================================================
           TAB 2: PUBLIC COMMITMENTS
           ========================================================================= */
        <div className="space-y-4">
          {/* Sub-filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider mr-1 text-[11px]">Filter:</span>
              <button
                onClick={() => setCommitmentFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  commitmentFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({commitments.length})
              </button>
              <button
                onClick={() => setCommitmentFilter('public')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  commitmentFilter === 'public'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public Commitments Only ({publicCommitmentsCount})</span>
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={() => setCommitmentFilter('from_people')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      commitmentFilter === 'from_people'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    From People to Us
                  </button>
                  <button
                    onClick={() => setCommitmentFilter('by_me')}
                    className={`px-3 py-1 rounded-md transition-colors ${
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

            <button
              onClick={() => setShowPostCommitment(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post New Commitment</span>
            </button>
          </div>

          <div className="space-y-4">
            {filteredCommitments.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-white rounded-xl border border-slate-200 p-8">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-800">No commitments match your filter</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Post a public commitment now to broadcast it to the network!
                </p>
                <button
                  onClick={() => setShowPostCommitment(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-2xs cursor-pointer"
                >
                  Post a Public Commitment
                </button>
              </div>
            ) : (
              filteredCommitments.map((commitment) => {
                const countdown = getCountdown(commitment.deadline, commitment.status);
                return (
                  <div
                    key={commitment.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            commitment.category === 'Other'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {commitment.category === 'Other' && commitment.otherCategoryDetails
                              ? `Other: ${commitment.otherCategoryDetails}`
                              : commitment.category}
                          </span>
                          {commitment.isPublic ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Globe className="w-3 h-3 text-emerald-600" />
                              <span>Public Commitment (Open Ledger)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-600" />
                              <span>Private Commitment (Bilateral)</span>
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-400">#{commitment.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            (commitment.ratingPercent ?? 100) === 100
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}>
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{commitment.ratingPercent ?? 100}% Rating</span>
                          </span>
                          {commitment.isPublic ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                              <Eye className="w-3 h-3 text-purple-600" />
                              <span>{(commitment.impressions ?? 1420).toLocaleString()} impressions</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                              Private
                            </span>
                          )}
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

                    {/* Public Impressions & Observer Witness Row */}
                    {commitment.isPublic && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs">
                        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800" title="Total public impressions on open ledger">
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{(commitment.impressions ?? 1420).toLocaleString()} impressions</span>
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-1 text-slate-600" title="Network observers witnessing this pact">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>{commitment.witnessCount ?? 24} witnesses</span>
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{commitment.positiveImpressions ?? 18} credible</span>
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleRecordImpression(commitment.id, e)}
                          disabled={commitment.hasWitnessed}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                            commitment.hasWitnessed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                              : 'bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 hover:border-indigo-600 shadow-2xs'
                          }`}
                          title={commitment.hasWitnessed ? 'You have witnessed this public pact' : 'Witness this public pact (+1 Impression)'}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{commitment.hasWitnessed ? 'Witnessed ✓' : 'Witness Pact (+1 Impression)'}</span>
                        </button>
                      </div>
                    )}

                    {/* Status & Privacy Toggle Action */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
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

                      {currentUser &&
                        (commitment.requesterId === currentUser.id || commitment.committerId === currentUser.id) && (
                          <button
                            onClick={() => handleToggleCommitmentPrivacy(commitment.id, commitment.isPublic)}
                            className="px-2.5 py-1 rounded text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
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
        </div>
      ) : activeTab === 'receipts' ? (
        /* =========================================================================
           TAB 3: TRUST RECEIPTS (PUBLIC & PRIVATE)
           ========================================================================= */
        <div className="space-y-4">
          {/* Sub-filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider mr-1 text-[11px]">Type:</span>
              <button
                onClick={() => setReceiptFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  receiptFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({receipts.length})
              </button>
              <button
                onClick={() => setReceiptFilter('public')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  receiptFilter === 'public'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public Receipts ({publicReceiptsCount})</span>
              </button>
              <button
                onClick={() => setReceiptFilter('private')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  receiptFilter === 'private'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Private Receipts ({privateReceiptsCount})</span>
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={() => setReceiptFilter('from_people')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      receiptFilter === 'from_people'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    From People to Us
                  </button>
                  <button
                    onClick={() => setReceiptFilter('by_me')}
                    className={`px-3 py-1 rounded-md transition-colors ${
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

            <button
              onClick={() => setShowPostReceipt(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Issue New Trust Receipt</span>
            </button>
          </div>

          <div className="space-y-4">
            {filteredReceipts.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-white rounded-xl border border-slate-200 p-8">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-800">No trust receipts match your filter</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Issue a trust receipt to document completed engagements with bilateral sign-offs!
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
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          receipt.interactionCategory === 'Other'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {receipt.interactionCategory === 'Other' && receipt.otherCategoryDetails
                            ? `Other: ${receipt.otherCategoryDetails}`
                            : receipt.interactionCategory}
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
                        onClick={() => onSelectProfile(receipt.creatorName.toLowerCase().replace(/\s+/g, ''))}
                        className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {receipt.creatorName}
                      </button>
                    </div>
                    <div>
                      <span className="text-slate-400">Counterparty:</span>{' '}
                      <button
                        onClick={() => onSelectProfile(receipt.counterpartyName.toLowerCase().replace(/\s+/g, ''))}
                        className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {receipt.counterpartyName}
                      </button>
                    </div>
                  </div>

                  {/* Conditions of Satisfaction */}
                  {receipt.completionConditions && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <div className="font-semibold text-slate-900 mb-0.5">Conditions of Satisfaction:</div>
                      <p className="text-slate-600 leading-relaxed">{receipt.completionConditions}</p>
                    </div>
                  )}

                  {/* Dual-Signature History */}
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

                  {/* Owner Privacy Toggle */}
                  {currentUser &&
                    (receipt.creatorId === currentUser.id ||
                      receipt.counterpartyUserId === currentUser.id) && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[11px] text-slate-500">
                          You are a party on this receipt. Change visibility anytime:
                        </span>
                        <button
                          onClick={() => handleToggleReceiptPrivacy(receipt.id, receipt.isPublic)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
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
        </div>
      ) : (
        /* =========================================================================
           TAB 4: NETWORK FEED OVERVIEW
           ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Top Verified People */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Verified People</span>
              </div>
              <button
                onClick={() => setActiveTab('people')}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                View all ({people.length})
              </button>
            </div>

            <div className="space-y-3">
              {people.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProfile(p.username)}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.fullName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {p.fullName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        <span>{p.fullName}</span>
                        {p.identityStatus === 'verified' && (
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">@{p.username}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Latest Commitments */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Active Commitments</span>
              </div>
              <button
                onClick={() => setActiveTab('commitments')}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                View all ({commitments.length})
              </button>
            </div>

            <div className="space-y-3">
              {commitments.slice(0, 4).map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[180px]">{c.title}</span>
                    {c.isPublic ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                        Public
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-semibold border border-slate-200">
                        Private
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Committed by: <strong>{c.committerName}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Recent Trust Receipts */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Recent Trust Receipts</span>
              </div>
              <button
                onClick={() => setActiveTab('receipts')}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                View all ({receipts.length})
              </button>
            </div>

            <div className="space-y-3">
              {receipts.slice(0, 4).map((r) => (
                <div key={r.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">{r.title}</span>
                    {r.isPublic ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                        Public
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-semibold border border-slate-200">
                        Private
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>With: <strong>{r.counterpartyName}</strong></span>
                    {r.transactionValue && <span className="font-mono text-emerald-800 font-bold">{r.transactionValue}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post Public Commitment */}
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
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
                  <option value="Personal Promise">Personal Promise</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {postCategory === 'Other' && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-1 animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Specify "Other" Commitment Type / Pact *
                  </label>
                  <input
                    type="text"
                    required
                    value={postOtherCategoryDetails}
                    onChange={(e) => setPostOtherCategoryDetails(e.target.value)}
                    placeholder="e.g. Rare Artifact Custody, Temporary Office Key Return, Pet Care Escrow..."
                    className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg bg-white"
                  />
                  <p className="text-[11px] text-purple-700">
                    Defines custom classification for this time-locked commitment pact.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Counterparty / Beneficiary
                </label>
                <select
                  value={postCommitterId}
                  onChange={(e) => setPostCommitterId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="">Select network person</option>
                  {availableUsers
                    .filter((u) => u.id !== currentUser?.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (@{u.username})
                      </option>
                    ))}
                  <option value="other">Other (External Person / Contact)</option>
                </select>
              </div>

              {postCommitterId === 'other' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-1 animate-in fade-in duration-150">
                  <label className="block text-indigo-950 font-semibold mb-1 text-xs">
                    Counterparty Full Name & Contact Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={postExternalCommitterName}
                    onChange={(e) => setPostExternalCommitterName(e.target.value)}
                    placeholder="e.g. Samuel Adekunle (samuel@example.com / +234 802 000 1122)"
                    className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white focus:outline-hidden"
                  />
                  <p className="text-[11px] text-indigo-700">
                    Specify the external counterparty for this commitment pact.
                  </p>
                </div>
              )}

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
                      ? 'Visible to everyone on the public commitments feed. Demonstrates credibility.'
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

      {/* Modal: Issue Trust Receipt */}
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
                  placeholder="e.g. Delivery of Industrial Equipment & Complete Sign-off"
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
                    placeholder="e.g. Lola or Counterparty Name"
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
                    <option value="Other">Other</option>
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

              {recCategory === 'Other' && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-1 animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Specify "Other" Receipt Category / Transaction Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={recOtherCategoryDetails}
                    onChange={(e) => setRecOtherCategoryDetails(e.target.value)}
                    placeholder="e.g. Intellectual Property License, Custody Transfer, Art Commission..."
                    className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg bg-white"
                  />
                  <p className="text-[11px] text-purple-700">
                    Defines custom classification for this bilateral trust receipt.
                  </p>
                </div>
              )}

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
