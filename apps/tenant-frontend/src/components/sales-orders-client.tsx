"use client";

import React, { useState, useEffect } from "react";
import { Plus, PhoneCall, Monitor, Globe, UserCheck, Calendar, Edit3, Clock, Trash2, X, ShoppingBag, Loader2, Utensils, Briefcase, CalendarCheck } from "lucide-react";
import { createUnifiedOrderAction, updateOrderStatusAction, updateOrderItemsAction, rescheduleOrderAction } from "@/app/dashboard/[tenantId]/sales-orders/actions";

export interface UnifiedOrderItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface UnifiedOrder {
  id: string;
  tenantId: string;
  origin?: "direct_sales" | "restaurant_order" | "service_booking";
  customerName: string;
  customerPhone: string;
  source: "voice_ai" | "pos" | "web" | "manual";
  orderType: "pickup" | "delivery" | "service_booking";
  scheduledDate?: string;
  status: "new" | "in_progress" | "out_for_delivery" | "completed" | "cancelled";
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: UnifiedOrderItem[];
}

export function SalesOrdersClient({ tenantId, initialOrders }: { tenantId: string; initialOrders: UnifiedOrder[] }) {
  const [orders, setOrders] = useState<UnifiedOrder[]>(initialOrders);
  const [activeStatusTab, setActiveStatusTab] = useState<string>("all");
  const [activeOriginTab, setActiveOriginTab] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<UnifiedOrder | null>(null);
  const [reschedulingOrder, setReschedulingOrder] = useState<UnifiedOrder | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Loading state trackers
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [updatingStatusOrderId, setUpdatingStatusOrderId] = useState<string | null>(null);
  const [isSavingEditItems, setIsSavingEditItems] = useState(false);
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);

  // New order state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [source, setSource] = useState<"voice_ai" | "pos" | "web" | "manual">("manual");
  const [orderType, setOrderType] = useState<"pickup" | "delivery" | "service_booking">("pickup");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items] = useState<UnifiedOrderItem[]>([
    { name: "Standard Package Item", quantity: 1, unitPrice: 85 },
  ]);

  // Edit line items state
  const [editItemsList, setEditItemsList] = useState<UnifiedOrderItem[]>([]);
  const [rescheduleDateValue, setRescheduleDateValue] = useState("");

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOrder(true);
    try {
      const newOrder = await createUnifiedOrderAction(tenantId, {
        customerName,
        customerPhone,
        source,
        orderType,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        notes,
        items,
      });
      if (newOrder) {
        setOrders((prev) => [newOrder as UnifiedOrder, ...prev]);
      }
      setIsCreateOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
    } catch (err: unknown) {
      console.error("Create order failed", err);
      alert(err instanceof Error ? err.message : "Create order failed");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdatingStatusOrderId(orderId);
    try {
      const updated = await updateOrderStatusAction(tenantId, orderId, status) as { status: "new" | "in_progress" | "out_for_delivery" | "completed" | "cancelled" };
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)));
      }
    } catch (err: unknown) {
      console.error("Update status failed", err);
      alert(err instanceof Error ? err.message : "Update status failed");
    } finally {
      setUpdatingStatusOrderId(null);
    }
  };

  const handleSaveEditItems = async (orderId: string) => {
    setIsSavingEditItems(true);
    try {
      const res = await updateOrderItemsAction(tenantId, orderId, editItemsList) as { order: UnifiedOrder; items: UnifiedOrderItem[] };
      if (res) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, totalAmount: res.order.totalAmount, items: res.items } : o))
        );
        setEditingOrder(null);
      }
    } catch (err: unknown) {
      console.error("Save edit items failed", err);
      alert(err instanceof Error ? err.message : "Save edit items failed");
    } finally {
      setIsSavingEditItems(false);
    }
  };

  const handleSaveReschedule = async (orderId: string) => {
    if (!rescheduleDateValue) return;
    setIsSavingReschedule(true);
    try {
      const updated = await rescheduleOrderAction(tenantId, orderId, new Date(rescheduleDateValue).toISOString()) as { scheduledDate?: string };
      if (updated) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, scheduledDate: updated.scheduledDate } : o))
        );
        setReschedulingOrder(null);
      }
    } catch (err: unknown) {
      console.error("Reschedule failed", err);
      alert(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setIsSavingReschedule(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = activeStatusTab === "all" || o.status === activeStatusTab;
    const origin = o.origin || "direct_sales";
    const matchesOrigin = activeOriginTab === "all" || origin === activeOriginTab;
    return matchesStatus && matchesOrigin;
  });

  const getOriginBadge = (origin?: string) => {
    switch (origin) {
      case "restaurant_order":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
            <Utensils size={11} /> Restaurant Order
          </span>
        );
      case "service_booking":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <CalendarCheck size={11} /> Service Booking
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#071D75] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <Briefcase size={11} /> Direct Sale
          </span>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "voice_ai":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full"><PhoneCall size={11} /> Voice AI</span>;
      case "pos":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Monitor size={11} /> POS</span>;
      case "web":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#071D75] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><Globe size={11} /> Web</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"><UserCheck size={11} /> Manual</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 uppercase">New</span>;
      case "in_progress":
        return <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 uppercase">In Progress</span>;
      case "out_for_delivery":
        return <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200 uppercase">Out for Delivery</span>;
      case "completed":
        return <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 uppercase">Completed</span>;
      case "cancelled":
        return <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200 uppercase">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#071D75]">UNIFIED FULFILLMENT</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">Unified Orders & Bookings</h2>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#071D75] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#080C42]"
        >
          <Plus size={16} /> New Unified Order
        </button>
      </div>

      {/* Dual Filter Bars: Origin Channel + Status */}
      <div className="space-y-2.5">
        {/* Origin Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Source Origin:</span>
          {[
            { id: "all", label: "All Channels" },
            { id: "direct_sales", label: "Direct Sales" },
            { id: "restaurant_order", label: "Restaurant Orders" },
            { id: "service_booking", label: "Service Bookings" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveOriginTab(tab.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition border ${
                activeOriginTab === tab.id
                  ? "bg-[#080C42] text-white border-[#080C42] shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label} ({orders.filter((o) => tab.id === "all" || (o.origin || "direct_sales") === tab.id).length})
            </button>
          ))}
        </div>

        {/* Status Lifecycle Filter */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1.5">
          {["all", "new", "in_progress", "out_for_delivery", "completed", "cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatusTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeStatusTab === tab
                  ? "bg-[#080C42] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.replace(/_/g, " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">
            No orders found in this filter selection.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#071D75] transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {getOriginBadge(order.origin)}
                      {getSourceBadge(order.source)}
                    </div>
                    <h3 className="text-base font-bold text-[#080C42]">{order.customerName}</h3>
                    <p className="text-xs text-slate-500 font-mono">{order.customerPhone}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">#{order.id.substring(0, 7)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium capitalize">{order.orderType.replace(/_/g, " ")}</span>
                  {getStatusBadge(order.status)}
                </div>

                {/* Scheduled Date if available */}
                {order.scheduledDate && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                    <span className="flex items-center gap-1.5 font-medium truncate">
                      <Calendar size={13} className="text-[#071D75] shrink-0" />
                      <span className="truncate">{new Date(order.scheduledDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                    </span>
                    <button
                      onClick={() => {
                        setReschedulingOrder(order);
                        setRescheduleDateValue(order.scheduledDate ? new Date(order.scheduledDate).toISOString().slice(0, 16) : "");
                      }}
                      className="text-xs font-bold text-[#071D75] hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Clock size={12} /> Reschedule
                    </button>
                  </div>
                )}

                {/* Items Summary */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-700 pb-1 border-b border-slate-200">
                    <span>Items ({order.items?.length || 0})</span>
                    {(order.origin === "direct_sales" || !order.origin) && (
                      <button
                        onClick={() => {
                          setEditingOrder(order);
                          setEditItemsList(order.items || []);
                        }}
                        className="text-xs font-bold text-[#071D75] hover:underline flex items-center gap-1"
                      >
                        <Edit3 size={12} /> Edit Items
                      </button>
                    )}
                  </div>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span className="truncate pr-2">{item.name} x{item.quantity}</span>
                      <span className="font-mono shrink-0">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[#071D75] font-bold">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {order.notes && (
                  <p className="text-xs italic text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed">
                    &quot;{order.notes}&quot;
                  </p>
                )}
              </div>

              {/* Status transition dropdown */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status Lifecycle</label>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    disabled={updatingStatusOrderId === order.id}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none disabled:opacity-50"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {updatingStatusOrderId === order.id && (
                    <Loader2 size={16} className="animate-spin text-[#071D75] shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#080C42]">
                <ShoppingBag className="text-[#071D75]" size={18} /> Create Unified Order
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Ingestion Channel</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as "voice_ai" | "pos" | "web" | "manual")}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="voice_ai">Voice AI Call</option>
                    <option value="pos">POS Terminal</option>
                    <option value="web">Web Booking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as "pickup" | "delivery" | "service_booking")}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                  >
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                    <option value="service_booking">Service Booking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Scheduled Date/Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Order / Booking Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrder}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isCreatingOrder && <Loader2 size={16} className="animate-spin" />}
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Line Items Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900">Edit Line Items - #{editingOrder.id.substring(0, 8)}</h3>
              <button onClick={() => setEditingOrder(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {editItemsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditItemsList((prev) => prev.map((i, iIdx) => (iIdx === idx ? { ...i, name: val } : i)));
                    }}
                    className="flex-1 rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setEditItemsList((prev) => prev.map((i, iIdx) => (iIdx === idx ? { ...i, quantity: val } : i)));
                    }}
                    className="w-16 rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900 focus:outline-none text-center"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditItemsList((prev) => prev.map((i, iIdx) => (iIdx === idx ? { ...i, unitPrice: val } : i)));
                    }}
                    className="w-20 rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900 focus:outline-none text-right font-mono"
                  />
                  <button
                    onClick={() => setEditItemsList((prev) => prev.filter((_, iIdx) => iIdx !== idx))}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditItemsList((prev) => [...prev, { name: "New Line Item", quantity: 1, unitPrice: 25 }])}
                className="text-xs font-bold text-[#071D75] hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => setEditingOrder(null)}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEditItems(editingOrder.id)}
                disabled={isSavingEditItems}
                className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
              >
                {isSavingEditItems && <Loader2 size={16} className="animate-spin" />}
                Save Line Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900">Reschedule Date & Time</h3>
              <button onClick={() => setReschedulingOrder(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">New Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={rescheduleDateValue}
                onChange={(e) => setRescheduleDateValue(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => setReschedulingOrder(null)}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveReschedule(reschedulingOrder.id)}
                disabled={isSavingReschedule}
                className="inline-flex items-center gap-2 rounded-lg bg-[#080C42] hover:bg-[#071D75] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
              >
                {isSavingReschedule && <Loader2 size={16} className="animate-spin" />}
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
