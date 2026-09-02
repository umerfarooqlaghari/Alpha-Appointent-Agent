"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Send, CheckCircle, FileText, Share2, PenTool, ArrowRight, X, MessageCircle, Loader2, UserCheck } from "lucide-react";
import { createQuoteAction, signQuoteAction, convertQuoteAction, getQuoteShareLinkAction } from "@/app/dashboard/[tenantId]/quotes/actions";
import { Lead } from "@/components/leads-client";

export interface QuoteItem {
  id?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface Quote {
  id: string;
  tenantId: string;
  leadId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: "draft" | "sent" | "approved" | "rejected" | "converted";
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  digitalSignature?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
}

export function QuotesClient({
  tenantId,
  initialQuotes,
  leads = []
}: {
  tenantId: string;
  initialQuotes: Quote[];
  leads?: Lead[];
}) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [shareData, setShareData] = useState<{ whatsappUrl: string; smsUrl: string; summaryText: string } | null>(null);
  const [signatureInput, setSignatureInput] = useState("");

  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);

  // Loading states for buttons
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isSigningQuote, setIsSigningQuote] = useState(false);
  const [isConvertingQuote, setIsConvertingQuote] = useState(false);
  const [fetchingShareId, setFetchingShareId] = useState<string | null>(null);

  // New quote form state
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [taxRate, setTaxRate] = useState<number>(10);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<QuoteItem[]>([
    { itemName: "Initial Service Consultation", quantity: 1, unitPrice: 150 },
  ]);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setCustomerName(lead.name);
      setCustomerPhone(lead.phone);
      setCustomerEmail(lead.email || "");
    }
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { itemName: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calculatedSubtotal = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
  const calculatedTax = Math.round(calculatedSubtotal * (taxRate / 100) * 100) / 100;
  const calculatedTotal = Math.max(0, calculatedSubtotal + calculatedTax - discountAmount);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingQuote(true);
    try {
      const newQuote = await createQuoteAction(tenantId, {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        taxRate,
        discountAmount,
        items
      });

      if (newQuote) {
        setQuotes((prev) => [newQuote as Quote, ...prev]);
      }
      setIsCreateOpen(false);
      setSelectedLeadId("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setItems([{ itemName: "Initial Service Consultation", quantity: 1, unitPrice: 150 }]);
    } catch (err: unknown) {
      console.error("Failed to create quote", err);
      alert(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleSignQuote = async (quoteId: string) => {
    if (!signatureInput.trim()) return;
    setIsSigningQuote(true);
    try {
      const updated = await signQuoteAction(tenantId, quoteId, signatureInput) as Quote;
      if (updated) {
        setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updated : q)));
        if (selectedQuote?.id === quoteId) setSelectedQuote(updated);
      }
      setSignatureInput("");
    } catch (err: unknown) {
      console.error("Sign quote failed", err);
      alert(err instanceof Error ? err.message : "Sign quote failed");
    } finally {
      setIsSigningQuote(false);
    }
  };

  const handleConvertToOrder = async (quoteId: string) => {
    setIsConvertingQuote(true);
    try {
      await convertQuoteAction(tenantId, quoteId);
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: "converted" } : q))
      );
      if (selectedQuote?.id === quoteId) {
        setSelectedQuote((prev) => (prev ? { ...prev, status: "converted" } : null));
      }
    } catch (err: unknown) {
      console.error("Convert to order failed", err);
      alert(err instanceof Error ? err.message : "Convert to order failed");
    } finally {
      setIsConvertingQuote(false);
    }
  };

  const handleFetchShareLink = async (quoteId: string) => {
    setFetchingShareId(quoteId);
    try {
      const data = await getQuoteShareLinkAction(tenantId, quoteId);
      setShareData(data);
    } catch (err: unknown) {
      console.error("Fetch share link failed", err);
      alert(err instanceof Error ? err.message : "Fetch share link failed");
    } finally {
      setFetchingShareId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Approved</span>;
      case "converted":
        return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">Converted</span>;
      case "sent":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Sent</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">PROPOSALS & ESTIMATES</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Quotes & Estimates</h2>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#080C42]"
        >
          <Plus size={16} /> Create Dynamic Estimate
        </button>
      </div>

      {/* Quotes Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Estimate ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-stone-400">
                    No quotes or estimates created yet.
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-stone-900">
                      #{quote.id.substring(0, 8)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-stone-900">{quote.customerName}</div>
                      <div className="text-xs text-stone-500 font-mono">{quote.customerPhone}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-stone-600">
                      {quote.items?.length || 0} Line Items
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-stone-900">
                      ${quote.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(quote.status)}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleFetchShareLink(quote.id)}
                        disabled={fetchingShareId === quote.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
                      >
                        {fetchingShareId === quote.id ? (
                          <Loader2 size={13} className="animate-spin text-[#071D75]" />
                        ) : (
                          <Share2 size={13} />
                        )}
                        Share Link
                      </button>
                      <button
                        onClick={() => setSelectedQuote(quote)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
                      >
                        <FileText size={13} /> View & Sign
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quote Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#080C42] flex items-center gap-2">
                <FileText className="text-[#071D75]" size={18} /> Dynamic Estimate Generator
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-5">
              {/* Optional Lead Selector */}
              {leads.length > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-1.5">
                  <label className="block text-xs font-bold text-[#080C42] uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={14} className="text-[#071D75]" /> Select Customer from Existing Leads (Optional)
                  </label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => handleSelectLead(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  >
                    <option value="">-- Manual Entry (New Customer) --</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} • {lead.phone} {lead.email ? `(${lead.email})` : ""} {lead.callLogIdentifier ? `[Ref: ${lead.callLogIdentifier}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Phone (SMS/WhatsApp)</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@acme.com"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </div>
              </div>

              {/* Itemized Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Itemized Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-[#071D75] hover:underline"
                  >
                    <Plus size={14} /> Add Item Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <input
                        type="text"
                        placeholder="Item name / Service"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                        required
                        className="flex-3 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#071D75] focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        required
                        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-[#071D75] focus:outline-none"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                        required
                        className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 font-mono focus:border-[#071D75] focus:outline-none"
                      />
                      <span className="w-20 text-right font-mono text-xs font-bold text-slate-700">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax, Discount, Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-1/2">
                      <label className="block text-xs font-semibold text-slate-700">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#071D75] focus:outline-none"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs font-semibold text-slate-700">Discount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#071D75] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Terms & Client Notes</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Valid for 30 days. 50% deposit required on start..."
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#071D75] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">${calculatedSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({taxRate}%):</span>
                    <span className="font-mono">${calculatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                    <span>Total Estimate:</span>
                    <span className="font-mono text-[#071D75]">${calculatedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuote}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingQuote && <Loader2 size={16} className="animate-spin" />}
                  Generate Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Links Modal */}
      {shareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#080C42]">
                <Share2 size={18} className="text-[#071D75]" /> Share Approval Link
              </h3>
              <button onClick={() => setShareData(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-700 whitespace-pre-wrap">
              {shareData.summaryText}
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={shareData.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 shadow-xs"
              >
                <MessageCircle size={16} /> Send via WhatsApp
              </a>
              <a
                href={shareData.smsUrl}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Send size={16} /> Send via SMS
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Detail & Signature Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#080C42]">Estimate #{selectedQuote.id.substring(0, 8)}</h3>
                <p className="text-xs text-slate-500">{selectedQuote.customerName} • {selectedQuote.customerPhone}</p>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Line items summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items Summary</h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {selectedQuote.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 text-sm text-slate-800">
                    <span>{item.itemName} (x{item.quantity})</span>
                    <span className="font-mono">${(item.totalPrice || item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount:</span>
                  <span className="font-mono text-[#071D75]">${selectedQuote.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Digital Signature section */}
            <div className="space-y-2.5 rounded-lg border border-stone-200 bg-stone-50 p-3.5">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool size={14} /> Client Digital Signature
              </h4>

              {selectedQuote.digitalSignature ? (
                <div className="space-y-1">
                  <p className="text-xs text-emerald-700 font-medium">Signed digitally on {new Date(selectedQuote.signedAt || "").toLocaleString()}:</p>
                  <div className="font-serif italic text-lg text-stone-900 p-2.5 bg-white rounded border border-stone-200">
                    &quot;{selectedQuote.digitalSignature}&quot;
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={signatureInput}
                    onChange={(e) => setSignatureInput(e.target.value)}
                    placeholder="Type full legal name as signature..."
                    className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSignQuote(selectedQuote.id)}
                    disabled={isSigningQuote}
                    className="inline-flex items-center justify-center gap-2 w-full rounded bg-stone-900 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    {isSigningQuote && <Loader2 size={14} className="animate-spin" />}
                    Sign & Approve Proposal
                  </button>
                </div>
              )}
            </div>

            {/* Convert to Order */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              {selectedQuote.status === "converted" ? (
                <span className="text-sm font-semibold text-[#071D75] flex items-center gap-1.5">
                  <CheckCircle size={16} /> Active Order Converted
                </span>
              ) : (
                <button
                  onClick={() => handleConvertToOrder(selectedQuote.id)}
                  disabled={isConvertingQuote}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2 text-sm font-bold text-white hover:bg-[#080C42] shadow-sm transition-all disabled:opacity-50"
                >
                  {isConvertingQuote ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  Convert to Active Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
