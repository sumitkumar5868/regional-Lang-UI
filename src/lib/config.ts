// ============================================================
// RegionalAI — Multimodal AI Configuration
// ------------------------------------------------------------
// Manages backend endpoint URLs, supported regional languages,
// frame intervals, and backend capability verification.
// ============================================================

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  script?: string;
  notes?: string;
}

// 12 Required Regional & National Languages with Bhojpuri as a first-class citizen
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", script: "Devanagari" },
  { code: "bho", label: "Bhojpuri", nativeLabel: "भोजपुरी", script: "Devanagari / Kaithi" },
  { code: "or", label: "Odia", nativeLabel: "ଓଡ଼ିଆ", script: "Odia" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", script: "Bengali" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", script: "Tamil" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", script: "Telugu" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", script: "Devanagari" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", script: "Gujarati" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", script: "Kannada" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", script: "Malayalam" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ", script: "Gurmukhi" },
  { code: "en", label: "English", nativeLabel: "English", script: "Latin" },
];

// Backend URL resolution with dynamic override support from settings/session
export const STORAGE_KEYS = {
  BACKEND_URL: "regionalai_backend_url",
  HEALTH_URL: "regionalai_health_url",
  FRAME_INTERVAL: "regionalai_frame_interval",
  SELECTED_LANG: "regionalai_selected_lang",
};

export const DEFAULT_AI_BACKEND_URL =
  import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8000/predict";

export const DEFAULT_HEALTH_ENDPOINT =
  import.meta.env.VITE_AI_HEALTH_URL || "http://localhost:8000/health";

export function getActiveBackendUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEYS.BACKEND_URL);
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_AI_BACKEND_URL;
}

export function getActiveHealthUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEYS.HEALTH_URL);
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_HEALTH_ENDPOINT;
}

export function setActiveBackendUrl(url: string) {
  if (typeof window !== "undefined") {
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEYS.BACKEND_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.BACKEND_URL);
    }
  }
}

export function setActiveHealthUrl(url: string) {
  if (typeof window !== "undefined") {
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEYS.HEALTH_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.HEALTH_URL);
    }
  }
}

// Frame Interval: default 1000ms (within prompt target of 500ms–1500ms)
export const DEFAULT_FRAME_INTERVAL = 1000;
export const FRAME_INTERVAL = DEFAULT_FRAME_INTERVAL;

export const getBackendUrl = getActiveBackendUrl;
export const getHealthUrl = getActiveHealthUrl;

export function getActiveFrameInterval(): number {

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEYS.FRAME_INTERVAL);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 500 && parsed <= 3000) return parsed;
    }
  }
  return DEFAULT_FRAME_INTERVAL;
}

export function setActiveFrameInterval(interval: number) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.FRAME_INTERVAL, interval.toString());
  }
}

// Request shape definition matching the FastAPI PredictRequest schema
export const REQUEST_CONFIG = {
  method: "POST" as const,
  headers: {
    "Content-Type": "application/json",
  },
  imageField: "image",
  languageField: "language",
};

// Known baseline languages supported by the initial repository's FastAPI backend (backend_server.py).
// If a backend does not explicitly return supported_languages in /health or returns an unsupported
// status, we inform the user gracefully without simulating or faking output.
export const BASELINE_BACKEND_LANGUAGES = ["hi"];

export function isLanguageSupportedByBackend(
  langCode: string,
  backendReportedLanguages?: string[] | null
): boolean {
  if (backendReportedLanguages && backendReportedLanguages.length > 0) {
    return backendReportedLanguages.includes(langCode);
  }
  // If backend hasn't reported an explicit list, check against baseline
  return BASELINE_BACKEND_LANGUAGES.includes(langCode);
}

export const DEFAULT_EMPTY_RESULT = {
  text: "",
  translation: "",
  audio: "",
  emoji: "",
  gesture: "",
  confidence: 0,
};

