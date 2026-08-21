"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, ShieldAlert, Download, Upload, Search, SlidersHorizontal, ToggleLeft, ToggleRight } from "lucide-react";
import { upsertItem, deleteItem, toggleItemStatus, bulkUploadInventory } from "@/app/dashboard/[tenantId]/inventory/actions";
import { type InventoryItem } from "@/lib/db";
import { useLoading } from "@/components/loading-provider";

export function InventoryClient({
  tenantId,
  initialItems
}: {
  tenantId: string;
  initialItems: InventoryItem[];
}) {

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { withLoading, isLoading } = useLoading();

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);


  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Unique categories for filtering
  const categories = ["All", ...Array.from(new Set(initialItems.map(item => item.category).filter(Boolean) as string[]))];

  // Filtered items
  const filteredItems = initialItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await withLoading(async () => {
      try {
        await upsertItem(tenantId, editingItem?.id || null, formData);
        setIsModalOpen(false);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "An error occurred.");
      }
    });
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    await withLoading(async () => {
      try {
        await deleteItem(tenantId, itemId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete item.");
      }
    });
  };

  const handleToggleStatus = async (item: InventoryItem) => {
    await withLoading(async () => {
      try {
        await toggleItemStatus(tenantId, item.id, !item.is_disabled);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update item status.");
      }
    });
  };

  const downloadCSVTemplate = () => {
    const headers = "Name,SKU,Description,Category,Price,Stock Status,Variations,Custom Variables\n";
    const sampleRow = "Classic Mug,MUG-01,Ceramic 11oz daily mug,Kitchenware,14.99,in_stock,Red;Blue;White,material:Ceramic;volume:11oz\n";
    const blob = new Blob([headers + sampleRow], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      await withLoading(async () => {
        try {
          await bulkUploadInventory(tenantId, text);
          setUploadSuccess("Inventory uploaded successfully!");
        } catch (err: unknown) {
          setUploadError(err instanceof Error ? err.message : "Failed to parse or upload CSV.");
        }
      });
    };
    reader.onerror = () => {
      setUploadError("Error reading file.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">CATALOG & STOCK</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Inventory Items</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadCSVTemplate}
            className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            <Download size={16} /> Download Template
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800">
            <Upload size={16} /> {isLoading ? "Uploading..." : "Bulk Upload CSV"}
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-md bg-[#ddf070] px-4 py-2 text-sm font-semibold text-[#12382e] shadow-sm transition hover:bg-[#cde05e]"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* CSV Status Messages */}
      {(uploadError || uploadSuccess) && (
        <div className={`p-4 rounded-md border ${uploadError ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
          <p className="text-sm font-medium">{uploadError || uploadSuccess}</p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 rounded-lg border border-black/5 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search by Name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-stone-200 py-2 pr-4 pl-10 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={18} className="text-stone-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-black/5 bg-white shadow-sm">
        <table className="w-full min-w-220 text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-5 py-4">Item details</th>
              <th className="px-5 py-4">SKU</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Stock status</th>
              <th className="px-5 py-4">Variations</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredItems.map((item) => {
              // Parse Variations safely
              let parsedVars: string[] = [];
              try {
                parsedVars = typeof item.variations === "string" ? JSON.parse(item.variations) : item.variations;
                if (!Array.isArray(parsedVars)) parsedVars = [];
              } catch {
                parsedVars = [];
              }

              // Parse Custom Variables safely
              let parsedCustom: Record<string, unknown> = {};
              try {
                parsedCustom = typeof item.custom_variables === "string" ? JSON.parse(item.custom_variables) : item.custom_variables;
                if (typeof parsedCustom !== "object" || parsedCustom === null) parsedCustom = {};
              } catch {
                parsedCustom = {};
              }

              return (
                <tr key={item.id} className={`transition hover:bg-stone-50/50 ${item.is_disabled ? "opacity-60" : ""}`}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-stone-900">{item.name}</p>
                    {item.description && <p className="mt-0.5 text-xs text-stone-500 max-w-sm line-clamp-1">{item.description}</p>}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs font-medium text-stone-600">{item.sku}</td>
                  <td className="px-5 py-4 text-stone-700">{item.category || "—"}</td>
                  <td className="px-5 py-4 font-semibold text-stone-900">${Number(item.price).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.stock_status === "in_stock" 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-rose-50 text-rose-700"
                    }`}>
                      {item.stock_status === "in_stock" ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {parsedVars.map((v, index) => (
                        <span key={index} className="inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {typeof v === "object" ? JSON.stringify(v) : v}
                        </span>
                      ))}
                      {parsedVars.length === 0 && <span className="text-stone-400">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button 
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${
                        item.is_disabled ? "text-stone-400 hover:text-stone-600" : "text-teal-600 hover:text-teal-800"
                      }`}
                    >
                      {item.is_disabled ? (
                        <>
                          <ToggleLeft size={20} /> Disabled
                        </>
                      ) : (
                        <>
                          <ToggleRight size={20} /> Active
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filteredItems.length && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-stone-500">
                  <ShieldAlert className="mx-auto mb-2 text-stone-300" size={32} />
                  No inventory items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-stone-900">
              {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
            </h3>
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-stone-700">
                  Name *
                  <input
                    required
                    name="name"
                    defaultValue={editingItem?.name || ""}
                    placeholder="E.g., Classic Mug"
                    className="mt-1 w-full rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-semibold text-stone-700">
                  SKU *
                  <input
                    required
                    name="sku"
                    defaultValue={editingItem?.sku || ""}
                    placeholder="E.g., MUG-001"
                    className="mt-1 w-full rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="block text-xs font-semibold text-stone-700">
                  Price ($) *
                  <input
                    required
                    type="number"
                    step="0.01"
                    name="price"
                    defaultValue={editingItem?.price || ""}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-semibold text-stone-700">
                  Category
                  <input
                    name="category"
                    defaultValue={editingItem?.category || ""}
                    placeholder="Category"
                    className="mt-1 w-full rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-semibold text-stone-700">
                  Stock Status
                  <select
                    name="stockStatus"
                    defaultValue={editingItem?.stock_status || "in_stock"}
                    className="mt-1 w-full rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none bg-white"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold text-stone-700">
                Description
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ""}
                  rows={2}
                  placeholder="Enter details..."
                  className="mt-1 w-full rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-stone-700">
                Variations (Comma-separated values or JSON array)
                <input
                  name="variations"
                  defaultValue={
                    editingItem?.variations 
                      ? (typeof editingItem.variations === "string" 
                          ? editingItem.variations 
                          : JSON.stringify(editingItem.variations)) 
                      : ""
                  }
                  placeholder='E.g., Small, Medium, Large or ["S", "M"]'
                  className="mt-1 w-full rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-stone-700">
                Custom Variables (Comma-separated key:value or JSON object)
                <input
                  name="customVariables"
                  defaultValue={
                    editingItem?.custom_variables 
                      ? (typeof editingItem.custom_variables === "string" 
                          ? editingItem.custom_variables 
                          : JSON.stringify(editingItem.custom_variables)) 
                      : ""
                  }
                  placeholder='E.g., color:Red, material:Cotton or {"color": "Red"}'
                  className="mt-1 w-full rounded-md border border-stone-200 p-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </label>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-md bg-[#12382e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4f42] disabled:opacity-50"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
