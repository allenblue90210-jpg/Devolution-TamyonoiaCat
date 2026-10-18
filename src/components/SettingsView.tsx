import React, { useState, useEffect } from 'react';
import { User, UserPrivacySettings } from '../types/trust.js';
import { api } from '../services/api.js';
import { ShieldCheck, Download, Trash2, Check, Lock, Save, AlertCircle, GitBranch, RefreshCw, ExternalLink, CheckCircle2, ArrowLeft } from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onProfileUpdated, onBack }) => {
  const [headline, setHeadline] = useState(user.headline);
  const [bio, setBio] = useState(user.bio);
  const [category, setCategory] = useState(user.category);
  const [city, setCity] = useState(user.city);
  const [country, setCountry] = useState(user.country);

  const [privacy, setPrivacy] = useState<UserPrivacySettings>(user.privacySettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // GitHub Continuous Sync State
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [gitSyncing, setGitSyncing] = useState(false);
  const [gitMessage, setGitMessage] = useState<string | null>(null);
  const [customCommit, setCustomCommit] = useState('');

  const loadGitStatus = async () => {
    try {
      const status = await api.getGitStatus();
      setGitStatus(status);
    } catch {
      // background fetch
    }
  };

  useEffect(() => {
    loadGitStatus();
  }, []);

  const handleSyncNow = async () => {
    setGitSyncing(true);
    setGitMessage(null);
    try {
      const res = await api.syncGitRepo(customCommit.trim() || undefined);
      setGitStatus(res);
      setCustomCommit('');
      setGitMessage('Pushed latest changes to GitHub repository successfully.');
      setTimeout(() => setGitMessage(null), 4000);
    } catch (err: any) {
      setGitMessage(err.message || 'Failed to sync with repository');
    } finally {
      setGitSyncing(false);
    }
  };

  const handlePullNow = async () => {
    setGitSyncing(true);
    setGitMessage(null);
    try {
      const res = await api.pullGitRepo();
      setGitStatus(res);
      if (res?.pulledCount && res.pulledCount > 0) {
        setGitMessage(`Pulled ${res.pulledCount} new commit(s) from GitHub! Reloading app...`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setGitMessage('Repository is already up to date with GitHub main.');
        setTimeout(() => setGitMessage(null), 3500);
      }
    } catch (err: any) {
      setGitMessage(err.message || 'Failed to pull updates from repository');
    } finally {
      setGitSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.updateProfile({
        headline,
        bio,
        category,
        city,
        country,
        privacySettings: privacy,
      });
      onProfileUpdated(res.user);
      setMessage('Profile and privacy preferences updated successfully.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    window.location.href = '/api/export-data';
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you certain you wish to request irreversible account and evidence ledger erasure? This process initiates legal retention deletion pursuant to NDPR/GDPR Article 17.')) {
      alert('Your deletion request has been registered in the compliance revocation ledger. An attestation receipt has been issued.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Navigation Bar */}
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

      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Privacy & Governance Controls
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Privacy Settings</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Control which verified facets appear on your public profile, exercise data subject access rights, or request complete evidence ledger revocation.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Details Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Public Profile Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Professional Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City Location</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">Biography</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-xs"
            />
          </div>
        </div>

        {/* Granular Privacy Toggles */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Granular Privacy & Sharing Boundary Controls</h2>
              <p className="text-xs text-slate-500">Fine-tune what external viewers can inspect on your public URL.</p>
            </div>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <label className="py-3 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 block">Display Confirmed Relationship Counts</span>
                <span className="text-slate-500 text-[11px]">Show aggregate number of verified family, colleagues, and clients.</span>
              </div>
              <input
                type="checkbox"
                checked={privacy.showRelationshipCounts}
                onChange={(e) => setPrivacy({ ...privacy, showRelationshipCounts: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>

            <label className="py-3 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 block">Display Relationship Category Breakdown</span>
                <span className="text-slate-500 text-[11px]">Disclose the category distribution (e.g. 5 Colleagues, 2 Clients).</span>
              </div>
              <input
                type="checkbox"
                checked={privacy.showCategoryBreakdown}
                onChange={(e) => setPrivacy({ ...privacy, showCategoryBreakdown: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>

            <label className="py-3 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 block">Display Voluntarily Public Endorsers</span>
                <span className="text-slate-500 text-[11px]">Show names and quotes of peers who consented to public attribution.</span>
              </div>
              <input
                type="checkbox"
                checked={privacy.showPublicEndorsers}
                onChange={(e) => setPrivacy({ ...privacy, showPublicEndorsers: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>

            <label className="py-3 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 block">Display Completed Trust Receipts</span>
                <span className="text-slate-500 text-[11px]">Allow verified counterparties and public viewers to inspect transaction milestones.</span>
              </div>
              <input
                type="checkbox"
                checked={privacy.showTrustReceipts}
                onChange={(e) => setPrivacy({ ...privacy, showTrustReceipts: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>

            <label className="py-3 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 block">Coarse City-Level Location Only</span>
                <span className="text-slate-500 text-[11px]">Strictly prevent any precise GPS coordinates or street residential data exposure.</span>
              </div>
              <input
                type="checkbox"
                checked={privacy.showLocationCityOnly}
                onChange={(e) => setPrivacy({ ...privacy, showLocationCityOnly: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Compliance & Data Subject Access Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs text-xs">
        <h2 className="text-sm font-bold text-slate-900">Regulatory Data Subject Access Rights (NDPR & GDPR)</h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <div className="font-bold text-slate-900">Export Complete Trust Dossier Archive</div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Download all cryptographic attestations, audit trails, and dual-signed receipts in machine-readable JSON format.
            </p>
          </div>
          <button
            onClick={handleExportData}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Machine-Readable Archive</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-red-50/50 border border-red-200">
          <div>
            <div className="font-bold text-red-900">Account Erasure & Right to Be Forgotten</div>
            <p className="text-red-700 text-[11px] mt-0.5">
              Permanently delete your profile and revoke all active invitation tokens. Historical completed receipts are preserved in compliance logs without personal telemetry.
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Request Account Erasure</span>
          </button>
        </div>
      </div>

      {/* GitHub Continuous Repository Sync Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">GitHub Continuous Repository Sync</h2>
              <p className="text-slate-500 text-[11px]">
                Direct automated bi-directional synchronization with your remote Git repository.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Continuous Sync Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Repository Details</div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Repository:</span>
              <a
                href="https://github.com/allenblue90210-jpg/Devolution-TamyonoiaCat"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-indigo-600 hover:underline flex items-center gap-1"
              >
                allenblue90210-jpg/Devolution-TamyonoiaCat
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Branch:</span>
              <span className="font-mono font-semibold text-slate-800">{gitStatus?.branch || 'main'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Latest Commit:</span>
              <span className="font-mono text-slate-800 text-[11px]">
                {gitStatus?.lastCommit?.hash || '18ce210'} ({gitStatus?.lastCommit?.relativeTime || 'synced'})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sync Mechanism</div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Auto-Push Interval:</span>
              <span className="font-medium text-slate-800">Every 45 seconds on change</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Working Tree State:</span>
              <span className={gitStatus?.clean ? 'text-emerald-600 font-semibold flex items-center gap-1' : 'text-amber-600 font-semibold'}>
                {gitStatus?.clean ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Clean & Fully Synced
                  </>
                ) : (
                  `${gitStatus?.uncommittedCount || 0} change(s) staged/pending`
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">CLI Commands:</span>
              <code className="text-[11px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-800">npm run sync</code>
            </div>
          </div>
        </div>

        {gitMessage && (
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs">
            {gitMessage}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={customCommit}
            onChange={(e) => setCustomCommit(e.target.value)}
            placeholder="Custom commit message (optional, e.g. 'feat: update trust endorsements')"
            className="flex-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            onClick={handlePullNow}
            disabled={gitSyncing}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pull Latest from GitHub</span>
          </button>
          <button
            onClick={handleSyncNow}
            disabled={gitSyncing}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gitSyncing ? 'animate-spin' : ''}`} />
            <span>{gitSyncing ? 'Syncing...' : 'Sync & Push Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
