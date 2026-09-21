import { useCallback, useEffect, useState } from "react";
import { Eye, Hand, Sparkles, Zap } from "lucide-react";
import Header from "@/components/Header";
import AICamera from "@/components/AICamera";
import ResultPanel from "@/components/ResultPanel";
import LanguageSelector from "@/components/LanguageSelector";
import SessionHistory from "@/components/SessionHistory";
import HowItWorks from "@/components/HowItWorks";
import {
  DEFAULT_EMPTY_RESULT,
  checkBackendHealthDetails,
  type AIResult,
  type AIStatus,
  type BackendHealthResult,
} from "@/lib/api";
import { FRAME_INTERVAL } from "@/lib/config";
import {
  fetchRecentResults,
  saveResult,
  deleteResult,
  clearAllResults,
  type StoredResult,
} from "@/lib/resultsDb";

function App() {
  const [language, setLanguage] = useState("hi");
  const [realtime, setRealtime] = useState(false);
  const [result, setResult] = useState<AIResult>(DEFAULT_EMPTY_RESULT);
  const [status, setStatus] = useState<AIStatus>("Ready");
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [backendSupportedLangs, setBackendSupportedLangs] = useState<string[] | null>(null);
  const [history, setHistory] = useState<StoredResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [retrySignal, setRetrySignal] = useState(0);

  const refreshHistory = useCallback(async () => {
    const items = await fetchRecentResults(12);
    setHistory(items);
    setHistoryLoading(false);
  }, []);

  const handleResult = useCallback(
    async (r: AIResult) => {
      setResult(r);
      setAnalyzing(false);
      if (r.text || r.gesture || r.emoji) {
        await saveResult(r, language);
        refreshHistory();
      }
    },
    [language, refreshHistory]
  );

  const handleStatus = useCallback((s: AIStatus) => {
    setStatus(s);
    setAnalyzing(
      s === "Analyzing gesture..." ||
      s === "Processing..." ||
      s === "Connecting to AI..."
    );
  }, []);

  const handleError = useCallback((msg: string | null) => setError(msg), []);

  const retry = () => {
    setError(null);
    setStatus("Ready");
    setRetrySignal((x) => x + 1);
  };

  const handleHealthDetails = useCallback((details: BackendHealthResult) => {
    setOnline(details.ok);
    if (details.supportedLanguages) {
      setBackendSupportedLangs(details.supportedLanguages);
    }
  }, []);

  // Initial load: probe backend & load persisted history
  useEffect(() => {
    refreshHistory();
    checkBackendHealthDetails().then((details: BackendHealthResult) => {
      setOnline(details.ok);
      if (details.supportedLanguages) {
        setBackendSupportedLangs(details.supportedLanguages);
      }
    });
  }, [refreshHistory]);

  const handleClearHistory = async () => {
    await clearAllResults();
    setHistory([]);
  };

  const handleDeleteItem = async (id: string) => {
    const ok = await deleteResult(id);
    if (ok) setHistory((h) => h.filter((it) => it.id !== id));
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="aurora bg-cyan-500 w-[480px] h-[480px] -top-32 -left-24" />
      <div className="aurora bg-violet-600 w-[520px] h-[520px] top-40 -right-24" />
      <div className="aurora bg-blue-600 w-[400px] h-[400px] bottom-0 left-1/3" />

      <div className="relative">
        <Header
          online={online}
          onStatus={setOnline}
          onHealthDetails={handleHealthDetails}
        />

        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 pb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-5 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-semibold tracking-widest text-cyan-200">
              REGIONAL LANGUAGE MULTIMODAL AI
            </span>
          </div>
          <h1
            className="text-4xl sm:text-6xl font-extrabold text-white text-glow leading-tight tracking-tight"
          >
            See. Understand.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-violet-400 bg-clip-text text-transparent">
              Communicate.
            </span>
          </h1>
          <p
            className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed"
          >
            Multimodal AI that bridges non-verbal gestures and visual input into authentic regional Indian languages and spoken synthesis.
          </p>

          <div
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              id="hero-start-camera-btn"
              type="button"
              onClick={() => document.getElementById("camera-app")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all cursor-pointer shadow-lg"
            >
              <Eye className="h-4 w-4" /> Start AI Camera
            </button>
            <a
              id="hero-how-it-works-link"
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl glass px-6 py-3 text-sm font-medium text-slate-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <Hand className="h-4 w-4" /> How It Works
            </a>
          </div>
        </section>

        {/* Main Application Container */}
        <section id="camera-app" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          {/* Controls bar: Language Selector + Real-Time Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl glass border border-white/10 shadow-lg">
            <div className="sm:w-80">
              <LanguageSelector value={language} onChange={setLanguage} />
            </div>

            <div className="flex items-center gap-3">
              <button
                id="main-toggle-realtime-btn"
                type="button"
                onClick={() => setRealtime((r) => !r)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold border transition-all cursor-pointer ${
                  realtime
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                    : "glass border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30"
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>REAL-TIME AI</span>
                <span
                  className={`text-[10px] tracking-widest px-1.5 py-0.5 rounded font-mono font-bold ${
                    realtime ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {realtime ? "ACTIVE" : "STANDBY"}
                </span>
              </button>
              {realtime && (
                <span className="hidden md:inline-block text-xs text-slate-400 font-mono">
                  {FRAME_INTERVAL / 1000}s non-overlapping throttled loop
                </span>
              )}
            </div>
          </div>

          {/* Core Grid: Camera feed on left, AI Interpretation on right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6" key={`cam-${retrySignal}`}>
              <AICamera
                language={language}
                realtime={realtime}
                onToggleRealtime={() => setRealtime((r) => !r)}
                onResult={handleResult}
                onStatus={handleStatus}
                onError={handleError}
                currentStatus={status}
              />

              <SessionHistory
                items={history}
                loading={historyLoading}
                onClear={handleClearHistory}
                onDelete={handleDeleteItem}
              />
            </div>

            <ResultPanel
              result={result}
              status={status}
              error={error}
              analyzing={analyzing}
              selectedLanguage={language}
              backendSupportedLanguages={backendSupportedLangs}
              onRetry={retry}
            />
          </div>
        </section>

        {/* How It Works Explainer Section */}
        <div id="how-it-works">
          <HowItWorks />
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center bg-black/40">
          <p className="text-xs text-slate-500 font-mono">
            RegionalAI — Multimodal Regional Language AI · Powered by FastAPI, React & Vite
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

