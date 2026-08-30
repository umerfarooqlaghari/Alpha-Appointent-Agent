"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Settings,
  UsersRound,
  Package,
  HelpCircle,
  LogOut,
  CreditCard,
  Briefcase,
  PhoneCall,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Kanban,
  FileText,
  ShoppingBag,
  BarChart3
} from "lucide-react";
import { logout } from "@/app/actions";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  suffix: string;
}

interface SalesSubModule {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  suffix: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, suffix: "" },
  { label: "Slots", icon: CalendarDays, suffix: "/calendar" },
  { label: "Appointments", icon: UsersRound, suffix: "/appointments" },
  { label: "Services", icon: Briefcase, suffix: "/services" },
  { label: "Inventory", icon: Package, suffix: "/inventory" },
  { label: "Menu", icon: Package, suffix: "/menu" },
  { label: "Orders", icon: CalendarDays, suffix: "/orders" },
  { label: "Call Logs", icon: PhoneCall, suffix: "/call-logs" },
  { label: "FAQs", icon: HelpCircle, suffix: "/faqs" },
];

const salesSubModules: SalesSubModule[] = [
  { label: "Leads & Pipeline", icon: Kanban, suffix: "/leads", badge: "1.1" },
  { label: "Quotes & Proposals", icon: FileText, suffix: "/quotes", badge: "1.2" },
  { label: "Unified Orders", icon: ShoppingBag, suffix: "/sales-orders", badge: "1.3" },
  { label: "Analytics", icon: BarChart3, suffix: "/sales-analytics", badge: "1.4" },
];

export function TenantNav({
  tenantId,
  tenantName,
  disabledTabs = "",
  industryType = ""
}: {
  tenantId: string;
  tenantName: string;
  disabledTabs?: string;
  industryType?: string;
}) {
  const basePath = `/dashboard/${tenantId}`;
  const pathname = usePathname();
  const disabledList = disabledTabs.toLowerCase().split(",").map((s) => s.trim());

  // Check if any sales sub-route is active to auto-expand
  const isSalesActive = salesSubModules.some((sub) => pathname === `${basePath}${sub.suffix}`);
  const [isSalesOpen, setIsSalesOpen] = useState<boolean>(true);

  const visibleNavItems = mainNavItems.filter((item) => {
    const labelLower = item.label.toLowerCase();
    if (labelLower === "overview") return true;
    if (disabledList.includes(labelLower)) return false;

    const ind = (industryType || "service").toLowerCase();
    if (ind === "restaurant" && labelLower === "inventory") return false;
    if (ind !== "restaurant" && labelLower === "menu") return false;

    return true;
  });

  const bottomNavItems = [
    { label: "Billing", icon: CreditCard, suffix: "/billing" },
    { label: "Settings", icon: Settings, suffix: "/settings" },
  ];

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-emerald-950/10 bg-[#12382e] p-5 text-emerald-50">
      <div>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Relay Desk</p>
          <h1 className="mt-2 text-lg font-semibold">{tenantName}</h1>
        </div>

        <nav className="space-y-1">
          {visibleNavItems.map(({ label, icon: Icon, suffix }) => {
            const href = `${basePath}${suffix}`;
            const isCurrent = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                onClick={(e) => {
                  if (isCurrent) e.preventDefault();
                }}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isCurrent
                    ? "bg-emerald-50/15 text-white cursor-default"
                    : "text-emerald-100 hover:bg-emerald-50/10"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}

          {/* Sales Module Group Dropdown */}
          <div className="pt-2">
            <button
              onClick={() => setIsSalesOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                isSalesActive
                  ? "bg-emerald-50/10 text-white"
                  : "text-emerald-100 hover:bg-emerald-50/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp size={18} className="text-[#ddf070]" />
                <span>Sales Module</span>
              </div>
              {isSalesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isSalesOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-emerald-800/50 pl-3">
                {salesSubModules.map(({ label, icon: SubIcon, suffix, badge }) => {
                  const href = `${basePath}${suffix}`;
                  const isCurrent = pathname === href;
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={(e) => {
                        if (isCurrent) e.preventDefault();
                      }}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition ${
                        isCurrent
                          ? "bg-[#ddf070]/20 text-[#ddf070] font-bold cursor-default"
                          : "text-emerald-200/80 hover:bg-emerald-50/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <SubIcon size={15} />
                        <span>{label}</span>
                      </div>
                      {badge && (
                        <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-800/40">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="mt-auto pt-6 border-t border-emerald-800/40 space-y-1">
        {bottomNavItems.map(({ label, icon: Icon, suffix }) => {
          const href = `${basePath}${suffix}`;
          const isCurrent = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              onClick={(e) => {
                if (isCurrent) e.preventDefault();
              }}
              aria-current={isCurrent ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                isCurrent
                  ? "bg-emerald-50/15 text-white cursor-default"
                  : "text-emerald-100 hover:bg-emerald-50/10"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <button
          onClick={async () => {
            await logout();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut size={18} />
          Logout
        </button>

        <Link
          href={`/call/${tenantId}`}
          target="_blank"
          className="mt-4 flex items-center justify-between rounded-md bg-[#ddf070] px-3 py-3 text-sm font-semibold text-[#173a2d] transition hover:bg-[#cbe05d]"
        >
          Open call page <ExternalLink size={16} />
        </Link>
      </div>
    </aside>
  );
}