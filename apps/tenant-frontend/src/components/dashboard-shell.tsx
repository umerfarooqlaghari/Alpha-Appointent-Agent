import React from "react";

export function DashboardShell({
  children,
}: {
  tenantId?: string;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}