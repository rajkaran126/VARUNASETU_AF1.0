"use client";

import { useEffect, useState } from "react";

const PANEL_DATA = {
  status: "OPERATIONAL",
  metrics: [
    { label: "Active Cable Systems", value: "426" },
    { label: "Landing Stations", value: "1,200+" },
    { label: "Monitored Segments", value: "8,400+" },
    { label: "Active Warnings", value: "03" },
  ],
  networkHealth: [
    { region: "Pacific Route", pct: 98 },
    { region: "Atlantic Backbone", pct: 96 },
    { region: "Indian Ocean", pct: 91 },
    { region: "Mediterranean", pct: 84 },
  ],
};

function MiniSparkline({ tick }: { tick: number }) {
  // Smooth animated sparkline curve that fits neatly into the card
  const basePoints = [
    [0, 18],
    [18, 14],
    [36, 17],
    [54, 11],
    [72, 13],
    [90, 8],
    [108, 12],
    [126, 6],
    [144, 9],
    [162, 4],
  ];

  // Slight subtle fluctuation on the active end
  const pathD = basePoints
    .map((pt, i) => {
      const y = i === basePoints.length - 1 ? pt[1] + (tick % 3) - 1 : pt[1];
      return `${i === 0 ? "M" : "L"} ${pt[0]} ${y}`;
    })
    .join(" ");

  return (
    <div className="w-full pt-1">
      <svg
        viewBox="0 0 165 24"
        className="w-full h-7 overflow-visible"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
        {/* Glow point on the trailing edge */}
        <circle
          cx={162}
          cy={4 + (tick % 3) - 1}
          r={2}
          fill="#ffffff"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

export default function FloatingIntelPanel() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 10), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="glass-card w-full max-w-[340px] sm:max-w-[360px] p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-3.5 select-none"
      aria-label="Network Intelligence Telemetry Panel"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] text-white font-semibold tracking-[0.2em] uppercase">
            Network Intelligence
          </span>
        </div>
        <span className="font-mono text-[9px] text-white/70 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {PANEL_DATA.status}
        </span>
      </div>

      {/* 2x2 Metric Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {PANEL_DATA.metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] space-y-0.5"
          >
            <div className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight">
              {m.value}
            </div>
            <div className="font-body text-[10px] text-white/60 leading-tight">
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Global Throughput with Sparkline */}
      <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-white/60 tracking-wider uppercase">
            Global Throughput
          </span>
          <span className="font-mono text-[10px] text-white font-medium">
            ↑ {96 + (tick % 3)}%
          </span>
        </div>
        <MiniSparkline tick={tick} />
      </div>

      {/* Regional Route Density */}
      <div className="space-y-2 pt-0.5">
        <div className="font-mono text-[9px] text-white/50 tracking-[0.2em] uppercase">
          Regional Route Density
        </div>
        {PANEL_DATA.networkHealth.map((item) => (
          <div key={item.region} className="flex items-center gap-2.5">
            <span className="font-body text-[11px] text-white/75 w-28 shrink-0 truncate">
              {item.region}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/85 transition-all duration-700"
                style={{ width: `${item.pct}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-white/60 w-8 text-right">
              {item.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Centered Subtitle */}
      <div className="text-center pt-1 border-t border-white/5">
        <span className="font-mono text-[8px] text-white/35 tracking-[0.25em] uppercase">
          Digital Twin Subsea Telemetry
        </span>
      </div>
    </div>
  );
}
