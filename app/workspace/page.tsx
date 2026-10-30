import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Workspace — VARUNASETU",
  description: "VARUNASETU infrastructure intelligence workspace.",
};

export default function WorkspacePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10 py-16">
      <div className="glass-card max-w-xl w-full p-8 sm:p-10 rounded-3xl text-center space-y-6 relative">
        <div className="hud-bracket-tl" />
        <div className="hud-bracket-tr" />
        <div className="hud-bracket-bl" />
        <div className="hud-bracket-br" />

        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20">
          <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 10 Q5 5, 10 7.5 Q15 10, 18 5"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M2 13 Q5 8, 10 10.5 Q15 13, 18 8"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <circle cx="10" cy="8.75" r="1.8" fill="#ffffff" />
          </svg>
        </div>

        <div>
          <p className="font-mono text-white/50 text-[10px] tracking-[0.25em] uppercase mb-2">
            VARUNASETU · DIGITAL TWIN ENCLAVE
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Workspace Active
          </h1>
        </div>

        <p className="font-body text-white/70 text-sm leading-relaxed max-w-md mx-auto">
          Phase 1 design foundation and subsea telemetry systems are active.
          Full 3D GIS interactive globe and agent execution environment will be
          unlocked in Phase 2.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="btn-pure-white inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-body text-xs uppercase tracking-widest font-bold"
          >
            ← Return to Landing
          </Link>
          <Link
            href="/#capabilities"
            className="btn-white-outline inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-body text-xs uppercase tracking-widest"
          >
            Explore Capabilities
          </Link>
        </div>
      </div>
    </div>
  );
}
