"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Share2,
  FileText,
  DollarSign,
  CheckCircle2,
  X,
  MessageCircle,
  Send,
  Loader2,
  Calendar,
  Layers,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Ban
} from "lucide-react";
import { Lead } from "@/components/leads-client";
import { Quote } from "@/components/quotes-client";
import { UnifiedOrder } from "@/components/sales-orders-client";
import {
  createInvoiceAction,
  recordPaymentAction,
  sendPaymentLinkAction,
  flagBadDebtAction,
  deleteInvoiceAction,
  type InvoiceItemDto
} from "@/app/dashboard/[tenantId]/invoices/actions";

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderId?: string;
  quoteId?: string;
  leadId?: string;
  invoiceType: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  depositRequired: number;
  amountPaid: number;
  status: "unpaid" | "partially_paid" | "paid" | "overdue" | "bad_debt" | "cancelled";
  dueDate: string;
  paymentLink?: string;
  paymentGateway?: string;
  lastReminderSentAt?: string;
  dunningStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

export function InvoicesClient({
  tenantId,
  initialInvoices,
  leads = [],
  quotes = [],
  orders = []
}: {
  tenantId: string;
  initialInvoices: Invoice[];
  leads?: Lead[];
  quotes?: Quote[];
  orders?: UnifiedOrder[];
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [receiptModalPayment, setReceiptModalPayment] = useState<{ payment: InvoicePayment; invoice: Invoice } | null>(null);
  const [shareData, setShareData] = useState<{ invoiceNumber: string; paymentLink: string; summaryText: string; whatsappUrl: string; smsUrl: string } | null>(null);

  useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);

  // Loading states
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [fetchingShareId, setFetchingShareId] = useState<string | null>(null);
  const [flaggingBadDebtId, setFlaggingBadDebtId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form states
  const [sourceType, setSourceType] = useState<"manual" | "lead" | "quote" | "order">("manual");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [invoiceType, setInvoiceType] = useState<string>("one_time");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [depositPercent, setDepositPercent] = useState<number>(100);
  const [customDeposit, setCustomDeposit] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItemDto[]>([
    { itemName: "Consulting & Implementation Service", quantity: 1, unitPrice: 350 }
  ]);

  // Payment recording form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");

  const calculatedSubtotal = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
  const calculatedTotal = Math.max(0, calculatedSubtotal + taxAmount - discountAmount);
  const calculatedDeposit = depositPercent === 100 ? calculatedTotal : Math.round(calculatedTotal * (depositPercent / 100) * 100) / 100;

  // Handle lead import
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

  // Handle quote import
  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    if (!quoteId) return;
    const quote = quotes.find((q) => q.id === quoteId);
    if (quote) {
      setCustomerName(quote.customerName);
      setCustomerPhone(quote.customerPhone);
      setCustomerEmail(quote.customerEmail || "");
      setTaxAmount(quote.taxAmount || 0);
      setDiscountAmount(quote.discountAmount || 0);
      if (quote.items && quote.items.length > 0) {
        setItems(quote.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity, unitPrice: i.unitPrice })));
      }
    }
  };

  // Handle order import
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) return;
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setCustomerName(order.customerName);
      setCustomerPhone(order.customerPhone);
      if (order.items && order.items.length > 0) {
        setItems(order.items.map((i) => ({ itemName: i.name, quantity: i.quantity, unitPrice: i.unitPrice })));
      }
    }
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { itemName: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof InvoiceItemDto, value: string | number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingInvoice(true);
    try {
      const depositVal = customDeposit > 0 ? customDeposit : calculatedDeposit;
      const newInv = await createInvoiceAction(tenantId, {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        orderId: selectedOrderId || undefined,
        quoteId: selectedQuoteId || undefined,
        leadId: selectedLeadId || undefined,
        invoiceType,
        taxAmount,
        discountAmount,
        depositRequired: depositVal,
        dueDate: new Date(dueDate).toISOString(),
        notes: notes || undefined,
        items
      }) as Invoice;

      if (newInv) {
        setInvoices((prev) => [newInv, ...prev]);
      }
      setIsCreateOpen(false);
      // Reset
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setSelectedLeadId("");
      setSelectedQuoteId("");
      setSelectedOrderId("");
      setTaxAmount(0);
      setDiscountAmount(0);
      setNotes("");
      setItems([{ itemName: "Consulting & Implementation Service", quantity: 1, unitPrice: 350 }]);
    } catch (err: unknown) {
      console.error("Failed to create invoice", err);
      alert(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setPaymentModalInvoice(invoice);
    const balance = Math.max(0, invoice.totalAmount - invoice.amountPaid);
    // If no payment made yet and deposit required, suggest deposit amount, else full balance
    if (invoice.amountPaid === 0 && invoice.depositRequired > 0 && invoice.depositRequired < invoice.totalAmount) {
      setPaymentAmount(invoice.depositRequired);
    } else {
      setPaymentAmount(balance);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    setIsRecordingPayment(true);
    try {
      const res = await recordPaymentAction(tenantId, paymentModalInvoice.id, {
        amount: paymentAmount,
        paymentMethod
      }) as { invoice: Invoice; payment: InvoicePayment };

      if (res && res.invoice) {
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === paymentModalInvoice.id
              ? {
                  ...i,
                  ...res.invoice,
                  payments: [res.payment, ...(i.payments || [])]
                }
              : i
          )
        );
        setPaymentModalInvoice(null);
        setReceiptModalPayment({ payment: res.payment, invoice: res.invoice });
      }
    } catch (err: unknown) {
      console.error("Record payment failed", err);
      alert(err instanceof Error ? err.message : "Record payment failed");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleSendPaymentLink = async (invoiceId: string) => {
    setFetchingShareId(invoiceId);
    try {
      const data = await sendPaymentLinkAction(tenantId, invoiceId);
      setShareData(data);
    } catch (err: unknown) {
      console.error("Send link failed", err);
      alert(err instanceof Error ? err.message : "Send link failed");
    } finally {
      setFetchingShareId(null);
    }
  };

  const handleFlagBadDebt = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to flag this invoice as Bad Debt / Write-Off?")) return;
    setFlaggingBadDebtId(invoiceId);
    try {
      const updated = await flagBadDebtAction(tenantId, invoiceId) as Invoice;
      if (updated) {
        setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, status: "bad_debt" } : i)));
      }
    } catch (err: unknown) {
      console.error("Flag bad debt failed", err);
      alert(err instanceof Error ? err.message : "Flag bad debt failed");
    } finally {
      setFlaggingBadDebtId(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    setIsDeletingId(invoiceId);
    try {
      await deleteInvoiceAction(tenantId, invoiceId);
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
      if (selectedInvoice?.id === invoiceId) setSelectedInvoice(null);
    } catch (err: unknown) {
      console.error("Delete invoice failed", err);
      alert(err instanceof Error ? err.message : "Delete invoice failed");
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredInvoices = invoices.filter((i) => {
    if (activeTab === "all") return true;
    return i.status === activeTab;
  });

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">Paid in Full</span>;
      case "partially_paid":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">Partially Paid / Deposit</span>;
      case "overdue":
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">Overdue</span>;
      case "bad_debt":
        return <span className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-semibold text-stone-200 border border-stone-800">Bad Debt</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">Unpaid</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">FINANCE & BILLING</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Invoicing & Billing</h2>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#080C42]"
        >
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoiced</p>
            <h3 className="text-2xl font-extrabold text-[#080C42] mt-1">${totalInvoiced.toFixed(2)}</h3>
            <p className="text-xs text-slate-500 mt-1">{invoices.length} invoices generated</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-[#071D75] border border-blue-100">
            <FileText size={24} />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Collected Revenue</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">${totalCollected.toFixed(2)}</h3>
            <p className="text-xs text-emerald-700 font-medium mt-1">Settled & deposited</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 border border-emerald-100">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Outstanding Balance</p>
            <h3 className="text-2xl font-extrabold text-amber-700 mt-1">${totalOutstanding.toFixed(2)}</h3>
            <p className="text-xs text-amber-700 font-medium mt-1">Pending payments</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-amber-700 border border-amber-100">
            <Receipt size={24} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-stone-200 bg-stone-100 p-1.5">
        {["all", "unpaid", "partially_paid", "paid", "overdue", "bad_debt"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold uppercase transition ${
              activeTab === tab
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:bg-stone-200/60"
            }`}
          >
            {tab.replace(/_/g, " ")} ({invoices.filter((i) => tab === "all" || i.status === tab).length})
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Total / Paid</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-stone-400">
                    No invoices found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const remaining = Math.max(0, invoice.totalAmount - invoice.amountPaid);
                  return (
                    <tr key={invoice.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-stone-900">
                        {invoice.invoiceNumber}
                        <div className="text-[10px] text-stone-400 font-sans capitalize">{invoice.invoiceType.replace(/_/g, " ")}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-stone-900">{invoice.customerName}</div>
                        <div className="text-xs text-stone-500 font-mono">{invoice.customerPhone}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-stone-600 font-mono">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-stone-900 font-mono">${invoice.totalAmount.toFixed(2)}</div>
                        <div className="text-xs text-emerald-700 font-mono">Paid: ${invoice.amountPaid.toFixed(2)}</div>
                        {remaining > 0 && <div className="text-[11px] text-amber-700 font-mono">Bal: ${remaining.toFixed(2)}</div>}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(invoice.status)}</td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleSendPaymentLink(invoice.id)}
                          disabled={fetchingShareId === invoice.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs disabled:opacity-50"
                        >
                          {fetchingShareId === invoice.id ? <Loader2 size={12} className="animate-spin text-[#071D75]" /> : <Share2 size={12} />}
                          Pay Link
                        </button>
                        {invoice.status !== "paid" && (
                          <button
                            onClick={() => handleOpenPaymentModal(invoice)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#071D75] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#080C42] shadow-xs"
                          >
                            <DollarSign size={12} /> Pay / Deposit
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="inline-flex items-center gap-1 rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 shadow-xs"
                        >
                          <FileText size={12} /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#080C42] flex items-center gap-2">
                <FileText className="text-[#071D75]" size={18} /> Generate Invoice
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-5">
              {/* Source Mode Selector */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                <label className="block text-xs font-bold text-[#080C42] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-[#071D75]" /> Reference Sales Module (Pre-fill Items & Customer)
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSourceType("manual")}
                    className={`rounded-lg p-1.5 font-semibold transition border ${sourceType === "manual" ? "bg-[#080C42] text-white border-[#080C42]" : "bg-white text-slate-700 border-slate-200"}`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("lead")}
                    className={`rounded-lg p-1.5 font-semibold transition border ${sourceType === "lead" ? "bg-[#080C42] text-white border-[#080C42]" : "bg-white text-slate-700 border-slate-200"}`}
                  >
                    From Lead ({leads.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("quote")}
                    className={`rounded-lg p-1.5 font-semibold transition border ${sourceType === "quote" ? "bg-[#080C42] text-white border-[#080C42]" : "bg-white text-slate-700 border-slate-200"}`}
                  >
                    From Quote ({quotes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("order")}
                    className={`rounded-lg p-1.5 font-semibold transition border ${sourceType === "order" ? "bg-[#080C42] text-white border-[#080C42]" : "bg-white text-slate-700 border-slate-200"}`}
                  >
                    From Order ({orders.length})
                  </button>
                </div>

                {/* Sub-selectors */}
                {sourceType === "lead" && leads.length > 0 && (
                  <select
                    value={selectedLeadId}
                    onChange={(e) => handleSelectLead(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} • {l.phone}</option>
                    ))}
                  </select>
                )}

                {sourceType === "quote" && quotes.length > 0 && (
                  <select
                    value={selectedQuoteId}
                    onChange={(e) => handleSelectQuote(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="">-- Choose Quote/Estimate --</option>
                    {quotes.map((q) => (
                      <option key={q.id} value={q.id}>#{q.id.substring(0, 7)} - {q.customerName} (${q.totalAmount.toFixed(2)})</option>
                    ))}
                  </select>
                )}

                {sourceType === "order" && orders.length > 0 && (
                  <select
                    value={selectedOrderId}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="">-- Choose Unified Order --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>#{o.id.substring(0, 7)} - {o.customerName} (${o.totalAmount.toFixed(2)})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Customer Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Customer Phone</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Email (Optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Billing Parameters: Type, Due Date, Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Invoice Frequency</label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  >
                    <option value="one_time">One-Time Invoice</option>
                    <option value="recurring_monthly">Recurring (Monthly)</option>
                    <option value="recurring_yearly">Recurring (Yearly)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Upfront Deposit Required</label>
                  <select
                    value={depositPercent}
                    onChange={(e) => {
                      const p = parseInt(e.target.value);
                      setDepositPercent(p);
                      setCustomDeposit(0);
                    }}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  >
                    <option value={100}>100% (Full Payment)</option>
                    <option value={50}>50% Upfront Deposit</option>
                    <option value={25}>25% Upfront Deposit</option>
                    <option value={20}>20% Upfront Deposit</option>
                    <option value={0}>Custom Deposit ($)</option>
                  </select>
                </div>
              </div>

              {depositPercent === 0 && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Custom Deposit Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customDeposit}
                    onChange={(e) => setCustomDeposit(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-mono text-stone-900 focus:outline-none"
                  />
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-[#071D75] hover:underline"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Description of item or service"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none"
                      />
                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none text-center"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none text-right font-mono"
                        />
                      </div>
                      <div className="w-20 text-right font-mono text-sm font-semibold text-slate-900">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Tax ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Discount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">${calculatedSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span className="font-mono">+${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[#071D75] font-bold">${calculatedTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-[#080C42] bg-blue-50 p-2 rounded-lg border border-blue-200">
                    <span>Upfront Deposit:</span>
                    <span className="font-mono">${(customDeposit > 0 ? customDeposit : calculatedDeposit).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvoice}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingInvoice && <Loader2 size={16} className="animate-spin" />}
                  Generate & Activate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment / Deposit Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="text-emerald-700" size={18} /> Record Payment / Deposit
              </h3>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Invoice:</span>
                  <span className="font-mono font-bold text-stone-900">{paymentModalInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer:</span>
                  <span className="font-semibold text-stone-900">{paymentModalInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Remaining Balance:</span>
                  <span className="font-mono font-bold text-amber-700">${(paymentModalInvoice.totalAmount - paymentModalInvoice.amountPaid).toFixed(2)}</span>
                </div>
                {paymentModalInvoice.depositRequired > 0 && paymentModalInvoice.amountPaid === 0 && (
                  <div className="flex justify-between text-[#071D75] font-semibold pt-1 border-t border-slate-200">
                    <span>Deposit Goal:</span>
                    <span className="font-mono">${paymentModalInvoice.depositRequired.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={paymentModalInvoice.totalAmount - paymentModalInvoice.amountPaid}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-lg font-mono font-bold text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash / POS In-Person</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="local_gateway">Local Payment Gateway</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isRecordingPayment && <Loader2 size={16} className="animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {shareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#080C42]">
                <Share2 size={18} className="text-[#071D75]" /> Share Direct Payment Link
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
                className="flex items-center justify-center gap-2 w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 shadow-xs"
              >
                <MessageCircle size={16} /> Send via WhatsApp
              </a>
              <a
                href={shareData.smsUrl}
                className="flex items-center justify-center gap-2 w-full rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                <Send size={16} /> Send via SMS
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {receiptModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck size={20} />
                <h3 className="text-lg font-bold text-stone-900">Payment Receipt</h3>
              </div>
              <button onClick={() => setReceiptModalPayment(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3 text-center">
              <p className="text-xs uppercase font-bold text-emerald-800 tracking-wider">Payment Confirmed</p>
              <h2 className="text-3xl font-extrabold text-stone-900 font-mono">${receiptModalPayment.payment.amount.toFixed(2)}</h2>
              <p className="text-xs text-stone-500">
                Transaction Ref: <span className="font-mono font-bold text-stone-700">{receiptModalPayment.payment.transactionReference}</span>
              </p>
            </div>

            <div className="space-y-2 text-xs border-t border-stone-200 pt-3">
              <div className="flex justify-between text-stone-600">
                <span>Invoice Number:</span>
                <span className="font-mono font-bold text-stone-900">{receiptModalPayment.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Billed To:</span>
                <span className="font-semibold text-stone-900">{receiptModalPayment.invoice.customerName}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Payment Method:</span>
                <span className="capitalize font-medium text-stone-900">{receiptModalPayment.payment.paymentMethod.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Timestamp:</span>
                <span className="font-mono">{new Date(receiptModalPayment.payment.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setReceiptModalPayment(null)}
                className="w-full rounded-md bg-stone-900 py-2 text-sm font-semibold text-white hover:bg-stone-800"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-5">
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-xl font-bold text-stone-900">{selectedInvoice.invoiceNumber}</h3>
                <p className="text-xs text-stone-500">{selectedInvoice.customerName} • {selectedInvoice.customerPhone}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Itemized Line Items</h4>
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-stone-50 p-3">
                {selectedInvoice.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 text-sm text-stone-800">
                    <span>{item.itemName} (x{item.quantity})</span>
                    <span className="font-mono">${(item.totalPrice || item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount:</span>
                  <span className="font-mono text-[#071D75]">${selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Payment & Deposit History</h4>
              {(!selectedInvoice.payments || selectedInvoice.payments.length === 0) ? (
                <p className="text-xs text-stone-400 italic">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedInvoice.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs">
                      <div>
                        <span className="font-semibold text-emerald-900 capitalize">{p.paymentMethod.replace(/_/g, " ")} Payment</span>
                        <p className="text-[11px] text-stone-500 font-mono">{new Date(p.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-800 text-sm">${p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Bad debt / delete */}
            <div className="flex items-center justify-between border-t border-stone-200 pt-3">
              <div className="flex gap-2">
                {selectedInvoice.status !== "bad_debt" && selectedInvoice.status !== "paid" && (
                  <button
                    onClick={() => handleFlagBadDebt(selectedInvoice.id)}
                    disabled={flaggingBadDebtId === selectedInvoice.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    {flaggingBadDebtId === selectedInvoice.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                    Flag Bad Debt
                  </button>
                )}
                <button
                  onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                  disabled={isDeletingId === selectedInvoice.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  {isDeletingId === selectedInvoice.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
              </div>

              {selectedInvoice.status !== "paid" && (
                <button
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    handleOpenPaymentModal(inv);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#071D75] px-4 py-2 text-sm font-bold text-white hover:bg-[#080C42] shadow-sm transition-all"
                >
                  <DollarSign size={14} /> Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
