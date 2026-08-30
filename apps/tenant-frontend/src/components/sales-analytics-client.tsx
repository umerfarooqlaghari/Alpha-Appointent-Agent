"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Target,
  PhoneCall,
  Monitor,
  Globe,
  Layers,
  Award,
  Calendar,
  Sparkles
} from "lucide-react";

export interface TimeBucket {
  label: string;
  revenue: number;
  ordersCount: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  ordersCount: number;
  percentage: number;
}

export interface TopItem {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

export interface ChannelMetric {
  channel: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface SalesAnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  monthlyRevenue: TimeBucket[];
  weeklyRevenue: TimeBucket[];
  categoryBreakdown: CategoryBreakdown[];
  topItems: TopItem[];
  channelBreakdown: ChannelMetric[];
  pipelineFunnel: FunnelStage[];
}

export function SalesAnalyticsClient({
  tenantId: _tenantId,
  initialData
}: {
  tenantId: string;
  initialData: SalesAnalyticsData;
}) {
  const [data] = useState<SalesAnalyticsData>(initialData);
  const [timeframe, setTimeframe] = useState<"monthly" | "weekly">("monthly");

  const chartBuckets = timeframe === "monthly" ? data.monthlyRevenue : data.weeklyRevenue;
  const maxRevenue = Math.max(1, ...chartBuckets.map((b) => b.revenue));

  const getChannelIcon = (channel: string) => {
    if (channel.toLowerCase().includes("voice")) return <PhoneCall size={14} className="text-purple-600 shrink-0" />;
    if (channel.toLowerCase().includes("pos") || channel.toLowerCase().includes("restaurant")) return <Monitor size={14} className="text-emerald-600 shrink-0" />;
    if (channel.toLowerCase().includes("web")) return <Globe size={14} className="text-blue-600 shrink-0" />;
    return <Sparkles size={14} className="text-teal-600 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">PERFORMANCE & REVENUE</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">Sales Analytics</h2>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex items-center rounded-lg border border-stone-200 bg-white p-1 shadow-xs">
          <button
            onClick={() => setTimeframe("monthly")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              timeframe === "monthly"
                ? "bg-teal-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Calendar size={13} /> Monthly View
          </button>
          <button
            onClick={() => setTimeframe("weekly")}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              timeframe === "weekly"
                ? "bg-teal-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <TrendingUp size={13} /> Weekly View
          </button>
        </div>
      </div>

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Gross Sales Revenue</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-xs text-emerald-700 font-medium mt-1">Across all sales channels</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-teal-800 border border-teal-100">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Total Orders / Bookings */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Orders & Bookings</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">{data.totalOrders.toLocaleString()}</h3>
            <p className="text-xs text-stone-500 mt-1">Unified orders processed</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700 border border-blue-100">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Avg Deal Size (AOV)</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">${data.averageOrderValue.toFixed(2)}</h3>
            <p className="text-xs text-stone-500 mt-1">Per completed sale</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-amber-700 border border-amber-100">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Pipeline Win Rate */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Pipeline Win Rate</p>
            <h3 className="text-2xl font-extrabold text-teal-800 mt-1">{data.conversionRate}%</h3>
            <p className="text-xs text-stone-500 mt-1">{data.wonLeads} won of {data.totalLeads} total leads</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 border border-emerald-100">
            <Target size={24} />
          </div>
        </div>
      </div>

      {/* Main Revenue Trend Chart */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900">Revenue Progression</h3>
            <p className="text-xs text-stone-500">
              {timeframe === "monthly" ? "Gross revenue trends across the last 6 months" : "Weekly revenue volume across the last 8 weeks"}
            </p>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Peak: ${maxRevenue.toLocaleString()}
          </span>
        </div>

        {/* Bar & Volume Visualizer */}
        <div className="pt-4 pb-2">
          <div className="grid grid-flow-col auto-cols-fr gap-3 sm:gap-6 items-end h-56 border-b border-stone-200 pb-2">
            {chartBuckets.map((bucket, idx) => {
              const heightPercent = Math.max(8, Math.round((bucket.revenue / maxRevenue) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[11px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none mb-1">
                    ${bucket.revenue.toFixed(2)} ({bucket.ordersCount} orders)
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[48px] bg-stone-100 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-teal-800 to-[#ddf070] rounded-t-md transition-all duration-500 group-hover:brightness-110"
                    />
                  </div>

                  {/* Label */}
                  <span className="text-[11px] font-semibold text-stone-600 truncate max-w-full text-center">
                    {bucket.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Categories Breakdown & Top Items Leaderboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Categories Breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Layers size={18} className="text-teal-700" /> Revenue by Category
            </h3>
            <span className="text-xs text-stone-400 font-mono">{data.categoryBreakdown.length} Categories</span>
          </div>

          <div className="space-y-3.5">
            {data.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-800">{cat.category}</span>
                  <div className="space-x-2">
                    <span className="text-stone-500">{cat.ordersCount} orders</span>
                    <span className="font-mono font-bold text-stone-900">${cat.revenue.toFixed(2)} ({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-teal-700 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Items */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Award size={18} className="text-amber-600" /> Top Selling Items
            </h3>
            <span className="text-xs text-stone-400 font-mono">By Volume & Revenue</span>
          </div>

          <div className="divide-y divide-stone-100">
            {data.topItems.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <h4 className="font-semibold text-xs text-stone-900 truncate">{item.name}</h4>
                    <span className="text-[11px] text-stone-400 font-mono">{item.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-xs text-teal-800">${item.revenue.toFixed(2)}</span>
                  <p className="text-[11px] text-stone-500">{item.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Channel Distribution & Pipeline Conversion Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Channel Ingestion Breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            Sales Channel Ingestion
          </h3>

          <div className="space-y-3">
            {data.channelBreakdown.map((ch, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 p-3">
                <div className="flex items-center gap-2.5">
                  {getChannelIcon(ch.channel)}
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{ch.channel}</h4>
                    <p className="text-[11px] text-stone-500">{ch.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-stone-900">{ch.percentage}%</span>
                  <p className="text-[11px] font-mono text-teal-800 font-semibold">${ch.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Conversion Funnel */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            Pipeline Conversion Funnel
          </h3>

          <div className="space-y-2.5">
            {data.pipelineFunnel.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-800">{step.stage}</span>
                  <span className="font-mono font-bold text-stone-900">{step.count} leads ({step.percentage}%)</span>
                </div>
                <div className="w-full h-3 rounded-md bg-stone-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.max(6, step.percentage)}%` }}
                    className={`h-full rounded-md transition-all duration-500 ${
                      idx === 0
                        ? "bg-blue-600"
                        : idx === 1
                        ? "bg-amber-500"
                        : idx === 2
                        ? "bg-purple-600"
                        : "bg-emerald-600"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
