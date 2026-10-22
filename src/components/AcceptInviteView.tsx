import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { RelationshipInvite } from '../types/trust.js';
import { ShieldCheck, CheckCircle2, AlertCircle, Users, Check, X, ArrowLeft } from 'lucide-react';
import { UserAvatar } from './UserAvatar.js';

interface AcceptInviteViewProps {
  token: string;
  onBack: () => void;
  onCompleted: () => void;
}

export const AcceptInviteView: React.FC<AcceptInviteViewProps> = ({
  token,
  onBack,
  onCompleted,
}) => {
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<RelationshipInvite | null>(null);
  const [inviter, setInviter] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [wantsEndorsement, setWantsEndorsement] = useState(false);
  const [endorsementText, setEndorsementText] = useState('');
  const [endorsementContext, setEndorsementContext] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      try {
        setLoading(true);
        const res = await api.getInviteByToken(token);
        setInvite(res.invite);
        setInviter(res.inviter);
      } catch (err: any) {
        setError(err.message || 'Invitation not found or expired.');
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  const handleRespond = async (decision: 'confirm' | 'reject') => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.respondToInvite(token, {
        decision,
        hasEndorsement: wantsEndorsement && decision === 'confirm',
        endorsementText: wantsEndorsement ? endorsementText : undefined,
        endorsementContext: wantsEndorsement ? endorsementContext : undefined,
        isEndorserPublic: isPublic,
      });
      setSuccessMessage(res.message);
      setTimeout(() => {
        onCompleted();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Loading secure relationship invitation...
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <div className="font-bold">{error || 'Invalid Invitation Token'}</div>
          <p className="mt-1">This invitation link may have already been executed or revoked.</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Application</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <button
        onClick={onBack}
        className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Application</span>
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Social Verification Request
          </div>
          <span className="text-xs font-mono text-slate-400">Token: {token.slice(0, 10)}...</span>
        </div>

        {successMessage ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 text-xs text-emerald-900">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-bold text-sm">Response Recorded Successfully!</div>
            <p>{successMessage}</p>
          </div>
        ) : (
          <>
            {/* Inviter Info Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <UserAvatar
                src={inviter?.avatarUrl}
                name={inviter?.fullName || 'User'}
                className="w-14 h-14 rounded-full border border-slate-200"
                iconClassName="w-7 h-7 text-slate-500"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-base">{inviter?.fullName}</span>
                  {inviter?.identityStatus === 'verified' && (
                    <span title="Identity Attested">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600">{inviter?.headline}</div>
                <div className="text-[11px] text-slate-400 font-mono">@{inviter?.username}</div>
              </div>
            </div>

            {/* Claimed Relationship */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700">Claimed Connection Capacity:</div>
              <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200 text-indigo-950 font-medium">
                {inviter?.fullName} claims you know them as a{' '}
                <span className="font-bold text-indigo-700">{invite.relationshipCategory}</span>.
              </div>

              {invite.personalNote && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 italic">
                  Note from {inviter?.fullName}: "{invite.personalNote}"
                </div>
              )}
            </div>

            {/* Crucial Concept: Separation of Confirmation and Endorsement */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-900">Step 1: Relationship Confirmation</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Confirming merely acknowledges that you know {inviter?.fullName} in this capacity. It does not evaluate character or guarantee future behavior.
              </p>

              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsEndorsement}
                    onChange={(e) => setWantsEndorsement(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900">
                      Step 2: Submit Voluntary Personal Endorsement (Optional)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Check this box only if you freely wish to vouch for their character, reliability, or execution within a specific context.
                    </p>
                  </div>
                </label>
              </div>

              {wantsEndorsement && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Context of Working Relationship
                    </label>
                    <input
                      type="text"
                      value={endorsementContext}
                      onChange={(e) => setEndorsementContext(e.target.value)}
                      placeholder="e.g. Co-built payment gateway at Paystack (2022–2024)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Personal Endorsement Statement
                    </label>
                    <textarea
                      rows={3}
                      value={endorsementText}
                      onChange={(e) => setEndorsementText(e.target.value)}
                      placeholder="Provide honest, specific commentary on their reliability and integrity..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span className="text-[11px] text-slate-600">
                      Display my name and statement publicly on their profile (consent to public attribution).
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleRespond('reject')}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Reject / Do Not Confirm
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleRespond('confirm')}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>
                  {wantsEndorsement
                    ? 'Confirm Relationship & Submit Endorsement'
                    : 'Confirm Relationship Only'}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
