"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Clock, Briefcase, Search, SlidersHorizontal, ToggleLeft, ToggleRight } from "lucide-react";
import { createService, updateService, deleteService, toggleServiceStatus } from "@/app/dashboard/[tenantId]/services/actions";
import { useLoading } from "@/components/loading-provider";
import { formatPrice } from "@/lib/currency";

export interface ServiceItem {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: number | null;
  durationMinutes: number | null;
  category: string;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ServicesClient({
  tenantId,
  initialServices,
  currency = "USD"
}: {
  tenantId: string;
  initialServices: ServiceItem[];
  currency?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { withLoading } = useLoading();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const categories = ["All", ...Array.from(new Set(initialServices.map(s => s.category).filter(Boolean)))];

  const filteredServices = initialServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: ServiceItem) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await withLoading(async () => {
      try {
        if (editingService) {
          await updateService(tenantId, editingService.id, formData);
        } else {
          await createService(tenantId, formData);
        }
        setIsModalOpen(false);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to save service");
      }
    });
  };

  const handleToggle = async (serviceId: string) => {
    await withLoading(async () => {
      try {
        await toggleServiceStatus(tenantId, serviceId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to toggle status");
      }
    });
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    await withLoading(async () => {
      try {
        await deleteService(tenantId, serviceId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete service");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-[#071D75] uppercase tracking-wider">SERVICE CATALOG & PRICING</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Services</h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#080C42]"
        >
          <Plus size={18} /> Add Service
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search services by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-10 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={18} className="text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
              service.isDisabled ? "opacity-60 bg-slate-50/50" : ""
            }`}
          >
            <div>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#071D75] mb-2">
                    {service.category}
                  </span>
                  <h3 className="font-bold text-lg text-[#080C42] leading-tight">{service.name}</h3>
                </div>
                {service.price != null && (
                  <span className="font-bold text-lg text-[#071D75] bg-blue-50 px-2.5 py-1 rounded-lg shrink-0">
                    {formatPrice(service.price, currency)}
                  </span>
                )}
              </div>

              {service.description && (
                <p className="mt-3 text-sm text-slate-500 line-clamp-3 leading-relaxed">
                  {service.description}
                </p>
              )}

              {service.durationMinutes != null && (
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Clock size={15} className="text-[#071D75]" />
                  <span>{service.durationMinutes} minutes</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
              <button
                onClick={() => handleToggle(service.id)}
                className="flex items-center gap-1.5 text-xs font-semibold transition hover:opacity-80"
              >
                {service.isDisabled ? (
                  <>
                    <ToggleLeft size={20} className="text-slate-400" />
                    <span className="text-slate-500">Disabled</span>
                  </>
                ) : (
                  <>
                    <ToggleRight size={20} className="text-[#071D75]" />
                    <span className="text-[#071D75] font-bold">Active</span>
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(service)}
                  className="p-1.5 text-slate-400 hover:text-[#071D75] hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Briefcase className="mx-auto text-slate-300 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-slate-900">No services found</h3>
            <p className="mt-1 text-sm text-slate-500">Add your first service to get started.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#080C42]">
              {editingService ? "Edit Service" : "Add New Service"}
            </h3>
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Service Name *
                <input
                  required
                  name="name"
                  defaultValue={editingService?.name || ""}
                  placeholder="e.g. Full Dental Checkup"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Description
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingService?.description || ""}
                  placeholder="Describe what's included in this service..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Cost / Price
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    placeholder="e.g. 50 (Optional)"
                    defaultValue={editingService?.price ?? ""}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Duration (Minutes)
                  <input
                    type="number"
                    name="durationMinutes"
                    placeholder="e.g. 30 (Optional)"
                    defaultValue={editingService?.durationMinutes ?? ""}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Category
                <input
                  name="category"
                  defaultValue={editingService?.category || "General"}
                  placeholder="e.g. Dental, Consultation, Hair, Therapy"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
                />
              </label>

              {editingService && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    name="isDisabled"
                    value="true"
                    defaultChecked={editingService.isDisabled}
                    className="rounded border-slate-300 text-[#071D75] focus:ring-[#071D75] h-4 w-4"
                  />
                  Disable service (hide from booking)
                </label>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-lg bg-[#080C42] py-2.5 text-sm font-semibold text-white hover:bg-[#071D75] transition-colors shadow-md"
                >
                  {editingService ? "Save Changes" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
