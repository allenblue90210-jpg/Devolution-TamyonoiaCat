import React, { useState } from 'react';
import { api } from '../services/api.js';
import { Phone, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface PhoneVerificationModalProps {
  initialPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  initialPhone,
  onClose,
  onSuccess,
}) => {
  const [phone, setPhone] = useState(initialPhone || '+234 ');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [demoCodeNotice, setDemoCodeNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.sendPhoneOtp(phone);
      setDemoCodeNotice(res.demoOtp);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification challenge.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.verifyPhoneOtp(phone, otpCode);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative z-10 bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 my-auto max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Phone Endpoint Verification</h3>
              <p className="text-[11px] text-slate-500">Carrier HLR & One-Time Cryptographic Challenge</p>
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

        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-800">Privacy Safeguard:</span> Verifying phone ownership proves active channel control. Your phone number is strictly private and is never exposed on public profiles.
        </div>

        {step === 'input' ? (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                International Mobile Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 123 4567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Include country prefix (e.g. +234 for Nigeria, +44 for UK, +1 for US)
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Dispatching...' : 'Send SMS Challenge Code'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            {demoCodeNotice && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                <div className="font-semibold mb-0.5">Sandbox Carrier Simulation</div>
                <div>
                  Your 6-digit challenge code is{' '}
                  <span className="font-mono font-bold text-sm text-indigo-700 tabular-nums">
                    {demoCodeNotice}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="e.g. 849201"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono text-center tracking-widest text-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-xs text-indigo-600 hover:underline"
              >
                Change Phone Number
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Confirm Ownership'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
