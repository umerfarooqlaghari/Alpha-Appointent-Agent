import { cookies } from "next/headers";
import { MarketingLanding } from "@/components/marketing-landing";

export const metadata = {
  title: "SecureMind • AI Appointment Agent | TechWitPro",
  description:
    "Autonomous AI voice and chat agents that detect availability, prevent double bookings, and keep your business calendar full 24/7.",
};

export default async function Home() {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  const tenantId = store.get("auth_tenant")?.value;

  const loggedInTenant = token && tenantId ? tenantId : null;

  return <MarketingLanding initialLoggedInTenant={loggedInTenant} />;
}