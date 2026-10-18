import React, { useState } from 'react';
import { api } from '../services/api.js';
import { ShieldCheck, AlertCircle, X, CheckCircle2, Lock } from 'lucide-react';

interface IdentityVerificationModalProps {
  currentMethod: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const IdentityVerificationModal: React.FC<IdentityVerificationModalProps> = ({
  currentMethod,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState('NIMC National Identity Database + 3D Liveness');
  const [docNumber, setDocNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = [
    {
      id: 'NIMC National Identity Database + 3D Liveness',
      name: 'NIMC National Identity (Nigeria)',
      description: 'NIN query verified against the National Identity Management Commission with active 3D face liveness match.',
    },
    {
      id: 'International Passport Machine Readable Zone (MRZ) + Liveness',
      name: 'International Passport MRZ Check',
      description: 'ICAO 9303 standard passport cryptographic signature verification and facial biometric comparison.',
    },
    {
      id: 'CAC Corporate Director Biometric Resolution',
      name: 'CAC Corporate Director Verification',
      description: 'Corporate Affairs Commission cross-reference verifying legal status as an attested company officer.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.initiateIdentity(method, docNumber);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Identity verification check failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center">
      <div className="relative bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Identity Attestation Provider</h3>
              <p className="text-[11px] text-slate-500">Authoritative Database & Biometric Matching</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Ethical Rationale Notice (Required by Master Prompt) */}
        <div className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-200 space-y-1">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Ethical Boundary Notice:</span>
          </div>
          <p className="text-amber-800">
            A verified identity establishes that an official check succeeded against an authoritative ledger. It does <strong>not</strong> guarantee character or future honesty. We never store raw government ID images; only provider cryptographic attestation hashes are retained.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Select Attestation Provider Method
            </label>
            <div className="space-y-2">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                    method === m.id
                      ? 'border-indigo-600 bg-indigo-50/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="identityMethod"
                    value={m.id}
                    checked={method === m.id}
                    onChange={(e) => setMethod(e.target.value)}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-slate-500 leading-normal">{m.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Document Reference / Identification Number
            </label>
            <input
              type="text"
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. 11-digit NIN or Passport Number (Sandbox Testable)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              In test sandbox mode, entering any 8–11 digit reference generates an official attestation token.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !docNumber}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Attesting...' : 'Execute Provider Check'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
