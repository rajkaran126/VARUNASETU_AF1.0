"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FloatingIntelPanel from "./FloatingIntelPanel";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDemoModalOpen(false);
    };
    if (demoModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [demoModalOpen]);

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
                className="btn-pure-white inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full font-body text-xs tracking-wider uppercase font-bold shadow-lg shadow-white/10"
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

              {/* Watch Demo Trigger Button */}
              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="btn-white-outline inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-body text-xs tracking-wider uppercase font-semibold text-white hover:bg-white/10 transition-all group"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span>Watch System Demo</span>
              </button>

              <a
                href="#ghost-simulation"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full font-body text-xs tracking-wider uppercase text-white/60 hover:text-white transition-colors"
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

      {/* Pop-up Video Demo & Salient Features Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-8 animate-in fade-in duration-200">
          {/* Backdrop Click Dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setDemoModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-5xl bg-[#0F141C]/95 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh] ring-1 ring-white/10">
            {/* Close Button */}
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105"
              title="Close System Demo"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Left Side: Video Player */}
            <div className="lg:w-[58%] bg-black flex flex-col justify-center items-center relative overflow-hidden min-h-[260px] sm:min-h-[360px] lg:min-h-[460px]">
              <video
                src="/video/demo.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain max-h-[500px]"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 border border-white/20 backdrop-blur-md flex items-center gap-1.5 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] text-white/90 uppercase tracking-widest font-semibold">
                  VARUNASETU System Walkthrough
                </span>
              </div>
            </div>

            {/* Right Side: Salient Features */}
            <div className="lg:w-[42%] p-5 sm:p-7 flex flex-col justify-between bg-gradient-to-b from-white/[0.04] to-transparent overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E06D3B]/20 text-[#E06D3B] border border-[#E06D3B]/40 uppercase tracking-wider">
                    Platform Architecture
                  </span>
                  <span className="text-white/40 text-[11px] font-mono">v1.0 Live</span>
                </div>

                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Subsea Resilience Twin
                  </h3>
                  <p className="font-body text-xs text-white/70 leading-relaxed mt-1">
                    Continuous physical telemetry, false redundancy detection, and autonomous multi-agent failover for global submarine cables.
                  </p>
                </div>

                {/* Salient Features List */}
                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                    <span className="text-lg">🌐</span>
                    <div>
                      <h4 className="font-display text-xs font-bold text-white">692-Cable Digital Twin</h4>
                      <p className="font-body text-[11px] text-white/60 leading-normal mt-0.5">
                        Interactive 3D geospatial mesh mapping 1.3M+ km of subsea fiber, bathymetry trenches, landing stations, and seismic hazard zones.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                    <span className="text-lg">⚡</span>
                    <div>
                      <h4 className="font-display text-xs font-bold text-white">False Redundancy (SRLG) Hunter</h4>
                      <p className="font-body text-[11px] text-white/60 leading-normal mt-0.5">
                        Exposes shared physical corridor chokepoints (Suez, Luzon, Malacca) where supposed backup cables get severed simultaneously.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                    <span className="text-lg">🤖</span>
                    <div>
                      <h4 className="font-display text-xs font-bold text-white">5-Agent Collaborative AI</h4>
                      <p className="font-body text-[11px] text-white/60 leading-normal mt-0.5">
                        Network Analyst, Risk & Scenario, Logistics Fleet, and Policy Agents governed by Chief Orchestrator & Ghost Copilot.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                    <span className="text-lg">🚢</span>
                    <div>
                      <h4 className="font-display text-xs font-bold text-white">Physics-Grounded 3D ROV Repair Sim</h4>
                      <p className="font-body text-[11px] text-white/60 leading-normal mt-0.5">
                        Replays DP2 repair ship transit, ocean swell windows, benthic ROV trenching, cutting, and optical fusion splicing sequences.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer CTA */}
              <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <Link
                  href="/workspace"
                  onClick={() => setDemoModalOpen(false)}
                  className="w-full btn-pure-white py-2.5 rounded-xl font-body text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  <span>Launch Live Workspace</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
