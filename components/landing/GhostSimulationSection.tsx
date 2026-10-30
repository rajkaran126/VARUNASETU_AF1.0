"use client";

import { useRef } from "react";
import { useInView } from "./useInView";
import Link from "next/link";

const stages = [
  {
    phase: "PHASE 01",
    tag: "DETECTION // 00:00:00",
    title: "Instantaneous Cable Severance Detection",
    depth: "DEPTH: -4,820M",
    desc: "Acoustic TDR reflectometry isolates optical signal rupture within 1.2 metres. Seismic accelerometers flag submarine landslide trigger on the continental shelf.",
  },
  {
    phase: "PHASE 02",
    tag: "SURVEY // +04:12:00",
    title: "Deep-Sea ROV Acoustic Survey",
    depth: "DEPTH: -4,820M",
    desc: "Submersible ROV 'V-KRAKEN' descends through abyssal thermoclines. 4K optical cameras and acoustic side-scan sonar confirm sheared double-armored trunk cable.",
  },
  {
    phase: "PHASE 03",
    tag: "DISPATCH // +12:30:00",
    title: "Dynamic Vessel Routing & Mobilization",
    depth: "TRANSIT: 412 NM",
    desc: "Autonomous dispatch of DP2 cable repair ship from Colombo. Satellite AIS routing avoids maritime storm cells while clearing diplomatic EEZ permissions.",
  },
  {
    phase: "PHASE 04",
    tag: "RECOVERY // +72:00:00",
    title: "Benthic Grappling & Deck Recovery",
    depth: "TENSION: 42 KN",
    desc: "Deep-water de-trenching grapnels sweep ocean floor sediments, hooking severed optical ends. Benthic winch hoists trunk cable onto vessel stern workdecks.",
  },
  {
    phase: "PHASE 05",
    tag: "RESTORE // +96:45:00",
    title: "Cleanroom Fusion Splicing & Jointing",
    depth: "PRECISION: ±0.01μm",
    desc: "Specialist marine fiber engineers perform microscopic fusion splicing of 96 optical cores under cleanroom conditions, re-encapsulating in titanium joint housing.",
  },
  {
    phase: "PHASE 06",
    tag: "CUTOVER // +108:00:00",
    title: "OTDR Verification & High-Volume Re-Cutover",
    depth: "THROUGHPUT: 100%",
    desc: "Full OTDR loss validation (&lt;0.18 dB/km), re-powering subsea optical repeaters, and autonomous re-cutover of 48 Tbps inter-continental data traffic.",
  },
];

export default function GhostSimulationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  return (
    <section
      id="ghost-simulation"
      className="section-py relative z-10"
      ref={ref}
    >
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
              GHOST SIMULATION OPERATIONAL SEQUENCE
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white leading-tight">
              Replay the full operational
              <br />
              <em className="italic font-light">arc of a deep-sea crisis.</em>
            </h2>
            <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed max-w-md">
              Ghost Simulation executes a deterministic, multi-stage replay of a
              submarine cable catastrophe — from abyssal rupture to sovereign
              traffic cutover.
            </p>
          </div>
        </div>

        {/* 6 Tactical Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stages.map((stage, i) => (
            <div
              key={stage.phase}
              className={`glass-card-interactive rounded-2xl p-6 flex flex-col justify-between transition-all duration-700 ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 80 + 100}ms` }}
            >
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/50 font-bold">
                    {stage.phase}
                  </span>
                  <span className="font-mono text-[9px] text-white/90 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    {stage.depth}
                  </span>
                </div>

                <div className="font-mono text-[9px] text-white/60 mb-1.5 tracking-wider">
                  {stage.tag}
                </div>

                <h3 className="font-display text-base sm:text-lg font-bold text-white mb-2 leading-tight">
                  {stage.title}
                </h3>
              </div>

              <p className="font-body text-white/65 text-xs sm:text-sm leading-relaxed mt-2">
                {stage.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Launch Button */}
        <div
          className={`mt-10 text-center transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <Link
            href="/workspace"
            className="btn-pure-white inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-body text-xs uppercase tracking-widest font-bold"
          >
            <span>Launch Ghost Simulation</span>
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
        </div>
      </div>
    </section>
  );
}
