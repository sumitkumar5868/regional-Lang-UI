// ============================================================
// ResultPanel — Glassmorphism AI Interpretation Display
// ------------------------------------------------------------
// Displays genuine backend prediction outputs: regional text,
// translation, gesture, emoji, confidence %, and audio output.
// Strictly avoids fake values; displays "Not available" when missing.
// ============================================================

import {
  Activity,
  AlertTriangle,
  Languages,
  Play,
  Sparkles,
  Type,
  Volume2,
} from "lucide-react";
import ConfidenceRing from "./ConfidenceRing";
import AudioCard from "./AudioCard";
import type { AIResult, AIStatus } from "@/lib/api";
import {
  SUPPORTED_LANGUAGES,
  isLanguageSupportedByBackend,
} from "@/lib/config";

interface Props {
  result: AIResult;
  status: AIStatus;
  error: string | null;
  analyzing: boolean;
  selectedLanguage: string;
  backendSupportedLanguages?: string[] | null;
  onRetry: () => void;
}

const STATUS_COLOR: Record<AIStatus, string> = {
  Ready: "text-slate-400",
  "Camera starting...": "text-cyan-300",
  "Camera ready": "text-emerald-400",
  "Connecting to AI...": "text-cyan-300",
  "Analyzing gesture...": "text-cyan-300 animate-pulse",
  "Processing...": "text-violet-300 animate-pulse",
  "Result detected": "text-emerald-400 font-bold",
  "Saving session...": "text-cyan-300",
  "Backend offline": "text-rose-400 font-bold",
  "No gesture detected": "text-amber-400",
  Error: "text-rose-400 font-bold",
};

