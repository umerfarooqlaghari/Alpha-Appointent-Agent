"use client";

import React, { useState, useEffect } from "react";
import { PhoneCall, Clock, FileText, Trash2, Search, Volume2, Sparkles, X, User, Bot, PhoneIncoming, PhoneOutgoing, Radio, Tag, Check, Edit2, Loader2 } from "lucide-react";
import { deleteCallLog, createSampleCallLog, updateCallLogIdentifier } from "@/app/dashboard/[tenantId]/call-logs/actions";
import { useLoading } from "@/components/loading-provider";

export interface CallLogItem {
  id: string;
  tenantId: string;
  identifier?: string | null;
  customerPhone: string | null;
  durationSeconds: number;
  transcript: string | null;
  summary: string | null;
  recordingUrl: string | null;
  cost: number;
  startedAt: string | null;
  endedAt: string | null;
  callType?: string;
  createdAt: string;
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function getCallTypeBadge(type?: string) {
  const t = (type || "inbound").toLowerCase();
  if (t === "outbound") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
        <PhoneOutgoing size={12} /> Outbound
      </span>
    );
  }
  if (t === "web") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        <Radio size={12} /> Web Widget
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      <PhoneIncoming size={12} /> Inbound
    </span>
  );
}

export function CallLogsClient({
  tenantId,
  initialLogs,
}: {
  tenantId: string;
  initialLogs: CallLogItem[];
  currency?: string;
}) {
  const [logs, setLogs] = useState<CallLogItem[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTranscriptLog, setActiveTranscriptLog] = useState<CallLogItem | null>(null);
  const [editingIdentifierId, setEditingIdentifierId] = useState<string | null>(null);
  const [identifierInput, setIdentifierInput] = useState("");
  const [savingIdentifierId, setSavingIdentifierId] = useState<string | null>(null);
  const { withLoading } = useLoading();

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const filteredLogs = logs.filter(log => {
    const phoneMatch = log.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase());
    const summaryMatch = log.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const transcriptMatch = log.transcript?.toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = log.callType?.toLowerCase().includes(searchQuery.toLowerCase());
    const identifierMatch = log.identifier?.toLowerCase().includes(searchQuery.toLowerCase());
    return !searchQuery || phoneMatch || summaryMatch || transcriptMatch || typeMatch || identifierMatch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this call log?")) return;
    await withLoading(async () => {
      try {
        await deleteCallLog(tenantId, id);
        setLogs((prev) => prev.filter((l) => l.id !== id));
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete call log");
      }
    });
  };

  const handleSeedSample = async () => {
    await withLoading(async () => {
      try {
        await createSampleCallLog(tenantId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to add sample call log");
      }
    });
  };

  const handleStartEditIdentifier = (log: CallLogItem) => {
    setEditingIdentifierId(log.id);
    setIdentifierInput(log.identifier || "");
  };

  const handleSaveIdentifier = async (id: string) => {
    setSavingIdentifierId(id);
    const updatedTag = identifierInput.trim() || null;
    try {
      await updateCallLogIdentifier(tenantId, id, updatedTag);
      setLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, identifier: updatedTag } : l))
      );
      setEditingIdentifierId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update identifier");
    } finally {
      setSavingIdentifierId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">VAPI VOICE ASSISTANT</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Call Logs & Transcripts</h2>
        </div>
        <button
          onClick={handleSeedSample}
          className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#080C42]"
        >
          <Sparkles size={16} /> Add Test Log
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by identifier tag, phone number, transcript, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-10 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
          />
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="overflow-x-auto rounded-lg border border-black/5 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Identifier / Ref</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Date & Time</th>
              <th className="px-5 py-4">Duration</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="transition hover:bg-stone-50/50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#071D75]">
                      <PhoneCall size={15} />
                    </div>
                    <div>
                      <p className="font-bold text-[#080C42]">{log.customerPhone || "Web Call Widget"}</p>
                      <p className="text-xs font-mono text-slate-400">{log.id.substring(0, 12)}...</p>
                    </div>
                  </div>
                </td>
                
                {/* Identifier Column with inline edit */}
                <td className="px-5 py-4">
                  {editingIdentifierId === log.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={identifierInput}
                        onChange={(e) => setIdentifierInput(e.target.value)}
                        placeholder="e.g. Lead-101"
                        className="w-28 rounded-lg border border-[#071D75] bg-white px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#071D75]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveIdentifier(log.id)}
                        disabled={savingIdentifierId === log.id}
                        className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                        title="Save identifier"
                      >
                        {savingIdentifierId === log.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingIdentifierId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      {log.identifier ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-semibold text-[#071D75] border border-blue-200">
                          <Tag size={11} className="text-[#071D75]" />
                          {log.identifier}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No ref</span>
                      )}
                      <button
                        onClick={() => handleStartEditIdentifier(log)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 transition-opacity"
                        title="Edit identifier"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </td>

                <td className="px-5 py-4">
                  {getCallTypeBadge(log.callType)}
                </td>
                <td className="px-5 py-4 text-xs font-medium text-stone-600">
                  {new Date(log.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                    <Clock size={13} className="text-stone-500" />
                    {formatDuration(log.durationSeconds)}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {log.transcript && (
                      <button
                        onClick={() => setActiveTranscriptLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-[#071D75] hover:bg-blue-100 transition-colors"
                      >
                        <FileText size={14} /> View Transcript
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete log"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center my-4">
            <PhoneCall className="mx-auto text-slate-300 mb-3" size={48} />
            <h3 className="text-lg font-bold text-[#080C42]">No call logs yet</h3>
            <p className="mt-1 text-sm text-slate-500">Both incoming and outgoing Vapi AI calls will automatically appear here with transcripts.</p>
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {activeTranscriptLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#071D75] uppercase tracking-wider">CALL TRANSCRIPT & RECORDING</span>
                <h3 className="text-xl font-bold text-[#080C42] mt-0.5">
                  {activeTranscriptLog.customerPhone || "Web Call Widget"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(activeTranscriptLog.createdAt).toLocaleString()} • Duration: {formatDuration(activeTranscriptLog.durationSeconds)}
                  {activeTranscriptLog.identifier && ` • Ref: ${activeTranscriptLog.identifier}`}
                </p>
              </div>
              <button
                onClick={() => setActiveTranscriptLog(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Audio Recording Player if present */}
            {activeTranscriptLog.recordingUrl && (
              <div className="mt-4 p-3 bg-[#080C42] text-white rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-100">
                  <Volume2 size={18} className="text-[#93c5fd]" />
                  <span>Call Audio Recording</span>
                </div>
                <audio
                  controls
                  src={
                    activeTranscriptLog.recordingUrl.startsWith("http")
                      ? activeTranscriptLog.recordingUrl
                      : `/api/tenants/${encodeURIComponent(tenantId)}/call-logs/${encodeURIComponent(activeTranscriptLog.id)}/audio`
                  }
                  className="h-8 max-w-xs"
                />
              </div>
            )}

            {/* Summary Banner */}
            {activeTranscriptLog.summary && (
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200/60 p-3 text-xs text-amber-900">
                <p className="font-bold text-amber-800 mb-0.5 flex items-center gap-1">
                  <Sparkles size={14} /> AI Call Summary:
                </p>
                {activeTranscriptLog.summary}
              </div>
            )}

            {/* Transcript Messages */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {activeTranscriptLog.transcript?.split("\n").map((line, idx) => {
                if (!line.trim()) return null;
                const isUser = line.toLowerCase().startsWith("customer:") || line.toLowerCase().startsWith("user:");
                const isAi = line.toLowerCase().startsWith("ai:") || line.toLowerCase().startsWith("assistant:");
                const cleanText = line.replace(/^(customer|user|ai|assistant):\s*/i, "");

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 p-3 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-slate-100 text-slate-900 ml-6"
                        : isAi
                        ? "bg-blue-50 text-[#080C42] border border-blue-100 mr-6"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isUser ? <User size={16} className="text-slate-500" /> : <Bot size={16} className="text-[#071D75]" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[11px] text-slate-500 mb-0.5">
                        {isUser ? "Customer" : isAi ? "Vapi AI Assistant" : "System"}
                      </p>
                      <p className="text-xs">{cleanText}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-stone-100 pt-3 flex justify-end">
              <button
                onClick={() => setActiveTranscriptLog(null)}
                className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
