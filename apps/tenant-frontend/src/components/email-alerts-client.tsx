"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  AlertTriangle,
  TrendingUp,
  Search,
  Trash2,
  Eye,
  Loader2,
  X,
  CheckCircle2,
  FileSpreadsheet,
  UserCheck,
  Calendar,
  Briefcase,
  ChevronRight
} from "lucide-react";
import {
  sendConfirmationEmailAction,
  generateDigestEmailAction,
  triggerEscalationAlertAction,
  notifyStaffFulfillmentAction,
  notifyStaffTaskAction,
  notifyStaffShiftAction,
  deleteEmailLogAction
} from "@/app/dashboard/[tenantId]/email-alerts/actions";
import type { ServiceFulfillmentItem } from "@/components/fulfillment-client";
import type { StaffMemberItem, StaffShiftItem, DispatchTaskItem } from "@/components/dispatch-client";

export interface EmailLogItem {
  id: string;
  tenantId: string;
  emailType: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyPreview: string;
  status: string;
  triggeredBy: string;
  sentAt: string;
  createdAt: string;
}

export interface EmailAlertsData {
  totalLogs: number;
  confirmationCount: number;
  digestCount: number;
  escalationCount: number;
  logs: EmailLogItem[];
}

type ActionModalType = "staff_job" | "staff_task" | "staff_shift" | "customer_conf" | "digest" | "escalation";

