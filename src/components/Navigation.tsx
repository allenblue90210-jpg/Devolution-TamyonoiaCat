import React, { useState, useEffect } from 'react';
import { User, InAppNotification } from '../types/trust.js';
import { api } from '../services/api.js';
import { ShieldCheck, Bell, ChevronDown, UserCheck, LogOut, Check, GitBranch, RefreshCw, ExternalLink, CheckCircle2 } from 'lucide-react';

interface NavigationProps {
  currentUser: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  notifications: InAppNotification[];
  onOpenAuth: () => void;
  onSwitchUser: (userId: string) => void;
  availableUsers: Array<{ id: string; username: string; fullName: string; accountType: string; avatarUrl: string }>;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  notifications,
  onOpenAuth,
  onSwitchUser,
  availableUsers,
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
      setSyncMessage('Repository synced and pushed successfully!');
      setTimeout(() => setSyncMessage(null), 3500);
    } catch (err: any) {
      setSyncMessage(err.message || 'Sync failed');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'evidence', label: 'Evidence Center' },
    { id: 'relationships', label: 'Social Verification' },
    { id: 'receipts', label: 'Trust Receipts' },
    { id: 'directory', label: 'Directory' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onSelectTab('landing')}
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-xs">
            A
          </span>
          <span>Aegis Trust</span>
        </button>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === link.id
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                  : 'text-slate-600'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => onSelectTab('reputation')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentTab === 'reputation'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'text-slate-600'
            }`}
          >
            Reputation Engine
          </button>
        </nav>

        {/* Zone 3: 1 primary action or active user profile zone */}
        <div className="flex items-center gap-3 shrink-0">
          {/* GitHub Continuous Sync Indicator & Action */}
          <div className="relative">
            <button
              onClick={() => setShowGitMenu(!showGitMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
              title="GitHub Continuous Sync Status"
              aria-label="GitHub Continuous Sync"
            >
              <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline font-mono text-[11px]">Sync</span>
              <span
                className={`w-2 h-2 rounded-full ${
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
                    <span className="text-slate-600">Continuously every 45s</span>
                  </div>
                </div>

                {syncMessage && (
                  <div className="p-2 rounded bg-indigo-50 text-indigo-700 text-[11px] leading-tight">
                    {syncMessage}
                  </div>
                )}

                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Pushing to GitHub...' : 'Push & Sync to Repo Now'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Trigger */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Notifications
                    </span>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 hover:bg-slate-50 text-xs cursor-pointer ${
                            !n.isRead ? 'bg-indigo-50/50' : ''
                          }`}
                          onClick={() => {
                            setShowNotifications(false);
                            if (n.link?.includes('evidence')) onSelectTab('evidence');
                            else if (n.link?.includes('relationships')) onSelectTab('relationships');
                            else if (n.link?.includes('receipts')) onSelectTab('receipts');
                          }}
                        >
                          <div className="font-semibold text-slate-900 mb-0.5">{n.title}</div>
                          <div className="text-slate-600 line-clamp-2">{n.message}</div>
                          <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile or Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-800 transition-colors"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {currentUser.fullName.charAt(0)}
                  </div>
                )}
                <span className="hidden sm:inline font-semibold">{currentUser.fullName}</span>
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
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View My Public Profile
                    </button>
                    {currentUser.accountType === 'business' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSelectTab('business');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Business Entity Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSelectTab('settings');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Privacy & Data Settings
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
                          className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded text-xs transition-colors ${
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
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
