"use client";

import { useRef } from "react";
import { useInView } from "./useInView";

const steps = [
  {
    id: "01",
    phase: "INGEST",
    title: "Multimodal Telemetry Ingestion",
    desc: "Ingesting bathymetric depth charts, live ship AIS movements, seismic event feeds, optical OTDR traces and landing station cross-connects.",
    tag: "TELEMETRY BUS",
  },
  {
    id: "02",
    phase: "TWIN",
    title: "Graph-Based Digital Twin",
    desc: "Constructing a real-time topology replica of the planetary cable web — segment physical routing, repeater spans, optical attenuation and burial margins.",
    tag: "GRAPH KERNEL",
  },
  {
    id: "03",
    phase: "SIMULATE",
    title: "Deterministic Fault Injection",
    desc: "Simulating single and multi-point severances, subsea landslides, sabotage vectors and optical power drops to evaluate systemic network resilience.",
    tag: "SIMULATION ENGINE",
  },
  {
    id: "04",
    phase: "ANALYZE",
    title: "Spectral & Traffic Impact Analysis",
    desc: "Quantifying packet loss, wavelength degradation, alternate path saturation, latency inflation and national connectivity disconnects in milliseconds.",
    tag: "ANALYTICS CORE",
  },
  {
    id: "05",
    phase: "LOGISTICS",
    title: "Maritime Recovery Planning",
    desc: "Autonomous repair pathing: optimal ship dispatch, cable-tank stock checks, ROV descent depth validation and splice timeline forecasting.",
    tag: "MARITIME LOGISTICS",
  },
  {
    id: "06",
    phase: "EXECUTE",
    title: "Multi-Agent Consensus Recommendations",
    desc: "Five specialist agents formulate prioritized recovery directives, jurisdictional maritime clearances and carrier traffic reroute instructions.",
    tag: "LANGGRAPH AGENTS",
  },
];

export default function ApproachSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  return (
    <section id="approach" className="section-py relative z-10" ref={ref}>
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
              THE VARUNASETU RESILIENCE PARADIGM
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white leading-tight">
              A digital twin engineered
              <br />
              <em className="italic font-light">for sovereign resilience.</em>
            </h2>
            <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed max-w-lg">
              VARUNASETU models the full operational arc of a subsea crisis —
              from anomalous wavelength loss to autonomous vessel routing —
              inside a high-fidelity digital twin environment.
            </p>
          </div>
        </div>

        {/* 6 High-Tech Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`glass-card-interactive relative rounded-2xl p-6 transition-all duration-700 flex flex-col justify-between ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 80 + 120}ms` }}
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      STEP {step.id}
                    </span>
                    <span className="text-white/30 text-xs">|</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                      {step.phase}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-white/80 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest">
                    {step.tag}
                  </span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-2 leading-tight">
                  {step.title}
                </h3>

                <p className="font-body text-white/70 text-xs sm:text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-white/40">
                <span>EXECUTION LATENCY</span>
                <span className="text-white/80 font-bold">&lt; 120ms</span>
              </div>
            </div>
          ))}
        </div>

        {/* Process Bar Strip */}
        <div
          className={`hidden lg:flex items-center justify-between mt-8 p-4 rounded-xl glass-card text-xs font-mono text-white/60 transition-all duration-700 ${
            inView ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <span className="text-white font-bold tracking-wider">
            [DATA BUS]
          </span>
          <span className="text-white/30">───────────►</span>
          <span>INGESTION</span>
          <span className="text-white/30">──►</span>
          <span>DIGITAL TWIN KERNEL</span>
          <span className="text-white/30">──►</span>
          <span>FAULT SIMULATOR</span>
          <span className="text-white/30">──►</span>
          <span>5-AGENT REASONING</span>
          <span className="text-white/30">───────────►</span>
          <span className="text-white font-bold tracking-wider">
            [RECOVERY ACTION]
          </span>
        </div>
      </div>
    </section>
  );
}
