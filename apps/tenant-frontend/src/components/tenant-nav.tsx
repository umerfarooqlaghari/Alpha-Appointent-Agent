"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  BarChart3,
  CheckSquare,
  Users,
  Mail,
  Cpu
} from "lucide-react";
import { logout } from "@/app/actions";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  suffix: string;
}

interface SubModuleItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  suffix: string;
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

const salesSubModules: SubModuleItem[] = [
  { label: "Leads & Pipeline", icon: Kanban, suffix: "/leads" },
  { label: "Quotes & Proposals", icon: FileText, suffix: "/quotes" },
  { label: "Unified Orders", icon: ShoppingBag, suffix: "/sales-orders" },
  { label: "Analytics", icon: BarChart3, suffix: "/sales-analytics" },
];

const financeSubModules: SubModuleItem[] = [
  { label: "Invoicing & Billing", icon: FileText, suffix: "/invoices" },
  { label: "Expense & COGS", icon: CreditCard, suffix: "/expenses" },
  { label: "Accounts Receivable", icon: TrendingUp, suffix: "/receivables" },
];

const operationsSubModules: SubModuleItem[] = [
  { label: "Service Fulfillment", icon: CheckSquare, suffix: "/fulfillment" },
  { label: "Staff & Dispatch", icon: Users, suffix: "/dispatch" },
  { label: "Email Alerts & Logs", icon: Mail, suffix: "/email-alerts" },
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

  const visibleSalesSubModules = salesSubModules.filter((sub) => {
    const key = sub.suffix.replace("/", "").toLowerCase();
    return !disabledList.includes(key);
  });

  const visibleFinanceSubModules = financeSubModules.filter((sub) => {
    const key = sub.suffix.replace("/", "").toLowerCase();
    return !disabledList.includes(key);
  });

  const visibleOperationsSubModules = operationsSubModules.filter((sub) => {
    const key = sub.suffix.replace("/", "").toLowerCase();
    return !disabledList.includes(key);
  });

  const isSalesActive = visibleSalesSubModules.some((sub) => pathname === `${basePath}${sub.suffix}`);
  const [isSalesOpen, setIsSalesOpen] = useState<boolean>(false);

  const isFinanceActive = visibleFinanceSubModules.some((sub) => pathname === `${basePath}${sub.suffix}`);
  const [isFinanceOpen, setIsFinanceOpen] = useState<boolean>(false);

  const isOperationsActive = visibleOperationsSubModules.some((sub) => pathname === `${basePath}${sub.suffix}`);
  const [isOperationsOpen, setIsOperationsOpen] = useState<boolean>(false);

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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-[#080C42] text-blue-50 z-30">
      {/* Top Branding Section */}
      <div className="shrink-0 p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-md">
            <Image
              src="/logo.jpg"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">Relay Desk</p>
            <h1 className="truncate text-base font-bold text-white" title={tenantName}>{tenantName}</h1>
          </div>
        </div>
      </div>

      {/* Middle Scrollable Nav Items */}
      <div className="flex-1 overflow-y-auto px-5 py-2 scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent">
        <nav className="space-y-1 pb-4">
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
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isCurrent
                    ? "bg-[#071D75] text-white shadow-sm font-semibold cursor-default"
                    : "text-blue-100/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}

          {/* Sales Module Group Dropdown */}
          {visibleSalesSubModules.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setIsSalesOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isSalesActive
                    ? "bg-white/10 text-white"
                    : "text-blue-100/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp size={17} className="text-blue-300" />
                  <span>Sales Module</span>
                </div>
                {isSalesOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>

              {isSalesOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-blue-800/50 pl-3">
                  {visibleSalesSubModules.map(({ label, icon: SubIcon, suffix }) => {
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
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                          isCurrent
                            ? "bg-[#071D75] text-white font-bold cursor-default shadow-xs"
                            : "text-blue-200/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <SubIcon size={14} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Finance Module Group Dropdown */}
          {visibleFinanceSubModules.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setIsFinanceOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isFinanceActive
                    ? "bg-white/10 text-white"
                    : "text-blue-100/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={17} className="text-blue-300" />
                  <span>Finance Module</span>
                </div>
                {isFinanceOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>

              {isFinanceOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-blue-800/50 pl-3">
                  {visibleFinanceSubModules.map(({ label, icon: SubIcon, suffix }) => {
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
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                          isCurrent
                            ? "bg-[#071D75] text-white font-bold cursor-default shadow-xs"
                            : "text-blue-200/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <SubIcon size={14} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Operations Module Group Dropdown */}
          {visibleOperationsSubModules.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setIsOperationsOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isOperationsActive
                    ? "bg-white/10 text-white"
                    : "text-blue-100/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cpu size={17} className="text-blue-300" />
                  <span>Operations Module</span>
                </div>
                {isOperationsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>

              {isOperationsOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-blue-800/50 pl-3">
                  {visibleOperationsSubModules.map(({ label, icon: SubIcon, suffix }) => {
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
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                          isCurrent
                            ? "bg-[#071D75] text-white font-bold cursor-default shadow-xs"
                            : "text-blue-200/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <SubIcon size={14} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Sticky Section (Billing, Settings, Logout, Open Call Page) */}
      <div className="shrink-0 p-5 pt-3 border-t border-blue-900/60 bg-[#080C42] space-y-1 shadow-lg">
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
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                isCurrent
                  ? "bg-[#071D75] text-white shadow-sm font-semibold cursor-default"
                  : "text-blue-100/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}

        <button
          onClick={async () => {
            await logout();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut size={17} />
          Logout
        </button>

        <Link
          href={`/call/${tenantId}`}
          target="_blank"
          className="mt-3 flex items-center justify-between rounded-md bg-[#071D75] px-3 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#0a299e]"
        >
          <span>Open call page</span> <ExternalLink size={14} />
        </Link>
      </div>
    </aside>
  );
}