import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import {
  Search,
  X,
  ShieldCheck,
  Building2,
  Users,
  Receipt,
  MapPin,
  Briefcase,
  ArrowRight,
  ExternalLink,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar.js';

interface PeopleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (username: string) => void;
}

export const PeopleSearchModal: React.FC<PeopleSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'verified_id' | 'business'>('all');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      loadProfiles('');
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadProfiles = async (searchTerm: string) => {
    setLoading(true);
    try {
      const res = await api.getProfiles({
        q: searchTerm,
        verified: filterType !== 'all',
      });
      setProfiles(res.profiles || []);
    } catch (err) {
      console.error('Failed to search profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        loadProfiles(query);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query, filterType]);

  if (!isOpen) return null;

  const filteredResults = profiles.filter((p) => {
    if (filterType === 'verified_id') return p.identityStatus === 'verified';
    if (filterType === 'business') return p.accountType === 'business' || p.businessVerificationStatus === 'verified';
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search People"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden mt-4 sm:mt-12 flex flex-col max-h-[85vh]">
        {/* Top Search Input Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-indigo-600 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredResults.length > 0) {
                    onSelectUser(filteredResults[0].username);
                    onClose();
                  }
                }
              }}
              placeholder="Search person by name, @username, title, industry, or city (Press Enter to open profile)..."
              className="w-full pl-11 pr-24 py-3 bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <div className="absolute right-3 flex items-center gap-2">
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
                ESC
              </kbd>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Filter:
            </span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Profiles
            </button>
            <button
              onClick={() => setFilterType('verified_id')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                filterType === 'verified_id'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Identity Attested</span>
            </button>
            <button
              onClick={() => setFilterType('business')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                filterType === 'business'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Corporate / CAC Verified</span>
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <div>Searching verified directory...</div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-800">No verified people found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No profiles matched "{query}". Try searching by another keyword or explore all categories.
              </p>
            </div>
          ) : (
            filteredResults.map((person) => (
              <div
                key={person.id}
                onClick={() => {
                  onSelectUser(person.username);
                  onClose();
                }}
                className="pt-3 first:pt-0 group p-3.5 sm:p-4 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/40 transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* User Avatar + Identity Info */}
                  <div className="flex items-start gap-3.5">
                    <UserAvatar
                      src={person.avatarUrl}
                      name={person.fullName}
                      className="w-13 h-13 rounded-full border border-slate-200 shrink-0"
                      iconClassName="w-6 h-6 text-slate-500"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm sm:text-base transition-colors">
                          {person.fullName}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          @{person.username}
                        </span>
                        {person.accountType === 'business' && (
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                            Business Entity
                          </span>
                        )}
                      </div>

                      {/* Headline / Title */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-snug">
                        {person.headline || 'Network Member'}
                      </p>

                      {/* Category & City */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                        {person.category && (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span>{person.category}</span>
                          </span>
                        )}
                        {(person.city || person.country) && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{[person.city, person.country].filter(Boolean).join(', ')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verification Badges & CTA */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-1 sm:pt-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {person.identityStatus === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Identity Verified</span>
                        </span>
                      )}
                      {person.businessVerificationStatus === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>CAC Verified</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                      <span className="inline-flex items-center gap-1" title="Confirmed Social Endorsements">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{person.confirmedRelationshipsCount || 0} connections</span>
                      </span>
                      <span className="inline-flex items-center gap-1" title="Dual-Signed Trust Receipts">
                        <Receipt className="w-3.5 h-3.5 text-slate-400" />
                        <span>{person.completedReceiptsCount || 0} receipts</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(person.username);
                        onClose();
                      }}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {person.identityMethod && (
                  <div className="mt-2 text-[11px] text-slate-500 font-mono bg-slate-50 rounded px-2.5 py-1 border border-slate-100 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Attestation: {person.identityMethod}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Search connects to independently attested records on the Devolution ledger</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {filteredResults.length} profile{filteredResults.length === 1 ? '' : 's'} available
          </div>
        </div>
      </div>
    </div>
  );
};
