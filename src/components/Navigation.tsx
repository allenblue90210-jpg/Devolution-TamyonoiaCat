import React, { useState, useEffect } from 'react';
import { User, InAppNotification } from '../types/trust.js';
import { api } from '../services/api.js';
import {
  LayoutDashboard,
  Clock,
  ShieldCheck,
  Users,
  Receipt,
  Globe,
  Compass,
  Sparkles,
  Bell,
  ChevronDown,
  UserCheck,
  LogOut,
  Check,
  GitBranch,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Download,
  Search,
  User as UserIcon,
  Settings,
  Building2,
  X,
  Bookmark,
  LogIn,
} from 'lucide-react';

interface NavigationProps {
  currentUser: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  notifications: InAppNotification[];
  onOpenAuth: () => void;
  onLogout?: () => void;
  onSwitchUser: (userId: string) => void;
  availableUsers: Array<{ id: string; username: string; fullName: string; accountType: string; avatarUrl: string }>;
  onOpenSearch?: () => void;
  onOpenPublicLedger?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  notifications,
  onOpenAuth,
  onLogout,
  onSwitchUser,
  availableUsers,
  onOpenSearch,
  onOpenPublicLedger,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGitMenu, setShowGitMenu] = useState(false);
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchGitStatus = async () => {
    try {
      const status = await api.getGitStatus();
      setGitStatus(status);
    } catch {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    fetchGitStatus();
    const interval = setInterval(fetchGitStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.syncGitRepo('chore(sync): manual sync from app UI');
      setGitStatus(res);
      setSyncMessage('Repository bidirectional sync completed successfully!');
      setTimeout(() => setSyncMessage(null), 3500);
    } catch (err: any) {
      setSyncMessage(err.message || 'Sync failed');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const handlePullUpdates = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.pullGitRepo();
      setGitStatus(res);
      if (res?.pulledCount && res.pulledCount > 0) {
        setSyncMessage(`Pulled ${res.pulledCount} new commit(s) from GitHub! Reloading app...`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncMessage('Repository is already up to date with GitHub main.');
        setTimeout(() => setSyncMessage(null), 3500);
      }
    } catch (err: any) {
      setSyncMessage(err.message || 'Pull failed');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const [localNotifications, setLocalNotifications] = useState<InAppNotification[]>(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const unreadCount = localNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  const handleNotificationClick = async (n: InAppNotification) => {
    setShowNotifications(false);
    if (!n.isRead) {
      setLocalNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
      try {
        await api.markNotificationRead(n.id);
      } catch (err) {
        console.warn('Failed to mark notification read:', err);
      }
    }
    if (n.link?.includes('evidence') || n.type?.includes('evidence')) onSelectTab('evidence');
    else if (n.link?.includes('relationships') || n.type?.includes('relationship')) onSelectTab('relationships');
    else if (n.link?.includes('receipts') || n.type?.includes('receipt')) onSelectTab('receipts');
    else if (n.link?.includes('commitments') || n.type?.includes('commitment')) onSelectTab('commitments');
    else if (n.link?.includes('reputation') || n.type?.includes('reputation')) onSelectTab('reputation');
    else if (n.link?.includes('remember')) onSelectTab('remember');
    else if (n.link?.includes('business') || n.type?.includes('business')) onSelectTab('business');
    else if (n.link?.includes('public-ledger')) onSelectTab('public-ledger');
    else onSelectTab('dashboard');
  };

  // Complete navigation links with clean, distinct Lucide icons - Remember placed beside Reputation
  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'commitments', label: 'Commitments', icon: Clock },
    { id: 'evidence', label: 'Evidence Center', icon: ShieldCheck },
    { id: 'relationships', label: 'Social Verification', icon: Users },
    { id: 'receipts', label: 'Trust Receipts', icon: Receipt },
    { id: 'public-ledger', label: 'People & Ledger', icon: Globe },
    { id: 'directory', label: 'Directory', icon: Compass },
    { id: 'reputation', label: 'Reputation Engine', icon: Sparkles },
    { id: 'remember', label: 'Remember', icon: Bookmark },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => onSelectTab('landing')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-xs">
              D
            </span>
            <span className="font-extrabold tracking-tight">Devolution</span>
          </button>

          {/* Zone 2: Desktop Horizontal Navigation with Icons on every tab */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-medium text-slate-600">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.id === 'public-ledger') {
                      onOpenPublicLedger?.();
                    } else {
                      onSelectTab(link.id);
                    }
                  }}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-indigo-600 font-bold bg-indigo-50/80 border border-indigo-200/80'
                      : 'text-slate-600 hover:bg-slate-100/80'
                  }`}
                  title={link.label}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Action Icons Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* 1. GitHub Continuous Sync Icon */}
            <div className="relative">
              <button
                onClick={() => setShowGitMenu(!showGitMenu)}
                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer relative"
                title="GitHub Continuous Sync Status"
                aria-label="GitHub Continuous Sync"
              >
                <GitBranch className="w-4 h-4 text-indigo-600" />
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    syncing
                      ? 'bg-amber-500 animate-spin'
                      : gitStatus?.clean === false
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500'
                  }`}
                />
              </button>

              {showGitMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-xl py-3 px-4 z-50 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <GitBranch className="w-4 h-4 text-indigo-600" />
                      <span>GitHub Continuous Sync</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Repository:</span>
                      <a
                        href="https://github.com/allenblue90210-jpg/Devolution-TamyonoiaCat"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-mono"
                      >
                        Devolution-TamyonoiaCat
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Branch:</span>
                      <span className="font-mono text-slate-800">{gitStatus?.branch || 'main'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Latest Commit:</span>
                      <span className="font-mono text-slate-800 truncate max-w-[150px]" title={gitStatus?.lastCommit?.message}>
                        {gitStatus?.lastCommit?.hash || 'HEAD'} - {gitStatus?.lastCommit?.message || 'Latest'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Working Tree:</span>
                      <span className={gitStatus?.clean ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                        {gitStatus?.clean ? 'Clean (All Synced)' : `${gitStatus?.uncommittedCount || 0} change(s) pending`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Auto-Sync:</span>
                      <span className="text-slate-600">Active (polls remote & pushes every 30s)</span>
                    </div>
                  </div>

                  {syncMessage && (
                    <div className="p-2 rounded bg-indigo-50 text-indigo-700 text-[11px] leading-tight">
                      {syncMessage}
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={handleManualSync}
                      disabled={syncing}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                      <span>{syncing ? 'Syncing with GitHub...' : 'Sync & Push to Repo Now'}</span>
                    </button>

                    <button
                      onClick={handlePullUpdates}
                      disabled={syncing}
                      className="w-full py-1.5 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Pull Latest Updates from GitHub</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. World / People & Public Ledger Screen Icon */}
            <button
              onClick={() => onSelectTab('public-ledger')}
              className={`relative px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer group shadow-2xs ${
                currentTab === 'public-ledger'
                  ? 'text-indigo-700 bg-indigo-100 border border-indigo-300'
                  : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80'
              }`}
              title="World Screen: Browse Verified People, Public Commitments & Trust Receipts"
              aria-label="World Screen - Verified People & Public Ledger"
            >
              <Globe className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-bold text-indigo-900">People & Ledger</span>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
            </button>

            {/* 3. Search People Icon */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
              title="Search verified people (Cmd+K / Ctrl+K)"
              aria-label="Search people"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 4. Notifications Icon */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
                  title="Notifications"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                  )}
                </button>

                {showNotifications && (
                  <>
                    {/* Backdrop for easy dismissal */}
                    <div
                      className="fixed inset-0 z-40 bg-slate-900/15 backdrop-blur-[1px] sm:bg-transparent"
                      onClick={() => setShowNotifications(false)}
                    />

                    {/* Notification Dialog / Popover: responsive, guaranteed never cut off */}
                    <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-16 sm:top-full sm:right-0 sm:mt-2 sm:w-96 max-w-lg bg-white rounded-xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[32rem]">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                            title="Close notifications"
                            aria-label="Close notifications"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Notification list with full scrolling */}
                      <div className="overflow-y-auto divide-y divide-slate-100 flex-1 overscroll-contain">
                        {localNotifications.length === 0 ? (
                          <div className="px-4 py-10 text-center text-slate-500 space-y-2">
                            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                              <Bell className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-semibold text-slate-700">No notifications yet</div>
                            <div className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                              Updates on relationships, commitments, and trust receipts will appear here.
                            </div>
                          </div>
                        ) : (
                          localNotifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`px-4 py-3 hover:bg-indigo-50/40 text-xs cursor-pointer transition-colors flex items-start gap-3 ${
                                !n.isRead ? 'bg-indigo-50/60' : 'bg-white'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {!n.isRead ? (
                                  <span className="block w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
                                ) : (
                                  <span className="block w-2 h-2 rounded-full bg-slate-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="font-semibold text-slate-900 leading-snug break-words">
                                  {n.title}
                                </div>
                                <div className="text-slate-600 text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                                  {n.message}
                                </div>
                                <div className="text-slate-400 text-[10px] pt-0.5 font-mono">
                                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
                        <span>{localNotifications.length} total notification{localNotifications.length === 1 ? '' : 's'}</span>
                        <span className="text-[10px] text-slate-400">Click any notification to open</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 5. Active User Profile Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-800 transition-colors cursor-pointer"
                  title="User Profile Menu"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {currentUser.fullName.charAt(0)}
                    </div>
                  )}
                  <span className="hidden sm:inline font-semibold max-w-[110px] truncate">{currentUser.fullName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-slate-200 shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">@{currentUser.username}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{currentUser.identityStatus === 'verified' ? 'Identity Attested' : 'Unverified'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{currentUser.accountType}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSelectTab(`profile-${currentUser.username}`);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>View My Public Profile</span>
                      </button>
                      {currentUser.accountType === 'business' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onSelectTab('business');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Business Entity Dashboard</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSelectTab('settings');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Privacy & Data Settings</span>
                      </button>
                    </div>

                    {/* Switch Demo Profile helper */}
                    <div className="border-t border-slate-100 pt-2 pb-1 px-4">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Switch Active Persona (Sandbox)
                      </div>
                      <div className="space-y-1">
                        {availableUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u.id);
                              setShowUserMenu(false);
                            }}
                            className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                              u.id === currentUser.id
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{u.fullName}</span>
                            {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuth();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Switch Account / Sign In</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg select-none [-webkit-tap-highlight-color:transparent]"
      >
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="text-[10px] text-slate-500 font-normal">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('commitments')}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <Clock className={`w-4 h-4 ${currentTab === 'commitments' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="text-[10px] text-slate-500 font-normal">Pacts</span>
        </button>

        <button
          onClick={() => onSelectTab('receipts')}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <Receipt className={`w-4 h-4 ${currentTab === 'receipts' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="text-[10px] text-slate-500 font-normal">Receipts</span>
        </button>

        <button
          onClick={() => onSelectTab('reputation')}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <ShieldCheck className={`w-4 h-4 ${currentTab === 'reputation' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="text-[10px] text-slate-500 font-normal">Reputation</span>
        </button>
      </nav>
    </>
  );
};
