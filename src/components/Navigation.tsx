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
  Shield,
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
  Database,
  Camera,
} from 'lucide-react';
import tanmiLogo from '../assets/images/tanmi.png';
import { UserAvatar } from './UserAvatar.js';

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
  onOpenAvatarUpload?: () => void;
  onOpenSupabaseModal?: () => void;
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
  onOpenAvatarUpload,
  onOpenSupabaseModal,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGitMenu, setShowGitMenu] = useState(false);
  const [showSupabaseMenu, setShowSupabaseMenu] = useState(false);
  const [showMoreNav, setShowMoreNav] = useState(false);
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
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

  const fetchSupabaseStatus = async () => {
    try {
      const status = await api.getSupabaseStatus();
      setSupabaseStatus(status);
    } catch {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    fetchGitStatus();
    fetchSupabaseStatus();
    const interval = setInterval(() => {
      fetchGitStatus();
      fetchSupabaseStatus();
    }, 20000);
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

  // Clean, prioritized primary navigation links
  const primaryNavLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'commitments', label: 'Commitments', icon: Clock },
    { id: 'relationships', label: 'Verification', icon: Users },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'public-ledger', label: 'Ledger', icon: Globe },
  ];

  const moreNavLinks = [
    { id: 'evidence', label: 'Evidence', icon: ShieldCheck },
    { id: 'directory', label: 'Directory', icon: Compass },
    { id: 'remember', label: 'Remember', icon: Bookmark },
  ];

  // Placed at the end right: Reputation beside Profile
  const endNavLinks = [
    { id: 'reputation', label: 'Reputation', icon: Shield },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => onSelectTab('landing')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer group"
          >
            <img
              src={tanmiLogo}
              alt="Tanmi Logo"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain group-hover:scale-105 transition-transform shrink-0"
            />
            <span className="font-extrabold tracking-tight hidden min-[400px]:inline">Devolution</span>
          </button>

          {/* Zone 2: Desktop Horizontal Navigation */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-600">
            {primaryNavLinks.map((link) => {
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

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreNav(!showMoreNav)}
                className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  moreNavLinks.some((l) => l.id === currentTab)
                    ? 'text-indigo-600 font-bold bg-indigo-50/80 border border-indigo-200/80'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
                title="More Navigation Sections"
              >
                <span>More</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showMoreNav ? 'rotate-180' : ''}`} />
              </button>

              {showMoreNav && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreNav(false)} />
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {moreNavLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = currentTab === link.id;
                      return (
                        <button
                          key={link.id}
                          onClick={() => {
                            setShowMoreNav(false);
                            onSelectTab(link.id);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                            isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{link.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* End right navigation links: Reputation beside Profile at the end right */}
            {endNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                currentTab === link.id ||
                (link.id === 'profile' && (currentTab === 'profile' || currentTab.startsWith('profile-')));
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.id === 'profile') {
                      if (currentUser) {
                        onSelectTab(`profile-${currentUser.username}`);
                      } else {
                        onOpenAuth();
                      }
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
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* 1. GitHub Continuous Sync Icon */}
            <div className="relative shrink-0 hidden md:block">
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
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowGitMenu(false)} />
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-lg border border-slate-200 shadow-xl py-3 px-4 z-50 text-xs space-y-3">
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
                        <span className="text-slate-400">GitHub Push:</span>
                        <span className={gitStatus?.hasToken ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                          {gitStatus?.hasToken ? `Enabled (${gitStatus.tokenMasked})` : 'Set token in Settings'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Auto-Sync:</span>
                        <span className="text-slate-600">Active (continuous on data update)</span>
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
                </>
              )}
            </div>

            {/* Supabase Cloud Backend Icon */}
            <div className="relative shrink-0 hidden md:block">
              <button
                onClick={() => setShowSupabaseMenu(!showSupabaseMenu)}
                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer relative"
                title="Supabase Cloud Backend Status"
                aria-label="Supabase Cloud Backend"
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    supabaseStatus?.status === 'connected'
                      ? 'bg-emerald-500'
                      : supabaseStatus?.configured
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
              </button>

              {showSupabaseMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSupabaseMenu(false)} />
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-lg border border-slate-200 shadow-xl py-3 px-4 z-50 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Supabase Backend</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          supabaseStatus?.status === 'connected'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {supabaseStatus?.status === 'connected' ? 'Connected' : 'Setup URL'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Secret Key:</span>
                        <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {supabaseStatus?.key ? 'Configured (Active)' : 'Not configured'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Project URL:</span>
                        <span className="font-mono text-slate-800 truncate max-w-[170px]" title={supabaseStatus?.url || 'Not set'}>
                          {supabaseStatus?.url || 'Pending configuration'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Database:</span>
                        <span className="font-medium text-emerald-700">PostgreSQL (Relational)</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <button
                        onClick={() => {
                          setShowSupabaseMenu(false);
                          if (onOpenSupabaseModal) {
                            onOpenSupabaseModal();
                          } else {
                            onSelectTab('settings');
                          }
                        }}
                        className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>{supabaseStatus?.status === 'connected' ? 'Configure Supabase & Sync' : 'Activate Supabase Backend'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowSupabaseMenu(false);
                          onSelectTab('settings');
                        }}
                        className="w-full py-1.5 px-3 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Settings className="w-3 h-3 text-slate-500" />
                        <span>View SQL Schema in Settings</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Global Ledger / World Screen Icon */}
            <button
              onClick={() => {
                if (onOpenPublicLedger) onOpenPublicLedger();
                else onSelectTab('public-ledger');
              }}
              className={`relative px-2 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer group shadow-2xs shrink-0 ${
                currentTab === 'public-ledger'
                  ? 'text-indigo-700 bg-indigo-100 border border-indigo-300'
                  : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80'
              }`}
              title="World Screen: Browse Verified People, Public Commitments & Trust Receipts"
              aria-label="World Screen - Verified People & Public Ledger"
            >
              <Globe className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline text-xs font-bold text-indigo-900">People & Ledger</span>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
            </button>

            {/* Search Icon Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shrink-0"
              title="Search verified people (Cmd+K / Ctrl+K)"
              aria-label="Search verified people"
            >
              <Search className="w-4 h-4 text-slate-700 hover:text-indigo-600 transition-colors" />
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

            {/* Reputation quick access button - beside profile menu (second end right) */}
            <button
              onClick={() => onSelectTab('reputation')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs shrink-0 ${
                currentTab === 'reputation'
                  ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-200 font-bold'
                  : 'bg-white hover:bg-amber-50/60 border-slate-200 hover:border-amber-300 text-slate-700'
              }`}
              title="Transparent Multi-Dimensional Reputation & Trust Metrics"
              aria-label="Reputation Breakdown"
            >
              <Shield className={`w-3.5 h-3.5 ${currentTab === 'reputation' ? 'text-amber-600' : 'text-amber-500'}`} />
              <span className="text-xs font-semibold">Reputation</span>
            </button>

            {/* 4. Active User Profile Menu (at the end right) */}
            {currentUser ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl border-2 transition-all cursor-pointer shadow-xs shrink-0 ${
                    showUserMenu
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                      : 'bg-white hover:bg-indigo-50/70 border-indigo-300 hover:border-indigo-500'
                  }`}
                  title="Your Profile & Account Menu"
                  aria-label="User Profile and Account Menu"
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={currentUser.avatarUrl}
                      name={currentUser.fullName}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-indigo-500/20 border border-white shadow-2xs shrink-0"
                      iconClassName="w-4 h-4 text-slate-500"
                    />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                      title="Active Profile"
                    />
                  </div>

                  {/* Profile label & Name - clearly visible, never wraps or pushes width */}
                  <div className="flex flex-col text-left leading-tight shrink-0">
                    <span className="font-bold text-slate-900 text-xs max-w-[70px] sm:max-w-[110px] truncate">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 tracking-wide flex items-center gap-1">
                      <span>Profile</span>
                      <span className="text-slate-300 hidden sm:inline">·</span>
                      <span className="text-slate-500 font-mono font-normal hidden sm:inline">@{currentUser.username}</span>
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0 transition-transform duration-200 ${
                      showUserMenu ? 'rotate-180 text-indigo-800' : ''
                    }`}
                  />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[0.5px]"
                      onClick={() => setShowUserMenu(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl border border-slate-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={currentUser.avatarUrl}
                            name={currentUser.fullName}
                            className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                            iconClassName="w-5 h-5 text-slate-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</div>
                            <div className="text-[11px] text-slate-500 font-mono truncate">@{currentUser.username}</div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Verified Account</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onSelectTab(`profile-${currentUser.username}`);
                          }}
                          className="w-full text-left p-2.5 mb-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-indigo-200 group-hover:text-white" />
                            <span>View My Public Profile</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-200 group-hover:text-white" />
                        </button>

                        {currentUser.accountType === 'business' && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onSelectTab('business');
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Business Entity Dashboard</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onOpenAvatarUpload) {
                              onOpenAvatarUpload();
                            } else {
                              onSelectTab('settings');
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Camera className="w-3.5 h-3.5 text-slate-400" />
                          <span>Change Profile Picture</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onSelectTab('settings');
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          <span>Privacy & Data Settings</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenAuth();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Switch Account / Sign In</span>
                        </button>

                        {onLogout && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onLogout();
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer border-t border-slate-100"
                          >
                            <LogOut className="w-3.5 h-3.5 text-red-500" />
                            <span>Log Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
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
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className={`text-[10px] ${currentTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-normal'}`}>Home</span>
        </button>

        <button
          onClick={() => onSelectTab('commitments')}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <Clock className={`w-4 h-4 ${currentTab === 'commitments' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className={`text-[10px] ${currentTab === 'commitments' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-normal'}`}>Commitments</span>
        </button>

        <button
          onClick={() => onSelectTab('receipts')}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <Receipt className={`w-4 h-4 ${currentTab === 'receipts' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className={`text-[10px] ${currentTab === 'receipts' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-normal'}`}>Receipts</span>
        </button>

        {/* Reputation - Second End Right */}
        <button
          onClick={() => onSelectTab('reputation')}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <Shield className={`w-4 h-4 ${currentTab === 'reputation' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className={`text-[10px] ${currentTab === 'reputation' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-normal'}`}>Reputation</span>
        </button>

        {/* Profile - End Right */}
        <button
          onClick={() => {
            if (currentUser) {
              onSelectTab(`profile-${currentUser.username}`);
            } else {
              onOpenAuth();
            }
          }}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]"
        >
          <UserIcon className={`w-4 h-4 ${currentTab === 'profile' || currentTab.startsWith('profile-') ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className={`text-[10px] ${currentTab === 'profile' || currentTab.startsWith('profile-') ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>Profile</span>
        </button>
      </nav>
    </>
  );
};
