// ============================================================
// HowItWorks — four step cards
// ============================================================

import { Camera, Eye, Languages, Layers } from "lucide-react";

const STEPS = [
  { n: "01", icon: Camera, title: "CAMERA", desc: "Capture visual information from the live camera feed." },
  { n: "02", icon: Eye, title: "AI VISION", desc: "Analyze gesture and visual information with your AI backend." },
  { n: "03", icon: Languages, title: "REGIONAL AI", desc: "Generate regional-language understanding from the analysis." },
  { n: "04", icon: Layers, title: "MULTIMODAL OUTPUT", desc: "Return text, audio, emoji and gesture in one response." },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-glow">How It Works</h2>
        <p className="mt-2 text-sm text-slate-400">From camera frame to multimodal regional-language output.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((s) => (
          <div key={s.n} className="glass glass-hover rounded-2xl p-6 fade-up">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold text-cyan-500/30">{s.n}</span>
              <s.icon className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold tracking-wide text-white mb-2">{s.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
