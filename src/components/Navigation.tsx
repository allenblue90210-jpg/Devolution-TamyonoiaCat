import React, { useState } from 'react';
import { User, InAppNotification } from '../types/trust.js';
import { ShieldCheck, Bell, ChevronDown, UserCheck, LogOut, Check } from 'lucide-react';

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
