"use client";

import { useRef } from "react";
import { useInView } from "./useInView";

const challenges = [
  {
    number: "V-01",
    label: "INFRASTRUCTURE EXPOSURE",
    title: "Deep-Sea Physical Vulnerability",
    metric: "1.3M+ KM FIBRE",
    body: "Over 400 submarine cable networks carry approximately 95% of international communications across tectonic plates, subsea trenches and unpatrolled maritime zones. A physical severance immediately threatens inter-continental economic flow.",
  },
  {
    number: "V-02",
    label: "BENTHIC SEVERANCE PATTERNS",
    title: "100+ Annual Ocean Floor Severances",
    metric: "~100 FAULTS / YR",
    body: "Deep-sea dredging, commercial trawling gear, subsea seismic fault shifts and benthic landslides cause catastrophic fibre breaks. Pinpointing fault coordinates across abyssal depths requires acoustic precision and multi-sensor correlation.",
  },
  {
    number: "V-03",
    label: "CONGESTION DYNAMICS",
    title: "Cascading Reroute Saturation",
    metric: "350% CAPACITY SPIKE",
    body: "When primary subsea routes go dark, dynamic traffic dumps onto secondary corridors, pushing alternate trunks to 300%+ load capacity. Latency degrades catastrophically and cascading packet drops disrupt sovereign digital corridors.",
  },
  {
    number: "V-04",
    label: "MOBILIZATION BOTTLENECKS",
    title: "Complex Multi-Week Vessel Logistics",
    metric: "4–6 WEEKS DOWNTIME",
    body: "Specialized cable repair ships must secure multi-jurisdiction maritime permits, transit rough seas, drop ROVs down to 8,000m depths, grapple benthic cable ends and execute nanometre-level fusion splicing under hostile ocean conditions.",
  },
];

export default function ChallengeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.15 });

  return (
    <section id="challenge" className="section-py relative z-10" ref={ref}>
      <div className="container-max section-px">
        {/* Section Header */}
        <div
          className={`mb-12 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-mono text-[11px] text-white/70 tracking-[0.25em] uppercase font-semibold">
              CRITICAL INFRASTRUCTURE AT RISK
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white leading-tight">
              When subsea cables fail,
              <br />
              <em className="italic font-light">the world notices.</em>
            </h2>
            <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed max-w-lg">
              Submarine telecommunications cables are the invisible backbone of
              humanity’s digital infrastructure. VARUNASETU equips engineering
              commands to simulate, predict, and counter deep-sea vulnerabilities.
            </p>
          </div>
        </div>

        {/* 4 Powerful Editorial Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {challenges.map((item, i) => (
            <div
              key={item.number}
              className={`glass-card-interactive relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 90 + 150}ms` }}
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white/80">
                      {item.number}
                    </span>
                    <span className="text-white/30 text-xs">|</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/15">
                    {item.metric}
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2.5 leading-tight">
                  {item.title}
                </h3>

                <p className="font-body text-white/70 text-xs sm:text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-white/40">
                <span>SECTOR RESILIENCE IMPACT</span>
                <span className="text-white/70">CRITICAL PRIORITY</span>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Impact Banner */}
        <div
          className={`mt-8 p-6 sm:p-8 rounded-2xl glass-card flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          <div className="text-center md:text-left">
            <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-0.5">
              ~100 Faults
            </div>
            <div className="font-body text-white/60 text-xs">
              Recorded global benthic severances annually
            </div>
          </div>
          <div className="h-px md:h-10 md:w-px bg-white/20 w-full md:w-auto" />
          <div className="text-center md:text-left">
            <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-0.5">
              4–6 Weeks
            </div>
            <div className="font-body text-white/60 text-xs">
              Average deep-sea maritime vessel mobilization &amp; splice
            </div>
          </div>
          <div className="h-px md:h-10 md:w-px bg-white/20 w-full md:w-auto" />
          <div className="text-center md:text-left">
            <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-0.5">
              95.4% Flow
            </div>
            <div className="font-body text-white/60 text-xs">
              Of global financial and internet transactions vulnerable
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
