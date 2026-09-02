"use client";

import React, { useState } from "react";
import { type RestaurantOrder } from "@/lib/db";
import { useLoading } from "@/components/loading-provider";
import { updateOrderStatus } from "@/app/dashboard/[tenantId]/orders/actions";
import { Search, SlidersHorizontal, Package } from "lucide-react";
import { formatPrice } from "@/lib/currency";

export function OrdersClient({
  tenantId,
  initialOrders,
  industryType = "",
  currency = "USD"
}: {
  tenantId: string;
  initialOrders: RestaurantOrder[];
  industryType?: string;
  currency?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const { withLoading } = useLoading();

  const isRestaurant = industryType.toLowerCase() === "restaurant";

  const statuses = isRestaurant
    ? ["All", "pending", "preparing", "ready", "delivered", "cancelled"]
    : ["All", "pending", "processing", "shipped", "delivered", "cancelled"];

  const statusOptions = isRestaurant
    ? [
        { value: "pending", label: "Pending" },
        { value: "preparing", label: "Preparing" },
        { value: "ready", label: "Ready" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
      ]
    : [
        { value: "pending", label: "Pending" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
      ];

  const filteredOrders = initialOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (orderId: string, status: string) => {
    await withLoading(async () => {
      try {
        await updateOrderStatus(tenantId, orderId, status);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "preparing":
      case "processing": return "bg-blue-100 text-blue-800";
      case "ready":
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-rose-100 text-rose-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-[#071D75] uppercase tracking-wider">
            {isRestaurant ? "RESTAURANT & FOOD ORDERS" : "STORE & E-COMMERCE ORDERS"}
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#080C42]">
            {isRestaurant ? "Customer Dining Orders" : "Product & Store Orders"}
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Customer Name or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-10 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={18} className="text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 p-2 text-sm focus:border-[#071D75] focus:ring-1 focus:ring-[#071D75] focus:outline-none capitalize"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full min-w-220 text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">Order ID</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <tr key={order.orderId} className="transition hover:bg-slate-50/50">
                <td className="px-5 py-4 font-mono text-xs text-slate-600">{order.orderId.substring(0, 8)}...</td>
                <td className="px-5 py-4">
                  <p className="font-bold text-[#080C42]">{order.customerName}</p>
                  <p className="text-xs text-slate-500">{order.customerPhone}</p>
                  {order.customerAddress && <p className="text-xs text-slate-500">{order.customerAddress}</p>}
                </td>
                <td className="px-5 py-4 capitalize font-semibold text-slate-700">{order.orderType}</td>
                <td className="px-5 py-4 font-bold text-[#080C42]">{formatPrice(order.totalAmount, currency)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                    className="rounded-lg border border-slate-200 p-1.5 text-xs focus:border-[#071D75] focus:outline-none capitalize"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!filteredOrders.length && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <Package className="mx-auto mb-2 text-slate-300" size={32} />
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