export default function ResultPanel({
  result,
  status,
  error,
  analyzing,
  selectedLanguage,
  backendSupportedLanguages,
  onRetry,
}: Props) {
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) ??
    SUPPORTED_LANGUAGES[0];

  const isLangSupported = isLanguageSupportedByBackend(
    selectedLanguage,
    backendSupportedLanguages
  );

  const hasResult = Boolean(
    result.text || result.gesture || result.emoji || result.translation
  );
  const showSkeleton = analyzing && !hasResult;

  const playQuickAudio = () => {
    if (result.audio) {
      const audioEl = new Audio(result.audio);
      audioEl.play().catch(() => {});
    }
  };

  return (
    <div id="ai-result-panel" className="flex flex-col gap-5">
      {/* Top Header Card with AI INTERPRETATION & Status */}
      <div className="glass rounded-2xl px-5 py-4 flex items-center justify-between border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              AI INTERPRETATION
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                Status:
              </span>
              <span className={`text-xs font-semibold ${STATUS_COLOR[status] || "text-slate-300"}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analyzing && <LoaderDots />}
          {result.audio && (
            <button
              id="quick-play-audio-btn"
              type="button"
              onClick={playQuickAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-all cursor-pointer shadow-sm"
              title="Play AI speech"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-300" />
              <span>Play Audio</span>
            </button>
          )}
        </div>
      </div>

      {/* Language Backend Capability Warning Banner */}
      {!isLangSupported && (
        <div
          id="unsupported-language-banner"
          className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 fade-up"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-300">
                {currentLang.label} is selected, but the current AI backend does not support this language yet.
              </p>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                The frontend sends <code className="px-1 py-0.5 bg-black/40 rounded text-amber-300 font-mono text-[11px]">&quot;{currentLang.code}&quot;</code> in the prediction payload.
                To receive authentic {currentLang.label} speech and script, update your FastAPI backend with a regional translation or Indic NLP model (e.g. IndicTrans2, Bhashini, or regional vocabulary dictionary).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error notification banner */}
      {error && (
        <div
          id="ai-error-banner"
          className="glass rounded-2xl px-5 py-4 border-rose-500/40 bg-rose-950/20 fade-up"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Diagnostic Alert
              </span>
              <p className="text-sm text-rose-200 mt-0.5">{error}</p>
            </div>
            <button
              id="btn-retry-analysis"
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-rose-500/20 px-3.5 py-1.5 text-xs font-semibold text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 transition-all cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Top Section: Gesture + Emoji + Confidence */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Detected Gesture Card */}
        <div className="glass rounded-2xl p-5 border border-white/10 sm:col-span-2 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Detected Gesture
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                hasResult
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              {hasResult ? "RECOGNIZED" : "AWAITING GESTURE"}
            </span>
          </div>

          <div className="flex items-center gap-5 my-1">
            <div
              className="text-6xl select-none flex items-center justify-center min-w-[72px] min-h-[72px] rounded-2xl bg-slate-900/50 border border-white/5"
              aria-label="gesture emoji"
            >
              {showSkeleton ? (
                <SkeletonBox w={56} h={56} rounded />
              ) : (
                result.emoji || "👋"
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-2xl font-bold text-white tracking-tight">
                {showSkeleton ? (
                  <SkeletonLine w={140} />
                ) : hasResult ? (
                  result.gesture || "Not available"
                ) : (
                  "Show a gesture"
                )}
              </div>
              <div className="text-sm text-slate-300">
                {showSkeleton ? (
                  <SkeletonLine w={100} />
                ) : hasResult ? (
                  `English: ${result.translation || "Not available"}`
                ) : (
                  "Position your hand in front of the camera"
                )}
              </div>
              <div className="pt-1 text-xs text-cyan-300/80 font-mono">
                Target Language: <span className="text-white font-medium">{currentLang.label}</span> ({currentLang.nativeLabel})
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Meter Card */}
        <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            AI Confidence
          </span>
          <ConfidenceRing value={result.confidence} />
          <span className="text-xs text-slate-400 mt-2 font-mono">
            {hasResult
              ? `${Math.round(result.confidence * 100)}% Match`
              : "0% (Standby)"}
          </span>
        </div>
      </div>

      {/* Regional Language Output + English Translation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Regional Text */}
        <div className="glass rounded-2xl p-5 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Regional Text ({currentLang.label})
              </span>
            </div>
            <span className="text-xs text-cyan-300/70 font-serif">
              {currentLang.nativeLabel}
            </span>
          </div>
          {showSkeleton ? (
            <SkeletonLine w={180} h={36} />
          ) : (
            <div className="min-h-[50px] flex items-center">
              <p
                id="regional-text-display"
                className="text-3xl font-bold text-white text-glow leading-tight break-words"
              >
                {hasResult ? result.text || "Not available" : "—"}
              </p>
            </div>
          )}
        </div>

        {/* English Translation */}
        <div className="glass rounded-2xl p-5 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                English Translation
              </span>
            </div>
            <span className="text-xs text-slate-400">EN</span>
          </div>
          {showSkeleton ? (
            <SkeletonLine w={160} h={36} />
          ) : (
            <div className="min-h-[50px] flex items-center">
              <p
                id="english-translation-display"
                className="text-2xl font-semibold text-slate-200 leading-tight break-words"
              >
                {hasResult ? result.translation || "Not available" : "—"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audio card */}
      <AudioCard audioUrl={result.audio} active={analyzing} />
    </div>
  );
}

function LoaderDots() {
  return (
    <div className="flex gap-1.5 items-center px-2 py-1 rounded-md bg-cyan-950/40 border border-cyan-500/30">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function SkeletonLine({ w = 120, h = 20 }: { w?: number; h?: number }) {
  return <div className="shimmer rounded-md" style={{ width: w, height: h }} />;
}

function SkeletonBox({ w, h, rounded }: { w: number; h: number; rounded?: boolean }) {
  return (
    <div
      className={`shimmer ${rounded ? "rounded-2xl" : "rounded-md"}`}
      style={{ width: w, height: h }}
    />
  );
}

