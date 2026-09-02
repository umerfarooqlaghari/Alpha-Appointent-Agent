"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Tag, Utensils, Eye, EyeOff } from "lucide-react";
import { upsertItem, deleteItem, toggleItemStatus } from "@/app/dashboard/[tenantId]/inventory/actions";
import { createCategory, deleteCategory, updateCategory } from "@/app/dashboard/[tenantId]/menu/actions";
import { type InventoryItem } from "@/lib/db";
import { useLoading } from "@/components/loading-provider";
import { formatPrice } from "@/lib/currency";

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

export function MenuClient({
  tenantId,
  initialItems,
  initialCategories,
  currency = "USD"
}: {
  tenantId: string;
  initialItems: InventoryItem[];
  initialCategories: Category[];
  currency?: string;
}) {
  const { withLoading, isLoading } = useLoading();

  // Item Modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleItemFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await withLoading(async () => {
      try {
        await upsertItem(tenantId, editingItem?.id || null, formData);
        setIsItemModalOpen(false);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "An error occurred.");
      }
    });
  };

  const handleCategoryFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    await withLoading(async () => {
      try {
        await createCategory(tenantId, name);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "An error occurred.");
      }
    });
    e.currentTarget.reset();
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditingCategoryName(cat.name);
  };

  const handleSaveEditCategory = async (categoryId: string) => {
    if (!editingCategoryName.trim()) return;
    await withLoading(async () => {
      try {
        await updateCategory(tenantId, categoryId, editingCategoryName.trim());
        setEditingCategory(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update category.");
      }
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    await withLoading(async () => {
      try {
        await deleteItem(tenantId, itemId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete item.");
      }
    });
  };

  const handleToggleItemStatus = async (itemId: string, isDisabled: boolean) => {
    await withLoading(async () => {
      try {
        await toggleItemStatus(tenantId, itemId, isDisabled);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update item status.");
      }
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? Items under it will become Uncategorized.")) return;
    await withLoading(async () => {
      try {
        await deleteCategory(tenantId, categoryId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete category.");
      }
    });
  };

  // Group items by category string
  const groupedItems = initialItems.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Sort categories: predefined first, then others that might exist in items but not in predefined, then Uncategorized
  const predefinedNames = initialCategories.map(c => c.name);
  const otherNames = Object.keys(groupedItems).filter(name => name !== "Uncategorized" && !predefinedNames.includes(name));
  const sortedCategoryNames = [...predefinedNames, ...otherNames, "Uncategorized"];

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-[#071D75] uppercase tracking-wider">RESTAURANT</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Menu Manager</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <Tag size={16} /> Manage Categories
          </button>
          <button
            onClick={handleOpenAddItem}
            className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#080C42]"
          >
            <Plus size={16} /> Add Menu Item
          </button>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="space-y-12">
        {sortedCategoryNames.map(catName => {
          const catItems = groupedItems[catName] || [];
          if (catItems.length === 0) return null;

          return (
            <div key={catName} className="space-y-4">
              <div className="border-b-2 border-blue-900/10 pb-2">
                <h3 className="text-2xl font-bold text-[#080C42] flex items-center gap-2">
                  <Utensils size={24} className="text-[#071D75]" />
                  {catName}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catItems.map((item) => (
                  <div key={item.id} className={`group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${item.is_disabled ? "opacity-60" : ""}`}>
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-lg text-[#080C42] leading-tight">{item.name}</h4>
                        <span className="font-bold text-[#071D75] bg-blue-50 px-2.5 py-1 rounded-md text-sm">{formatPrice(item.price, currency)}</span>
                      </div>
                      {item.description && <p className="mt-3 text-sm text-slate-500 line-clamp-2">{item.description}</p>}
                    </div>
                    <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
                      <span className={`text-xs font-semibold ${item.stock_status === "in_stock" ? "text-blue-700" : "text-rose-600"}`}>
                        {item.stock_status === "in_stock" ? "Available" : "Sold Out"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleItemStatus(item.id, !item.is_disabled)}
                          className="p-1.5 text-slate-400 hover:text-[#071D75] hover:bg-blue-50 rounded-md transition-colors"
                          title={item.is_disabled ? "Enable Item" : "Disable Item"}
                        >
                          {item.is_disabled ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          className="p-1.5 text-slate-400 hover:text-[#071D75] hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {initialItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Utensils className="mx-auto text-slate-300 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-slate-900">Your menu is empty</h3>
            <p className="mt-1 text-sm text-slate-500">Add your first menu item to get started.</p>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#080C42]">
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </h3>
            <form onSubmit={handleItemFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Name *
                  <input required name="name" defaultValue={editingItem?.name || ""} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none" />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  SKU *
                  <input required name="sku" defaultValue={editingItem?.sku || ""} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none" />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Price ($) *
                  <input required type="number" step="0.01" name="price" defaultValue={editingItem?.price || ""} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none" />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Category
                  <select name="category" defaultValue={editingItem?.category || ""} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none bg-white">
                    <option value="">Select Category</option>
                    {sortedCategoryNames.filter(c => c !== "Uncategorized").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Stock Status
                  <select name="stockStatus" defaultValue={editingItem?.stock_status || "in_stock"} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none bg-white">
                    <option value="in_stock">Available</option>
                    <option value="out_of_stock">Sold Out</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Description
                <textarea name="description" defaultValue={editingItem?.description || ""} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none" />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isLoading} className="rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#080C42] mb-4">Manage Categories</h3>
            
            <form onSubmit={handleCategoryFormSubmit} className="flex gap-2 mb-6">
              <input required name="name" placeholder="New Category (e.g., Seafood)" className="flex-1 rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:outline-none" />
              <button type="submit" disabled={isLoading} className="rounded-lg bg-[#080C42] hover:bg-[#071D75] px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm">
                <Plus size={16} /> Add
              </button>
            </form>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
              {initialCategories.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No predefined categories.</p>
              ) : (
                initialCategories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 gap-2">
                    {editingCategory?.id === cat.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-[#071D75] focus:outline-none bg-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditCategory(cat.id)}
                          disabled={isLoading}
                          className="rounded-md bg-[#071D75] px-3 py-1 text-xs font-semibold text-white hover:bg-[#080C42] disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-sm text-slate-800">{cat.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditCategory(cat)}
                            disabled={isLoading}
                            className="text-slate-400 hover:text-[#071D75] transition-colors p-1"
                            title="Edit category"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={isLoading}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsCategoryModalOpen(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 w-full">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
