"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, HelpCircle, Search, X } from "lucide-react";
import { upsertFaq, deleteFaq } from "@/app/dashboard/[tenantId]/faqs/actions";
import { type Faq } from "@/lib/db";
import { useLoading } from "@/components/loading-provider";

export function FaqClient({
  tenantId,
  initialFaqs
}: {
  tenantId: string;
  initialFaqs: Faq[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { withLoading } = useLoading();

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

  // Form values
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const filteredFaqs = initialFaqs.filter(faq => {
    return (
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setQuestion("");
    setAnswer("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("question", question);
    formData.append("answer", answer);

    await withLoading(async () => {
      try {
        await upsertFaq(tenantId, editingFaq?.id || null, formData);
        setIsModalOpen(false);
        setQuestion("");
        setAnswer("");
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "An error occurred.");
      }
    });
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    await withLoading(async () => {
      try {
        await deleteFaq(tenantId, faqId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete FAQ.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#080C42]">Tenant FAQs</h1>
          <p className="text-sm text-slate-500">
            Manage frequently asked questions to help customers and enrich automated agent interactions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#071D75] px-4 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-[#080C42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#071D75]"
        >
          <Plus size={16} />
          Add FAQ
        </button>
      </div>

      {/* Search and Filters */}
      <div className="relative flex items-center max-w-md">
        <Search className="absolute left-3 size-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search FAQs by question or answer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75]"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            <HelpCircle className="mx-auto size-8 text-slate-400 mb-2" />
            <p className="font-medium text-slate-700">No FAQs found</p>
            <p className="text-xs text-slate-400 mt-1">Add your first question and answer to get started.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-base text-[#080C42] flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#071D75]">
                      Q
                    </span>
                    {faq.question}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(faq)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-[#071D75] transition"
                      title="Edit FAQ"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete FAQ"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="pl-8 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-lg font-bold text-[#080C42]">
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Question
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What is your cancellation policy?"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm outline-none transition focus:border-[#071D75] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Answer
                </label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="e.g., Appointments can be cancelled up to 24 hours in advance without any fee."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-sm outline-none transition focus:border-[#071D75] focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all"
                >
                  {editingFaq ? "Save Changes" : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
