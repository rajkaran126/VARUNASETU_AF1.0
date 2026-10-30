"use client";

import { useRef } from "react";
import { useInView } from "./useInView";
import Link from "next/link";

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.2 });

  return (
    <section id="cta" className="section-py relative z-10" ref={ref}>
      <div className="container-max section-px">
        <div
          className={`glass-card relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 transition-all duration-700 ${
            inView ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="font-mono text-[11px] text-white/70 tracking-[0.25em] uppercase font-semibold">
                  VARUNASETU INTELLIGENCE WORKSPACE
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Command the deep
                <br />
                telecom network.
              </h2>

              <p className="font-body text-white/75 text-sm sm:text-base leading-relaxed max-w-lg">
                Enter the VARUNASETU workspace to explore global submarine cable
                infrastructure, simulate severe benthic ruptures, and observe
                real-time multi-agent crisis resolution.
              </p>

              {/* Action Buttons: Pure White Primary + Glass Outline Secondary */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href="/workspace"
                  className="btn-pure-white inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-body text-xs tracking-wider uppercase font-bold"
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
                  className="btn-white-outline inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-body text-xs tracking-wider uppercase"
                >
                  <span>Watch Demo</span>
                </a>
              </div>
            </div>

            {/* Right: Technical Capabilities Matrix */}
            <div className="space-y-3">
              {[
                {
                  title: "Global Subsea GIS Topology",
                  desc: "Comprehensive database covering 400+ international submarine cables.",
                },
                {
                  title: "Deterministic Failure Injection",
                  desc: "Simulate single and multi-point severances with optical loss modeling.",
                },
                {
                  title: "5 Autonomous LangGraph Agents",
                  desc: "Specialist multi-agent reasoning, logistics pathing, and consensus orders.",
                },
                {
                  title: "Ghost Simulation Operational Replay",
                  desc: "From fault trigger to ROV dive, repair ship transit, and carrier cutover.",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.07] transition-all duration-700 ${
                    inView
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-6"
                  }`}
                  style={{ transitionDelay: `${i * 80 + 200}ms` }}
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white text-xs sm:text-sm mb-0.5">
                      {feature.title}
                    </div>
                    <div className="font-body text-white/60 text-[11px] leading-relaxed">
                      {feature.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
