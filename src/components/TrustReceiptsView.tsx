import React, { useState } from 'react';
import { TrustReceipt, ReceiptStatus, User } from '../types/trust.js';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Check,
  FileText,
  AlertCircle,
  ExternalLink,
  Shield,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';

interface TrustReceiptsViewProps {
  user: User;
  receipts: TrustReceipt[];
  onCreateReceipt: (data: Partial<TrustReceipt>) => Promise<void>;
  onConfirmReceipt: (id: string) => Promise<void>;
  onCompleteReceipt: (id: string) => Promise<void>;
  onDisputeReceipt: (id: string, reason: string, description: string) => Promise<void>;
  onBack?: () => void;
}

export const TrustReceiptsView: React.FC<TrustReceiptsViewProps> = ({
  user,
  receipts,
  onCreateReceipt,
  onConfirmReceipt,
  onCompleteReceipt,
  onDisputeReceipt,
  onBack,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<TrustReceipt | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form states for create
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyContact, setCounterpartyContact] = useState('');
  const [interactionCategory, setInteractionCategory] = useState<TrustReceipt['interactionCategory']>('Freelance Project');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transactionValue, setTransactionValue] = useState('');
  const [completionConditions, setCompletionConditions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Unfulfilled Deliverables');
  const [disputeDesc, setDisputeDesc] = useState('');

  const filteredReceipts =
    filterStatus === 'all'
      ? receipts
      : receipts.filter((r) => r.status === filterStatus);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !counterpartyName || !completionConditions) return;
    setSubmitting(true);
    try {
      await onCreateReceipt({
        counterpartyName,
        counterpartyContact,
        interactionCategory,
        title,
        description,
        transactionValue,
        completionConditions,
        evidenceAttachments: [
          {
            name: `${title.toLowerCase().replace(/\s+/g, '_')}_spec.pdf`,
            date: new Date().toISOString().split('T')[0],
            size: '280 KB',
          },
        ],
      });
      setShowCreateModal(false);
      setTitle('');
      setCounterpartyName('');
      setCounterpartyContact('');
      setDescription('');
      setTransactionValue('');
      setCompletionConditions('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt || !disputeDesc) return;
    await onDisputeReceipt(selectedReceipt.id, disputeReason, disputeDesc);
    setShowDisputeModal(false);
    setSelectedReceipt(null);
  };

  const getStatusBadge = (status: ReceiptStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dual-Signed & Completed</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-indigo-700 font-medium text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Terms Executed (In Progress)</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting Counterparty Sign-Off</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 text-red-700 font-bold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Disputed Record</span>
          </span>
        );
      default:
        return <span className="text-slate-500 text-xs">Cancelled</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Documented Fulfillment
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trust Receipts</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Dual-signed records of agreements, services, deliveries, and transactions. Neither party can unilaterally fabricate a completed commitment.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Trust Receipt</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Receipts', count: receipts.length },
          { id: 'completed', label: 'Completed & Dual-Signed', count: receipts.filter((r) => r.status === 'completed').length },
          { id: 'confirmed', label: 'Confirmed / Active', count: receipts.filter((r) => r.status === 'confirmed').length },
          { id: 'pending', label: 'Pending Sign-Off', count: receipts.filter((r) => r.status === 'pending').length },
          { id: 'disputed', label: 'Disputed', count: receipts.filter((r) => r.status === 'disputed').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterStatus === tab.id
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono tabular-nums text-[11px] opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {filteredReceipts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No trust receipts found in this view.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                Draft First Receipt
              </button>
            </div>
          ) : (
            filteredReceipts.map((rc) => (
              <div
                key={rc.id}
                onClick={() => setSelectedReceipt(rc)}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs cursor-pointer"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 text-xs">{rc.id}</span>
                    <span className="font-bold text-slate-900 text-sm">{rc.title}</span>
                    {getStatusBadge(rc.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                    <span className="font-medium text-slate-700">{rc.interactionCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span>Counterparty: {rc.counterpartyName}</span>
                    {rc.transactionValue && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-slate-900">{rc.transactionValue}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Created {new Date(rc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-1">
                    {rc.completionConditions}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReceipt(rc);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                  >
                    Inspect Ledger Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Receipt Ledger Drawer / Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    {selectedReceipt.id}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Bilateral Trust Receipt
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedReceipt.title}</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedReceipt.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block">Category:</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.interactionCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Transaction Value:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceipt.transactionValue || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Initiated By:</span>
                  <span className="font-medium text-slate-800">{selectedReceipt.creatorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Counterparty:</span>
                  <span className="font-medium text-slate-800">{selectedReceipt.counterpartyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fulfillment Attested:</span>
                  <span className="font-medium text-slate-800">
                    {selectedReceipt.isFulfillmentConfirmed ? 'Yes (Dual Signed)' : 'Pending'}
                  </span>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">Scope of Commitment & Terms</div>
                <p className="text-slate-600 bg-white p-3 rounded border border-slate-200 leading-relaxed">
                  {selectedReceipt.description || 'Standard mutual agreement terms.'}
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">Defined Completion Conditions</div>
                <p className="text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed font-mono text-[11px]">
                  {selectedReceipt.completionConditions}
                </p>
              </div>

              {selectedReceipt.evidenceAttachments?.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-700 mb-2">Attached Milestone Records</div>
                  <div className="space-y-1.5">
                    {selectedReceipt.evidenceAttachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-medium text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{att.name}</span>
                        </span>
                        <span className="font-mono text-slate-400">{att.size || '320 KB'} · {att.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="font-semibold text-slate-700 mb-2">Immutable Milestone History</div>
                <div className="space-y-2">
                  {selectedReceipt.history?.map((h, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-100 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{h.event}</span>
                        <span className="font-mono tabular-nums text-slate-400">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-500">Signoff actor: {h.actor}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bilateral Action Controls (Sandbox Interactive!) */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium"
              >
                Raise Dispute / Flag
              </button>

              <div className="flex items-center gap-2">
                {selectedReceipt.status === 'pending' && (
                  <button
                    onClick={async () => {
                      await onConfirmReceipt(selectedReceipt.id);
                      setSelectedReceipt(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                  >
                    Simulate Counterparty Terms Confirmation
                  </button>
                )}

                {selectedReceipt.status === 'confirmed' && (
                  <button
                    onClick={async () => {
                      await onCompleteReceipt(selectedReceipt.id);
                      setSelectedReceipt(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Dual Sign-Off: Acknowledge Fulfillment</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Formal Receipt Dispute</span>
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Disputes are logged onto the public audit ledger. Please detail the unfulfilled commitments or discrepancies.
            </p>

            <form onSubmit={handleRaiseDispute} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dispute Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="Unfulfilled Deliverables">Unfulfilled Deliverables</option>
                  <option value="Late / Missing Milestone">Late / Missing Milestone</option>
                  <option value="Non-Payment / Partial Payment">Non-Payment / Partial Payment</option>
                  <option value="Material Breach of Specifications">Material Breach of Specifications</option>
                  <option value="Fraudulent Representation">Fraudulent Representation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Explanation</label>
                <textarea
                  required
                  rows={3}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Detail the timeline, specific unmet condition, and communications..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
                >
                  Record Formal Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Trust Receipt Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Bilateral Trust Receipt</h3>
                <p className="text-xs text-slate-500">Document a commitment with counterparty confirmation.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Commitment / Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Payment Microservice Architecture"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interaction Category</label>
                  <select
                    value={interactionCategory}
                    onChange={(e) => setInteractionCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Freelance Project">Freelance Project</option>
                    <option value="Goods Sale & Delivery">Goods Sale & Delivery</option>
                    <option value="Consulting Agreement">Consulting Agreement</option>
                    <option value="Service Contract">Service Contract</option>
                    <option value="Loan / Micro-credit Repayment">Loan / Micro-credit Repayment</option>
                    <option value="Property Lease">Property Lease</option>
                    <option value="Joint Venture">Joint Venture</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction Value (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionValue}
                    onChange={(e) => setTransactionValue(e.target.value)}
                    placeholder="e.g. ₦ 2,500,000 NGN or $3,500 USD"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Counterparty Individual or Org
                  </label>
                  <input
                    type="text"
                    required
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    placeholder="e.g. Horizon Global Freight"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Counterparty Contact
                  </label>
                  <input
                    type="text"
                    required
                    value={counterpartyContact}
                    onChange={(e) => setCounterpartyContact(e.target.value)}
                    placeholder="phone or email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scope of Agreement / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key deliverables, SLAs, or delivery specifications..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Defined Completion Conditions (Crucial)
                </label>
                <textarea
                  required
                  rows={2}
                  value={completionConditions}
                  onChange={(e) => setCompletionConditions(e.target.value)}
                  placeholder="State the exact measurable criteria required before this receipt can be finalized (e.g. staging cluster signoff, bill of lading confirmation)..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Issue Trust Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
