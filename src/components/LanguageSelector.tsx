// ============================================================
// LanguageSelector — Regional Language Selection Dropdown
// ------------------------------------------------------------
// Supports all 12 specified Indian regional and national languages,
// highlighting Bhojpuri as a first-class language.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe, Sparkles } from "lucide-react";
import { SUPPORTED_LANGUAGES, type LanguageOption } from "@/lib/config";

interface Props {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export default function LanguageSelector({ value, onChange, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const current: LanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === value) ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        id="language-selector-button"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass glass-hover flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-200 w-full justify-between border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate">
          <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Language</span>
          <span className="text-white font-medium truncate">{current.label}</span>
          <span className="text-cyan-300/80 text-xs font-serif shrink-0">({current.nativeLabel})</span>
          {current.code === "bho" && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Bhojpuri
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-cyan-300" : ""
          }`}
        />
      </button>

      {open && (
        <div
          id="language-selector-dropdown"
          className="absolute z-50 mt-2 w-full min-w-[280px] right-0 glass rounded-xl p-2 shadow-2xl border border-cyan-500/30 max-h-80 overflow-y-auto backdrop-blur-xl bg-slate-950/95"
          role="listbox"
        >
          <div className="px-2 py-1.5 text-[11px] font-medium text-slate-400 border-b border-white/10 flex items-center justify-between">
            <span>SELECT REGIONAL LANGUAGE</span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 12 Languages
            </span>
          </div>

          <div className="mt-1 space-y-0.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === value;
              const isBhojpuri = lang.code === "bho";

              return (
                <button
                  key={lang.code}
                  id={`language-option-${lang.code}`}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    onChange(lang.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-slate-100">{lang.label}</span>
                    <span className="text-xs text-cyan-300/80 font-serif">
                      {lang.nativeLabel}
                    </span>
                    {isBhojpuri && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        First-Class
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-cyan-300 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

