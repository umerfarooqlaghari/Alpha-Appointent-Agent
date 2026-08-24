"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, CalendarRange, CreditCard } from "lucide-react";
const items = [
  { label: "Tenants", href: "/tenants", icon: Building2 },
  { label: "Plans & Packages", href: "/plans", icon: CreditCard },
  { label: "Appointments", href: "/appointments", icon: CalendarRange },
  { label: "System status", href: "/status", icon: Activity }
];
export function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/tenants" className="font-semibold tracking-tight text-slate-950">
          <span className="mr-2 text-teal-700">Relay</span>Control
        </Link>
        <nav className="flex items-center gap-1">
          {items.map(({ label, href, icon: Icon }) => {
            const isCurrent = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => {
                  if (isCurrent) {
                    e.preventDefault();
                  }
                }}
                aria-current={isCurrent ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isCurrent
                    ? "bg-slate-100 text-slate-950 cursor-default"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}