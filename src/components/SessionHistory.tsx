// ============================================================
// SessionHistory — recent AI results panel
// ------------------------------------------------------------
// Now persisted in the Supabase database (single-tenant, no auth).
// Items survive page reloads.
// ============================================================

import { Clock, History, Loader2, Trash2 } from "lucide-react";
import type { StoredResult } from "@/lib/resultsDb";

interface Props {
  items: StoredResult[];
  loading: boolean;
  onClear: () => void;
  onDelete: (id: string) => void;
}

export default function SessionHistory({ items, loading, onClear, onDelete }: Props) {
  return (
    <div className="glass rounded-2xl p-5 fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">SESSION HISTORY</h3>
          <span className="text-[10px] text-slate-500">saved</span>
        </div>
        {items.length > 0 && (
          <button onClick={onClear} className="text-xs text-slate-500 hover:text-rose-300 transition">
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 text-cyan-400/60 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">No results yet. Capture and analyze to start building history.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {items.map((it) => (
            <div
              key={it.id}
              className="group flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5 hover:border-cyan-500/20 transition fade-up"
            >
              <span className="text-2xl select-none">{it.emoji || "—"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">{it.gesture || "—"}</div>
                <div className="text-xs text-cyan-300/80 truncate" lang={it.language || "en"}>{it.regional_text || "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-cyan-300">{Math.round(it.confidence * 100)}%</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(it.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <button
                onClick={() => onDelete(it.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition p-1"
                aria-label="Delete result"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
