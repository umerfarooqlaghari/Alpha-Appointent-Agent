import { DashboardShell } from "@/components/dashboard-shell";
import { decodeTenantId } from "@/lib/db";
import { tenantApi } from "@/lib/api";
import { ExpensesClient, Expense, CogsMarginItem } from "@/components/expenses-client";

export default async function ExpensesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const decodedTenantId = decodeTenantId(tenantId);

  let initialExpenses: Expense[] = [];
  let initialCategoryTotals: Record<string, number> = {};
  let totalExpenses = 0;
  let cogsMargins: CogsMarginItem[] = [];

  try {
    const [expensesData, marginsData] = await Promise.all([
      tenantApi<{ totalExpenses: number; categoryTotals: Record<string, number>; expenses: Expense[] }>(
        `/api/tenants/${encodeURIComponent(decodedTenantId)}/expenses`
      ),
      tenantApi<CogsMarginItem[]>(
        `/api/tenants/${encodeURIComponent(decodedTenantId)}/expenses/cogs-margins`
      ).catch(() => [])
    ]);

    initialExpenses = expensesData.expenses;
    initialCategoryTotals = expensesData.categoryTotals;
    totalExpenses = expensesData.totalExpenses;
    cogsMargins = marginsData;
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
  }

  return (
    <DashboardShell tenantId={tenantId}>
      <div className="w-full">
        <ExpensesClient
          tenantId={decodedTenantId}
          initialExpenses={initialExpenses}
          initialCategoryTotals={initialCategoryTotals}
          initialTotalExpenses={totalExpenses}
          initialCogsMargins={cogsMargins}
        />
      </div>
    </DashboardShell>
  );
}
