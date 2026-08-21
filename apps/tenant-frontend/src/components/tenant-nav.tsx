"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ExternalLink, LayoutDashboard, Settings, UsersRound, Package, HelpCircle, LogOut } from "lucide-react";
import { logout } from "@/app/actions";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, suffix: "" },
  { label: "Slots", icon: CalendarDays, suffix: "/calendar" },
  { label: "Appointments", icon: UsersRound, suffix: "/appointments" },
  { label: "Inventory", icon: Package, suffix: "/inventory" },
  { label: "FAQs", icon: HelpCircle, suffix: "/faqs" },
  { label: "Settings", icon: Settings, suffix: "/settings" },
];

import { useLoading } from "@/components/loading-provider";

export function TenantNav({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const basePath = `/dashboard/${tenantId}`;
  const pathname = usePathname();
  const { showLoader } = useLoading();
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-emerald-950/10 bg-[#12382e] p-5 text-emerald-50">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Relay Desk</p>
        <h1 className="mt-2 text-lg font-semibold">{tenantName}</h1>
      </div>
      <nav className="space-y-1">
        {navItems.map(({ label, icon: Icon, suffix }) => { const href = `${basePath}${suffix}`; return <Link key={label} href={href} onClick={() => { if (pathname !== href) showLoader(); }} aria-current={pathname === href ? "page" : undefined} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${pathname === href ? "bg-emerald-50/15 text-white" : "text-emerald-100 hover:bg-emerald-50/10"}`}><Icon size={18} />{label}</Link>; })}
        <button
          onClick={async () => {
            showLoader();
            await logout();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>
      <Link href={`/call/${tenantId}`} target="_blank" className="mt-auto flex items-center justify-between rounded-md bg-[#ddf070] px-3 py-3 text-sm font-semibold text-[#173a2d]">
        Open call page <ExternalLink size={16} />
      </Link>
    </aside>
  );
}