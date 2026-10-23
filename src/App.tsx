import React, { useState, useEffect } from 'react';
import { api, setSessionUserId, clearSessionUserId } from './services/api.js';
import { ShieldCheck, LogIn } from 'lucide-react';
import {
  User,
  EvidenceItem,
  RelationshipInvite,
  TrustReceipt,
  ProfessionalReference,
  InAppNotification,
  ReputationBreakdown,
  RelationshipCategory,
  UserSummary,
  TrustCommitment,
} from './types/trust.js';
import { Navigation } from './components/Navigation.js';
import { LandingPage } from './components/LandingPage.js';
import { Dashboard } from './components/Dashboard.js';
import { EvidenceCenter } from './components/EvidenceCenter.js';
import { RelationshipsView } from './components/RelationshipsView.js';
import { AcceptInviteView } from './components/AcceptInviteView.js';
import { TrustReceiptsView } from './components/TrustReceiptsView.js';
import { CommitmentsView } from './components/CommitmentsView.js';
import { PublicProfileView } from './components/PublicProfileView.js';
import { ReputationView } from './components/ReputationView.js';
import { RememberView } from './components/RememberView.js';
import { DirectoryView } from './components/DirectoryView.js';
import { BusinessView } from './components/BusinessView.js';
import { SettingsView } from './components/SettingsView.js';
import { AuthModal } from './components/AuthModal.js';
import { PeopleSearchModal } from './components/PeopleSearchModal.js';
import { PublicLedgerScreen } from './components/PublicLedgerScreen.js';
import { AvatarUploadModal } from './components/AvatarUploadModal.js';
import { SupabaseModal } from './components/SupabaseModal.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [loading, setLoading] = useState<boolean>(true);

  // Core Data
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [relationships, setRelationships] = useState<RelationshipInvite[]>([]);
  const [receipts, setReceipts] = useState<TrustReceipt[]>([]);
  const [commitments, setCommitments] = useState<TrustCommitment[]>([]);
  const [references, setReferences] = useState<ProfessionalReference[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [reputation, setReputation] = useState<ReputationBreakdown | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);

  const [tabHistory, setTabHistory] = useState<string[]>([]);

  // Hash Navigation listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentTab((prev) => {
          if (prev !== hash) {
            setTabHistory((hist) => (hist[hist.length - 1] === prev ? hist : [...hist, prev]));
          }
          return hash;
        });
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global Cmd+K / Ctrl+K listener for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectTab = (tab: string) => {
    if (tab !== currentTab) {
      setTabHistory((prev) => (prev[prev.length - 1] === currentTab ? prev : [...prev, currentTab]));
    }
    setCurrentTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory((prev) => prev.slice(0, -1));
      setCurrentTab(prevTab);
      window.location.hash = prevTab;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const fallback = currentUser ? 'dashboard' : 'landing';
      setCurrentTab(fallback);
      window.location.hash = fallback;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Initial Data Load
  const refreshData = async () => {
    try {
      const [userRes, usersListRes] = await Promise.all([
        api.getCurrentUser().catch((err) => {
          console.warn('Notice loading current user profile:', err.message);
          return { user: null };
        }),
        api.getUsersList().catch((err) => {
          console.warn('Notice loading users list:', err.message);
          return { users: [] };
        }),
      ]);

      if (userRes && userRes.user) {
        setCurrentUser(userRes.user);
      }
      if (usersListRes && usersListRes.users) {
        setAvailableUsers(usersListRes.users);
      }

      const activeUserId = userRes?.user?.id || currentUser?.id;
      if (activeUserId) {
        const [eviRes, relRes, recRes, refRes, notifRes, repRes, cmtRes] = await Promise.all([
          api.getEvidence().catch(() => ({ evidence: [] })),
          api.getRelationships().catch(() => ({ relationships: [] })),
          api.getReceipts('all').catch(() => ({ receipts: [] })),
          api.getReferences().catch(() => ({ references: [] })),
          api.getNotifications().catch(() => ({ notifications: [] })),
          api.getReputation(activeUserId).catch(() => ({ breakdown: null })),
          api.getCommitments('all').catch(() => ({ commitments: [] })),
        ]);

        if (eviRes?.evidence) setEvidence(eviRes.evidence);
        if (relRes?.relationships) setRelationships(relRes.relationships);
        if (recRes?.receipts) setReceipts(recRes.receipts);
        if (refRes?.references) setReferences(refRes.references);
        if (notifRes?.notifications) setNotifications(notifRes.notifications);
        if (repRes?.breakdown) setReputation(repRes.breakdown);
        if (cmtRes?.commitments) setCommitments(cmtRes.commitments);
      }
    } catch (err) {
      console.warn('Notice refreshing platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSwitchUser = async (userId: string) => {
    setLoading(true);
    try {
      setSessionUserId(userId);
      await api.switchUser(userId);
      await refreshData();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.logout();
    } catch {
      clearSessionUserId();
    }
    setCurrentUser(null);
    setEvidence([]);
    setRelationships([]);
    setReceipts([]);
    setCommitments([]);
    setReferences([]);
    setNotifications([]);
    setReputation(null);
    handleSelectTab('landing');
    setLoading(false);
  };

  // Evidence Actions
  const handleAddEvidence = async (data: Partial<EvidenceItem>) => {
    const res = await api.addEvidence(data);
    setEvidence((prev) => [res.item, ...prev]);
    refreshData();
  };

  const handleToggleEvidenceVisibility = async (id: string, currentPublic: boolean) => {
    const res = await api.updateEvidence(id, { isPublic: !currentPublic });
    setEvidence((prev) => prev.map((e) => (e.id === id ? res.item : e)));
  };

  const handleDeleteEvidence = async (id: string) => {
    await api.deleteEvidence(id);
    setEvidence((prev) => prev.filter((e) => e.id !== id));
    refreshData();
  };

  // Relationship Actions
  const handleInviteContact = async (data: {
    recipientName: string;
    recipientContact: string;
    relationshipCategory: RelationshipCategory;
    personalNote?: string;
  }) => {
    const res = await api.inviteRelationship(data);
    setRelationships((prev) => [res.invite, ...prev]);
    return { inviteUrl: res.inviteUrl };
  };

  const handleDeleteRelationship = async (id: string) => {
    await api.deleteRelationship(id);
    setRelationships((prev) => prev.filter((r) => r.id !== id));
    refreshData();
  };

  // Trust Receipt Actions
  const handleCreateReceipt = async (data: Partial<TrustReceipt>) => {
    const res = await api.createReceipt(data);
    setReceipts((prev) => [res.receipt, ...prev]);
    refreshData();
  };

  const handleConfirmReceipt = async (id: string) => {
    const res = await api.confirmReceipt(id);
    setReceipts((prev) => prev.map((r) => (r.id === id ? res.receipt : r)));
    refreshData();
  };

  const handleCompleteReceipt = async (id: string) => {
    const res = await api.completeReceipt(id);
    setReceipts((prev) => prev.map((r) => (r.id === id ? res.receipt : r)));
    refreshData();
  };

  const handleDisputeReceipt = async (id: string, reason: string, description: string) => {
    const res = await api.disputeReceipt(id, reason, description);
    setReceipts((prev) => prev.map((r) => (r.id === id ? res.receipt : r)));
    refreshData();
  };

  const renderSignInPrompt = (tabName: string, description: string) => (
    <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900">Sign in to access {tabName}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={() => setShowAuthModal(true)}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In / Select Profile</span>
        </button>
        <button
          onClick={() => handleSelectTab('public-ledger')}
          className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
        >
          Browse Public Ledger as Guest
        </button>
      </div>
    </div>
  );

  // Render view router based on currentTab
  const renderContent = () => {
    // Check for profile route: profile or dynamic profile-{username}
    if (currentTab === 'profile' || currentTab.startsWith('profile-')) {
      const username = currentTab.startsWith('profile-')
        ? currentTab.replace('profile-', '')
        : (currentUser?.username || 'allenkinetic006');
      return (
        <PublicProfileView
          key={username}
          username={username}
          currentUser={currentUser}
          onNavigateTab={handleSelectTab}
          onBack={handleBack}
          onOpenAvatarUpload={() => setShowAvatarModal(true)}
        />
      );
    }

    if (loading && !currentUser && currentTab !== 'landing' && currentTab !== 'public-ledger' && currentTab !== 'directory') {
      return (
        <div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-500">
          Initializing secure cryptographic trust ledger...
        </div>
      );
    }

    // Check for dynamic invitation acceptance route: invite-{token}
    if (currentTab.startsWith('invite-')) {
      const token = currentTab.replace('invite-', '');
      return (
        <AcceptInviteView
          token={token}
          onBack={handleBack}
          onCompleted={() => {
            refreshData();
            handleSelectTab('relationships');
          }}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return currentUser ? (
          <Dashboard
            user={currentUser}
            evidence={evidence}
            relationships={relationships}
            receipts={receipts}
            commitments={commitments}
            references={references}
            notifications={notifications}
            reputation={reputation}
            onNavigateTab={handleSelectTab}
            onOpenAddEvidence={() => handleSelectTab('evidence')}
            onOpenInviteModal={() => handleSelectTab('relationships')}
            onOpenNewReceiptModal={() => handleSelectTab('receipts')}
            onOpenPublicLedger={() => handleSelectTab('public-ledger')}
            onOpenAvatarUpload={() => setShowAvatarModal(true)}
            onOpenSearch={() => setShowSearchModal(true)}
            onRefreshData={refreshData}
          />
        ) : (
          <LandingPage
            onGetStarted={() => setShowAuthModal(true)}
            onExploreProfile={(username) => handleSelectTab(`profile-${username}`)}
            onNavigateTab={handleSelectTab}
          />
        );

      case 'commitments':
        return (
          <CommitmentsView
            currentUser={currentUser}
            onSelectTab={handleSelectTab}
            availableUsers={availableUsers}
            onRefreshAllData={refreshData}
            onBack={handleBack}
          />
        );

      case 'evidence':
        return currentUser ? (
          <EvidenceCenter
            user={currentUser}
            evidence={evidence}
            onAddEvidence={handleAddEvidence}
            onToggleVisibility={handleToggleEvidenceVisibility}
            onDeleteEvidence={handleDeleteEvidence}
            onBack={handleBack}
          />
        ) : (
          renderSignInPrompt('Evidence Center', 'Manage cryptographic document attestations and registry credentials.')
        );

      case 'relationships':
        return currentUser ? (
          <RelationshipsView
            user={currentUser}
            relationships={relationships}
            onInviteContact={handleInviteContact}
            onDeleteRelationship={handleDeleteRelationship}
            onOpenInviteFlow={(token) => handleSelectTab(`invite-${token}`)}
            onBack={handleBack}
          />
        ) : (
          renderSignInPrompt('Social Verification', 'Confirm real-world professional relationships and counterparty endorsements.')
        );

      case 'receipts':
        return currentUser ? (
          <TrustReceiptsView
            user={currentUser}
            receipts={receipts}
            availableUsers={availableUsers}
            onRefreshAllData={refreshData}
            onCreateReceipt={handleCreateReceipt}
            onConfirmReceipt={handleConfirmReceipt}
            onCompleteReceipt={handleCompleteReceipt}
            onDisputeReceipt={handleDisputeReceipt}
            onBack={handleBack}
          />
        ) : (
          renderSignInPrompt('Trust Receipts', 'Issue and verify dual-signed transaction settlements on the ledger.')
        );

      case 'directory':
        return (
          <DirectoryView
            onSelectProfile={(username) => handleSelectTab(`profile-${username}`)}
            onBack={handleBack}
          />
        );

      case 'public-ledger':
        return (
          <PublicLedgerScreen
            currentUser={currentUser}
            onSelectProfile={(username) => handleSelectTab(`profile-${username}`)}
            availableUsers={availableUsers}
            onRefreshData={refreshData}
            onBack={handleBack}
          />
        );

      case 'reputation':
        return currentUser ? (
          <ReputationView
            user={currentUser}
            reputation={reputation}
            onBack={handleBack}
            onNavigateTab={handleSelectTab}
          />
        ) : (
          renderSignInPrompt('Reputation Engine', 'Inspect your weighted trust score breakdown, honesty index, and decay metrics.')
        );

      case 'remember':
        return (
          <RememberView
            currentUser={currentUser}
            availableUsers={availableUsers}
            onBack={handleBack}
            onNavigateTab={handleSelectTab}
            onSelectProfile={(username) => handleSelectTab(`profile-${username}`)}
          />
        );

      case 'business':
        return currentUser ? (
          <BusinessView
            user={currentUser}
            onNavigateTab={handleSelectTab}
            onBack={handleBack}
          />
        ) : (
          renderSignInPrompt('Business Entity Dashboard', 'Access corporate entity verification and organizational records.')
        );

      case 'settings':
        return currentUser ? (
          <SettingsView
            user={currentUser}
            onProfileUpdated={(updated) => {
              setCurrentUser(updated);
              refreshData();
            }}
            onBack={handleBack}
            onOpenAvatarUpload={() => setShowAvatarModal(true)}
          />
        ) : (
          renderSignInPrompt('Settings', 'Configure privacy thresholds, profile attributes, and verification options.')
        );

      default:
        return (
          <LandingPage
            onGetStarted={() => (currentUser ? handleSelectTab('dashboard') : setShowAuthModal(true))}
            onExploreProfile={(username) => handleSelectTab(`profile-${username}`)}
            onNavigateTab={handleSelectTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      <Navigation
        currentUser={currentUser}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        notifications={notifications}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        availableUsers={availableUsers}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenPublicLedger={() => handleSelectTab('public-ledger')}
        onOpenAvatarUpload={() => setShowAvatarModal(true)}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
      />

      <main className="flex-1 pb-16">{renderContent()}</main>

      {/* Modals */}

      <PeopleSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectUser={(username) => handleSelectTab(`profile-${username}`)}
      />

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => {
            setCurrentUser(u);
            refreshData();
            handleSelectTab('dashboard');
          }}
          availableUsers={availableUsers}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {showAvatarModal && currentUser && (
        <AvatarUploadModal
          user={currentUser}
          onClose={() => setShowAvatarModal(false)}
          onSuccess={(updated) => {
            setCurrentUser(updated);
            refreshData();
          }}
        />
      )}

      {showSupabaseModal && (
        <SupabaseModal
          onClose={() => setShowSupabaseModal(false)}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}
    </div>
  );
}