export function EmailAlertsClient({
  tenantId,
  initialData,
  staffMembers = [],
  fulfillments = [],
  tasks = [],
  shifts = []
}: {
  tenantId: string;
  initialData: EmailAlertsData;
  staffMembers?: StaffMemberItem[];
  fulfillments?: ServiceFulfillmentItem[];
  tasks?: DispatchTaskItem[];
  shifts?: StaffShiftItem[];
}) {
  const [data, setData] = useState<EmailAlertsData>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Single Unified Modal state
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<ActionModalType>("staff_job");
  const [selectedPreviewLog, setSelectedPreviewLog] = useState<EmailLogItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form states - Customer Confirmation
  const [confRecipientEmail, setConfRecipientEmail] = useState("");
  const [confRecipientName, setConfRecipientName] = useState("");
  const [confDetails, setConfDetails] = useState("");

  // Form states - Digest
  const [digestPeriod, setDigestPeriod] = useState<"daily" | "monthly">("daily");
  const [digestEmail, setDigestEmail] = useState("");

  // Form states - Escalation
  const [escName, setEscName] = useState("");
  const [escPhone, setEscPhone] = useState("");
  const [escReason, setEscReason] = useState("VIP Lead Consultation Required");
  const [escAdminEmail, setEscAdminEmail] = useState("");

  // Form states - Staff Fulfillment
  const [staffFulfillItem, setStaffFulfillItem] = useState<ServiceFulfillmentItem | null>(fulfillments[0] || null);
  const [staffFulfillEmail, setStaffFulfillEmail] = useState(staffMembers[0]?.email || "");
  const [staffFulfillName, setStaffFulfillName] = useState(staffMembers[0]?.name || "");
  const [staffFulfillTitle, setStaffFulfillTitle] = useState(fulfillments[0]?.serviceTitle || "");
  const [staffFulfillCustName, setStaffFulfillCustName] = useState(fulfillments[0]?.customerName || "");
  const [staffFulfillCustPhone, setStaffFulfillCustPhone] = useState(fulfillments[0]?.customerPhone || "");
  const [staffFulfillCustEmail, setStaffFulfillCustEmail] = useState(fulfillments[0]?.customerEmail || "");
  const [staffFulfillNotes, setStaffFulfillNotes] = useState(fulfillments[0]?.notes || "");
  const [staffFulfillPriority, setStaffFulfillPriority] = useState(fulfillments[0]?.priority || "normal");

  // Form states - Staff Task
  const [staffTaskItem, setStaffTaskItem] = useState<DispatchTaskItem | null>(tasks[0] || null);
  const [staffTaskEmail, setStaffTaskEmail] = useState(staffMembers[0]?.email || "");
  const [staffTaskName, setStaffTaskName] = useState(staffMembers[0]?.name || "");
  const [staffTaskTitle, setStaffTaskTitle] = useState(tasks[0]?.title || "");
  const [staffTaskPriority, setStaffTaskPriority] = useState(tasks[0]?.priority || "medium");
  const [staffTaskDueDate, setStaffTaskDueDate] = useState(tasks[0]?.dueDate || new Date().toISOString().slice(0, 16));
  const [staffTaskDescription, setStaffTaskDescription] = useState(tasks[0]?.description || "");

  // Form states - Staff Shift
  const [staffShiftEmail, setStaffShiftEmail] = useState(staffMembers[0]?.email || "");
  const [staffShiftName, setStaffShiftName] = useState(staffMembers[0]?.name || "");
  const [staffShiftRole, setStaffShiftRole] = useState(shifts[0]?.role || staffMembers[0]?.role || "Lead Technician");
  const [staffShiftDate, setStaffShiftDate] = useState(shifts[0]?.shiftDate || new Date().toISOString().slice(0, 10));
  const [staffShiftStart, setStaffShiftStart] = useState(shifts[0]?.startTime || "09:00");
  const [staffShiftEnd, setStaffShiftEnd] = useState(shifts[0]?.endTime || "17:00");

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Sync initial selections when opening modal
  const handleOpenDispatchModal = (type: ActionModalType = "staff_job") => {
    setSelectedActionType(type);
    if (staffMembers.length > 0) {
      setStaffFulfillName(staffMembers[0].name);
      setStaffFulfillEmail(staffMembers[0].email || "");
      setStaffTaskName(staffMembers[0].name);
      setStaffTaskEmail(staffMembers[0].email || "");
      setStaffShiftName(staffMembers[0].name);
      setStaffShiftEmail(staffMembers[0].email || "");
      setStaffShiftRole(staffMembers[0].role);
    }
    if (fulfillments.length > 0) {
      setStaffFulfillItem(fulfillments[0]);
      setStaffFulfillTitle(fulfillments[0].serviceTitle);
      setStaffFulfillCustName(fulfillments[0].customerName);
      setStaffFulfillCustPhone(fulfillments[0].customerPhone);
      setStaffFulfillCustEmail(fulfillments[0].customerEmail || "");
      setStaffFulfillNotes(fulfillments[0].notes || "");
      setStaffFulfillPriority(fulfillments[0].priority);
    }
    if (tasks.length > 0) {
      setStaffTaskItem(tasks[0]);
      setStaffTaskTitle(tasks[0].title);
      setStaffTaskPriority(tasks[0].priority);
      setStaffTaskDueDate(tasks[0].dueDate);
      setStaffTaskDescription(tasks[0].description || "");
    }
    if (shifts.length > 0) {
      setStaffShiftDate(shifts[0].shiftDate);
      setStaffShiftStart(shifts[0].startTime);
      setStaffShiftEnd(shifts[0].endTime);
    }
    setIsUnifiedModalOpen(true);
  };

  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let createdLog: EmailLogItem;

      if (selectedActionType === "staff_job") {
        createdLog = await notifyStaffFulfillmentAction(tenantId, {
          fulfillmentId: staffFulfillItem?.id,
          staffName: staffFulfillName,
          staffEmail: staffFulfillEmail,
          serviceTitle: staffFulfillTitle,
          customerName: staffFulfillCustName,
          customerPhone: staffFulfillCustPhone,
          customerEmail: staffFulfillCustEmail || undefined,
          priority: staffFulfillPriority,
          notes: staffFulfillNotes || undefined
        });
      } else if (selectedActionType === "staff_task") {
        createdLog = await notifyStaffTaskAction(tenantId, {
          taskId: staffTaskItem?.id,
          taskTitle: staffTaskTitle,
          assignedToName: staffTaskName,
          assignedToEmail: staffTaskEmail,
          priority: staffTaskPriority,
          dueDate: staffTaskDueDate,
          description: staffTaskDescription || undefined
        });
      } else if (selectedActionType === "staff_shift") {
        createdLog = await notifyStaffShiftAction(tenantId, {
          staffName: staffShiftName,
          staffEmail: staffShiftEmail,
          role: staffShiftRole,
          shiftDate: staffShiftDate,
          startTime: staffShiftStart,
          endTime: staffShiftEnd
        });
      } else if (selectedActionType === "customer_conf") {
        createdLog = await sendConfirmationEmailAction(tenantId, {
          recipientEmail: confRecipientEmail,
          recipientName: confRecipientName,
          referenceType: "Service Booking",
          referenceId: `REF-${Date.now().toString().slice(-6)}`,
          detailsSummary: confDetails
        });
        setConfRecipientEmail("");
        setConfRecipientName("");
        setConfDetails("");
      } else if (selectedActionType === "digest") {
        createdLog = await generateDigestEmailAction(tenantId, {
          periodType: digestPeriod,
          recipientEmail: digestEmail,
          recipientName: "Operations Executive"
        });
        setDigestEmail("");
      } else {
        // escalation
        createdLog = await triggerEscalationAlertAction(tenantId, {
          leadOrCustomerName: escName,
          customerPhone: escPhone,
          escalationReason: escReason,
          recipientAdminEmail: escAdminEmail
        });
        setEscName("");
        setEscPhone("");
        setEscAdminEmail("");
      }

      setData((prev) => ({
        ...prev,
        totalLogs: prev.totalLogs + 1,
        confirmationCount: selectedActionType === "customer_conf" ? prev.confirmationCount + 1 : prev.confirmationCount,
        digestCount: selectedActionType === "digest" ? prev.digestCount + 1 : prev.digestCount,
        escalationCount: selectedActionType === "escalation" ? prev.escalationCount + 1 : prev.escalationCount,
        logs: [createdLog, ...prev.logs]
      }));

      setIsUnifiedModalOpen(false);
    } catch (err: unknown) {
      console.error("Failed to dispatch email", err);
      alert(err instanceof Error ? err.message : "Failed to dispatch email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Delete this email log record?")) return;
    setActionLoadingId(id);
    try {
      await deleteEmailLogAction(tenantId, id);
      setData((prev) => ({
        ...prev,
        totalLogs: Math.max(0, prev.totalLogs - 1),
        logs: prev.logs.filter((l) => l.id !== id)
      }));
    } catch (err: unknown) {
      console.error("Failed to delete log", err);
      alert(err instanceof Error ? err.message : "Failed to delete log");
    } finally {
      setActionLoadingId(null);
    }
  };

  const staffAlertCount = data.logs.filter((l) => l.emailType.startsWith("staff_")).length;

  const filteredLogs = data.logs.filter((log) => {
    const matchesSearch =
      log.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.bodyPreview.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (typeFilter === "all") return true;
    if (typeFilter === "staff") return log.emailType.startsWith("staff_");
    if (typeFilter === "confirmations") return log.emailType === "transactional_confirmation";
    if (typeFilter === "digests") return log.emailType.startsWith("financial_digest");
    if (typeFilter === "escalations") return log.emailType === "escalation_alert";

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with single clean button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#080C42]">
            Automated Email Communication & Alerts
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Dispatch staff job & shift notifications, customer confirmations, and executive financial digests via AWS SES.
          </p>
        </div>

        <button
          onClick={() => handleOpenDispatchModal("staff_job")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition"
        >
          <Send size={16} /> Dispatch Email & Alert
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Email Events</p>
            <Mail className="text-stone-400" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">{data.totalLogs}</p>
          <p className="mt-1 text-xs text-stone-400">SES audit logs recorded</p>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Staff Job & Shift Alerts</p>
            <UserCheck className="text-teal-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-teal-900">{staffAlertCount}</p>
          <p className="mt-1 text-xs text-teal-700">Team assignments dispatched</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">Customer Confirmations</p>
            <Send className="text-blue-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">{data.confirmationCount}</p>
          <p className="mt-1 text-xs text-blue-700">Transactional receipts</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-800">Digests & Escalations</p>
            <TrendingUp className="text-rose-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900">
            {data.digestCount + data.escalationCount}
          </p>
          <p className="mt-1 text-xs text-rose-700">{data.escalationCount} urgent escalations</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setTypeFilter("all")}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${
            typeFilter === "all"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          All Activity ({data.logs.length})
        </button>
        <button
          onClick={() => setTypeFilter("staff")}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${
            typeFilter === "staff"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Staff & Shift Alerts ({staffAlertCount})
        </button>
        <button
          onClick={() => setTypeFilter("confirmations")}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${
            typeFilter === "confirmations"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Customer Confirmations ({data.confirmationCount})
        </button>
        <button
          onClick={() => setTypeFilter("digests")}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${
            typeFilter === "digests"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Financial Digests ({data.digestCount})
        </button>
        <button
          onClick={() => setTypeFilter("escalations")}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${
            typeFilter === "escalations"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Escalations ({data.escalationCount})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
        <input
          type="text"
          placeholder="Search logs by recipient, staff email, subject keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3.5">Email Type & Event</th>
                <th className="px-5 py-3.5">Recipient</th>
                <th className="px-5 py-3.5">Subject & Content Preview</th>
                <th className="px-5 py-3.5">Delivery Status</th>
                <th className="px-5 py-3.5">Dispatched At</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-stone-400">
                    No email communication records found for this view.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          log.emailType === "staff_fulfillment_assignment"
                            ? "bg-teal-100 text-teal-800"
                            : log.emailType === "staff_task_assignment"
                            ? "bg-cyan-100 text-cyan-800"
                            : log.emailType === "staff_shift_scheduled"
                            ? "bg-indigo-100 text-indigo-800"
                            : log.emailType === "transactional_confirmation"
                            ? "bg-blue-100 text-blue-800"
                            : log.emailType.startsWith("financial_digest")
                            ? "bg-purple-100 text-purple-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {log.emailType === "staff_fulfillment_assignment"
                          ? "Staff Service Assignment"
                          : log.emailType === "staff_task_assignment"
                          ? "Staff Task Alert"
                          : log.emailType === "staff_shift_scheduled"
                          ? "Shift Schedule Notice"
                          : log.emailType === "transactional_confirmation"
                          ? "Booking Confirmation"
                          : log.emailType.startsWith("financial_digest")
                          ? "Financial Digest"
                          : "Urgent Escalation"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-stone-900">{log.recipientName}</div>
                      <div className="text-xs text-stone-500 font-mono">{log.recipientEmail}</div>
                    </td>

                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-medium text-stone-900 truncate">{log.subject}</div>
                      <p className="text-xs text-stone-500 truncate mt-0.5">{log.bodyPreview}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${
                          log.status === "delivered" || log.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <CheckCircle2 size={12} className="text-emerald-700" />
                        {log.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-xs text-stone-600">
                      {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedPreviewLog(log)}
                        className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition"
                        title="View Full Message Preview"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        disabled={actionLoadingId === log.id}
                        className="rounded p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE UNIFIED MODAL: Dispatch Email & Alert Hub */}
      {isUnifiedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Dispatch Email & Notification Hub</h3>
                  <p className="text-xs text-stone-500">Select an action and deliver notifications via AWS SES.</p>
                </div>
              </div>
              <button onClick={() => setIsUnifiedModalOpen(false)} className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            {/* Action Type Selector Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                1. Select Action Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSelectedActionType("staff_job")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    selectedActionType === "staff_job"
                      ? "border-teal-600 bg-teal-50/70 text-teal-950 shadow-xs ring-1 ring-teal-600"
                      : "border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-100/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <UserCheck size={14} className={selectedActionType === "staff_job" ? "text-teal-700" : "text-stone-500"} />
                    Staff Job Assignment
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500 line-clamp-1">Service & customer details</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedActionType("staff_task")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    selectedActionType === "staff_task"
                      ? "border-teal-600 bg-teal-50/70 text-teal-950 shadow-xs ring-1 ring-teal-600"
                      : "border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-100/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Briefcase size={14} className={selectedActionType === "staff_task" ? "text-teal-700" : "text-stone-500"} />
                    Task Dispatch Alert
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500 line-clamp-1">Instructions & deadlines</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedActionType("staff_shift")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    selectedActionType === "staff_shift"
                      ? "border-teal-600 bg-teal-50/70 text-teal-950 shadow-xs ring-1 ring-teal-600"
                      : "border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-100/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Calendar size={14} className={selectedActionType === "staff_shift" ? "text-teal-700" : "text-stone-500"} />
                    Shift Schedule Notice
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500 line-clamp-1">Roster hours & date</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedActionType("customer_conf")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    selectedActionType === "customer_conf"
                      ? "border-teal-600 bg-teal-50/70 text-teal-950 shadow-xs ring-1 ring-teal-600"
                      : "border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-100/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Mail size={14} className={selectedActionType === "customer_conf" ? "text-teal-700" : "text-stone-500"} />
                    Customer Confirmation
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500 line-clamp-1">Transactional receipt</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedActionType("digest")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    selectedActionType === "digest"
                      ? "border-teal-600 bg-teal-50/70 text-teal-950 shadow-xs ring-1 ring-teal-600"
                      : "border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-100/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <FileSpreadsheet size={14} className={selectedActionType === "digest" ? "text-blue-700" : "text-stone-500"} />
                    Financial Digest
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500 line-clamp-1">Daily / Monthly metrics</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedActionType("escalation")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    selectedActionType === "escalation"
                      ? "border-rose-600 bg-rose-50 text-rose-950 shadow-xs ring-1 ring-rose-600"
                      : "border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-100/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                    <AlertTriangle size={14} />
                    Urgent Escalation
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500 line-clamp-1">Broadcast to admin</p>
                </button>
              </div>
            </div>

            {/* Dynamic Form Content */}
            <form onSubmit={handleUnifiedSubmit} className="space-y-4 border-t border-stone-200 pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                2. Configure Email Parameters
              </label>

              {/* Form A: Staff Job Assignment */}
              {selectedActionType === "staff_job" && (
                <div className="space-y-3">
                  {fulfillments.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Choose Service Request</label>
                      <select
                        onChange={(e) => {
                          const found = fulfillments.find((f) => f.id === e.target.value);
                          if (found) {
                            setStaffFulfillItem(found);
                            setStaffFulfillTitle(found.serviceTitle);
                            setStaffFulfillCustName(found.customerName);
                            setStaffFulfillCustPhone(found.customerPhone);
                            setStaffFulfillCustEmail(found.customerEmail || "");
                            setStaffFulfillNotes(found.notes || "");
                            setStaffFulfillPriority(found.priority);
                          }
                        }}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      >
                        {fulfillments.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.serviceTitle} — {f.customerName} ({f.priority.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Assigned Staff Member</label>
                      {staffMembers.length > 0 ? (
                        <select
                          onChange={(e) => {
                            const found = staffMembers.find((m) => m.name === e.target.value);
                            if (found) {
                              setStaffFulfillName(found.name);
                              setStaffFulfillEmail(found.email || "");
                            }
                          }}
                          className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none font-medium"
                        >
                          {staffMembers.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name} ({m.role})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alex Morgan"
                          value={staffFulfillName}
                          onChange={(e) => setStaffFulfillName(e.target.value)}
                          className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Staff Email</label>
                      <input
                        type="email"
                        required
                        placeholder="staff@company.com"
                        value={staffFulfillEmail}
                        onChange={(e) => setStaffFulfillEmail(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Customer Name</label>
                      <input
                        type="text"
                        required
                        value={staffFulfillCustName}
                        onChange={(e) => setStaffFulfillCustName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Customer Phone</label>
                      <input
                        type="tel"
                        required
                        value={staffFulfillCustPhone}
                        onChange={(e) => setStaffFulfillCustPhone(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Service Title</label>
                    <input
                      type="text"
                      required
                      value={staffFulfillTitle}
                      onChange={(e) => setStaffFulfillTitle(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Job Instructions & Details</label>
                    <textarea
                      rows={2}
                      placeholder="Gate codes, customer requirements, required equipment..."
                      value={staffFulfillNotes}
                      onChange={(e) => setStaffFulfillNotes(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form B: Staff Task Dispatch */}
              {selectedActionType === "staff_task" && (
                <div className="space-y-3">
                  {tasks.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Choose Task Ticket</label>
                      <select
                        onChange={(e) => {
                          const found = tasks.find((t) => t.id === e.target.value);
                          if (found) {
                            setStaffTaskItem(found);
                            setStaffTaskTitle(found.title);
                            setStaffTaskPriority(found.priority);
                            setStaffTaskDueDate(found.dueDate);
                            setStaffTaskDescription(found.description || "");
                          }
                        }}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      >
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} (Priority: {t.priority.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Assigned Staff</label>
                      {staffMembers.length > 0 ? (
                        <select
                          onChange={(e) => {
                            const found = staffMembers.find((m) => m.name === e.target.value);
                            if (found) {
                              setStaffTaskName(found.name);
                              setStaffTaskEmail(found.email || "");
                            }
                          }}
                          className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none font-medium"
                        >
                          {staffMembers.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name} ({m.role})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jordan Smith"
                          value={staffTaskName}
                          onChange={(e) => setStaffTaskName(e.target.value)}
                          className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Staff Email</label>
                      <input
                        type="email"
                        required
                        placeholder="staff@company.com"
                        value={staffTaskEmail}
                        onChange={(e) => setStaffTaskEmail(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Task Title</label>
                    <input
                      type="text"
                      required
                      value={staffTaskTitle}
                      onChange={(e) => setStaffTaskTitle(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Task Instructions & Description</label>
                    <textarea
                      rows={2}
                      placeholder="Details of deliverables..."
                      value={staffTaskDescription}
                      onChange={(e) => setStaffTaskDescription(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form C: Staff Shift Schedule */}
              {selectedActionType === "staff_shift" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Staff Member</label>
                      {staffMembers.length > 0 ? (
                        <select
                          onChange={(e) => {
                            const found = staffMembers.find((m) => m.name === e.target.value);
                            if (found) {
                              setStaffShiftName(found.name);
                              setStaffShiftEmail(found.email || "");
                              setStaffShiftRole(found.role);
                            }
                          }}
                          className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none font-medium"
                        >
                          {staffMembers.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name} ({m.role})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Marcus Vance"
                          value={staffShiftName}
                          onChange={(e) => setStaffShiftName(e.target.value)}
                          className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Staff Email</label>
                      <input
                        type="email"
                        required
                        placeholder="staff@company.com"
                        value={staffShiftEmail}
                        onChange={(e) => setStaffShiftEmail(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Shift Date</label>
                      <input
                        type="date"
                        required
                        value={staffShiftDate}
                        onChange={(e) => setStaffShiftDate(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Start Time</label>
                      <input
                        type="time"
                        required
                        value={staffShiftStart}
                        onChange={(e) => setStaffShiftStart(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">End Time</label>
                      <input
                        type="time"
                        required
                        value={staffShiftEnd}
                        onChange={(e) => setStaffShiftEnd(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form D: Customer Confirmation */}
              {selectedActionType === "customer_conf" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Customer Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Jenkins"
                        value={confRecipientName}
                        onChange={(e) => setConfRecipientName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Customer Email</label>
                      <input
                        type="email"
                        required
                        placeholder="customer@example.com"
                        value={confRecipientEmail}
                        onChange={(e) => setConfRecipientEmail(e.target.value)}
                        className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Booking Summary & Details</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Consultation scheduled for tomorrow at 2:00 PM."
                      value={confDetails}
                      onChange={(e) => setConfDetails(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form E: Financial Digest */}
              {selectedActionType === "digest" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Digest Period</label>
                    <select
                      value={digestPeriod}
                      onChange={(e) => setDigestPeriod(e.target.value as "daily" | "monthly")}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                    >
                      <option value="daily">Daily Operations Summary</option>
                      <option value="monthly">Monthly Executive Financial Digest</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Recipient Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="executive@company.com"
                      value={digestEmail}
                      onChange={(e) => setDigestEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form F: Urgent Escalation */}
              {selectedActionType === "escalation" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Customer / Lead Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. VIP Robert Vance"
                        value={escName}
                        onChange={(e) => setEscName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-rose-300 p-2 text-xs focus:border-rose-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Customer Phone</label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 555 0192"
                        value={escPhone}
                        onChange={(e) => setEscPhone(e.target.value)}
                        className="mt-1 w-full rounded-md border border-rose-300 p-2 text-xs focus:border-rose-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Escalation Reason</label>
                    <select
                      value={escReason}
                      onChange={(e) => setEscReason(e.target.value)}
                      className="mt-1 w-full rounded-md border border-rose-300 p-2 text-xs focus:border-rose-600 focus:outline-none"
                    >
                      <option value="VIP Lead Consultation Required">⭐ VIP Lead Consultation Required</option>
                      <option value="Urgent Missed Booking Call">🚨 Urgent Missed Booking Call</option>
                      <option value="Delinquent Receivables Overdue">⚠️ Delinquent Receivables Overdue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Admin Recipient Email</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@company.com"
                      value={escAdminEmail}
                      onChange={(e) => setEscAdminEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-rose-300 p-2 text-xs focus:border-rose-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsUnifiedModalOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 ${
                    selectedActionType === "escalation"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-[#0f766e] hover:bg-teal-800"
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  {selectedActionType === "staff_job" && "Dispatch Job Email"}
                  {selectedActionType === "staff_task" && "Dispatch Task Email"}
                  {selectedActionType === "staff_shift" && "Send Shift Notice"}
                  {selectedActionType === "customer_conf" && "Send Confirmation"}
                  {selectedActionType === "digest" && "Generate & Send Digest"}
                  {selectedActionType === "escalation" && "Broadcast Escalation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Inspection Preview Modal */}
      {selectedPreviewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Eye className="text-teal-700" size={18} /> Message Inspection Preview
              </h3>
              <button onClick={() => setSelectedPreviewLog(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-stone-50 p-3 border border-stone-200 space-y-1.5">
                <p><strong>To:</strong> {selectedPreviewLog.recipientName} ({selectedPreviewLog.recipientEmail})</p>
                <p><strong>Subject:</strong> {selectedPreviewLog.subject}</p>
                <p><strong>Dispatched At:</strong> {new Date(selectedPreviewLog.sentAt).toLocaleString()}</p>
                <p><strong>Event Type:</strong> {selectedPreviewLog.emailType}</p>
                <p><strong>Trigger Source:</strong> {selectedPreviewLog.triggeredBy}</p>
              </div>

              <div>
                <p className="font-semibold text-stone-700 mb-1">Body Preview Content:</p>
                <div className="rounded-lg border border-stone-200 bg-white p-3 font-mono text-stone-800 whitespace-pre-wrap leading-relaxed">
                  {selectedPreviewLog.bodyPreview}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-200">
              <button
                onClick={() => setSelectedPreviewLog(null)}
                className="rounded-md bg-stone-800 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-900"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
