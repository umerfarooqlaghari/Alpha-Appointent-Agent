"use client";

import React, { useState } from "react";
import {
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  Share2,
  Ban,
  MessageCircle,
  X
} from "lucide-react";
import { triggerDunningCycleAction } from "@/app/dashboard/[tenantId]/receivables/actions";
import { sendPaymentLinkAction, flagBadDebtAction } from "@/app/dashboard/[tenantId]/invoices/actions";

export interface AgingBucket {
  bucketName: string;
  amount: number;
  invoiceCount: number;
}

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  totalAmount: number;
  amountPaid: number;
  unpaidBalance: number;
  status: string;
  dueDate: string;
  daysPastDue: number;
  paymentLink?: string;
  lastReminderSentAt?: string;
  dunningStatus: string;
  createdAt: string;
}

export interface ReceivablesSummaryResponse {
  totalOutstanding: number;
  totalOverdue: number;
  totalUnpaidCount: number;
  overdueCount: number;
  agingReport: AgingBucket[];
  overdueInvoices: OverdueInvoice[];
}

export function ReceivablesClient({
  tenantId,
  initialData
}: {
  tenantId: string;
  initialData: ReceivablesSummaryResponse;
}) {
  const [data, setData] = useState<ReceivablesSummaryResponse>(initialData);
  const [isTriggeringDunning, setIsTriggeringDunning] = useState(false);
  const [dunningResultMessage, setDunningResultMessage] = useState<string | null>(null);
  const [shareData, setShareData] = useState<{ invoiceNumber: string; paymentLink: string; summaryText: string; whatsappUrl: string; smsUrl: string } | null>(null);
  const [sendingLinkId, setSendingLinkId] = useState<string | null>(null);
  const [flaggingBadDebtId, setFlaggingBadDebtId] = useState<string | null>(null);

  const handleTriggerDunning = async () => {
    setIsTriggeringDunning(true);
    try {
      const res = await triggerDunningCycleAction(tenantId);
      if (res) {
        setDunningResultMessage(res.message);
        // Refresh local data state
        setData((prev) => ({
          ...prev,
          overdueInvoices: prev.overdueInvoices.map((inv) => ({
            ...inv,
            lastReminderSentAt: new Date().toISOString(),
            dunningStatus: inv.daysPastDue >= 30 ? "escalated" : inv.daysPastDue > 0 ? "reminded_overdue" : "reminded_pre_due"
          }))
        }));
      }
    } catch (err: unknown) {
      console.error("Dunning trigger failed", err);
      alert(err instanceof Error ? err.message : "Dunning trigger failed");
    } finally {
      setIsTriggeringDunning(false);
    }
  };

  const handleSendPaymentLink = async (invoiceId: string) => {
    setSendingLinkId(invoiceId);
    try {
      const res = await sendPaymentLinkAction(tenantId, invoiceId);
      setShareData(res);
    } catch (err: unknown) {
      console.error("Send link failed", err);
      alert(err instanceof Error ? err.message : "Send link failed");
    } finally {
      setSendingLinkId(null);
    }
  };

  const handleFlagBadDebt = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to write off this balance as Bad Debt?")) return;
    setFlaggingBadDebtId(invoiceId);
    try {
      await flagBadDebtAction(tenantId, invoiceId);
      setData((prev) => ({
        ...prev,
        overdueInvoices: prev.overdueInvoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: "bad_debt", dunningStatus: "written_off" } : inv
        )
      }));
    } catch (err: unknown) {
      console.error("Flag bad debt failed", err);
      alert(err instanceof Error ? err.message : "Flag bad debt failed");
    } finally {
      setFlaggingBadDebtId(null);
    }
  };

  const getDunningBadge = (status: string, daysPastDue: number) => {
    if (status === "written_off") {
      return <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[11px] font-bold text-stone-200">Written Off</span>;
    }
    if (status === "escalated" || daysPastDue >= 30) {
      return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 border border-rose-300">Escalated Dunning</span>;
    }
    if (status === "reminded_overdue") {
      return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">Overdue Reminded</span>;
    }
    if (status === "reminded_pre_due") {
      return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-300">Pre-Due Reminded</span>;
    }
    return <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 border border-stone-200">Pending Dunning</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">ACCOUNTS RECEIVABLE & DUNNING</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">Accounts Receivable Aging</h2>
        </div>
        <button
          onClick={handleTriggerDunning}
          disabled={isTriggeringDunning}
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50"
        >
          {isTriggeringDunning ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Run Automated Dunning Cycle
        </button>
      </div>

      {/* Dunning Notification Alert */}
      {dunningResultMessage && (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-semibold text-teal-900">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-teal-700 shrink-0" />
            <span>{dunningResultMessage}</span>
          </div>
          <button onClick={() => setDunningResultMessage(null)} className="text-teal-700 hover:text-teal-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* 5 Aging Buckets Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data.agingReport.map((bucket, idx) => {
          const isOverdue = idx > 0;
          return (
            <div
              key={bucket.bucketName}
              className={`rounded-xl border p-4 shadow-xs space-y-1 ${
                idx === 0
                  ? "border-emerald-200 bg-emerald-50/50"
                  : idx === 1
                  ? "border-amber-200 bg-amber-50/50"
                  : idx === 2
                  ? "border-orange-200 bg-orange-50/50"
                  : idx === 3
                  ? "border-rose-200 bg-rose-50/50"
                  : "border-purple-200 bg-purple-50/50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-600">
                <span className="truncate">{bucket.bucketName}</span>
                {isOverdue && <AlertTriangle size={12} className="text-rose-600 shrink-0" />}
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 font-mono">
                ${bucket.amount.toFixed(2)}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {bucket.invoiceCount} invoices
              </p>
            </div>
          );
        })}
      </div>

      {/* Overdue & Unpaid Invoices Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Active Receivable Balances & Dunning Queue</h3>
            <p className="text-xs text-stone-500">Evaluates overdue timelines for automatic SMS/Email reminders (3 days before due & 2 days after due)</p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            Total Overdue: ${data.totalOverdue.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Aging Status</th>
                <th className="px-5 py-3.5">Unpaid Balance</th>
                <th className="px-5 py-3.5">Dunning Lifecycle</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.overdueInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-stone-400">
                    No outstanding accounts receivable. All balances are fully settled!
                  </td>
                </tr>
              ) : (
                data.overdueInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-stone-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-stone-900">{inv.customerName}</div>
                      <div className="text-xs text-stone-500 font-mono">{inv.customerPhone}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-stone-600 font-mono">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.daysPastDue <= 0 ? (
                        <span className="text-xs font-medium text-emerald-700 font-mono">Current (in {Math.abs(inv.daysPastDue)}d)</span>
                      ) : (
                        <span className="text-xs font-bold text-rose-700 font-mono">{inv.daysPastDue} days overdue</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-stone-900">
                      ${inv.unpaidBalance.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      {getDunningBadge(inv.dunningStatus, inv.daysPastDue)}
                      {inv.lastReminderSentAt && (
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                          Last sent: {new Date(inv.lastReminderSentAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleSendPaymentLink(inv.id)}
                        disabled={sendingLinkId === inv.id}
                        className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs disabled:opacity-50"
                      >
                        {sendingLinkId === inv.id ? <Loader2 size={12} className="animate-spin text-teal-600" /> : <Share2 size={12} />}
                        Send Reminder
                      </button>
                      {inv.status !== "bad_debt" && (
                        <button
                          onClick={() => handleFlagBadDebt(inv.id)}
                          disabled={flaggingBadDebtId === inv.id}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs disabled:opacity-50"
                        >
                          {flaggingBadDebtId === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                          Bad Debt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Reminder Modal */}
      {shareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Share2 size={18} className="text-teal-700" /> Dispatch Dunning Reminder
              </h3>
              <button onClick={() => setShareData(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs font-mono text-stone-700 whitespace-pre-wrap">
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
    </div>
  );
}
