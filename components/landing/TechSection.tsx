"use client";

import { useRef } from "react";
import { useInView } from "./useInView";

const techStack = [
  {
    category: "FRONTEND STACK",
    items: [
      { name: "Next.js 15 (App Router)", desc: "Zero-latency SSR & RSC streaming" },
      { name: "React 19 & TypeScript", desc: "Type-safe asynchronous UI" },
      { name: "Tailwind CSS & Glass HUD", desc: "Hardware-accelerated backdrop blur" },
      { name: "Framer Motion", desc: "Telemetry viewport animations" },
    ],
  },
  {
    category: "COGNITIVE & AGENTS",
    items: [
      { name: "LangGraph Multi-Agent Swarm", desc: "Deterministic cyclic agent routing" },
      { name: "Google Gemini 1.5 Pro", desc: "Deep context reasoning & telemetry analysis" },
      { name: "Anthropic Claude 3.5 Sonnet", desc: "Complex topological graph decomposition" },
      { name: "LangChain Core", desc: "Standardized tool & state bus" },
    ],
  },
  {
    category: "BACKEND & PERSISTENCE",
    items: [
      { name: "Supabase (PostgreSQL)", desc: "Subsea fiber segment & CLS coordinates" },
      { name: "Upstash Redis", desc: "High-throughput stream cache" },
      { name: "QStash Queue", desc: "Reliable background simulation workers" },
      { name: "Vercel Global Edge", desc: "Sub-15ms edge routing worldwide" },
    ],
  },
  {
    category: "BATHYMETRY & MARITIME",
    items: [
      { name: "TeleGeography Subsea Data", desc: "Global cable route coordinates" },
      { name: "NOAA Bathymetric Elevations", desc: "Ocean trench depth matrices" },
      { name: "AIS Satellite Tracking", desc: "Live maritime cable repair fleets" },
      { name: "GeoJSON Spatial Graphs", desc: "High-precision vector topologies" },
    ],
  },
];

const principles = [
  {
    title: "OPERATIONAL SCOPE & BOUNDARIES",
    points: [
      "Deterministic simulation environment for stress-testing subsea cable topology.",
      "Real-time reroute analysis with capacity headroom and alternate path latency forecasting.",
      "Five-agent LangGraph consensus protocol for maritime and carrier recovery recommendations.",
      "Simulated vessel mobilization, permit coordination, and optical splice workflows.",
    ],
  },
  {
    title: "HONEST TECHNICAL DISCLOSURES",
    points: [
      "Operates as a high-fidelity digital twin decision platform, not a physical ROV teleoperation system.",
      "Simulated vessel transits utilize satellite AIS records and historical nautical velocities.",
      "Carrier capacity modeling uses verified industry baseline estimates & public consortium telemetry.",
      "All recommendations are decision-support outputs designed for senior telecom engineering commands.",
    ],
  },
];

export default function TechSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  return (
    <section id="tech-architecture" className="section-py relative z-10" ref={ref}>
      <div className="container-max section-px">
        {/* Header */}
        <div
          className={`mb-12 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-mono text-[11px] text-white/70 tracking-[0.25em] uppercase font-semibold">
              TECHNOLOGY &amp; ARCHITECTURE
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white leading-tight">
              Engineered on a modern,
              <br />
              <em className="italic font-light">battle-tested foundation.</em>
            </h2>
            <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed max-w-md">
              Every technology listed here is actively configured inside VARUNASETU.
              We only represent real, functioning systems.
            </p>
          </div>
        </div>

        {/* 4 Tech Stack Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {techStack.map((cat, ci) => (
            <div
              key={cat.category}
              className={`glass-card-interactive rounded-2xl p-5 transition-all duration-700 ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${ci * 80 + 100}ms` }}
            >
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-4 text-white/50 font-bold pb-2 border-b border-white/10">
                {cat.category}
              </div>

              <ul className="space-y-3">
                {cat.items.map((item) => (
                  <li key={item.name} className="flex flex-col gap-0.5">
                    <span className="font-display font-bold text-white text-xs sm:text-sm">
                      {item.name}
                    </span>
                    <span className="font-body text-white/50 text-[11px] leading-snug">
                      {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 2 Disclosure Panels */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "450ms" }}
        >
          {principles.map((p) => (
            <div key={p.title} className="glass-card rounded-2xl p-6">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3 font-bold text-white/60 pb-2 border-b border-white/10">
                {p.title}
              </div>
              <ul className="space-y-2.5">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-white shrink-0" />
                    <span className="font-body text-xs text-white/75 leading-relaxed">
                      {pt}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
