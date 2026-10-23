import React, { useState } from 'react';
import { api } from '../services/api.js';
import { GoodFaithRating, GoodFaithBadge } from '../types/trust.js';
import { Star, ShieldCheck, X, CheckCircle2, MessageSquare, HeartHandshake, AlertCircle } from 'lucide-react';

interface GoodFaithReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetUsername?: string;
  targetName?: string;
  onReviewSubmitted: (newRating: GoodFaithRating) => void;
}

const BADGES: Array<{ id: GoodFaithBadge; label: string; desc: string }> = [
  { id: 'Exemplary Integrity', label: 'Exemplary Integrity', desc: 'Consistently truthful, transparent, and honors word' },
  { id: 'Verified Partner', label: 'Verified Partner', desc: 'Direct bilateral collaboration completed cleanly' },
  { id: 'Prompt Delivery', label: 'Prompt Delivery', desc: 'Fulfilled deliverables or repayments on/before deadline' },
  { id: 'Honest Dealings', label: 'Honest Dealings', desc: 'Fair, non-predatory, and ethical commercial agreements' },
  { id: 'Trusted Collaborator', label: 'Trusted Collaborator', desc: 'Demonstrated high competence, rigor, and accountability' },
  { id: 'Civic Good Faith', label: 'Civic Good Faith', desc: 'Constructive community contributor with verifiable track record' },
];

export const GoodFaithReviewModal: React.FC<GoodFaithReviewModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUsername,
  targetName = 'Devolution Network & Verified People',
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [badge, setBadge] = useState<GoodFaithBadge>('Exemplary Integrity');
  const [authorName, setAuthorName] = useState('');
  const [authorTitle, setAuthorTitle] = useState('');
  const [context, setContext] = useState('');
  const [comment, setComment] = useState('');
  const [confirmedGoodFaith, setConfirmedGoodFaith] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please write your good faith comment or experience summary.');
      return;
    }
    if (!confirmedGoodFaith) {
      setErrorMsg('Please confirm that you are submitting this attestation in good faith.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await api.createRating({
        targetUserId: targetUserId || 'network',
        targetUsername: targetUsername || 'aegis_network',
        authorName: authorName.trim() || undefined,
        authorTitle: authorTitle.trim() || undefined,
        rating,
        goodFaithBadge: badge,
        comment: comment.trim(),
        context: context.trim() || undefined,
      });

      onReviewSubmitted(res.rating);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit rating in good faith');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return '5.0 — Exemplary Integrity & Flawless Good Faith';
      case 4:
        return '4.0 — Highly Reliable & Honest Dealings';
      case 3:
        return '3.0 — Satisfactory Fair Performance';
      case 2:
        return '2.0 — Significant Caution / Inconsistent Fulfillment';
      case 1:
        return '1.0 — Bad Faith / Unfulfilled Undertakings';
      default:
        return '';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in duration-150"
    >
      <div className="relative bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 my-auto max-h-[calc(100vh-2.5rem)] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
              <span>Good Faith Attestation</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Comment & Rate in Good Faith</h3>
            <p className="text-xs text-slate-500">
              Attesting for <strong className="text-slate-800 font-semibold">{targetName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Rating Percentage Selector (100% or 50% Presets) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-center">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Good Faith Rating Level *
              </label>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                rating === 5
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : rating === 3 || rating === 4
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {rating === 5 ? '100% Rating' : rating === 3 ? '50% Rating' : `${rating * 20}% Rating`}
              </span>
            </div>

            {/* Quick 100% vs 50% Toggle Buttons */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => {
                  setRating(5);
                  setBadge('Exemplary Integrity');
                }}
                className={`p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                  rating === 5
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Rating</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  5 Stars · Full Good Faith & Flawless Honoring
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRating(3);
                  setBadge('Honest Dealings');
                }}
                className={`p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                  rating === 3
                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>50% Rating</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  3 Stars · Partial Fulfillment / Cautionary
                </p>
              </button>
            </div>

            {/* Interactive 5-Star Row */}
            <div className="pt-1">
              <div className="flex items-center justify-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-hidden transform hover:scale-110 transition-transform cursor-pointer"
                      title={`${star * 20}% Rating`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          active
                            ? 'text-amber-500 fill-amber-400 filter drop-shadow-xs'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] font-semibold text-indigo-700 mt-1">
                {getRatingLabel(hoverRating || rating)}
              </div>
            </div>
          </div>

          {/* Good Faith Badge */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Good Faith Category Badge
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BADGES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBadge(b.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    badge === b.id
                      ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold ring-1 ring-indigo-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-[11px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>{b.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{b.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Author Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Your Full Name / Alias
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Samuel Adekunle"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Professional Title / Organization
              </label>
              <input
                type="text"
                value={authorTitle}
                onChange={(e) => setAuthorTitle(e.target.value)}
                placeholder="e.g. Lead Logistics Auditor · Kora NG"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Interaction Context */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Context of Interaction or Observation (Optional)
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Commercial freight milestone delivery, Open ledger witness, Subcontracting"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Comment & Good Faith Review */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Good Faith Comment & Evidence Note *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your direct experience, observation, or transaction with this person/network in honest good faith..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              All good-faith ratings and comments are permanent and cryptographically attributed to protect network honesty.
            </p>
          </div>

          {/* Good Faith Solemn Attestation Checkbox */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-2.5">
            <input
              type="checkbox"
              id="confirmGoodFaith"
              checked={confirmedGoodFaith}
              onChange={(e) => setConfirmedGoodFaith(e.target.checked)}
              className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="confirmGoodFaith" className="text-[11px] text-emerald-950 leading-relaxed cursor-pointer">
              <strong>Good Faith Declaration:</strong> I certify that this rating and commentary are provided truthfully, in bona fide good faith, based on verified observations, and free of manufactured collusion or commercial coercion.
            </label>
          </div>

          {/* CTAs */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit in Good Faith</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
