import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';

interface SupabaseModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ onClose, onSuccess }) => {
  const [status, setStatus] = useState<any>(null);
  const [projectUrl, setProjectUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [sqlSchema, setSqlSchema] = useState('');

  const loadStatus = async () => {
    try {
      const res = await api.getSupabaseStatus();
      setStatus(res);
      if (res?.url && res.url !== '001' && !projectUrl) {
        setProjectUrl(res.url);
      }
    } catch {
      // background fetch
    }
  };

  useEffect(() => {
    loadStatus();
    api.getSupabaseSchema().then(setSqlSchema).catch(() => {});
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = projectUrl.trim();
    const cleanKey = apiKey.trim();

    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      setMessage({
        text: 'Please enter a valid Supabase Project URL (e.g. https://your-project.supabase.co).',
        type: 'error',
      });
      return;
    }

    if (!cleanKey || cleanKey.length < 15) {
      setMessage({
        text: 'Please enter your Supabase service_role or API key.',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Saving configuration & testing connection to Supabase...', type: 'info' });

    try {
      const configRes = await api.configureSupabase(cleanUrl, cleanKey);
      setStatus(configRes);

      const testRes = await api.testSupabase();
      if (testRes.success) {
        setMessage({
          text: 'Connected successfully! Synchronizing real users and records to Supabase...',
          type: 'success',
        });
        await api.syncToSupabase();
        const finalStatus = await api.getSupabaseStatus();
        setStatus(finalStatus);
        setMessage({
          text: 'Supabase is now active! All real users and trust records are continuously backed by your PostgreSQL database.',
          type: 'success',
        });
        if (onSuccess) onSuccess();
      } else {
        setMessage({
          text: testRes.message || 'Connection test failed. Check your project URL and Key.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to connect to Supabase.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.syncToSupabase();
      if (res.success) {
        setMessage({ text: res.message, type: 'success' });
        const updated = await api.getSupabaseStatus();
        setStatus(updated);
      } else {
        setMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Sync failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopySql = () => {
    if (sqlSchema) {
      navigator.clipboard.writeText(sqlSchema);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2500);
    }
  };

  const isConnected = status?.status === 'connected';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Activate Supabase Backend</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {isConnected ? 'Active & Connected' : 'Configuration Required'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Persistent PostgreSQL cloud storage & real user data synchronization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{message.text}</div>
          </div>
        )}

        {/* Connection Form */}
        <form onSubmit={handleConnect} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              required
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://xyzprojectref.supabase.co"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Found under Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supabase API Key (service_role or anon key)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={status?.key ? `Current: ${status.key} (Leave blank to keep)` : 'eyJh... or sb_secret_...'}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Using the <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">service_role</code> key enables full automatic table sync for real users.
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{isConnected ? 'Update & Re-Sync Supabase' : 'Connect & Activate Supabase'}</span>
                </>
              )}
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={loading}
                className="py-2.5 px-3 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Sync current users and trust records to Supabase now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            )}
          </div>
        </form>

        {/* Database SQL Schema Guide */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>PostgreSQL Database Schema</span>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              {copiedSchema ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSchema ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            If tables are not created in Supabase yet, copy the schema above and paste it into your <strong>Supabase SQL Editor</strong> to create tables for real users, trust receipts, and bilateral commitments.
          </p>
        </div>

        {/* External Links */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
          <span>Need a free Supabase project?</span>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Open Supabase.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
