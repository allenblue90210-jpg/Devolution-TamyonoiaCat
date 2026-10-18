import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Search, ShieldCheck, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

interface DirectoryViewProps {
  onSelectProfile: (username: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ onSelectProfile }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    'All Categories',
    'Software Engineering & FinTech',
    'Cloud Architecture & Security',
    'Logistics & Supply Chain',
    'Legal & Advisory',
    'Financial Services',
    'Healthcare & Science',
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getProfiles({
          q: query,
          category: selectedCategory === 'All Categories' ? '' : selectedCategory,
          verified: onlyVerified,
        });
        setProfiles(res.profiles);
      } catch (err) {
        console.error('Failed to load profiles:', err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, onlyVerified]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Public Evidentiary Discovery
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verified Profile Directory</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Search verified professionals, founders, and businesses. Profiles display attested records without compromising private phone numbers or identity document scans.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username, or organization..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 whitespace-nowrap">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <span>Attested Only</span>
          </label>
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Searching directory...</div>
      ) : profiles.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-500">
          No matching public profiles found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectProfile(p.username)}
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.fullName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base border border-slate-200">
                      {p.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <span>{p.fullName}</span>
                      {p.identityStatus === 'verified' && (
                        <span title="Identity Attested">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">@{p.username}</div>
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">{p.headline}</div>
                  </div>
                </div>

                {p.businessName && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{p.businessName}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 text-[11px] font-mono tabular-nums">
                  {p.confirmedRelationshipsCount} relations · {p.completedReceiptsCount} receipts
                </div>
                <div className="text-indigo-600 font-semibold flex items-center gap-1">
                  <span>View Proof</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
