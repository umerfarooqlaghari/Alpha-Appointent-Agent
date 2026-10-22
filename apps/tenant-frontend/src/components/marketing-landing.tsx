"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Lock,
  Calendar,
  Zap,
  Sparkles,
  Crown,
  ArrowRight,
  Star,
  Globe,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  Headphones,
  Play,
  Pause,
  CheckCircle2,
  PhoneForwarded,
  ShieldAlert,
  CreditCard,
  Check,
  TrendingUp,
} from "lucide-react";
import { login, registerWorkspace } from "@/app/login/actions";

export type PlanItem = {
  name: string;
  minutes: string;
  price: string;
  annualPrice: string;
  period: string;
  popular?: boolean;
  features: string[];
};

export type DbPlan = {
  id: string;
  planName: string;
  monthlyMinutesLimit: number;
  price: number;
  description: string;
  isActive: boolean;
};

const defaultPlans: PlanItem[] = [
  {
    name: "Starter",
    minutes: "500 Minutes",
    price: "$50.00",
    annualPrice: "$40.00",
    period: "/month",
    popular: false,
    features: [
      "500 calling minutes included monthly",
      "Full n8n appointment automation",
      "Multi-calendar sync (Google & Outlook)",
      "Domain whitelisting & DDoS protection",
      "Standard conversational AI voice model",
      "Full FAQ catalog & business knowledge base",
      "Instant SMS & email confirmations",
    ],
  },
  {
    name: "Pro",
    minutes: "1,500 Minutes",
    price: "$120.00",
    annualPrice: "$96.00",
    period: "/month",
    popular: true,
    features: [
      "1,500 calling minutes included monthly",
      "High-priority ultra-low latency voice pipeline",
      "Multi-staff dispatch & skills matching",
      "Custom voice prompt tuning & accents",
      "Automated rescheduling & cancellation logic",
      "Embeddable web call widget for your site",
      "Priority email & chat support",
    ],
  },
  {
    name: "Premium",
    minutes: "5,000 Minutes",
    price: "$350.00",
    annualPrice: "$280.00",
    period: "/month",
    popular: false,
    features: [
      "5,000 calling minutes included monthly",
      "Dedicated high-throughput SIP trunk line",
      "Custom branding & WebRTC white-labeling",
      "Unlimited staff dispatch & multi-location",
      "99.9% uptime SLA guarantee",
      "Custom ERP, CRM & POS webhook sync",
      "24/7 dedicated account manager",
    ],
  },
];

