import React, { useState, useEffect } from 'react';
import { api, setSessionUserId } from './services/api.js';
import {
  User,
  EvidenceItem,
  RelationshipInvite,
  TrustReceipt,
  ProfessionalReference,
  InAppNotification,
  ReputationBreakdown,
  RelationshipCategory,
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
import { PhoneVerificationModal } from './components/PhoneVerificationModal.js';
import { IdentityVerificationModal } from './components/IdentityVerificationModal.js';
import { AuthModal } from './components/AuthModal.js';
import { PeopleSearchModal } from './components/PeopleSearchModal.js';
import { PublicLedgerScreen } from './components/PublicLedgerScreen.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ id: string; username: string; fullName: string; accountType: string; avatarUrl: string }>
  >([]);
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [loading, setLoading] = useState<boolean>(true);

  // Core Data
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [relationships, setRelationships] = useState<RelationshipInvite[]>([]);
  const [receipts, setReceipts] = useState<TrustReceipt[]>([]);
  const [references, setReferences] = useState<ProfessionalReference[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [reputation, setReputation] = useState<ReputationBreakdown | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [showIdentityModal, setShowIdentityModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);

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
        api.getCurrentUser(),
        api.getUsersList(),
      ]);

      setCurrentUser(userRes.user);
      setAvailableUsers(usersListRes.users);

      if (userRes.user) {
        const [eviRes, relRes, recRes, refRes, notifRes, repRes] = await Promise.all([
          api.getEvidence(),
          api.getRelationships(),
          api.getReceipts(),
          api.getReferences(),
          api.getNotifications(),
          api.getReputation(userRes.user.id),
        ]);

        setEvidence(eviRes.evidence);
        setRelationships(relRes.relationships);
        setReceipts(recRes.receipts);
        setReferences(refRes.references);
        setNotifications(notifRes.notifications);
        setReputation(repRes.breakdown);
      }
    } catch (err) {
      console.error('Error refreshing platform data:', err);
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
      await api.signIn('', userId);
      await refreshData();
    } finally {
      setLoading(false);
    }
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

  // Render view router based on currentTab
  const renderContent = () => {
    if (loading && !currentUser) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-500">
          Initializing secure cryptographic trust ledger...
        </div>
      );
    }

    // Dynamic Route 1: Public Profile View (`profile-[username]`)
    if (currentTab.startsWith('profile-')) {
      const username = currentTab.replace('profile-', '');
      return (
        <PublicProfileView
          username={username}
          onNavigateTab={handleSelectTab}
          onBack={handleBack}
        />
      );
    }

    // Dynamic Route 2: Accept Relationship Invite (`invite-[token]`)
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
      case 'landing':
        return (
          <LandingPage
            onGetStarted={() => {
              if (currentUser) handleSelectTab('dashboard');
              else setShowAuthModal(true);
            }}
            onExploreProfile={(username) => handleSelectTab(`profile-${username}`)}
            onNavigateTab={handleSelectTab}
          />
        );

      case 'dashboard':
        return currentUser ? (
          <Dashboard
            user={currentUser}
            evidence={evidence}
            relationships={relationships}
            receipts={receipts}
            references={references}
            notifications={notifications}
            reputation={reputation}
            onNavigateTab={handleSelectTab}
            onOpenPhoneModal={() => setShowPhoneModal(true)}
            onOpenIdentityModal={() => setShowIdentityModal(true)}
            onOpenAddEvidence={() => handleSelectTab('evidence')}
            onOpenInviteModal={() => handleSelectTab('relationships')}
            onOpenNewReceiptModal={() => handleSelectTab('receipts')}
            onOpenPublicLedger={() => handleSelectTab('public-ledger')}
          />
        ) : (
          <div className="py-20 text-center">
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold"
            >
              Sign In to View Dashboard
            </button>
          </div>
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
            onOpenPhoneModal={() => setShowPhoneModal(true)}
            onOpenIdentityModal={() => setShowIdentityModal(true)}
            onBack={handleBack}
          />
        ) : null;

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
        ) : null;

      case 'receipts':
        return currentUser ? (
          <TrustReceiptsView
            user={currentUser}
            receipts={receipts}
            onCreateReceipt={handleCreateReceipt}
            onConfirmReceipt={handleConfirmReceipt}
            onCompleteReceipt={handleCompleteReceipt}
            onDisputeReceipt={handleDisputeReceipt}
            onBack={handleBack}
          />
        ) : null;

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
        ) : null;

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
        ) : null;

      case 'settings':
        return currentUser ? (
          <SettingsView
            user={currentUser}
            onProfileUpdated={(updated) => {
              setCurrentUser(updated);
              refreshData();
            }}
            onBack={handleBack}
          />
        ) : null;

      default:
        return (
          <LandingPage
            onGetStarted={() => handleSelectTab('dashboard')}
            onExploreProfile={(username) => handleSelectTab(`profile-${username}`)}
            onNavigateTab={handleSelectTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navigation
        currentUser={currentUser}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        notifications={notifications}
        onOpenAuth={() => setShowAuthModal(true)}
        onSwitchUser={handleSwitchUser}
        availableUsers={availableUsers}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenPublicLedger={() => handleSelectTab('public-ledger')}
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
        />
      )}

      {showPhoneModal && currentUser && (
        <PhoneVerificationModal
          initialPhone={currentUser.phone}
          onClose={() => setShowPhoneModal(false)}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}

      {showIdentityModal && currentUser && (
        <IdentityVerificationModal
          currentMethod={currentUser.identityMethod}
          onClose={() => setShowIdentityModal(false)}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}
    </div>
  );
}
