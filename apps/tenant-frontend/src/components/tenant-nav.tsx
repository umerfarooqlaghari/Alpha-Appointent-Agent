"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ExternalLink, LayoutDashboard, Settings, UsersRound, Package, HelpCircle, LogOut, CreditCard, Briefcase, PhoneCall } from "lucide-react";
import { logout } from "@/app/actions";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, suffix: "" },
  { label: "Slots", icon: CalendarDays, suffix: "/calendar" },
  { label: "Appointments", icon: UsersRound, suffix: "/appointments" },
  { label: "Services", icon: Briefcase, suffix: "/services" },
  { label: "Inventory", icon: Package, suffix: "/inventory" },
  { label: "Menu", icon: Package, suffix: "/menu" },
  { label: "Orders", icon: CalendarDays, suffix: "/orders" },
  { label: "Call Logs", icon: PhoneCall, suffix: "/call-logs" },
  { label: "FAQs", icon: HelpCircle, suffix: "/faqs" },
  { label: "Billing", icon: CreditCard, suffix: "/billing" },
  { label: "Settings", icon: Settings, suffix: "/settings" },
];

export function TenantNav({ tenantId, tenantName, disabledTabs = "", industryType = "" }: { tenantId: string; tenantName: string; disabledTabs?: string; industryType?: string }) {
  const basePath = `/dashboard/${tenantId}`;
  const pathname = usePathname();
  const disabledList = disabledTabs.toLowerCase().split(",").map(s => s.trim());
  const isRestaurant = industryType.toLowerCase() === "restaurant";

  const visibleNavItems = navItems.filter(item => {
    const labelLower = item.label.toLowerCase();
    
    // Always show core tabs
    if (labelLower === "overview" || labelLower === "billing" || labelLower === "settings") {
      return true;
    }

    // Explicitly disabled by superadmin feature toggle overrides
    if (disabledList.includes(labelLower)) return false;

    const ind = (industryType || "service").toLowerCase();

    // Industry Variant Catalog Mapping:
    // Restaurant tenants: Catalog is represented by 'Menu' (hide standard 'Inventory')
    if (ind === "restaurant" && labelLower === "inventory") {
      return false;
    }

    // Non-restaurant tenants: Catalog is represented by 'Inventory' (hide 'Menu')
    if (ind !== "restaurant" && labelLower === "menu") {
      return false;
    }

    return true;
  });

  const topNavItems = visibleNavItems.filter(item => {
    const l = item.label.toLowerCase();
    return l !== "billing" && l !== "settings";
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
          {topNavItems.map(({ label, icon: Icon, suffix }) => {
            const href = `${basePath}${suffix}`;
            const isCurrent = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                onClick={(e) => {
                  if (isCurrent) {
                    e.preventDefault();
                  }
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
                if (isCurrent) {
                  e.preventDefault();
                }
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

        <Link href={`/call/${tenantId}`} target="_blank" className="mt-4 flex items-center justify-between rounded-md bg-[#ddf070] px-3 py-3 text-sm font-semibold text-[#173a2d] transition hover:bg-[#cbe05d]">
          Open call page <ExternalLink size={16} />
        </Link>
      </div>
    </aside>
  );
}