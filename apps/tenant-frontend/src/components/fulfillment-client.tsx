"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  UserCheck,
  Search,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  Phone,
  Layers,
  ArrowRight
} from "lucide-react";
import {
  createFulfillmentAction,
  syncAppointmentToFulfillmentAction,
  updateFulfillmentStatusAction,
  updateFulfillmentPriorityAction,
  assignStaffAction,
  deleteFulfillmentAction
} from "@/app/dashboard/[tenantId]/fulfillment/actions";

import type { StaffMemberItem } from "@/components/dispatch-client";

export interface ServiceFulfillmentItem {
  id: string;
  tenantId: string;
  referenceType?: string;
  referenceId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceTitle: string;
  scheduledAt: string;
  priority: "normal" | "urgent" | "vip";
  status: "queued" | "confirmed" | "in_progress" | "completed" | "cancelled";
  assignedStaffId?: string;
  assignedStaffName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnsyncedAppointment {
  appointmentId: string;
  customerName: string;
  customerPhone: string;
  serviceTitle: string;
  scheduledAt: string;
  notes?: string;
  status: string;
}

export interface FulfillmentData {
  totalFulfillments: number;
  urgentCount: number;
  activeCount: number;
  completedCount: number;
  queue: ServiceFulfillmentItem[];
  unsyncedAppointments: UnsyncedAppointment[];
}

export function FulfillmentClient({
  tenantId,
  initialData,
  initialStaffMembers = []
}: {
  tenantId: string;
  initialData: FulfillmentData;
  initialStaffMembers?: StaffMemberItem[];
}) {
  const [data, setData] = useState<FulfillmentData>(initialData);
  const [staffMembers, setStaffMembers] = useState<StaffMemberItem[]>(initialStaffMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Modals & Action states
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [assigningItem, setAssigningItem] = useState<ServiceFulfillmentItem | null>(null);
  const [assignStaffName, setAssignStaffName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form states for manual request
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 16));
  const [priority, setPriority] = useState<"normal" | "urgent" | "vip">("normal");
  const [staffName, setStaffName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setData(initialData);
    setStaffMembers(initialStaffMembers);
  }, [initialData, initialStaffMembers]);

  const handleCreateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await createFulfillmentAction(tenantId, {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        serviceTitle,
        scheduledAt: new Date(scheduledAt).toISOString(),
        priority,
        assignedStaffName: staffName || undefined,
        notes: notes || undefined
      });

      setData((prev) => ({
        ...prev,
        totalFulfillments: prev.totalFulfillments + 1,
        urgentCount: (priority === "urgent" || priority === "vip") ? prev.urgentCount + 1 : prev.urgentCount,
        queue: [created, ...prev.queue]
      }));

      setIsQueueModalOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setServiceTitle("");
      setStaffName("");
      setNotes("");
    } catch (err: unknown) {
      console.error("Failed to queue fulfillment", err);
      alert(err instanceof Error ? err.message : "Failed to queue fulfillment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncAppointment = async (appt: UnsyncedAppointment) => {
    setActionLoadingId(appt.appointmentId);
    try {
      const created = await syncAppointmentToFulfillmentAction(tenantId, appt.appointmentId);
      setData((prev) => ({
        ...prev,
        totalFulfillments: prev.totalFulfillments + 1,
        activeCount: prev.activeCount + 1,
        queue: [created, ...prev.queue],
        unsyncedAppointments: prev.unsyncedAppointments.filter((a) => a.appointmentId !== appt.appointmentId)
      }));
    } catch (err: unknown) {
      console.error("Failed to sync appointment", err);
      alert(err instanceof Error ? err.message : "Failed to sync appointment");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoadingId(id);
    try {
      await updateFulfillmentStatusAction(tenantId, id, newStatus);
      setData((prev) => ({
        ...prev,
        queue: prev.queue.map((item) =>
          item.id === id ? { ...item, status: newStatus as ServiceFulfillmentItem["status"] } : item
        )
      }));
    } catch (err: unknown) {
      console.error("Failed to update status", err);
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePriorityChange = async (id: string, newPriority: string) => {
    setActionLoadingId(id);
    try {
      await updateFulfillmentPriorityAction(tenantId, id, newPriority);
      setData((prev) => ({
        ...prev,
        queue: prev.queue.map((item) =>
          item.id === id ? { ...item, priority: newPriority as ServiceFulfillmentItem["priority"] } : item
        )
      }));
    } catch (err: unknown) {
      console.error("Failed to update priority", err);
      alert(err instanceof Error ? err.message : "Failed to update priority");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningItem) return;
    setIsSubmitting(true);
    try {
      await assignStaffAction(tenantId, assigningItem.id, assignStaffName);
      setData((prev) => ({
        ...prev,
        queue: prev.queue.map((item) =>
          item.id === assigningItem.id ? { ...item, assignedStaffName: assignStaffName } : item
        )
      }));
      setAssigningItem(null);
      setAssignStaffName("");
    } catch (err: unknown) {
      console.error("Failed to assign staff", err);
      alert(err instanceof Error ? err.message : "Failed to assign staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this fulfillment request?")) return;
    setActionLoadingId(id);
    try {
      await deleteFulfillmentAction(tenantId, id);
      setData((prev) => ({
        ...prev,
        totalFulfillments: Math.max(0, prev.totalFulfillments - 1),
        queue: prev.queue.filter((item) => item.id !== id)
      }));
    } catch (err: unknown) {
      console.error("Failed to delete fulfillment", err);
      alert(err instanceof Error ? err.message : "Failed to delete fulfillment");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredQueue = data.queue.filter((item) => {
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerPhone.includes(searchTerm) ||
      item.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.assignedStaffName && item.assignedStaffName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#080C42]">
            Service & Appointment Fulfillment
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Real-time fulfillment queue, urgent VIP resource alerts, and multi-stage execution workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQueueModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition"
          >
            <Plus size={16} /> Queue Service Request
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Fulfillments</p>
            <Layers className="text-stone-400" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">{data.queue.length}</p>
          <p className="mt-1 text-xs text-stone-400">All registered service tasks</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Urgent & VIP Bookings</p>
            <Flame className="text-amber-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">
            {data.queue.filter((f) => f.priority === "urgent" || f.priority === "vip").length}
          </p>
          <p className="mt-1 text-xs text-amber-700">Immediate prep required</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">Active Execution</p>
            <Clock className="text-blue-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            {data.queue.filter((f) => f.status === "in_progress" || f.status === "confirmed").length}
          </p>
          <p className="mt-1 text-xs text-blue-700">Confirmed / In-Progress</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Completed</p>
            <CheckCircle2 className="text-emerald-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">
            {data.queue.filter((f) => f.status === "completed").length}
          </p>
          <p className="mt-1 text-xs text-emerald-700">Successfully fulfilled</p>
        </div>
      </div>

      {/* AI Receptionist Appointments Sync Banner */}
      {data.unsyncedAppointments.length > 0 && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="text-teal-700 animate-spin-slow" size={18} />
              <div>
                <h4 className="text-sm font-bold text-teal-950">
                  {data.unsyncedAppointments.length} Unsynced AI Receptionist Bookings Available
                </h4>
                <p className="text-xs text-teal-800">
                  New calls booked slots directly via the phone agent. Sync them to the operations queue in 1-click.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {data.unsyncedAppointments.slice(0, 6).map((appt) => (
              <div
                key={appt.appointmentId}
                className="flex items-center justify-between rounded-lg border border-teal-200/80 bg-white p-2.5 text-xs shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900 truncate">{appt.customerName}</p>
                  <p className="text-stone-500 truncate">{appt.serviceTitle} • {new Date(appt.scheduledAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleSyncAppointment(appt)}
                  disabled={actionLoadingId === appt.appointmentId}
                  className="ml-2 inline-flex shrink-0 items-center gap-1 rounded bg-[#0f766e] px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {actionLoadingId === appt.appointmentId ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={12} /> Sync
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Search customer, phone, service, or assigned staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-teal-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:border-teal-500 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="vip">VIP Only</option>
            <option value="urgent">Urgent Only</option>
            <option value="normal">Normal Priority</option>
          </select>
        </div>
      </div>

      {/* Fulfillment Queue Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3.5">Customer & Contact</th>
                <th className="px-5 py-3.5">Service Request</th>
                <th className="px-5 py-3.5">Schedule</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status Workflow</th>
                <th className="px-5 py-3.5">Assigned Staff</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-stone-400">
                    No fulfillment records found. Click &quot;Queue Service Request&quot; to add a new task.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-stone-900">{item.customerName}</div>
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <Phone size={11} /> {item.customerPhone}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-medium text-stone-900">{item.serviceTitle}</div>
                      {item.notes && (
                        <p className="text-xs text-stone-400 italic line-clamp-1">{item.notes}</p>
                      )}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-xs text-stone-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-stone-400" />
                        {new Date(item.scheduledAt).toLocaleDateString()} {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <select
                        value={item.priority}
                        disabled={actionLoadingId === item.id}
                        onChange={(e) => handlePriorityChange(item.id, e.target.value)}
                        className={`rounded-md px-2 py-1 text-xs font-bold border transition ${item.priority === "vip"
                            ? "bg-purple-100 text-purple-900 border-purple-300"
                            : item.priority === "urgent"
                              ? "bg-rose-100 text-rose-900 border-rose-300"
                              : "bg-stone-100 text-stone-700 border-stone-200"
                          }`}
                      >
                        <option value="normal">Normal</option>
                        <option value="urgent">🔥 Urgent</option>
                        <option value="vip">⭐ VIP Client</option>
                      </select>
                    </td>

                    <td className="px-5 py-3.5">
                      <select
                        value={item.status}
                        disabled={actionLoadingId === item.id}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold border ${item.status === "completed"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : item.status === "in_progress"
                              ? "bg-blue-100 text-blue-900 border-blue-300"
                              : item.status === "confirmed"
                                ? "bg-teal-100 text-teal-900 border-teal-300"
                                : item.status === "cancelled"
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : "bg-amber-100 text-amber-900 border-amber-300"
                          }`}
                      >
                        <option value="queued">Queued</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="px-5 py-3.5">
                      {item.assignedStaffName ? (
                        <button
                          onClick={() => {
                            setAssigningItem(item);
                            setAssignStaffName(item.assignedStaffName || "");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100"
                        >
                          <UserCheck size={12} className="text-teal-700" />
                          {item.assignedStaffName}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setAssigningItem(item);
                            setAssignStaffName("");
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-dashed border-stone-300 px-2 py-1 text-xs text-stone-500 hover:border-teal-500 hover:text-teal-700"
                        >
                          <Plus size={11} /> Assign Staff
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
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

      {/* Queue Service Request Modal */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CheckSquare className="text-teal-700" size={18} /> Queue Service Request
              </h3>
              <button onClick={() => setIsQueueModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFulfillment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 555 0192"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Service / Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Consultation / HVAC Tune-up"
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Priority Flag</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "normal" | "urgent" | "vip")}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">🔥 Urgent Booking</option>
                    <option value="vip">⭐ VIP Consultation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Assigned Staff Coordinator</label>
                  {staffMembers.length > 0 ? (
                    <select
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none font-medium"
                    >
                      <option value="">Choose team member (Optional)...</option>
                      {staffMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. David Ross"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Internal Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Special customer requests, gate codes, required materials..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsQueueModalOpen(false)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Queue Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assigningItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserCheck className="text-teal-700" size={18} /> Assign Staff
              </h3>
              <button onClick={() => setAssigningItem(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignStaff} className="space-y-4">
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs space-y-1">
                <p className="font-semibold text-stone-900">{assigningItem.serviceTitle}</p>
                <p className="text-stone-500">Customer: {assigningItem.customerName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Choose Staff Member</label>
                {staffMembers.length > 0 ? (
                  <select
                    value={assignStaffName}
                    onChange={(e) => setAssignStaffName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none font-medium"
                  >
                    <option value="">Select team member...</option>
                    {staffMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role}) {m.phone ? `• ${m.phone}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={assignStaffName}
                    onChange={(e) => setAssignStaffName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setAssigningItem(null)}
                  className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !assignStaffName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#0f766e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
