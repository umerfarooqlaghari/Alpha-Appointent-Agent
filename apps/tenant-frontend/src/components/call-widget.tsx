"use client";

import { Mic, PhoneOff, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CallStatus = "Ready" | "Connecting" | "Listening" | "Speaking" | "Ended";

interface VapiClient {
  on(event: string, callback: () => void): void;
  start(assistantId: string, overrides?: Record<string, unknown>): void;
  stop(): void;
}

interface CustomWindow {
  Vapi?: new (key: string) => VapiClient;
}

export function CallWidget({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const vapiRef = useRef<VapiClient | null>(null);
  const [status, setStatus] = useState<CallStatus>("Ready");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) return;

    function initVapi() {
      const VapiConstructor = (window as unknown as CustomWindow).Vapi;
      if (!VapiConstructor || vapiRef.current) return;

      const vapi = new VapiConstructor(key);
      vapiRef.current = vapi;
      vapi.on("call-start", () => setStatus("Listening"));
      vapi.on("call-end", () => setStatus("Ended"));
      vapi.on("speech-start", () => setStatus("Speaking"));
      vapi.on("speech-end", () => setStatus("Listening"));
    }

    if ((window as unknown as CustomWindow).Vapi) {
      initVapi();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
      script.defer = true;
      script.onload = () => initVapi();
      document.head.appendChild(script);
    }

    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  function startCall() {
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId || !vapiRef.current) return;
    setStatus("Connecting");
    vapiRef.current.start(assistantId, {
      assistantOverrides: {
        variableValues: { tenantId, tenant_id: tenantId }
      },
      variableValues: { tenantId, tenant_id: tenantId }
    });
  }

  function endCall() {
    vapiRef.current?.stop();
    setStatus("Ended");
  }

  const active = status === "Connecting" || status === "Listening" || status === "Speaking";

  return (
    <main className="grid min-h-screen place-items-center bg-[#12382e] p-6 text-[#12382e]">
      <section className="w-full max-w-lg text-center bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl text-white">
        <p className="text-xs font-bold tracking-[0.24em] text-[#ddf070] uppercase">{tenantName}</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Talk to our receptionist</h1>
        <p className="mt-2 text-sm text-emerald-100/80">Ask about availability, services, or book your next visit.</p>
        
        <div className="mt-10">
          <div className={`mx-auto grid size-32 place-items-center rounded-full border border-white/20 transition-all duration-300 ${active ? "animate-pulse bg-[#ddf070] text-[#12382e] shadow-lg shadow-[#ddf070]/20" : "bg-white/10 text-emerald-100"}`}>
            <Radio size={36} />
          </div>
          <p className="mt-6 text-xl font-bold">{status}</p>
          <p className="mt-1 text-xs text-emerald-200/70">
            {status === "Speaking" ? "The receptionist is speaking" : status === "Listening" ? "Go ahead, we are listening" : "Your private voice connection"}
          </p>
        </div>

        {active ? (
          <button onClick={endCall} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition shadow-md">
            <PhoneOff size={18} /> End call
          </button>
        ) : (
          <button onClick={startCall} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#ddf070] hover:bg-[#cbe05d] px-6 py-3 text-sm font-bold text-[#12382e] transition shadow-md">
            <Mic size={18} /> {status === "Ended" ? "Start another call" : "Start call"}
          </button>
        )}
        
        <p className="mt-8 text-[10px] uppercase tracking-widest text-emerald-300/60 font-semibold">Powered by Relay Desk</p>
      </section>
    </main>
  );
}