"use client";

import Link from "next/link";
import Image from "next/image";
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
    <header className="border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href="/tenants" className="flex items-center gap-3 font-semibold tracking-tight text-[#080C42]">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-xs">
            <Image
              src="/logo.jpg"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-lg font-bold">
            <span className="mr-1.5 text-[#071D75]">Relay</span>Control
          </span>
        </Link>
        <nav className="flex items-center gap-1.5">
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
                className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition ${
                  isCurrent
                    ? "bg-[#080C42] text-white shadow-xs font-semibold cursor-default"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#080C42]"
                }`}
              >
                <Icon size={16} className={isCurrent ? "text-blue-300" : "text-slate-500"} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}