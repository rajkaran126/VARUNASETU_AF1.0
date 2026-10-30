"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FloatingIntelPanel from "./FloatingIntelPanel";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center pt-20 pb-12 overflow-hidden"
      aria-label="Hero"
    >
      <div className="container-max section-px relative z-10 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-6">
            {/* Mission Badge */}
            <div
              className={`inline-flex items-center gap-2 transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              <div className="glass-pill flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="font-mono text-[11px] text-white/90 tracking-[0.2em] uppercase font-semibold">
                  AI-Powered Subsea Digital Twin
                </span>
                <span className="text-white/30 text-xs">/</span>
                <span className="font-mono text-[10px] text-white/60 tracking-wider">
                  PHASE 1 CORE
                </span>
              </div>
            </div>

            {/* Headline - Bold Geometric Space Grotesk matching reference style */}
            <div
              className={`transition-all duration-800 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: "150ms" }}
            >
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight">
                The intelligence
                <br />
                layer for global
                <br />
                submarine
                <br />
                connectivity.
              </h1>
            </div>

            {/* Supporting description */}
            <div
              className={`transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: "280ms" }}
            >
              <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed max-w-lg">
                An AI-powered digital twin that explores global submarine cable
                infrastructure, simulates network disruptions and engineers
                intelligent recovery strategies.
              </p>
            </div>

            {/* Action Buttons: Pure White Primary + Glass Outline Secondary */}
            <div
              className={`flex flex-col sm:flex-row gap-3 pt-1 transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <Link
                href="/workspace"
                className="btn-pure-white inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full font-body text-xs tracking-wider uppercase font-bold"
              >
                <span>Enter Workspace</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <a
                href="#ghost-simulation"
                className="btn-white-outline inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full font-body text-xs tracking-wider uppercase"
              >
                <span>Explore Platform</span>
              </a>
            </div>

            {/* Compact Technical Metrics Strip */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
              style={{ transitionDelay: "500ms" }}
            >
              {[
                { value: "400+", label: "Cable Systems", sub: "Global Network" },
                { value: "1.3M km", label: "Subsea Fibre", sub: "Deep-Sea Routes" },
                { value: "~95%", label: "Internet Flow", sub: "International" },
                { value: "5 Agents", label: "Multi-Agent AI", sub: "Autonomous Ops" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-0.5">
                  <div className="font-display font-bold text-xl lg:text-2xl text-white">
                    {stat.value}
                  </div>
                  <div className="font-body text-[11px] text-white/80 font-medium">
                    {stat.label}
                  </div>
                  <div className="font-mono text-[9px] text-white/40 uppercase tracking-wider">
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Floating Tactical Intelligence HUD */}
          <div
            className={`lg:col-span-5 xl:col-span-6 flex justify-center lg:justify-end transition-all duration-1000 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
            style={{ transitionDelay: "350ms" }}
          >
            <FloatingIntelPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
