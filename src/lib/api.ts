// ============================================================
// API SERVICE — Isolated integration layer for RegionalAI
// ------------------------------------------------------------
// Manages HTTP communication with the FastAPI backend (/predict, /health),
// request timeouts, error classifications, and response normalization.
// ============================================================

import {
  getActiveBackendUrl,
  getActiveHealthUrl,
  REQUEST_CONFIG,
  DEFAULT_EMPTY_RESULT,
} from "./config";

export interface AIResult {
  text: string;
  translation: string;
  audio: string;
  emoji: string;
  gesture: string;
  confidence: number; // 0..1
  language?: string;
  rawResponse?: unknown;
}

export type AIStatus =
  | "Ready"
  | "Camera starting..."
  | "Camera ready"
  | "Connecting to AI..."
  | "Analyzing gesture..."
  | "Processing..."
  | "Result detected"
  | "Saving session..."
  | "Backend offline"
  | "No gesture detected"
  | "Error";

export type AIErrorKind =
  | "network"
  | "timeout"
  | "backend"
  | "validation"
  | "invalid"
  | "no_gesture";

export class AIError extends Error {
  kind: AIErrorKind;
  statusCode?: number;
  details?: unknown;

  constructor(kind: AIErrorKind, message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "AIError";
    this.kind = kind;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface BackendHealthResult {
  ok: boolean;
  online: boolean;
  latencyMs?: number;
  service?: string;
  statusText?: string;
  url: string;
  supportedLanguages?: string[];
  error?: string;
}

// ------------------------------------------------------------
// mapAIResponse — adapts real backend payload to the UI shape.
// Respects real backend values and NEVER synthesizes fake data.
// ------------------------------------------------------------
export function mapAIResponse(response: unknown, requestedLanguage?: string): AIResult {
  const r = (response ?? {}) as Record<string, unknown>;

  const text = String(r.text ?? r.regional_text ?? r.regionalText ?? "");
  const translation = String(r.translation ?? r.english ?? "");
  const audio = String(r.audio ?? r.audio_url ?? r.audioUrl ?? "");
  const emoji = String(r.emoji ?? "");
  const gesture = String(r.gesture ?? r.gesture_name ?? r.gestureName ?? "");

  const rawConf = r.confidence ?? r.confidence_score ?? r.score ?? 0;
  let confidence = typeof rawConf === "number" ? rawConf : Number(rawConf);
  if (!Number.isFinite(confidence) || isNaN(confidence)) {
    confidence = 0;
  }
  // Normalize if backend sends 0..100 percentage
  if (confidence > 1 && confidence <= 100) {
    confidence = confidence / 100;
  }

  const language = String(r.language ?? requestedLanguage ?? "");

  return {
    text,
    translation,
    audio,
    emoji,
    gesture,
    confidence,
    language,
    rawResponse: response,
  };
}

// ------------------------------------------------------------
// sendFrameToBackend — POSTs a captured frame to the AI backend
// ------------------------------------------------------------
export async function sendFrameToBackend(
  image: string,
  language: string,
  externalSignal?: AbortSignal
): Promise<AIResult> {
  const backendUrl = getActiveBackendUrl();

  if (!backendUrl || backendUrl === "YOUR_AI_BACKEND_URL") {
    throw new AIError("backend", "AI backend URL is not configured.");
  }

  const body: Record<string, string> = {};
  body[REQUEST_CONFIG.imageField] = image;
  body[REQUEST_CONFIG.languageField] = language;

  // Set up 15-second timeout
  const timeoutMs = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error("Timeout"));
  }, timeoutMs);

  // Link external signal if provided
  if (externalSignal) {
    externalSignal.addEventListener("abort", () => controller.abort());
  }

  let res: Response;
  try {
    res = await fetch(backendUrl, {
      method: REQUEST_CONFIG.method,
      headers: REQUEST_CONFIG.headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === "AbortError" || err.message === "Timeout") {
        throw new AIError(
          "timeout",
          `AI request timed out after ${timeoutMs / 1000}s. The backend may be processing slowly or unreachable.`
        );
      }
    }
    throw new AIError(
      "network",
      `Unable to connect to AI backend at ${backendUrl}. Verify that the FastAPI server is running and CORS is enabled.`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let errorDetail = `Backend returned HTTP status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && typeof errJson === "object") {
        if ("detail" in errJson) {
          errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        } else if ("message" in errJson) {
          errorDetail = String(errJson.message);
        }
      }
    } catch {
      // Body not JSON
    }

    if (res.status === 422) {
      throw new AIError("validation", `Validation Error: ${errorDetail}`, res.status);
    }
    throw new AIError("backend", `AI Backend Error: ${errorDetail}`, res.status);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AIError("invalid", "Backend returned an invalid non-JSON response.");
  }

  try {
    return mapAIResponse(data, language);
  } catch (err) {
    throw new AIError("invalid", "Failed to parse and map backend prediction payload.");
  }
}

// ------------------------------------------------------------
// checkBackendHealth — Active probe for /health endpoint
// ------------------------------------------------------------
export async function checkBackendHealth(): Promise<BackendHealthResult> {
  const healthUrl = getActiveHealthUrl();
  if (!healthUrl) {
    return { ok: false, online: false, url: healthUrl, error: "Health URL is empty." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  const startTime = performance.now();

  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - startTime);
    clearTimeout(timeoutId);

    if (res.ok) {
      try {
        const data = (await res.json()) as Record<string, unknown>;
        return {
          ok: true,
          online: true,
          latencyMs,
          service: typeof data?.service === "string" ? data.service : "RegionalAI Backend",
          statusText: typeof data?.status === "string" ? data.status : "ok",
          supportedLanguages: Array.isArray(data?.supported_languages)
            ? (data.supported_languages as string[])
            : undefined,
          url: healthUrl,
        };
      } catch {
        return {
          ok: true,
          online: true,
          latencyMs,
          statusText: "ok",
          url: healthUrl,
        };
      }
    }

    return {
      ok: false,
      online: false,
      latencyMs,
      url: healthUrl,
      error: `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      online: false,
      url: healthUrl,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

export const checkBackendHealthDetails = checkBackendHealth;

export { DEFAULT_EMPTY_RESULT };

