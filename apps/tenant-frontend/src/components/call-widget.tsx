"use client";

import { Mic, PhoneOff, Radio, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CallStatus = "Initializing" | "Ready" | "Connecting" | "Listening" | "Speaking" | "Ended" | "Error";

// Shape emitted by @vapi-ai/web error events
interface VapiError {
  type?: string;
  stage?: string;
  error?: { message?: string; name?: string };
  timestamp?: string;
}

function isVapiErrorFatal(err: unknown, currentStatus: CallStatus): boolean {
  // Only treat errors as fatal when a call is actually in progress.
  // Vapi fires noise errors (daily-error, audio-observer-setup-error, etc.)
  // on initialization before any call has started — ignore those.
  if (currentStatus === "Ready" || currentStatus === "Initializing") return false;

  if (!err || typeof err !== "object") return false;
  const e = err as VapiError;

  // Always fatal: validation or start errors
  if (e.type === "validation-error" || e.type === "start-method-error") return true;

  // If there's no type or it's empty, it's noise — ignore
  if (!e.type) return false;

  return true;
}

function extractErrorMessage(err: unknown): string {
  if (!err) return "Call error occurred.";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err !== "object") return "Call error occurred.";
  const e = err as VapiError;
  // e.error.message can itself be an object from Vapi's 400 responses - deep extract
  const msg = e.error?.message;
  if (typeof msg === "string") return msg;
  if (typeof msg === "object" && msg !== null) {
    const nested = msg as { message?: string | string[]; error?: string };
    if (Array.isArray(nested.message)) return nested.message.join(", ");
    if (typeof nested.message === "string") return nested.message;
    if (nested.error) return nested.error;
  }
  if (e.type) return `Error: ${e.type.replace(/-/g, " ")}`;
  return "Call error occurred.";
}

interface CallWidgetProps {
  tenantId: string;
  tenantName: string;
  industryType?: string;
  currency?: string;
}

export function CallWidget({ tenantId, tenantName, industryType = "", currency = "USD" }: CallWidgetProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);
  const [status, setStatus] = useState<CallStatus>("Initializing");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // We need the latest status inside the error handler without re-registering events
  const statusRef = useRef<CallStatus>("Initializing");
  function updateStatus(s: CallStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) {
      setErrorMsg("Vapi public key is not configured.");
      updateStatus("Error");
      return;
    }

    let destroyed = false;

    // Dynamic import — only runs client-side, avoids SSR issues
    import("@vapi-ai/web").then(({ default: Vapi }) => {
      if (destroyed) return;

      const vapi = new Vapi(key);
      vapiRef.current = vapi;

      vapi.on("call-start",   () => updateStatus("Listening"));
      vapi.on("call-end",     () => updateStatus("Ended"));
      vapi.on("speech-start", () => updateStatus("Speaking"));
      vapi.on("speech-end",   () => updateStatus("Listening"));

      vapi.on("error", (err: unknown) => {
        // Always log so it's visible in DevTools if needed
        console.warn("[Vapi] error event:", err);

        if (!isVapiErrorFatal(err, statusRef.current)) {
          // Noise / init-time error — ignore, stay in current state
          return;
        }

        const msg = extractErrorMessage(err);
        setErrorMsg(msg);
        updateStatus("Error");
      });

      updateStatus("Ready");
    }).catch((err) => {
      console.error("[Vapi] Failed to load SDK:", err);
      setErrorMsg("Failed to initialize Vapi SDK.");
      updateStatus("Error");
    });

    return () => {
      destroyed = true;
      vapiRef.current?.stop();
    };
  }, []);

  function startCall() {
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      setErrorMsg("Vapi assistant ID is not configured.");
      updateStatus("Error");
      return;
    }
    if (!vapiRef.current) {
      setErrorMsg("Vapi is still initializing — please wait a moment and try again.");
      return;
    }
    setErrorMsg(null);
    updateStatus("Connecting");
    // Pass variableValues at the top level only — NOT nested inside assistantOverrides
    // (Vapi API rejects `assistantOverrides.assistantOverrides` as invalid)
    vapiRef.current.start(assistantId, {
      variableValues: {
        tenantId,
        tenant_id: tenantId,
        industryType: industryType || "",
        industry_type: industryType || "",
        currency: currency || "USD"
      }
    });
  }

  function endCall() {
    vapiRef.current?.stop();
    updateStatus("Ended");
  }

  function retryCall() {
    setErrorMsg(null);
    updateStatus("Ready");
  }

  const active = status === "Connecting" || status === "Listening" || status === "Speaking";
  const initializing = status === "Initializing";
  const isError = status === "Error";

  const statusLabel: Record<CallStatus, string> = {
    Initializing: "Loading...",
    Ready: "Ready",
    Connecting: "Connecting...",
    Listening: "Listening",
    Speaking: "Speaking",
    Ended: "Call Ended",
    Error: "Unavailable",
  };

  const subLabel: Record<CallStatus, string> = {
    Initializing: "Setting up your connection",
    Ready: "Your private voice connection",
    Connecting: "Starting secure call...",
    Listening: "Go ahead, we are listening",
    Speaking: "The receptionist is speaking",
    Ended: "The call has ended",
    Error: errorMsg ?? "Something went wrong",
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#12382e] p-6">
      <section className="w-full max-w-lg text-center bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl text-white">
        <p className="text-xs font-bold tracking-[0.24em] text-[#ddf070] uppercase">{tenantName}</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Talk to our receptionist</h1>
        <p className="mt-2 text-sm text-emerald-100/80">Ask about availability, services, or book your next visit.</p>

        <div className="mt-10">
          <div className={`mx-auto grid size-32 place-items-center rounded-full border transition-all duration-300 ${
            active
              ? "animate-pulse bg-[#ddf070] text-[#12382e] shadow-lg shadow-[#ddf070]/20 border-[#ddf070]/50"
              : isError
              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
              : initializing
              ? "bg-white/5 text-emerald-200/40 border-white/10"
              : "bg-white/10 text-emerald-100 border-white/20"
          }`}>
            {initializing
              ? <Loader2 size={36} className="animate-spin" />
              : <Radio size={36} />
            }
          </div>
          <p className="mt-6 text-xl font-bold">{statusLabel[status]}</p>
          <p className={`mt-1 text-xs ${isError ? "text-rose-300" : "text-emerald-200/70"}`}>
            {subLabel[status]}
          </p>
        </div>

        <div className="mt-8">
          {active ? (
            <button
              id="end-call-btn"
              onClick={endCall}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition shadow-md"
            >
              <PhoneOff size={18} /> End call
            </button>
          ) : isError ? (
            <button
              id="retry-call-btn"
              onClick={retryCall}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 text-sm font-semibold text-white transition shadow-md"
            >
              <Mic size={18} /> Try again
            </button>
          ) : (
            <button
              id="start-call-btn"
              onClick={startCall}
              disabled={initializing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ddf070] hover:bg-[#cbe05d] disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-sm font-bold text-[#12382e] transition shadow-md"
            >
              {initializing ? (
                <><Loader2 size={18} className="animate-spin" /> Loading...</>
              ) : (
                <><Mic size={18} /> {status === "Ended" ? "Start another call" : "Start call"}</>
              )}
            </button>
          )}
        </div>

        <p className="mt-8 text-[10px] uppercase tracking-widest text-emerald-300/60 font-semibold">Powered by Relay Desk</p>
      </section>
    </main>
  );
}