// ============================================================
// results_db — Persistence for RegionalAI Analysis Results
// ------------------------------------------------------------
// Single-tenant database layer: uses Supabase when configured,
// and gracefully falls back to local storage without crashing
// when Supabase credentials are not provided.
// ============================================================

import { supabase, isSupabaseConfigured } from "./supabase";
import type { AIResult } from "./api";

export interface StoredResult {
  id: string;
  emoji: string;
  gesture: string;
  regional_text: string;
  translation: string;
  confidence: number;
  audio_url: string | null;
  language: string;
  created_at: string;
  image_data?: string | null;
}

const LOCAL_STORAGE_KEY = "regionalai_session_history";

function getLocalHistory(): StoredResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredResult[]) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(items: StoredResult[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // Ignore storage quota errors
  }
}

export function getDatabaseStatus(): { configured: boolean; message: string } {
  if (isSupabaseConfigured) {
    return {
      configured: true,
      message: "Supabase Cloud Database connected",
    };
  }
  return {
    configured: false,
    message: "History unavailable on Cloud (Supabase credentials not configured in .env)",
  };
}

// ---- Insert a new AI result ----------------------------------
export async function saveResult(
  result: AIResult,
  language: string,
  imageData?: string
): Promise<StoredResult | null> {
  // Only save valid successful predictions
  if (!result.text && !result.gesture && !result.emoji) {
    return null;
  }

  const newEntry: StoredResult = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`,
    emoji: result.emoji || "—",
    gesture: result.gesture || "Gesture",
    regional_text: result.text || "",
    translation: result.translation || "",
    confidence: result.confidence,
    audio_url: result.audio || null,
    language,
    created_at: new Date().toISOString(),
    image_data: imageData ?? null,
  };

  // 1. Try Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("ai_results")
        .insert({
          emoji: newEntry.emoji,
          gesture: newEntry.gesture,
          regional_text: newEntry.regional_text,
          translation: newEntry.translation,
          confidence: newEntry.confidence,
          audio_url: newEntry.audio_url,
          language,
          image_data: imageData ?? null,
        })
        .select()
        .single();

      if (error) {
        console.warn("Supabase insert error, saving to session cache:", error.message);
      } else if (data) {
        return data as StoredResult;
      }
    } catch (err) {
      console.warn("Supabase network error:", err);
    }
  }

  // 2. Always maintain local session cache for smooth instant feedback
  const localItems = getLocalHistory();
  saveLocalHistory([newEntry, ...localItems]);
  return newEntry;
}

// ---- Fetch recent results (newest first) --------------------
export async function fetchRecentResults(limit = 20): Promise<StoredResult[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("ai_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as StoredResult[];
      }
      console.warn("Supabase fetch failed, checking local history:", error?.message);
    } catch (err) {
      console.warn("Supabase connection error:", err);
    }
  }

  return getLocalHistory().slice(0, limit);
}

// ---- Delete a single result ---------------------------------
export async function deleteResult(id: string): Promise<boolean> {
  let deletedFromSupabase = false;
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("ai_results").delete().eq("id", id);
      deletedFromSupabase = !error;
    } catch {
      // Fall through to local delete
    }
  }

  const localItems = getLocalHistory().filter((it) => it.id !== id);
  saveLocalHistory(localItems);
  return deletedFromSupabase || true;
}

// ---- Clear all results --------------------------------------
export async function clearAllResults(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("ai_results").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    } catch {
      // Fall through
    }
  }

  saveLocalHistory([]);
  return true;
}

