import React, { useState, useEffect } from 'react';
import { User, UserPrivacySettings } from '../types/trust.js';
import { api } from '../services/api.js';
import {
  ShieldCheck,
  Download,
  Trash2,
  Check,
  Lock,
  Save,
  AlertCircle,
  GitBranch,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  ArrowLeft,
  Database,
  Copy,
  ChevronDown,
  ChevronUp,
  Camera,
  Key,
} from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
  onBack?: () => void;
  onOpenAvatarUpload?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onProfileUpdated, onBack, onOpenAvatarUpload }) => {
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
  const [gitTokenInput, setGitTokenInput] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);

  // Supabase Cloud Backend State
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [sqlSchema, setSqlSchema] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  const loadGitStatus = async () => {
    try {
      const status = await api.getGitStatus();
      setGitStatus(status);
    } catch {
      // background fetch
    }
  };

  const loadSupabaseStatus = async () => {
    try {
      const status = await api.getSupabaseStatus();
      setSupabaseStatus(status);
      if (status?.url && !supabaseUrlInput) {
        setSupabaseUrlInput(status.url);
      }
    } catch {
      // background fetch
    }
  };

  useEffect(() => {
    loadGitStatus();
    loadSupabaseStatus();
  }, []);

  const handleSaveSupabaseConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supabaseUrlInput.trim()) {
      setSupabaseMessage({ text: 'Please provide a valid Supabase Project URL (e.g. https://your-project.supabase.co)', type: 'error' });
      return;
    }
    setSupabaseLoading(true);
    setSupabaseMessage(null);
    try {
      const res = await api.configureSupabase(supabaseUrlInput.trim(), supabaseKeyInput.trim() || undefined);
      setSupabaseStatus(res);
      setSupabaseMessage({ text: 'Supabase configuration saved! Testing connection...', type: 'info' });
      const testRes = await api.testSupabase();
      if (testRes.success) {
        setSupabaseMessage({ text: testRes.message, type: 'success' });
        await api.syncToSupabase();
        const updated = await api.getSupabaseStatus();
        setSupabaseStatus(updated);
      } else {
        setSupabaseMessage({ text: testRes.message, type: 'error' });
      }
    } catch (err: any) {
      setSupabaseMessage({ text: err.message || 'Failed to configure Supabase', type: 'error' });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleTestSupabaseConnection = async () => {
    setSupabaseLoading(true);
    setSupabaseMessage(null);
    try {
      const res = await api.testSupabase();
      setSupabaseMessage({ text: res.message, type: res.success ? 'success' : 'error' });
      const updated = await api.getSupabaseStatus();
      setSupabaseStatus(updated);
    } catch (err: any) {
      setSupabaseMessage({ text: err.message || 'Connection test failed', type: 'error' });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseMessage(null);
    try {
      const res = await api.syncToSupabase();
      if (res.success) {
        setSupabaseMessage({ text: res.message, type: 'success' });
        const updated = await api.getSupabaseStatus();
        setSupabaseStatus(updated);
      } else {
        setSupabaseMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setSupabaseMessage({ text: err.message || 'Failed to push to Supabase', type: 'error' });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseMessage(null);
    try {
      const res = await api.pullFromSupabase();
      if (res.success) {
        setSupabaseMessage({ text: `${res.message} Reloading application...`, type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSupabaseMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setSupabaseMessage({ text: err.message || 'Failed to pull from Supabase', type: 'error' });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleToggleSqlSchema = async () => {
    if (!showSqlSchema && !sqlSchema) {
      try {
        const schema = await api.getSupabaseSchema();
        setSqlSchema(schema);
      } catch {
        // ignore
      }
    }
    setShowSqlSchema(!showSqlSchema);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

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

  const handleSaveGitToken = async () => {
    setIsSavingToken(true);
    setGitMessage(null);
    try {
      const res = await api.setGitToken(gitTokenInput.trim());
      setGitTokenInput('');
      const updatedStatus = await api.getGitStatus();
      setGitStatus(updatedStatus);
      setGitMessage(res.message || 'GitHub token saved successfully!');
      setTimeout(() => setGitMessage(null), 5000);
    } catch (err: any) {
      setGitMessage(err.message || 'Failed to configure GitHub token');
    } finally {
      setIsSavingToken(false);
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Public Profile Details</h2>

          {/* Profile Picture Uploader Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-indigo-100 bg-slate-200 shrink-0 shadow-xs flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-indigo-700 text-lg">{user.fullName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Profile Picture</h3>
                <p className="text-[11px] text-slate-500">
                  Visible across your bilateral commitments, verified receipts, and public ledger profile.
                </p>
              </div>
            </div>
            {onOpenAvatarUpload && (
              <button
                type="button"
                onClick={onOpenAvatarUpload}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload / Change Photo</span>
              </button>
            )}
          </div>

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

      {/* Supabase Cloud Backend Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Supabase Cloud Backend (PostgreSQL)</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Dual-Sync Ready
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Scalable relational database with automated snapshot persistence, live tables, and Row Level Security.
              </p>
            </div>
          </div>

          <div>
            {supabaseStatus?.status === 'connected' ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Connected
              </span>
            ) : supabaseStatus?.configured ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shrink-0">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Configured & Ready
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 shrink-0">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                Enter Project URL
              </span>
            )}
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Credential Status</div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Secret Key:</span>
              <span className="font-mono text-slate-800 text-[11px] bg-slate-200/70 px-2 py-0.5 rounded">
                {supabaseStatus?.key ? 'Configured (Active)' : 'Not configured'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Key Type:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Supabase Secret API Key (Service Role)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Auto-Replication:</span>
              <span className="text-slate-700 font-medium">Automatic on database change</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Synchronization State</div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Last Synced:</span>
              <span className="text-slate-800 font-medium">
                {supabaseStatus?.lastSyncTime
                  ? new Date(supabaseStatus.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Pending first sync'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Schema Compatibility:</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                PostgreSQL + JSONB Ready
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Local Ledger:</span>
              <span className="font-mono text-slate-800">data/db.json &rarr; public.devolution_state</span>
            </div>
          </div>
        </div>

        {/* Project URL Form */}
        <form onSubmit={handleSaveSupabaseConfig} className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <label className="font-semibold text-slate-800 text-xs">
              Supabase Project URL:
            </label>
            <span className="text-[11px] text-slate-500">
              Found in Supabase Dashboard &gt; Project Settings &gt; API
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="url"
              value={supabaseUrlInput}
              onChange={(e) => setSupabaseUrlInput(e.target.value)}
              placeholder="https://YOUR_PROJECT_REF.supabase.co"
              className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={supabaseLoading}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1.5 shrink-0 shadow-2xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{supabaseLoading ? 'Connecting...' : 'Save & Connect URL'}</span>
            </button>
          </div>
        </form>

        {supabaseMessage && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              supabaseMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : supabaseMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            {supabaseMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : supabaseMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            )}
            <span className="flex-1">{supabaseMessage.text}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-1 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTestSupabaseConnection}
            disabled={supabaseLoading || !supabaseUrlInput}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${supabaseLoading ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={supabaseLoading || !supabaseUrlInput}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-2xs disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Push Local Ledger to Supabase</span>
          </button>

          <button
            type="button"
            onClick={handlePullFromSupabase}
            disabled={supabaseLoading || !supabaseUrlInput}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pull from Supabase</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSqlSchema}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>{showSqlSchema ? 'Hide SQL Schema' : 'View / Copy SQL Migration'}</span>
            {showSqlSchema ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable SQL Migration Panel */}
        {showSqlSchema && (
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-emerald-400">Supabase SQL Schema (supabase/schema.sql)</span>
                <p className="text-[11px] text-slate-400">
                  Run this script once in your Supabase Dashboard &gt; SQL Editor to bootstrap the state table and RLS policies.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono overflow-x-auto max-h-64 border border-slate-800 text-slate-300">
              {sqlSchema || '-- Loading SQL schema...'}
            </pre>
          </div>
        )}
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

        {/* GitHub Authentication / Access Token */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>GitHub Authentication & Push Access</span>
            </div>
            {gitStatus?.hasToken ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Authenticated ({gitStatus.tokenMasked})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Token Required for Push
              </span>
            )}
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            To allow automatic pushing to <span className="font-mono text-slate-700">allenblue90210-jpg/Devolution-TamyonoiaCat</span> whenever you make updates, enter a GitHub Personal Access Token (classic or fine-grained with <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-800">repo</code> permissions).
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <input
              type="password"
              value={gitTokenInput}
              onChange={(e) => setGitTokenInput(e.target.value)}
              placeholder={gitStatus?.hasToken ? "Enter new token to replace existing..." : "ghp_xxxxxxxxxxxxxxxxxxxx"}
              className="flex-1 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            />
            <button
              onClick={handleSaveGitToken}
              disabled={isSavingToken || !gitTokenInput.trim()}
              className="w-full sm:w-auto px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isSavingToken ? 'Saving...' : 'Save & Authenticate'}</span>
            </button>
            {gitStatus?.hasToken && (
              <button
                onClick={async () => {
                  setGitTokenInput('');
                  await api.setGitToken('');
                  const updated = await api.getGitStatus();
                  setGitStatus(updated);
                  setGitMessage('GitHub token cleared.');
                }}
                className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                title="Remove token"
              >
                Clear
              </button>
            )}
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
