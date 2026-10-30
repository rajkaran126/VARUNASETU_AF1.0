"use client";

import { useRef } from "react";
import { useInView } from "./useInView";

const capabilities = [
  {
    number: "MOD-01",
    name: "Global Cable Explorer",
    tagline: "Planetary GIS & Bathymetry Layer",
    desc: "Interactive 3D planetary mapping of 400+ submarine systems, optical repeaters, landing stations, consortium equity and territorial exclusive economic zones (EEZ).",
    spec: "400+ CABLE NETWORKS",
    tags: ["3D Cartography", "Benthic GIS", "Consortium Data"],
  },
  {
    number: "MOD-02",
    name: "Underwater Digital Twin",
    tagline: "Deterministic Physical-Layer Replica",
    desc: "High-fidelity simulation of cable segment topology, optical carrier dispersion, physical burial depths, repeater voltage drops and oceanographic risk profiles.",
    spec: "REAL-TIME SYNC",
    tags: ["Physical Twin", "DWDM Telemetry", "Benthic Models"],
  },
  {
    number: "MOD-03",
    name: "Network Ops & Failure Simulation",
    tagline: "Stress-Testing Before The Crisis",
    desc: "Inject physical cuts, seismic shifts, optical amplifier outages and simultaneous multi-trunk disruptions to observe autonomic routing dynamics under peak load.",
    spec: "FAULT INJECTION",
    tags: ["Traffic Reroute", "Capacity Caps", "Latency Surges"],
  },
  {
    number: "MOD-04",
    name: "Recovery War Room",
    tagline: "Tactical Response Coordination",
    desc: "Mission control command dashboard for real-time fault isolation, maritime repair contractor coordination, dynamic SLA monitoring and incident mitigation briefing.",
    spec: "COMMAND CONSOLE",
    tags: ["War Room", "SLA Protection", "Crisis Command"],
  },
  {
    number: "MOD-05",
    name: "Multi-Agent Mission Control",
    tagline: "Autonomous Collective Intelligence",
    desc: "Five specialized AI agents orchestrated via LangGraph to decompose disruptions, evaluate geopolitical and economic impact, and construct optimized recovery strategies.",
    spec: "5 SPECIALIST AGENTS",
    tags: ["LangGraph Engine", "Autonomous", "Consensus Protocol"],
    featured: true,
  },
  {
    number: "MOD-06",
    name: "Ghost Simulation Engine",
    tagline: "Full-Lifecycle Deep-Sea Replay",
    desc: "Choreographed visual playback from acoustic fault alarm to deep-sea ROV inspection, cable-laying vessel transit, marine splicing and line power re-energization.",
    spec: "DEEP-SEA REPLAY",
    tags: ["ROV Operation", "Vessel Transit", "Micro-Splice"],
  },
  {
    number: "MOD-07",
    name: "Analytics & Executive Briefings",
    tagline: "Audit-Grade Telemetry Intelligence",
    desc: "Instant export of cryptographic audit reports, capacity depletion timelines, sovereign risk exposure assessments and regulatory briefing packs.",
    spec: "PDF & CSV EXPORT",
    tags: ["Risk Audit", "Sovereign Briefs", "SLA Reports"],
  },
  {
    number: "MOD-08",
    name: "Data & Bathymetric Foundation",
    tagline: "Authoritative Oceanographic Substrate",
    desc: "Continuous ingestion of global bathymetric elevation models, satellite AIS shipping corridors, historical fault databases and seabed geologic vulnerability indices.",
    spec: "HIGH-FIDELITY GIS",
    tags: ["Seafloor Bathymetry", "AIS Tracking", "Seismic Data"],
  },
];

export default function CapabilitiesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  return (
    <section id="capabilities" className="section-py relative z-10" ref={ref}>
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
              TACTICAL CAPABILITY SUITE
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white leading-tight">
              Eight mission-critical
              <br />
              <em className="italic font-light">infrastructure modules.</em>
            </h2>
            <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed max-w-lg">
              From global GIS seafloor exploration to autonomous multi-agent
              recovery planning — every module is engineered to give sovereign
              operators total network command.
            </p>
          </div>
        </div>

        {/* 8 Powerful Capability Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {capabilities.map((cap, i) => (
            <div
              key={cap.number}
              className={`glass-card-interactive relative rounded-2xl p-5 sm:p-6 transition-all duration-700 flex flex-col justify-between ${
                cap.featured ? "md:col-span-2 bg-white/[0.07] border-white/25" : ""
              } ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 70 + 100}ms` }}
            >
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/50 font-bold">
                    {cap.number}
                  </span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/10 text-white border border-white/15 tracking-wider uppercase">
                    {cap.spec}
                  </span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-1 leading-tight">
                  {cap.name}
                </h3>

                <p className="font-mono text-[10px] text-white/60 mb-3 tracking-wide">
                  {cap.tagline}
                </p>

                <p className="font-body text-xs sm:text-sm leading-relaxed text-white/70 mb-4">
                  {cap.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.06]">
                {cap.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
