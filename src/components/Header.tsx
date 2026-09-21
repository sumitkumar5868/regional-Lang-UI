// ============================================================
// Header — Brand + Backend Diagnostics + Recovery Modal
// ------------------------------------------------------------
// Shows connection status, latency, configured endpoint, and
// clear step-by-step recovery commands when backend is offline.
// ============================================================

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Copy,
  Cpu,
  ExternalLink,
  Radio,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  checkBackendHealthDetails,
  type BackendHealthResult,
} from "@/lib/api";
import { getBackendUrl } from "@/lib/config";

interface Props {
  online: boolean | null;
  onStatus: (v: boolean | null) => void;
  onHealthDetails?: (details: BackendHealthResult) => void;
}

export default function Header({ online, onStatus, onHealthDetails }: Props) {
  const [testing, setTesting] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [lastDetails, setLastDetails] = useState<BackendHealthResult | null>(null);
  const [copied, setCopied] = useState(false);

  const test = async () => {
    setTesting(true);
    const details = await checkBackendHealthDetails();
    onStatus(details.ok);
    setLatency(details.latencyMs ?? null);
    setLastDetails(details);
    if (onHealthDetails) onHealthDetails(details);
    setTesting(false);
    if (!details.ok) {
      setShowDiagModal(true);
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050814]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 live-dot" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide text-white">
                REGIONAL<span className="text-cyan-400">AI</span>
              </div>
              <div className="text-[10px] tracking-widest text-slate-400 font-mono">
                MULTIMODAL VISION
              </div>
            </div>
          </div>

          {/* Backend Diagnostics and Test Connection */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowDiagModal(true)}
              className="hidden sm:flex items-center gap-2 rounded-full glass px-3 py-1.5 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer text-left"
              title="Click to view Backend Diagnostics & Endpoint info"
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  online === true
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : online === false
                    ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                    : "bg-slate-500"
                }`}
              />
              <span className="text-xs text-slate-300">
                {online === true
                  ? "AI Backend Connected"
                  : online === false
                  ? "AI Backend Offline"
                  : "Backend Not Tested"}
              </span>
              {latency !== null && online === true && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {latency}ms
                </span>
              )}
            </button>

            <button
              id="header-test-connection-btn"
              type="button"
              onClick={test}
              disabled={testing}
              className="flex items-center gap-1.5 rounded-xl glass px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:border-cyan-500/30 border border-white/10 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {testing ? (
                <Radio className="h-3.5 w-3.5 animate-spin text-cyan-400" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              )}
              <span>{testing ? "Probing..." : "Test Connection"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Backend Diagnostics & Recovery Modal */}
      {showDiagModal && (
        <div
          id="backend-diagnostic-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-3xl glass p-6 border border-white/15 bg-slate-950/95 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Server className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  AI Backend Diagnostics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Breakdown */}
            <div className="my-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Connection Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      online === true
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        : online === false
                        ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="text-xs font-semibold text-white">
                    {online === true
                      ? "Connected & Responding"
                      : online === false
                      ? "Offline / Unreachable"
                      : "Not Checked"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400">Configured Endpoint</span>
                <span className="text-xs font-mono text-cyan-300">
                  {getBackendUrl()}
                </span>
              </div>

              {latency !== null && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-xs text-slate-400">Probe Latency</span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    {latency} ms
                  </span>
                </div>
              )}

              {lastDetails?.error && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  <span className="font-semibold">Probe details:</span> {lastDetails.error}
                </div>
              )}

              {/* Instructions if offline */}
              {online !== true && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle className="h-4 w-4" />
                    How to start your local FastAPI backend:
                  </div>
                  <p className="text-xs text-slate-300">
                    Run the following commands in your project terminal:
                  </p>
                  <pre className="p-3 rounded-xl bg-black/60 text-cyan-300 font-mono text-xs overflow-x-auto border border-white/10 select-all">
{`cd Regional_lang_webapp
pip install -r requirements.txt
python backend_server.py`}
                  </pre>
                  <button
                    type="button"
                    onClick={() =>
                      copyCommand("cd Regional_lang_webapp\npip install -r requirements.txt\npython backend_server.py")
                    }
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition pt-1 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copied ? "Copied commands to clipboard!" : "Copy commands"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer action buttons */}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDiagModal(false)}
                className="px-4 py-2 rounded-xl glass text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={test}
                disabled={testing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {testing ? <Radio className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>Test Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

