"use client";

import React, { useState, useEffect } from "react";
import { Plus, PhoneCall, Globe, User, CheckCircle2, Circle, X, Calendar, MessageSquare, Loader2, Tag, Edit3, Trash2 } from "lucide-react";
import { CallLogItem } from "@/components/call-logs-client";
import { createLeadAction, updateLeadAction, deleteLeadAction, updateLeadStageAction, addLeadTaskAction, toggleLeadTaskAction } from "@/app/dashboard/[tenantId]/leads/actions";

export interface LeadTask {
  id: string;
  leadId: string;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
  assignedTo?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  callLogIdentifier?: string | null;
  name: string;
  phone: string;
  email?: string;
  stage: "new" | "qualified" | "proposal" | "won" | "lost";
  score?: number;
  assignedTo?: string;
  summary?: string;
  source: "voice_call" | "web_form" | "manual";
  createdAt: string;
  updatedAt: string;
  tasks?: LeadTask[];
}

const STAGES = [
  { id: "new", title: "New Leads", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "qualified", title: "Qualified", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "proposal", title: "Proposal Sent", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "won", title: "Won / Closed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "lost", title: "Lost", color: "bg-blue-50 text-blue-700 border-blue-200" },
];

export function LeadsClient({
  tenantId,
  initialLeads,
  callLogs = []
}: {
  tenantId: string;
  initialLeads: Lead[];
  callLogs?: CallLogItem[];
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditingInDrawer, setIsEditingInDrawer] = useState(false);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  // Loading states for buttons
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);
  const [isDeletingLead, setIsDeletingLead] = useState(false);
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  // New lead form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [assignedTo, setAssignedTo] = useState("Sales Rep");
  const [source, setSource] = useState<"manual" | "voice_call" | "web_form">("manual");
  const [callLogIdentifier, setCallLogIdentifier] = useState("");
  const [selectedCallLogId, setSelectedCallLogId] = useState("");

  // Edit lead drawer states
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editCallLogIdentifier, setEditCallLogIdentifier] = useState("");

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleSelectCallLog = (logId: string) => {
    setSelectedCallLogId(logId);
    if (!logId) return;

    const log = callLogs.find((c) => c.id === logId);
    if (log) {
      if (log.customerPhone) setPhone(log.customerPhone);
      if (log.summary) setSummary(log.summary);
      else if (log.transcript) setSummary(log.transcript.slice(0, 180) + "...");
      if (log.identifier) setCallLogIdentifier(log.identifier);
      else setCallLogIdentifier(`Call-${log.id.substring(0, 8)}`);
      setSource("voice_call");
    }
  };

  const handleOpenLeadDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditingInDrawer(false);
    setEditName(lead.name);
    setEditPhone(lead.phone);
    setEditEmail(lead.email || "");
    setEditSummary(lead.summary || "");
    setEditAssignedTo(lead.assignedTo || "Sales Rep");
    setEditCallLogIdentifier(lead.callLogIdentifier || "");
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    try {
      const newLead = await createLeadAction(tenantId, {
        name: name.trim() || "New Lead",
        phone: phone.trim(),
        email: email.trim() || undefined,
        summary: summary.trim() || undefined,
        assignedTo: assignedTo.trim() || undefined,
        source,
        stage: "new",
        callLogIdentifier: callLogIdentifier.trim() || null
      });

      if (newLead) {
        setLeads((prev) => [newLead as Lead, ...prev]);
      }
      setIsAddLeadOpen(false);
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setSummary("");
      setCallLogIdentifier("");
      setSelectedCallLogId("");
      setSource("manual");
    } catch (err: unknown) {
      console.error("Failed to create lead", err);
      alert(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleSaveLeadEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setIsUpdatingLead(true);
    try {
      const updated = await updateLeadAction(tenantId, selectedLead.id, {
        name: editName.trim() || selectedLead.name,
        phone: editPhone.trim() || selectedLead.phone,
        email: editEmail.trim() || null,
        summary: editSummary.trim() || null,
        assignedTo: editAssignedTo.trim() || null,
        callLogIdentifier: editCallLogIdentifier.trim() || null
      }) as Lead;

      if (updated) {
        setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l)));
        setSelectedLead((prev) => (prev ? { ...prev, ...updated } : null));
        setIsEditingInDrawer(false);
      }
    } catch (err: unknown) {
      console.error("Failed to update lead", err);
      alert(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setIsUpdatingLead(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setIsDeletingLead(true);
    try {
      await deleteLeadAction(tenantId, leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setSelectedLead(null);
    } catch (err: unknown) {
      console.error("Failed to delete lead", err);
      alert(err instanceof Error ? err.message : "Failed to delete lead");
    } finally {
      setIsDeletingLead(false);
    }
  };

  const handleUpdateStage = async (leadId: string, stage: string) => {
    setUpdatingStageId(stage);
    try {
      const updated = await updateLeadStageAction(tenantId, leadId, stage) as { stage: "new" | "qualified" | "proposal" | "won" | "lost" };
      if (updated) {
        setLeads((prev) => prev.map(l => l.id === leadId ? { ...l, stage: updated.stage } : l));
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => prev ? { ...prev, stage: updated.stage } : null);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to update stage", err);
      alert(err instanceof Error ? err.message : "Failed to update stage");
    } finally {
      setUpdatingStageId(null);
    }
  };

  const handleAddTask = async (leadId: string) => {
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);
    try {
      const task = await addLeadTaskAction(tenantId, leadId, newTaskTitle, selectedLead?.assignedTo) as LeadTask;
      if (task) {
        setLeads((prev) => prev.map(l => {
          if (l.id === leadId) {
            const currentTasks = l.tasks || [];
            return { ...l, tasks: [...currentTasks, task] };
          }
          return l;
        }));
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => prev ? { ...prev, tasks: [...(prev.tasks || []), task] } : null);
        }
        setNewTaskTitle("");
      }
    } catch (err: unknown) {
      console.error("Failed to add task", err);
      alert(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (leadId: string, taskId: string, currentStatus: boolean) => {
    setTogglingTaskId(taskId);
    try {
      const updatedTask = await toggleLeadTaskAction(tenantId, leadId, taskId, !currentStatus) as LeadTask;
      if (updatedTask) {
        setLeads((prev) => prev.map(l => {
          if (l.id === leadId) {
            return {
              ...l,
              tasks: (l.tasks || []).map(t => t.id === taskId ? updatedTask : t)
            };
          }
          return l;
        }));
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => prev ? {
            ...prev,
            tasks: (prev.tasks || []).map(t => t.id === taskId ? updatedTask : t)
          } : null);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to update task", err);
      alert(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setTogglingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">SALES & PIPELINE</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Leads & Pipeline</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#080C42]"
          >
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* Responsive Kanban Board with comfortable column width & horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 shadow-xs min-w-[270px] w-[270px] sm:w-[285px] lg:w-[290px] shrink-0 snap-start min-h-[480px]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${stage.color}`}>
                  {stage.title}
                </span>
                <span className="text-xs font-bold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-xs">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {stageLeads.length === 0 ? (
                  <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-stone-300 p-3 text-center text-xs text-stone-400">
                    No leads in stage
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => handleOpenLeadDrawer(lead)}
                      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all hover:border-[#071D75] hover:shadow-md space-y-2"
                    >
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-[#080C42] text-sm group-hover:text-[#071D75] transition-colors truncate" title={lead.name}>
                          {lead.name}
                        </h3>
                        <p className="text-xs text-slate-600 font-mono">{lead.phone}</p>
                        {lead.email && (
                          <p className="text-xs text-slate-400 truncate" title={lead.email}>
                            {lead.email}
                          </p>
                        )}
                      </div>

                      {/* Call Log Identifier Reference Badge */}
                      {lead.callLogIdentifier && (
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-[#071D75] border border-blue-200 truncate max-w-full" title={lead.callLogIdentifier}>
                            <Tag size={10} className="text-[#071D75] shrink-0" />
                            <span className="truncate">Ref: {lead.callLogIdentifier}</span>
                          </span>
                        </div>
                      )}

                      {lead.summary && (
                        <p className="line-clamp-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                          {lead.summary}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium truncate max-w-[120px]">
                          {lead.source === "voice_call" ? <PhoneCall size={12} className="text-[#071D75] shrink-0" /> : <Globe size={12} className="shrink-0" />}
                          <span className="truncate">{lead.source === "voice_call" ? "Voice AI" : lead.source}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[120px]" title={lead.assignedTo || "Sales Rep"}>
                          <User size={12} className="shrink-0" />
                          <span className="truncate">{lead.assignedTo || "Sales Rep"}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900">Add New Lead</h3>
              <button onClick={() => setIsAddLeadOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              {/* Optional Call Reference Selector */}
              {callLogs.length > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-1.5">
                  <label className="block text-xs font-bold text-[#080C42] uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneCall size={13} className="text-[#071D75]" /> Reference Previous AI Call (Optional)
                  </label>
                  <select
                    value={selectedCallLogId}
                    onChange={(e) => handleSelectCallLog(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  >
                    <option value="">-- None (Manual Lead Entry) --</option>
                    {callLogs.map((log) => (
                      <option key={log.id} value={log.id}>
                        {log.identifier ? `[Ref: ${log.identifier}] ` : ""}{log.customerPhone || "Web Call"} ({new Date(log.createdAt).toLocaleDateString()}) - {log.summary ? log.summary.slice(0, 45) + "..." : "No summary"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">Lead / Contact Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Call Log Identifier / Reference</label>
                  <input
                    type="text"
                    value={callLogIdentifier}
                    onChange={(e) => setCallLogIdentifier(e.target.value)}
                    placeholder="e.g. Lead-101 or Ref ID"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Assign To Sales Rep</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Inquiry Notes & Summary</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Notes, transcript summary, or inquiry details..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingLead && <Loader2 size={16} className="animate-spin" />}
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail & Edit Drawer Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xl font-bold text-[#080C42]">{selectedLead.name}</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {selectedLead.phone} {selectedLead.email && `• ${selectedLead.email}`}
                </p>
                {selectedLead.callLogIdentifier && (
                  <p className="mt-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-semibold text-[#071D75] border border-blue-200">
                      <Tag size={11} className="text-[#071D75]" />
                      Attached Call Ref: {selectedLead.callLogIdentifier}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingInDrawer(!isEditingInDrawer)}
                  className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1"
                >
                  <Edit3 size={13} /> {isEditingInDrawer ? "Cancel Edit" : "Edit Lead"}
                </button>
                <button
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  disabled={isDeletingLead}
                  className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 flex items-center gap-1"
                >
                  {isDeletingLead ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
                </button>
                <button onClick={() => setSelectedLead(null)} className="text-stone-400 hover:text-stone-600 ml-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Edit Lead Form if toggled */}
            {isEditingInDrawer ? (
              <form onSubmit={handleSaveLeadEdits} className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Edit Lead Information</h4>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Phone</label>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Call Log Ref</label>
                    <input
                      type="text"
                      value={editCallLogIdentifier}
                      onChange={(e) => setEditCallLogIdentifier(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-mono text-stone-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Assigned To</label>
                    <input
                      type="text"
                      value={editAssignedTo}
                      onChange={(e) => setEditAssignedTo(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Summary / Notes</label>
                  <textarea
                    rows={2}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingInDrawer(false)}
                    className="rounded-md border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingLead}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#071D75] hover:bg-[#080C42] px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50 shadow-xs"
                  >
                    {isUpdatingLead && <Loader2 size={13} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Stage Progress & Actions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Move Pipeline Stage</label>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map((s) => (
                      <button
                        key={s.id}
                        disabled={updatingStageId !== null}
                        onClick={() => handleUpdateStage(selectedLead.id, s.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${selectedLead.stage === s.id
                            ? "bg-[#071D75] text-white border-[#071D75] shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        {updatingStageId === s.id && <Loader2 size={12} className="animate-spin" />}
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {selectedLead.summary && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                    <h4 className="text-xs font-bold text-[#080C42] uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-[#071D75]" /> Lead Notes & Summary
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedLead.summary}</p>
                  </div>
                )}
              </>
            )}

            {/* Task Assignment */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-[#071D75]" /> Assigned Tasks & Follow-ups
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
                <button
                  onClick={() => handleAddTask(selectedLead.id)}
                  disabled={isAddingTask}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50"
                >
                  {isAddingTask && <Loader2 size={14} className="animate-spin" />}
                  Add Task
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(!selectedLead.tasks || selectedLead.tasks.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No tasks assigned yet.</p>
                ) : (
                  selectedLead.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(selectedLead.id, task.id, task.isCompleted)}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        {togglingTaskId === task.id ? (
                          <Loader2 size={16} className="animate-spin text-[#071D75] shrink-0" />
                        ) : task.isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Circle size={16} className="text-slate-300 shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${task.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400 font-mono">
                        {task.assignedTo || "Sales Rep"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
