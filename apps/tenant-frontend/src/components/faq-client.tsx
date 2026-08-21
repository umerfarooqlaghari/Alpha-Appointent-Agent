"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, HelpCircle, Search, X } from "lucide-react";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Tenant FAQs</h1>
          <p className="text-sm text-stone-500">
            Manage frequently asked questions to help customers and enrich automated agent interactions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#12382e] px-4 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-[#1b4e41] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12382e]"
        >
          <Plus size={16} />
          Add FAQ
        </button>
      </div>

      {/* Search and Filters */}
      <div className="relative flex items-center max-w-md">
        <Search className="absolute left-3 size-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search FAQs by question or answer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
        />
      </div>

      {/* FAQs List */}
      {filteredFaqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 py-16 text-center">
          <HelpCircle className="size-12 text-stone-300" />
          <h3 className="mt-4 text-sm font-semibold text-stone-900">No FAQs found</h3>
          <p className="mt-1 text-sm text-stone-500">
            {searchQuery ? "Try checking your search terms." : "Get started by creating a new FAQ."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="group relative rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-semibold text-stone-950 text-base">{faq.question}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleOpenEdit(faq)}
                    title="Edit FAQ"
                    className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-950"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    title="Delete FAQ"
                    className="rounded p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-lg font-semibold text-stone-900">
                {editingFaq ? "Edit FAQ" : "Add FAQ"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Question
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What is your cancellation policy?"
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-stone-50/50 px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Answer
                </label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="e.g., Appointments can be cancelled up to 24 hours in advance without any fee."
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-stone-50/50 px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-stone-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#12382e] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1b4e41]"
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
