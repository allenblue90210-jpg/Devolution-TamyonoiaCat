import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Receipt,
  Award,
  Lock,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  ChevronRight,
  FileText,
  Check,
  Clock,
  Timer,
  Flame,
  Eye,
  Star,
  MessageSquarePlus,
  ThumbsUp,
  HeartHandshake,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api.js';
import { GoodFaithRating } from '../types/trust.js';
import { GoodFaithReviewModal } from './GoodFaithReviewModal.js';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreProfile: (username: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExploreProfile,
  onNavigateTab,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Live Impressions & Good Faith Ratings State
  const [impressions, setImpressions] = useState(4890);
  const [witnessCount, setWitnessCount] = useState(560);
  const [averageRating, setAverageRating] = useState(4.95);
  const [ratings, setRatings] = useState<GoodFaithRating[]>([]);
  const [hasWitnessedNetwork, setHasWitnessedNetwork] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedReviewTarget, setSelectedReviewTarget] = useState<{
    userId?: string;
    username?: string;
    name?: string;
  }>({ name: 'Aegis Trust Network & Verified People' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterPerson, setFilterPerson] = useState<string>('all');

  useEffect(() => {
    // Record page impression automatically ("if anybody see")
    api
      .recordImpression('network', false)
      .then((res) => {
        setImpressions(res.impressions);
        setWitnessCount(res.witnessCount);
      })
      .catch(() => {});

    api
      .getRatings('all')
      .then((res) => {
        setRatings(res.ratings);
        if (res.averageRating) setAverageRating(res.averageRating);
        if (res.impressions) setImpressions(res.impressions);
        if (res.witnessCount) setWitnessCount(res.witnessCount);
      })
      .catch(() => {});
  }, []);

  const handleWitnessNetwork = async () => {
    if (hasWitnessedNetwork) return;
    try {
      const res = await api.recordImpression('network', true);
      setImpressions(res.impressions);
      setWitnessCount(res.witnessCount);
      setHasWitnessedNetwork(true);
      setToastMessage('Thank you! You have officially witnessed the Aegis verified network in good faith.');
      setTimeout(() => setToastMessage(null), 4500);
    } catch {
      setHasWitnessedNetwork(true);
      setWitnessCount((prev) => prev + 1);
    }
  };

  const handleHelpfulClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markRatingHelpful(id);
      setRatings((prev) =>
        prev.map((r) => (r.id === id ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1, hasMarkedHelpful: true } : r))
      );
    } catch {}
  };

  const handleReviewSubmitted = (newRating: GoodFaithRating) => {
    setRatings((prev) => [newRating, ...prev]);
    setToastMessage('Your good faith comment & rating has been recorded and anchored to the open ledger!');
    setTimeout(() => setToastMessage(null), 4500);
  };

  const faqs = [
    {
      q: 'Does identity verification guarantee a person is honest or reliable?',
      a: 'No. We strictly do not equate identity verification with character. Identity attestation confirms that an official check against a recognized government or carrier registry succeeded. Reliability is established separately through verifiable transaction receipts, dual-signed peer confirmations, and independent professional references.',
    },
    {
      q: 'How does social verification prevent fake endorsement rings?',
      a: 'Relationships require independent confirmation from the recipient over a separate verified contact channel. Furthermore, relationship confirmation is strictly decoupled from personal endorsements: someone can confirm they are your colleague without vouching for you. Endorsements are audited, one per confirmed counterparty, with full context displayed.',
    },
    {
      q: 'Are my private government IDs or phone numbers displayed publicly?',
      a: 'Never. The platform enforces strict privacy-by-design. We do not store raw identity document images on public servers; only cryptographic attestation hashes and provider verification tokens are recorded. Phone numbers and home addresses are never published on public profiles.',
    },
    {
      q: 'What is a Trust Receipt?',
      a: 'A Trust Receipt is a bilateral, dual-signed record of a commitment or transaction between two parties (e.g. freelance work, supply delivery, lease). One party cannot fabricate a completion: both parties must acknowledge that milestones were fulfilled. Receipts include cryptographic hashes and dispute resolution history.',
    },
    {
      q: 'How does the platform handle disputes or unfulfilled commitments?',
      a: 'Any counterparty on a Trust Receipt or documented relationship can formally flag a dispute. Disputes are recorded on the ledger, audited with evidence submissions, and reflected in the contextual risk dimensions rather than hidden.',
    },
    {
      q: 'How can external applications or fintechs integrate with Aegis Trust?',
      a: 'We are architecting a portable trust API where authorized partners, marketplaces, and compliance providers can request user-consented trust attestations, verify credential authenticity, and query dual-signed receipts via scoped OAuth tokens.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and Rationale */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 tracking-wide uppercase">
                <span>Portable Trust Infrastructure</span>
                <span aria-hidden="true">·</span>
                <span>Evidence-Based Credibility</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] text-balance">
                Digital reputation anchored in verified evidence, not social popularity.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Establish credibility through verified identities, independently confirmed peer relationships, dual-signed transaction receipts, and official registry credentials. An independent platform for individuals, founders, and businesses.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onGetStarted}
                  className="px-5 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <span>Build Your Trust Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigateTab('commitments')}
                  className="px-5 py-3 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors inline-flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Time-Locked Commitments</span>
                </button>
                <button
                  onClick={() => onExploreProfile('allenokoro')}
                  className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  View Verified Profile
                </button>
              </div>

              {/* Toast Notification */}
              {toastMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{toastMessage}</span>
                  </div>
                  <button
                    onClick={() => setToastMessage(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Live Network Impressions, Good Faith Witnesses & Ratings Banner */}
              <div className="p-4 rounded-xl bg-indigo-50/90 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div
                      className="inline-flex items-center gap-1.5 text-indigo-950 font-bold"
                      title="Total public impressions registered when verified observers view network profiles"
                    >
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <span className="font-mono tabular-nums">{impressions.toLocaleString()}</span>
                      <span className="text-indigo-800 font-semibold">Impressions</span>
                    </div>
                    <span className="text-indigo-200">·</span>
                    <div
                      className="inline-flex items-center gap-1.5 text-slate-700 font-medium"
                      title="Network observers witnessing verified people in good faith"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {witnessCount.toLocaleString()}
                      </span>
                      <span>Witnesses in Good Faith</span>
                    </div>
                    <span className="text-indigo-200">·</span>
                    <div
                      className="inline-flex items-center gap-1 text-amber-700 font-bold"
                      title="Average community good-faith rating"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>{averageRating.toFixed(1)} / 5.0</span>
                      <span className="text-slate-500 font-normal">({ratings.length} reviews)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Live observer impressions recorded across verified people & ledger profiles.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleWitnessNetwork}
                    disabled={hasWitnessedNetwork}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      hasWitnessedNetwork
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 hover:border-indigo-600 shadow-2xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-current" />
                    <span>{hasWitnessedNetwork ? 'Witnessed in Good Faith' : 'Witness Network'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedReviewTarget({
                        name: 'Aegis Trust Network & Verified People',
                        userId: 'network',
                        username: 'aegis_network',
                      });
                      setShowRateModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Rate in Good Faith</span>
                  </button>
                </div>
              </div>

              {/* Four Core Evidentiary Questions */}
              <div className="pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
                <div>
                  <div className="font-semibold text-slate-900 mb-1">01. Who is this?</div>
                  <p className="text-slate-500">Identity & registry attestation</p>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 mb-1">02. Who knows them?</div>
                  <p className="text-slate-500">Dual-confirmed human ties</p>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 mb-1">03. Demonstrated?</div>
                  <p className="text-slate-500">Accredited documents & records</p>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 mb-1">04. Fulfilled?</div>
                  <p className="text-slate-500">Completed dual-signed receipts</p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Proof Card Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6 relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Live Verified Proof Ledger
                  </div>
                  <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Attested Record</span>
                  </div>
                </div>

                <div className="py-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="/src/assets/images/avatar_founder_1792334631930.jpg"
                      alt="Allen Okoro"
                      className="w-14 h-14 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Allen Okoro</span>
                        <span title="Identity Verified">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">Founder at Aegis Tech Systems Ltd</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">Lagos, Nigeria · CAC RC-1849204</div>
                    </div>
                  </div>

                  {/* Concrete metrics */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                    <div>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900">8</div>
                      <div className="text-[11px] text-slate-500">Confirmed Ties</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900">3</div>
                      <div className="text-[11px] text-slate-500">Completed Receipts</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900">6</div>
                      <div className="text-[11px] text-slate-500">Attested Records</div>
                    </div>
                  </div>

                  {/* Concrete verification rows */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900">NIMC National Identity & Biometric Match</div>
                        <div className="text-slate-500 text-[11px]">Query executed via certified provider · zero biometric storage</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900">Sarah Adesina (Colleague · CloudWorks NG)</div>
                        <div className="text-slate-500 text-[11px]">"Co-built payment settlement pipelines for 3 years. Exceptional integrity."</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start gap-2.5">
                      <Receipt className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900">Trust Receipt TR-90214 · ₦4,500,000 NGN</div>
                        <div className="text-slate-500 text-[11px]">Horizon Freight API · Dual-signed & fulfilled without dispute</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Cryptographically verifiable</span>
                  <button
                    onClick={() => onExploreProfile('allenokoro')}
                    className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors flex items-center gap-1"
                  >
                    <span>Inspect Full Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Architectural Pillars Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">
              The Architecture of Independent Credibility
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight text-balance">
              Four verified layers of digital proof that cannot be manufactured or purchased.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Layer 1: Identity & Contact */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">01. Identity & Contact Control</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect official registries (e.g. NIMC NIN, Corporate CAC, passports) and international phone ownership challenges. Proof of control without storing invasive biometric data.
              </p>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Non-simulated verification · Zero vanity badges
              </div>
            </div>

            {/* Layer 2: Social Verification */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">02. Two-Sided Human Ties</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Family members, supervisors, clients, and partners independently confirm relations over secure links. Relationship confirmation is strictly separated from voluntary endorsements.
              </p>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Decoupled vouching · Anti-reciprocal rings
              </div>
            </div>

            {/* Layer 3: Trust Receipts */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">03. Dual-Signed Trust Receipts</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Document agreements, deliveries, consulting milestones, and loans. Neither party can unilaterally claim fulfillment: completion requires dual confirmation or records formal disputes.
              </p>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Bilateral fulfillment · Immutable history
              </div>
            </div>

            {/* Layer 4: Transparent Reputation Engine */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">04. Transparent Reputation Ledger</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No single black-box score. We compute granular, context-specific evidence dimensions with full audit trails, handling sparse data gracefully and refusing to punish modest volume.
              </p>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Explainable math · Clear limitations notice
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-dive: Social Verification vs Endorsements */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Fundamental Paradigm Shift
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Relationship confirmation is not an endorsement. We keep them separate.
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                In most networks, a connection or reference conflates knowledge of a person with character endorsement. Aegis Trust explicitly divides these into two voluntary, independent steps:
              </p>
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm mb-1">Step 1: Relationship Confirmation</div>
                  <p className="text-slate-600">
                    The contact verifies that they know you in the stated capacity (e.g. former supervisor, family member, contractor). They do not vouch for your future performance.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <div className="font-bold text-indigo-950 text-sm mb-1">Step 2: Voluntary Personal Endorsement</div>
                  <p className="text-indigo-900/80">
                    Only if the contact freely chooses, they can submit a specific endorsement in defined context (e.g. technical reliability, debt repayment, contract execution) and decide if their name appears publicly.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab('relationships')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Explore Social Verification Workflows</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Example Public Attestation Card
                </div>
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Dr. Marcus Vance</div>
                      <div className="text-xs text-slate-500">Department of Electrical & Computer Engineering</div>
                    </div>
                    <span className="text-xs font-mono text-slate-500">Former Supervisor</span>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-md italic border-l-2 border-indigo-600">
                    "Allen conducted distributed systems research under my laboratory supervision. He demonstrated exemplary academic honesty, methodological rigor, and collaborative leadership."
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Context: University of Lagos (2018–2021)</span>
                    <span className="font-mono tabular-nums">Verified Sep 12, 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Receipts & Commitment Tracking */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">
              Verifiable Commercial Milestones
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight text-balance">
              Trust Receipts: Document agreements, deliveries, and settlement with counterparty confirmation.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-mono text-indigo-600 font-semibold">TR-90214</div>
              <h4 className="text-base font-bold text-slate-900">Multimodal Freight Tracking Microservice</h4>
              <p className="text-xs text-slate-600">
                Counterparty: Horizon Global Freight Services Ltd. Delivery of staging cluster, unit test coverage over 90%, and 30-day production monitoring.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 font-mono tabular-nums">₦ 4,500,000 NGN</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Dual Signed & Fulfilled</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-mono text-indigo-600 font-semibold">TR-84920</div>
              <h4 className="text-base font-bold text-slate-900">Security Audit & SOC2 Preparation</h4>
              <p className="text-xs text-slate-600">
                Counterparty: Kora Labs. Static analysis, AWS IAM privilege reduction, and terraform drift detection for high-compliance environment.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 font-mono tabular-nums">$3,800 USD</span>
                <span className="text-indigo-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmed & In-Progress</span>
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-mono text-indigo-600 font-semibold">TR-77102</div>
              <h4 className="text-base font-bold text-slate-900">Legal Document Automation System</h4>
              <p className="text-xs text-slate-600">
                Counterparty: Altus Advisory Partners. Automated contract generation and audit preservation system with role-based document access.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 font-mono tabular-nums">₦ 2,200,000 NGN</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Dual Signed & Fulfilled</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portable Trust Infrastructure & Future API Section */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Interoperability & Integrations
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Portable Trust Infrastructure for Marketplaces, Platforms, and Lenders.
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Reputation should not be locked into any single marketplace or closed walled garden. Aegis Trust provides a standardized attestation layer that external platforms can integrate:
              </p>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Scoped User Consent:</strong> Users explicitly authorize which evidence facets (e.g. CAC business standing, verified receipt count) are shared with a requesting client.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Cryptographic Attestation Tokens:</strong> Issue signed credentials verifiable without revealing underlying sensitive identity numbers or private chat logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Bilateral Webhook Updates:</strong> Notify integrated escrow services or hiring portals when an associated trust receipt is executed or disputed.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-slate-900 text-slate-100 rounded-xl p-6 font-mono text-xs overflow-x-auto shadow-xl border border-slate-800">
                <div className="text-slate-400 pb-3 border-b border-slate-800 text-[11px] flex items-center justify-between">
                  <span>GET /api/v1/verifiable-attestation/allenokoro</span>
                  <span className="text-emerald-400">200 OK</span>
                </div>
                <pre className="pt-3 text-[12px] leading-relaxed text-indigo-200">
{`{
  "subject": "allenokoro",
  "issuer": "https://aegis-trust.network",
  "attestation_type": "PortableTrustDossier",
  "claims": {
    "identity_status": "verified",
    "registry_match": "NIMC_NATIONAL_ID_BIOMETRIC_3D",
    "business_standing": {
      "cac_registration": "RC-1849204",
      "entity_name": "Aegis Tech Systems Ltd"
    },
    "confirmed_relationships": 8,
    "fulfilled_trust_receipts": 3,
    "active_disputes": 0
  },
  "signature": "0x7f4e91c...b28a9",
  "valid_until": "2027-10-18T00:00:00Z"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">
              Transparent Operating Standards
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transform transition-transform ${
                      activeFaq === idx ? 'rotate-90 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer & Compliance Notice */}
      <footer className="bg-white py-12 border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-xs">
                  A
                </span>
                <span>Aegis Trust Network</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Independent technology infrastructure for evidence-based digital credibility, verifiable credentials, and portable trust.
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-900 mb-3">Product Modules</div>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigateTab('evidence')} className="hover:text-slate-900">Trust Evidence Center</button></li>
                <li><button onClick={() => onNavigateTab('relationships')} className="hover:text-slate-900">Social Verification</button></li>
                <li><button onClick={() => onNavigateTab('receipts')} className="hover:text-slate-900">Trust Receipts</button></li>
                <li><button onClick={() => onNavigateTab('reputation')} className="hover:text-slate-900">Reputation Engine</button></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-slate-900 mb-3">Regulatory & Compliance</div>
              <ul className="space-y-2">
                <li><span className="text-slate-600">NDPR & GDPR Privacy by Design</span></li>
                <li><span className="text-slate-600">NIMC / CAC Direct Cross-Checks</span></li>
                <li><span className="text-slate-600">Data Subject Access & Export</span></li>
                <li><span className="text-slate-600">Zero Biometric Raw Storage</span></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-slate-900 mb-3">Public Profiles</div>
              <ul className="space-y-2">
                <li><button onClick={() => onExploreProfile('allenokoro')} className="hover:text-slate-900">Allen Okoro (Principal Architect)</button></li>
                <li><button onClick={() => onExploreProfile('sarah_adesina')} className="hover:text-slate-900">Sarah Adesina (Cloud Advisor)</button></li>
                <li><button onClick={() => onExploreProfile('fatimabello')} className="hover:text-slate-900">Fatima Bello (Logistics COO)</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              © 2026 Aegis Trust Network. All rights reserved. Operating as an independent trust infrastructure provider.
            </div>
            <div className="flex items-center gap-4">
              <span>Terms of Service</span>
              <span>·</span>
              <span>Privacy Policy</span>
              <span>·</span>
              <span>Security Architecture</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
