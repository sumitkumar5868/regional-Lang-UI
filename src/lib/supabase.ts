// ============================================================
// Supabase client singleton & configuration guard
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  url &&
    anonKey &&
    url.trim() !== "" &&
    anonKey.trim() !== "" &&
    !url.includes("your_supabase_url") &&
    url.startsWith("http")
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
    })
  : null;

