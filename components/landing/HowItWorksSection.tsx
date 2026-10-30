"use client";

import { useRef } from "react";
import { useInView } from "./useInView";

const archSteps = [
  {
    code: "01",
    label: "Multimodal Sources",
    spec: "TeleGeography · AIS Corridors · Seafloor GIS",
    throughput: "12.4 GB/s RAW",
  },
  {
    code: "02",
    label: "Real-Time Ingestion",
    spec: "Distributed stream parsing & schema normalisation",
    throughput: "ZERO DROP",
  },
  {
    code: "03",
    label: "Integrity Validation",
    spec: "Cryptographic check & anomaly baseline filter",
    throughput: "SHA-256 VERIFIED",
  },
  {
    code: "04",
    label: "Digital Twin Engine",
    spec: "Full topological graph model of 1.3M km cable web",
    throughput: "SUB-SECOND SYNC",
  },
  {
    code: "05",
    label: "Fault Simulator",
    spec: "Deterministic cut injection & optical dispersion test",
    throughput: "1,000 SCENARIOS/S",
  },
  {
    code: "06",
    label: "LangGraph Multi-Agent",
    spec: "5 specialist agents executing consensus planning",
    throughput: "5-NODE ORCHESTRATION",
  },
  {
    code: "07",
    label: "Recovery Directives",
    spec: "Prioritized maritime vessel & traffic reroute orders",
    throughput: "READY TO DEPLOY",
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  return (
    <section id="architecture" className="section-py relative z-10" ref={ref}>
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
              ARCHITECTURE &amp; DATA PIPELINE
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white leading-tight mb-3">
            From raw subsea telemetry
            <br />
            <em className="italic font-light">to autonomous crisis decisions.</em>
          </h2>
          <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed max-w-xl">
            The VARUNASETU processing engine transforms raw oceanographic and optical
            data into mission-ready recovery strategies through a deterministic 7-stage
            pipeline.
          </p>
        </div>

        {/* 7-Stage Pipeline */}
        <div className="relative">
          <div className="hidden lg:grid grid-cols-7 gap-2.5 items-stretch">
            {archSteps.map((step, i) => (
              <div
                key={step.label}
                className={`glass-card-interactive rounded-xl p-4 flex flex-col justify-between transition-all duration-700 ${
                  inView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 80 + 100}ms` }}
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-[9px] mb-3 pb-1.5 border-b border-white/10 text-white/50">
                    <span>STAGE {step.code}</span>
                    <span className="text-[8px] text-white/80">{step.throughput}</span>
                  </div>
                  <div className="font-display font-bold text-white text-xs sm:text-sm leading-tight mb-1.5">
                    {step.label}
                  </div>
                </div>
                <p className="font-body text-white/60 text-[11px] leading-relaxed mt-2">
                  {step.spec}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile Vertical Flow */}
          <div className="lg:hidden space-y-2.5">
            {archSteps.map((step, i) => (
              <div
                key={step.label}
                className={`glass-card rounded-xl p-4 flex items-start gap-3.5 transition-all duration-700 ${
                  inView
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-6"
                }`}
                style={{ transitionDelay: `${i * 60 + 100}ms` }}
              >
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-mono text-xs font-bold text-white shrink-0 mt-0.5">
                  {step.code}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-display font-bold text-white text-sm">
                      {step.label}
                    </div>
                    <span className="font-mono text-[9px] text-white/50">{step.throughput}</span>
                  </div>
                  <p className="font-body text-white/60 text-xs leading-relaxed mt-1">
                    {step.spec}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`mt-6 text-center font-mono text-[11px] text-white/40 tracking-wider transition-all duration-700 ${
            inView ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "700ms" }}
        >
          {"// SUBSEA GRAPH KERNEL EXECUTING CONTINUOUS TELEMETRY AUDIT //"}
        </div>
      </div>
    </section>
  );
}
