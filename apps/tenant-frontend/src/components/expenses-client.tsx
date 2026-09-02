"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Receipt,
  Trash2,
  X,
  Loader2,
  TrendingUp,
  Percent,
  Layers,
  Building,
  Users,
  Megaphone,
  Briefcase,
  ExternalLink,
  PackageCheck,
  Edit3
} from "lucide-react";
import { logExpenseAction, deleteExpenseAction, setItemCogsAction } from "@/app/dashboard/[tenantId]/expenses/actions";

export interface Expense {
  id: string;
  tenantId: string;
  title: string;
  category: "supplies" | "utilities" | "payroll" | "cogs_materials" | "marketing" | "rent" | "other";
  amount: number;
  vendorName?: string;
  associatedItemId?: string;
  receiptUrl?: string;
  expenseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CogsMarginItem {
  itemId: string;
  itemName: string;
  category: string;
  salePrice: number;
  unitCogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
  unitsSold: number;
  totalCogsLogged: number;
}

export function ExpensesClient({
  tenantId,
  initialExpenses,
  initialCategoryTotals,
  initialTotalExpenses,
  initialCogsMargins
}: {
  tenantId: string;
  initialExpenses: Expense[];
  initialCategoryTotals: Record<string, number>;
  initialTotalExpenses: number;
  initialCogsMargins: CogsMarginItem[];
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [categoryTotals] = useState<Record<string, number>>(initialCategoryTotals);
  const [cogsMargins, setCogsMargins] = useState<CogsMarginItem[]>(initialCogsMargins);
  const [activeTab, setActiveTab] = useState<"expenses" | "cogs">("expenses");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Expense | null>(null);

  // Direct Unit COGS Edit Modal
  const [editCogsModalItem, setEditCogsModalItem] = useState<CogsMarginItem | null>(null);
  const [customUnitCogs, setCustomUnitCogs] = useState<number>(0);
  const [isSavingCogs, setIsSavingCogs] = useState(false);

  useEffect(() => {
    setExpenses(initialExpenses);
    setCogsMargins(initialCogsMargins);
  }, [initialExpenses, initialCogsMargins]);

  // Loading states
  const [isLoggingExpense, setIsLoggingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("supplies");
  const [amount, setAmount] = useState<number>(0);
  const [vendorName, setVendorName] = useState("");
  const [associatedItemId, setAssociatedItemId] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const handleOpenSetCogsModal = (item: CogsMarginItem) => {
    setEditCogsModalItem(item);
    setCustomUnitCogs(item.unitCogs || 0);
  };

  const handleSaveUnitCogs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCogsModalItem) return;
    setIsSavingCogs(true);
    try {
      await setItemCogsAction(tenantId, editCogsModalItem.itemId, {
        unitCogs: customUnitCogs,
        itemType: editCogsModalItem.category === "Service" ? "service" : "item"
      });

      const newUnitCogs = Math.max(0, customUnitCogs);
      const newGrossProfit = Math.max(0, editCogsModalItem.salePrice - newUnitCogs);
      const newMargin = editCogsModalItem.salePrice > 0
        ? Math.round((newGrossProfit / editCogsModalItem.salePrice) * 1000) / 10
        : 0;

      setCogsMargins((prev) =>
        prev.map((it) =>
          it.itemId === editCogsModalItem.itemId
            ? {
                ...it,
                unitCogs: newUnitCogs,
                grossProfit: newGrossProfit,
                grossMarginPercentage: newMargin
              }
            : it
        )
      );

      setEditCogsModalItem(null);
    } catch (err: unknown) {
      console.error("Failed to save unit COGS", err);
      alert(err instanceof Error ? err.message : "Failed to save unit COGS");
    } finally {
      setIsSavingCogs(false);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingExpense(true);
    try {
      const newExp = await logExpenseAction(tenantId, {
        title,
        category,
        amount,
        vendorName: vendorName || undefined,
        associatedItemId: associatedItemId || undefined,
        receiptUrl: receiptUrl || undefined,
        expenseDate: new Date(expenseDate).toISOString(),
        notes: notes || undefined
      }) as Expense;

      if (newExp) {
        setExpenses((prev) => [newExp, ...prev]);
      }
      setIsLogExpenseOpen(false);
      setTitle("");
      setAmount(0);
      setVendorName("");
      setAssociatedItemId("");
      setReceiptUrl("");
      setNotes("");
    } catch (err: unknown) {
      console.error("Failed to log expense", err);
      alert(err instanceof Error ? err.message : "Failed to log expense");
    } finally {
      setIsLoggingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense log?")) return;
    setDeletingExpenseId(id);
    try {
      await deleteExpenseAction(tenantId, id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (viewingReceipt?.id === id) setViewingReceipt(null);
    } catch (err: unknown) {
      console.error("Delete expense failed", err);
      alert(err instanceof Error ? err.message : "Delete expense failed");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory === "all") return true;
    return e.category === selectedCategory;
  });

  const totalExpenseSum = expenses.reduce((acc, e) => acc + e.amount, 0);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "cogs_materials":
        return <PackageCheck size={14} className="text-amber-700" />;
      case "payroll":
        return <Users size={14} className="text-blue-700" />;
      case "utilities":
        return <Building size={14} className="text-purple-700" />;
      case "marketing":
        return <Megaphone size={14} className="text-rose-700" />;
      default:
        return <Briefcase size={14} className="text-[#071D75]" />;
    }
  };

  const handleOpenAddCogsModal = (item: CogsMarginItem) => {
    setTitle(`Materials / COGS for ${item.itemName}`);
    setCategory("cogs_materials");
    setAssociatedItemId(item.itemId);
    setAmount(0);
    setVendorName("");
    setReceiptUrl("");
    setNotes("");
    setIsLogExpenseOpen(true);
  };

  const getMarginBadge = (item: CogsMarginItem) => {
    if (item.unitCogs === 0) {
      return (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
          No COGS Logged ($0.00)
        </span>
      );
    }
    if (item.grossMarginPercentage >= 55) {
      return <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">{item.grossMarginPercentage}% High Margin</span>;
    }
    if (item.grossMarginPercentage >= 35) {
      return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">{item.grossMarginPercentage}% Healthy</span>;
    }
    return <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800 border border-rose-200">{item.grossMarginPercentage}% Low Margin</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">FINANCE & COST CONTROL</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Expense & COGS Management</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsLogExpenseOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#080C42]"
          >
            <Plus size={16} /> Log New Expense
          </button>
        </div>
      </div>

      {/* Top 3 Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Operating Expenses</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">${totalExpenseSum.toFixed(2)}</h3>
            <p className="text-xs text-slate-500 mt-1">{expenses.length} logged expense items</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 text-rose-700 border border-rose-100">
            <Receipt size={24} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">COGS & Material Expenses</p>
            <h3 className="text-2xl font-extrabold text-amber-700 mt-1">${(categoryTotals["cogs_materials"] || 0).toFixed(2)}</h3>
            <p className="text-xs text-amber-700 font-medium mt-1">Direct product/service cost</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-amber-700 border border-amber-100">
            <PackageCheck size={24} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tracked Catalog Items</p>
            <h3 className="text-2xl font-extrabold text-[#080C42] mt-1">{cogsMargins.length} Items</h3>
            <p className="text-xs text-[#071D75] font-medium mt-1">With gross margin analysis</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-[#071D75] border border-blue-100">
            <Percent size={24} />
          </div>
        </div>
      </div>

      {/* Mode Tabs: Expense Log vs COGS Margins */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            activeTab === "expenses"
              ? "border-[#080C42] text-[#080C42]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Receipt size={16} /> All Logged Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("cogs")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition ${
            activeTab === "cogs"
              ? "border-[#080C42] text-[#080C42]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp size={16} /> COGS & Gross Margins ({cogsMargins.length})
        </button>
      </div>

      {activeTab === "expenses" ? (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-stone-200 bg-stone-100 p-1.5">
            {["all", "supplies", "cogs_materials", "payroll", "utilities", "marketing", "rent", "other"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold uppercase transition ${
                  selectedCategory === cat
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:bg-stone-200/60"
                }`}
              >
                {cat.replace(/_/g, " ")} ({expenses.filter((e) => cat === "all" || e.category === cat).length})
              </button>
            ))}
          </div>

          {/* Expenses Table */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Expense Title</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Vendor</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-stone-400">
                        No expenses logged for this category.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-stone-900">{exp.title}</div>
                          {exp.notes && <div className="text-xs text-stone-400 italic mt-0.5">&quot;{exp.notes}&quot;</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700 border border-stone-200 capitalize">
                            {getCategoryIcon(exp.category)}
                            {exp.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-stone-600 font-medium">
                          {exp.vendorName || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono text-stone-600">
                          {new Date(exp.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 font-bold font-mono text-stone-900 text-sm">
                          ${exp.amount.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          {exp.receiptUrl && (
                            <button
                              onClick={() => setViewingReceipt(exp)}
                              className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs"
                            >
                              <Receipt size={12} /> Receipt
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            disabled={deletingExpenseId === exp.id}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs disabled:opacity-50"
                          >
                            {deletingExpenseId === exp.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* COGS & Gross Margins Tab */
        <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Catalog Item / Service</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Retail Price</th>
                  <th className="px-5 py-3.5">Unit COGS</th>
                  <th className="px-5 py-3.5">Gross Profit / Unit</th>
                  <th className="px-5 py-3.5">Gross Margin</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {cogsMargins.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-stone-400">
                      No catalog items available to evaluate COGS margins.
                    </td>
                  </tr>
                ) : (
                  cogsMargins.map((item) => (
                    <tr key={item.itemId} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-stone-900">
                        {item.itemName}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-stone-500">
                        {item.category}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-stone-900">
                        ${item.salePrice.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleOpenSetCogsModal(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 hover:border-[#071D75] hover:bg-blue-50/50 hover:text-[#080C42] transition-colors shadow-2xs group"
                          title="Click to set/edit unit COGS price directly"
                        >
                          <span className={item.unitCogs > 0 ? "text-rose-700 font-bold" : "text-slate-400"}>
                            ${item.unitCogs.toFixed(2)}
                          </span>
                          <Edit3 size={12} className="text-slate-400 group-hover:text-[#071D75]" />
                        </button>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-emerald-700 font-bold">
                        ${item.grossProfit.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        {getMarginBadge(item)}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenSetCogsModal(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#071D75] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#080C42] shadow-xs"
                        >
                          <Edit3 size={11} /> Set Unit COGS
                        </button>
                        <button
                          onClick={() => handleOpenAddCogsModal(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                        >
                          <Plus size={11} /> Log Expense
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {isLogExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#080C42]">
                <Receipt className="text-[#071D75]" size={18} /> Log Supplier / Business Expense
              </h3>
              <button onClick={() => setIsLogExpenseOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Expense Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Raw Ingredients & Supplies Batch #104"
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  >
                    <option value="supplies">Supplies & Equipment</option>
                    <option value="cogs_materials">Direct COGS / Materials</option>
                    <option value="payroll">Payroll & Contractors</option>
                    <option value="utilities">Utilities & Software</option>
                    <option value="marketing">Marketing & Ads</option>
                    <option value="rent">Facility & Rent</option>
                    <option value="other">Other Operational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={amount || ""}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-mono font-bold text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Vendor / Supplier Name</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Sysco Wholesale"
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-mono text-stone-900 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Optional COGS Item Association */}
              {cogsMargins.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-1">
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} /> Associate with Product for COGS Margin (Optional)
                  </label>
                  <select
                    value={associatedItemId}
                    onChange={(e) => setAssociatedItemId(e.target.value)}
                    className="w-full rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:outline-none"
                  >
                    <option value="">-- No Direct Item Association --</option>
                    {cogsMargins.map((item) => (
                      <option key={item.itemId} value={item.itemId}>
                        {item.itemName} (Sale: ${item.salePrice.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700">Receipt Image URL / Photo Link</label>
                <input
                  type="url"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="https://storage.googleapis.com/receipts/img-402.jpg"
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Supplier invoice notes, check numbers, etc..."
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsLogExpenseOpen(false)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingExpense}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isLoggingExpense && <Loader2 size={16} className="animate-spin" />}
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Unit COGS Edit Modal */}
      {editCogsModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#080C42]">
                <Edit3 className="text-[#071D75]" size={18} /> Set Unit COGS / Direct Cost
              </h3>
              <button onClick={() => setEditCogsModalItem(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUnitCogs} className="space-y-4">
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Item / Service:</span>
                  <span className="font-bold text-stone-900">{editCogsModalItem.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Category:</span>
                  <span className="font-medium text-stone-700">{editCogsModalItem.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Retail Sale Price:</span>
                  <span className="font-mono font-bold text-stone-900">${editCogsModalItem.salePrice.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  Unit Cost of Goods Sold (COGS) ($)
                </label>
                <p className="text-[11px] text-stone-500 mb-1">
                  Enter direct production / raw material / wholesale cost per unit:
                </p>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={customUnitCogs === 0 ? "" : customUnitCogs}
                    onChange={(e) => setCustomUnitCogs(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-stone-300 bg-white pl-8 pr-3 py-2 text-lg font-mono font-bold text-stone-900 focus:outline-none focus:border-[#071D75]"
                  />
                </div>
              </div>

              {/* Dynamic Live Profit & Margin Preview */}
              {editCogsModalItem.salePrice > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-[#080C42]">
                    <span>Projected Gross Profit / Unit:</span>
                    <span className="font-mono font-bold">
                      ${Math.max(0, editCogsModalItem.salePrice - customUnitCogs).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#080C42]">
                    <span>Projected Gross Margin:</span>
                    <span className="font-mono font-bold">
                      {Math.max(0, Math.round(((editCogsModalItem.salePrice - customUnitCogs) / editCogsModalItem.salePrice) * 1000) / 10)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditCogsModalItem(null)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCogs}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingCogs && <Loader2 size={16} className="animate-spin" />}
                  Save COGS Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Photo Viewer Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#080C42]">
                <Receipt className="text-[#071D75]" size={18} /> Vendor Receipt
              </h3>
              <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>{viewingReceipt.title}</span>
                  <span className="font-mono">${viewingReceipt.amount.toFixed(2)}</span>
                </div>
                <p className="text-slate-500">Vendor: {viewingReceipt.vendorName || "Not specified"}</p>
                <p className="text-slate-500">Date: {new Date(viewingReceipt.expenseDate).toLocaleDateString()}</p>
              </div>

              {viewingReceipt.receiptUrl && (
                <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 text-center">
                  <a
                    href={viewingReceipt.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#071D75] hover:underline"
                  >
                    <ExternalLink size={13} /> View Attached Full Receipt Image
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingReceipt(null)}
                className="w-full rounded-md bg-stone-900 py-2 text-sm font-semibold text-white hover:bg-stone-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