export function formatPlansFromDb(dbPlans?: DbPlan[] | null): PlanItem[] {
  if (!dbPlans || !Array.isArray(dbPlans)) return defaultPlans;
  const activePlans = dbPlans.filter(
    (p) => p.isActive && p.planName.toLowerCase() !== "trial"
  );
  if (activePlans.length === 0) return defaultPlans;

  return activePlans.map((p, idx) => {
    const priceNum = Number(p.price);
    const annualPriceNum = priceNum * 0.8;
    const isPopular = p.planName.toLowerCase().includes("pro") || idx === 1;

    let featureList: string[] = [];
    if (p.description && p.description.includes(";")) {
      featureList = p.description.split(";").map((s) => s.trim()).filter(Boolean);
    } else if (p.description && p.description.includes(",")) {
      featureList = p.description.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (featureList.length === 0) {
      if (idx === 0) {
        featureList = [
          `${p.monthlyMinutesLimit.toLocaleString()} calling minutes included monthly`,
          p.description || "Full n8n appointment automation",
          "Multi-calendar sync (Google & Outlook)",
          "Domain whitelisting & DDoS protection",
          "Standard conversational AI voice model",
          "Full FAQ catalog & business knowledge base",
          "Instant SMS & email confirmations",
        ];
      } else if (idx === 1) {
        featureList = [
          `${p.monthlyMinutesLimit.toLocaleString()} calling minutes included monthly`,
          p.description || "High-priority ultra-low latency voice pipeline",
          "Multi-staff dispatch & skills matching",
          "Custom voice prompt tuning & accents",
          "Automated rescheduling & cancellation logic",
          "Embeddable web call widget for your site",
          "Priority email & chat support",
        ];
      } else {
        featureList = [
          `${p.monthlyMinutesLimit.toLocaleString()} calling minutes included monthly`,
          p.description || "Dedicated high-throughput SIP trunk line",
          "Custom branding & WebRTC white-labeling",
          "Unlimited staff dispatch & multi-location",
          "99.9% uptime SLA guarantee",
          "Custom ERP, CRM & POS webhook sync",
          "24/7 dedicated account manager",
        ];
      }
    }

    return {
      name: p.planName,
      minutes: `${p.monthlyMinutesLimit.toLocaleString()} Minutes`,
      price: `$${priceNum.toFixed(2)}`,
      annualPrice: `$${annualPriceNum.toFixed(2)}`,
      period: "/month",
      popular: isPopular,
      features: featureList,
    };
  });
}

export function MarketingLanding({
  initialLoggedInTenant,
  initialPlans,
}: {
  initialLoggedInTenant?: string | null;
  initialPlans?: DbPlan[];
}) {
  const [plans, setPlans] = useState<PlanItem[]>(() => formatPlansFromDb(initialPlans));

  useEffect(() => {
    if (!initialPlans || initialPlans.length === 0) {
      fetch("/api/plans")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: DbPlan[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setPlans(formatPlansFromDb(data));
          }
        })
        .catch(() => {});
    }
  }, [initialPlans]);

  const [selectedAgentGender, setSelectedAgentGender] = useState<"male" | "female">("male");
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PlanItem | null>(null);
  const [modalTab, setModalTab] = useState<"signin" | "register">("signin");

  // Modal Auth Form States
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Simulator State
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleOpenPlanModal = (plan: PlanItem) => {
    setSelectedPlanForModal(plan);
    setAuthError(null);
    setModalTab("signin");
  };

  const handleCloseModal = () => {
    setSelectedPlanForModal(null);
    setAuthError(null);
  };

  const handleModalLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    formData.append("redirectTo", "/dashboard/:tenantId/billing");

    try {
      const res = await login(formData);
      if (res?.error) {
        setAuthError(res.error);
        setIsPending(false);
      }
    } catch (err: unknown) {
      const isRedirect =
        err &&
        typeof err === "object" &&
        (("message" in err && (err as { message: string }).message === "NEXT_REDIRECT") ||
          ("digest" in err && String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")));
      if (!isRedirect) {
        setAuthError(err instanceof Error ? err.message : "Failed to sign in. Please verify credentials.");
        setIsPending(false);
      }
    }
  };

  const handleModalRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    if (selectedPlanForModal) {
      formData.append("selectedPlan", selectedPlanForModal.name);
    }
    formData.append("redirectTo", "/dashboard/:tenantId/billing");

    try {
      const res = await registerWorkspace(formData);
      if (res?.error) {
        setAuthError(res.error);
        setIsPending(false);
      }
    } catch (err: unknown) {
      const isRedirect =
        err &&
        typeof err === "object" &&
        (("message" in err && (err as { message: string }).message === "NEXT_REDIRECT") ||
          ("digest" in err && String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")));
      if (!isRedirect) {
        setAuthError(err instanceof Error ? err.message : "Registration failed. Please try again.");
        setIsPending(false);
      }
    }
  };

  const handleRunSimulator = () => {
    if (isPlayingDemo) {
      setIsPlayingDemo(false);
      setDemoStep(0);
      return;
    }
    setIsPlayingDemo(true);
    setDemoStep(1);

    setTimeout(() => setDemoStep(2), 2200);
    setTimeout(() => setDemoStep(3), 4800);
    setTimeout(() => setDemoStep(4), 7500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#EA580C] selection:text-white relative overflow-x-hidden flex flex-col w-full">
      {/* Top Techwitpro announcement header */}
      <div className="w-full bg-[#080C42] text-white py-2 px-4 text-xs z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-white shrink-0"
              viewBox="0 0 40 40"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 11L14 30L20 16L26 30L33 11H27.5L23 23L18.5 12.5L14 23L9.5 11H7Z" />
            </svg>
            <span className="font-semibold tracking-wide">techwitpro &bull; SecureMind AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-white/80 text-[11px]">
            <span>24/7 AI Voice Dispatch</span>
            <span>&bull;</span>
            <span>Conflict-Free Calendar Booking</span>
            <span>&bull;</span>
            <span>99.9% Telephony Uptime</span>
          </div>
        </div>
      </div>

      {/* Edge-to-Edge Sticky Navbar */}
      <nav className="w-full border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#090D1A] flex items-center justify-center text-white shadow-xs">
              <Shield size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#090D1A]">SecureMind</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#EA580C] -mt-0.5">
                Alpha Booking Agent
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#simulator" className="hover:text-[#090D1A] transition">
              Live Simulator
            </a>
            <a href="#pricing" className="hover:text-[#090D1A] transition">
              Pricing
            </a>
            <a href="#features" className="hover:text-[#090D1A] transition">
              Features
            </a>
            <a href="#faq" className="hover:text-[#090D1A] transition">
              FAQ
            </a>
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-3 sm:gap-4">
            {initialLoggedInTenant ? (
              <Link
                href={`/dashboard/${encodeURIComponent(initialLoggedInTenant)}`}
                className="rounded-full bg-[#090D1A] px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm flex items-center gap-1.5"
              >
                Workspace Dashboard
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-black transition px-2 py-1"
                >
                  Sign in
                </Link>
                <a
                  href="#pricing"
                  className="rounded-full bg-[#090D1A] px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-black transition shadow-sm"
                >
                  Get Started
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area - Full width clean white */}
      <main className="flex-1 w-full bg-white">
        {/* HERO SECTION */}
        <section className="relative w-full bg-white pt-10 pb-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column (Copy + CTA + Social proof) */}
              <div className="lg:col-span-5 space-y-6 z-10">
                {/* Pill badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF1EB] border border-[#FDBA74]/50 px-3.5 py-1 text-xs font-semibold text-[#EA580C] shadow-2xs">
                  <span className="size-2 rounded-full bg-[#EA580C] animate-pulse" />
                  <span>AI • AI-POWERED SCHEDULING</span>
                </div>

                {/* Hero Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight text-[#090D1A] leading-[1.12]">
                  AI Appointment Agent That Protects &amp; Fills Schedule
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                  Autonomous AI agents that detect customer availability, qualify appointment requests,
                  prevent calendar double bookings, and keep your business fully scheduled 24/7.
                </p>

                {/* CTA Group */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <a
                    href="#simulator"
                    className="group inline-flex items-center gap-3 rounded-full bg-[#090D1A] pl-6 pr-2.5 py-2.5 text-sm font-semibold text-white hover:bg-black transition shadow-md hover:shadow-lg"
                  >
                    <span>Book a Demo</span>
                    <span className="size-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center transition-transform group-hover:translate-x-1 shadow-xs">
                      <ArrowRight size={15} />
                    </span>
                  </a>

                  <a
                    href="#pricing"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <span>View Subscription Plans</span>
                  </a>
                </div>

                {/* Social Proof */}
                <div className="pt-4 flex items-center gap-4 border-t border-slate-100">
                  <div className="relative h-10 w-28 overflow-hidden rounded-full ring-2 ring-white shadow-xs">
                    <Image
                      src="/avatars-row.jpg"
                      alt="Customer Avatars"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[#EA580C]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-[#EA580C]" />
                      ))}
                      <span className="text-xs font-bold text-slate-900 ml-1.5">4.9 rating</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Trusted by 10,000+ business owners &amp; clinics
                    </p>
                  </div>
                </div>
              </div>

              {/* Center Column (High-res AI profile image matching the prompt image) */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
                <div className="relative w-full max-w-[380px] h-[440px] rounded-2xl overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAgentGender === "male" ? "/hero-agent-male.jpg" : "/hero-agent-female.jpg"}
                    alt="AI Security & Appointment Agent"
                    className="w-full h-full object-contain object-center transition-all duration-700"
                  />
                  {/* Subtle edge blend overlay to guarantee seamless white integration */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white via-transparent to-transparent opacity-20" />
                </div>

                {/* Voice Agent Profile Switcher */}
                <div className="mt-3 flex items-center gap-2 bg-slate-100/80 p-1 rounded-full border border-slate-200/60 text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => setSelectedAgentGender("male")}
                    type="button"
                    className={`px-3 py-1 rounded-full transition ${
                      selectedAgentGender === "male"
                        ? "bg-white text-[#090D1A] shadow-xs font-bold"
                        : "hover:text-black"
                    }`}
                  >
                    Alex (Male Voice)
                  </button>
                  <button
                    onClick={() => setSelectedAgentGender("female")}
                    type="button"
                    className={`px-3 py-1 rounded-full transition ${
                      selectedAgentGender === "female"
                        ? "bg-white text-[#090D1A] shadow-xs font-bold"
                        : "hover:text-black"
                    }`}
                  >
                    Sophia (Female Voice)
                  </button>
                </div>
              </div>

              {/* Right Column (Floating Status Cards & Catchphrase) */}
              <div className="lg:col-span-3 space-y-5 z-10">
                {/* Floating Card 1: AI Agent Active */}
                <div className="rounded-2xl border border-slate-100/90 bg-white/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xs">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-[#090D1A] flex items-center justify-center text-white shrink-0">
                      <Shield size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-900">AI Agent Active</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Appointments monitored in real-time
                      </p>
                    </div>
                  </div>

                  {/* Feature checklist matching screenshot */}
                  <ul className="mt-4 space-y-2 text-xs text-slate-600 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="size-1.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                      <span>Monitor and analyze live slot availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="size-1.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                      <span>Detect and block double-booking conflicts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="size-1.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                      <span>Prevent lost revenue from missed calls</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="size-1.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                      <span>Ensure multi-calendar compliance automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="size-1.5 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                      <span>Generate caller transcripts &amp; voice summaries</span>
                    </li>
                  </ul>
                </div>

                {/* Floating Card 2: System Protection Stat */}
                <div className="rounded-2xl border border-slate-100/90 bg-white/95 p-5 shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">System Accuracy &amp; Fill</p>
                      <p className="text-3xl font-extrabold text-[#090D1A] mt-0.5">99.7%</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#EA580C] bg-[#FFF1EB] px-2.5 py-1 rounded-full">
                      <TrendingUp size={13} />
                      <span>+18% this week</span>
                    </div>
                  </div>
                </div>

                {/* Punchy Text below (Matching screenshot: Your Data Stays Protected) */}
                <div className="pt-2">
                  <h3 className="text-2xl font-bold text-[#090D1A] tracking-tight">
                    Your Schedule Stays Full.
                  </h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Always. Everywhere.</p>
                </div>
              </div>
            </div>

            {/* TRUSTED BY INNOVATIVE COMPANIES BAR */}
            <div className="mt-14 pt-8 border-t border-slate-100">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                TRUSTED BY INNOVATIVE COMPANIES
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition duration-300">
                {/* Microsoft */}
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <div className="grid grid-cols-2 gap-0.5 size-4">
                    <span className="bg-[#F25022]" />
                    <span className="bg-[#7FBA00]" />
                    <span className="bg-[#00A4EF]" />
                    <span className="bg-[#FFB900]" />
                  </div>
                  <span>Microsoft</span>
                </div>

                {/* AWS */}
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm tracking-tighter">
                  <span className="text-base">aws</span>
                  <span className="size-1.5 rounded-full bg-[#FF9900]" />
                </div>

                {/* Google Cloud */}
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
                      fill="#4285F4"
                    />
                  </svg>
                  <span>Google Cloud</span>
                </div>

                {/* Azure */}
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
                  <svg className="size-4 text-[#0078D4]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.05 4.24l-6.83 12.33 3.65 3.19h8.38l-5.2-15.52zm-7.6 12.82l-3.45-3.02 6.5-11.8 4.2 3.8-7.25 11.02z" />
                  </svg>
                  <span>Azure</span>
                </div>

                {/* IBM */}
                <div className="text-slate-700 font-black tracking-widest text-sm">
                  IBM
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE LIVE VOICE & CALENDAR SIMULATOR */}
        <section id="simulator" className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-slate-50/70 border-t border-b border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-4xl mx-auto text-center space-y-3">
              <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider bg-orange-100/60 px-3 py-1 rounded-full">
                Interactive Voice Demo
              </span>
              <h2 className="text-3xl font-bold text-[#090D1A] tracking-tight">
                Experience Natural Conversational Booking
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                See how the AI appointment agent answers real caller inquiries, cross-checks calendar slots, and locks appointments without human intervention.
              </p>
            </div>

            <div className="mt-10 max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
              {/* Simulator Header */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Call Route: +1 (800) 555-ALPHA</span>
                      <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <p className="text-xs text-slate-400">Autonomous Vapi Engine &bull; PostgreSQL Calendar Sync</p>
                  </div>
                </div>

                <button
                  onClick={handleRunSimulator}
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-[#EA580C] px-5 py-2 text-xs font-bold text-white hover:bg-orange-600 transition shadow-xs"
                >
                  {isPlayingDemo ? <Pause size={15} /> : <Play size={15} />}
                  <span>{isPlayingDemo ? "Pause Simulation" : "Run Call Simulation"}</span>
                </button>
              </div>

              {/* Simulation Canvas */}
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Transcript feed */}
                <div className="md:col-span-7 space-y-3 font-sans">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Call Audio Transcript</p>

                  <div className="space-y-3 min-h-[220px]">
                    <div className="flex items-start gap-2.5">
                      <div className="size-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                        C
                      </div>
                      <div className="rounded-2xl rounded-tl-none bg-slate-100 p-3 text-xs text-slate-800 font-medium">
                        &quot;Hi! Do you have any openings for an appointment this Thursday afternoon?&quot;
                      </div>
                    </div>

                    {demoStep >= 1 && (
                      <div className="flex items-start gap-2.5 justify-end">
                        <div className="rounded-2xl rounded-tr-none bg-[#090D1A] text-white p-3 text-xs font-medium max-w-[85%]">
                          &quot;Hello! Let me check Dr. Roberts&apos; availability for this Thursday... I have two slots open: 2:30 PM and 4:15 PM. Which one suits you best?&quot;
                        </div>
                        <div className="size-7 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          AI
                        </div>
                      </div>
                    )}

                    {demoStep >= 2 && (
                      <div className="flex items-start gap-2.5">
                        <div className="size-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                          C
                        </div>
                        <div className="rounded-2xl rounded-tl-none bg-slate-100 p-3 text-xs text-slate-800 font-medium">
                          &quot;2:30 PM is perfect! My name is Jordan Hayes, and my cell is 555-0192.&quot;
                        </div>
                      </div>
                    )}

                    {demoStep >= 3 && (
                      <div className="flex items-start gap-2.5 justify-end">
                        <div className="rounded-2xl rounded-tr-none bg-[#090D1A] text-white p-3 text-xs font-medium max-w-[85%]">
                          &quot;Confirmed Jordan! You are booked for Thursday at 2:30 PM. I have just triggered your SMS confirmation and synced the slot. See you then!&quot;
                        </div>
                        <div className="size-7 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          AI
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time calendar slot visualizer */}
                <div className="md:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Calendar size={15} className="text-[#EA580C]" />
                        <span>Thursday Schedule</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Live Sync
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs">
                        <span className="font-semibold text-slate-700">1:00 PM</span>
                        <span className="text-slate-400 font-medium">Existing Patient</span>
                      </div>

                      <div
                        className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all duration-500 ${
                          demoStep >= 3
                            ? "bg-orange-50 border border-orange-300 text-[#EA580C] shadow-xs"
                            : "bg-white border border-slate-200 text-emerald-700"
                        }`}
                      >
                        <span>2:30 PM</span>
                        <span>{demoStep >= 3 ? "Locked &bull; Jordan Hayes" : "Available Slot"}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs">
                        <span className="font-semibold text-slate-700">4:15 PM</span>
                        <span className="text-emerald-700 font-medium">Available Slot</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>0 staff double-bookings detected in past 30 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SUBSCRIPTION PLANS (Dynamic from API) */}
        <section id="pricing" className="w-full px-4 sm:px-6 lg:px-8 py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider bg-orange-100/60 px-3.5 py-1 rounded-full">
                Transparent Plans
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#090D1A] tracking-tight">
                Simple, Predictable Plans For Every Workspace
              </h2>
              <p className="text-base text-slate-600">
                Pick a calling package below. All plans include 24/7 AI voice phone agent, conflict-free appointment booking, and n8n workflow pipelines.
              </p>

              {/* Monthly / Annual Toggle with 20% discount */}
              <div className="pt-4 flex items-center justify-center gap-3">
                <span className={`text-xs font-semibold ${!isAnnual ? "text-[#090D1A]" : "text-slate-500"}`}>
                  Monthly Billing
                </span>
                <button
                  type="button"
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="relative w-12 h-6 bg-[#090D1A] rounded-full p-0.5 transition-colors duration-200 focus:outline-hidden"
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      isAnnual ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isAnnual ? "text-[#090D1A]" : "text-slate-500"}`}>
                    Annual Billing
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 border border-emerald-300">
                    SAVE 20%
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Cards Grid - Dynamic from API */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {plans.map((plan) => {
                const isPro = plan.popular;
                const price = isAnnual ? plan.annualPrice : plan.price;

                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                      isPro
                        ? "bg-[#090D1A] text-white ring-4 ring-[#EA580C]/40 shadow-2xl scale-[1.03] z-10"
                        : "bg-white text-slate-800 border border-slate-200 shadow-md hover:shadow-xl"
                    }`}
                  >
                    {isPro && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#EA580C] px-4 py-1 text-xs font-bold text-white shadow-sm tracking-wide">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      {/* Top Plan Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-xl font-bold ${isPro ? "text-white" : "text-[#090D1A]"}`}>
                            {plan.name}
                          </h3>
                          <p className={`text-xs mt-0.5 ${isPro ? "text-slate-300" : "text-slate-500"}`}>
                            {plan.minutes} Calling Quota
                          </p>
                        </div>
                        <div
                          className={`size-10 rounded-2xl flex items-center justify-center ${
                            isPro ? "bg-white/10 text-orange-400" : "bg-slate-100 text-[#090D1A]"
                          }`}
                        >
                          {plan.name === "Starter" ? (
                            <Zap size={20} />
                          ) : plan.name === "Pro" ? (
                            <Sparkles size={20} />
                          ) : (
                            <Crown size={20} />
                          )}
                        </div>
                      </div>

                      {/* Pricing Tag */}
                      <div className="mt-6 flex items-baseline gap-1.5">
                        <span className={`text-4xl font-extrabold tracking-tight ${isPro ? "text-white" : "text-[#090D1A]"}`}>
                          {price}
                        </span>
                        <span className={`text-xs font-semibold ${isPro ? "text-slate-400" : "text-slate-500"}`}>
                          {plan.period}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isPro ? "text-slate-400" : "text-slate-500"}`}>
                        {isAnnual ? "Billed annually (2 months free)" : "Billed monthly, cancel anytime"}
                      </p>

                      {/* Features List */}
                      <div className={`mt-8 pt-6 border-t ${isPro ? "border-white/10" : "border-slate-100"}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isPro ? "text-slate-300" : "text-slate-600"}`}>
                          What&apos;s Included:
                        </p>
                        <ul className="space-y-3 text-xs">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <Check
                                size={15}
                                className={`shrink-0 mt-0.5 ${isPro ? "text-[#EA580C]" : "text-emerald-600"}`}
                              />
                              <span className={isPro ? "text-slate-200" : "text-slate-600"}>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* CTA Button (Triggers the safeguard modal) */}
                    <div className="mt-8 pt-4">
                      <button
                        onClick={() => handleOpenPlanModal(plan)}
                        type="button"
                        className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm flex items-center justify-center gap-2 ${
                          isPro
                            ? "bg-[#EA580C] hover:bg-orange-600 text-white shadow-md hover:shadow-lg"
                            : "bg-[#090D1A] hover:bg-black text-white hover:shadow-md"
                        }`}
                      >
                        <span>Choose {plan.name}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safeguard & Payment Security Guarantee Note */}
            <div className="mt-12 max-w-2xl mx-auto rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-center flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Shield size={16} className="text-[#EA580C]" />
                <span>Enterprise Credentials &amp; Payments Protection:</span>
              </div>
              <p>
                All checkouts require tenant workspace verification to prevent unauthorized billing and protect telephony credentials.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: FEATURES GRID */}
        <section id="features" className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-slate-50/60 border-b border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto text-center space-y-2 mb-12">
              <h2 className="text-3xl font-bold text-[#090D1A] tracking-tight">
                Engineered For High-Volume Operations
              </h2>
              <p className="text-sm text-slate-500">
                Built from the ground up to eliminate scheduling bottlenecks, double-bookings, and missed phone opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="size-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center font-bold">
                  <PhoneForwarded size={20} />
                </div>
                <h3 className="text-base font-bold text-[#090D1A]">Zero Missed Inbound Calls</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The AI voice assistant answers every incoming caller on the first ring, 24 hours a day, 365 days a year, with zero queue fatigue.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="size-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Calendar size={20} />
                </div>
                <h3 className="text-base font-bold text-[#090D1A]">Real-Time Conflict Resolution</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dynamic availability logic queries working hours, holidays, and live bookings simultaneously to guarantee zero duplicate reservations.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="size-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CreditCard size={20} />
                </div>
                <h3 className="text-base font-bold text-[#090D1A]">Stripe &amp; POS Deposit Collection</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Optionally dispatch automated SMS deposit links to reserve slots, eliminating expensive no-shows and late cancellations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FAQ ACCORDION */}
        <section id="faq" className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#090D1A] tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Everything you need to know about our AI Appointment Agent and onboarding security.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {[
                {
                  q: "How does the AI voice assistant answer phone calls?",
                  a: "Our system provisions a dedicated local or toll-free telephone number (or forwards from your existing carrier). When customers call, the low-latency Vapi voice model speaks naturally, answers FAQs, checks your live availability slots, and books the appointment directly into your database.",
                },
                {
                  q: "Why do I need to log in or create an account before purchasing a plan?",
                  a: "To safeguard your credit card payments, phone line routing, and sensitive client calendar schedules, we require all workspaces to be authenticated. This guarantees that your calling minutes are bound securely to your tenant workspace and never exposed to unverified guest sessions.",
                },
                {
                  q: "Can I bring my existing business phone number?",
                  a: "Yes! You can configure call forwarding from your existing telecom provider (Twilio, Vonage, Verizon, AT&T) directly to your assigned RelayDesk line, allowing you to keep your public marketing number without changing customer habits.",
                },
                {
                  q: "What happens if a customer asks a complex question not in the schedule?",
                  a: "You can populate the FAQ and Knowledge Base tabs with your pricing, policies, directions, and services. If a customer inquiry cannot be resolved, the AI can gracefully take a message and alert your staff via email or dispatch task.",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200/80 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    type="button"
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-sm font-bold text-[#090D1A] hover:bg-slate-50"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100/60 bg-slate-50/40">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FULL-WIDTH FOOTER COVERING ALL ENDS */}
      <footer className="w-full bg-[#080C42] text-white/80 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-lg bg-white text-[#080C42] flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-sm">Alpha RelayDesk &bull; SecureMind</span>
              <p className="text-slate-400 text-xs">Autonomous AI Voice Booking Agent</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-slate-300">
            <a href="#simulator" className="hover:text-white transition">Simulator</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <Link href="/login" className="hover:text-white transition">Sign in</Link>
            <a href="#faq" className="hover:text-white transition">Security</a>
            <a
              href="https://techwitpro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition text-white font-semibold"
            >
              <Globe size={15} />
              techwitpro.com
            </a>
          </div>
          <p className="text-slate-400">&copy; {new Date().getFullYear()} TechWitPro. All rights reserved.</p>
        </div>
      </footer>

      {/* THE SAFEGUARD PURCHASE MODAL (Prompting to login/signup to safeguard creds & payments) */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              type="button"
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1 rounded-full transition"
            >
              <X size={20} />
            </button>

            {/* Safeguard Shield Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto size-12 rounded-2xl bg-orange-50 border border-orange-200 text-[#EA580C] flex items-center justify-center shadow-xs">
                <Lock size={24} />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-900">
                <Shield size={12} className="text-blue-700" />
                <span>Payment &amp; Credential Safeguard</span>
              </div>

              <h3 className="text-xl font-extrabold text-[#090D1A] tracking-tight">
                Sign In to Reserve Your {selectedPlanForModal.name} Plan
              </h3>

              {/* Explicit User Message requested in prompt */}
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                To safeguard your payments, credentials, and telephony configurations, please sign up or log in first.
                Your chosen plan (<strong>{selectedPlanForModal.name} &bull; {selectedPlanForModal.price}/mo</strong>) will be securely bound to your workspace upon authentication.
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Tabs: Sign In vs Create Account */}
            <div className="mt-5 grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setModalTab("signin");
                  setAuthError(null);
                }}
                className={`py-2 rounded-lg transition ${
                  modalTab === "signin"
                    ? "bg-white text-[#090D1A] shadow-xs"
                    : "hover:text-black"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab("register");
                  setAuthError(null);
                }}
                className={`py-2 rounded-lg transition ${
                  modalTab === "register"
                    ? "bg-white text-[#090D1A] shadow-xs"
                    : "hover:text-black"
                }`}
              >
                Create Workspace
              </button>
            </div>

            {/* TAB 1: SIGN IN FORM */}
            {modalTab === "signin" ? (
              <form onSubmit={handleModalLogin} className="mt-5 space-y-4">
                <label className="block text-xs font-medium text-slate-700">
                  Workspace Email
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="admin@organization.com"
                    disabled={isPending}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Password
                  <div className="relative mt-1">
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isPending}
                      className="w-full rounded-xl border border-slate-200 p-2.5 pr-10 text-xs text-slate-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-xl bg-[#090D1A] hover:bg-black text-white text-xs font-bold transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? "Authenticating & Reserving..." : `Sign In & Upgrade to ${selectedPlanForModal.name}`}
                </button>
              </form>
            ) : (
              /* TAB 2: REGISTER WORKSPACE FORM */
              <form onSubmit={handleModalRegister} className="mt-5 space-y-3">
                <label className="block text-xs font-medium text-slate-700">
                  Business / Organization Name
                  <input
                    required
                    name="companyName"
                    type="text"
                    placeholder="e.g. Apex Health Clinic"
                    disabled={isPending}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Admin Email Address
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="dr.smith@apexclinic.com"
                    disabled={isPending}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Password
                  <div className="relative mt-1">
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      disabled={isPending}
                      className="w-full rounded-xl border border-slate-200 p-2 pr-10 text-xs text-slate-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>

                <label className="block text-xs font-medium text-slate-700">
                  Industry / Type
                  <select
                    name="industryType"
                    disabled={isPending}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-[#EA580C] focus:outline-none"
                  >
                    <option value="healthcare">Healthcare &amp; Clinic</option>
                    <option value="dental">Dental Practice</option>
                    <option value="legal">Law Firm &amp; Consulting</option>
                    <option value="salon">Salon &amp; Wellness</option>
                    <option value="home-services">Home &amp; Field Services</option>
                    <option value="general">Other / Enterprise</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full mt-2 py-3 rounded-xl bg-[#EA580C] hover:bg-orange-600 text-white text-xs font-bold transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? "Creating Workspace..." : `Create Workspace & Bind ${selectedPlanForModal.name}`}
                </button>
              </form>
            )}

            {/* Trust Badges */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Shield size={11} className="text-emerald-600" />
                256-Bit SSL
              </span>
              <span className="flex items-center gap-1">
                <CreditCard size={11} className="text-emerald-600" />
                PCI-DSS Level 1
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-600" />
                Instant Setup
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
