"use client";

import { useRef, useState } from "react";
import { useInView } from "./useInView";

const agents = [
  {
    id: "AGENT-01",
    name: "Chief Orchestrator",
    role: "Mission Commander & Consensus Arbiter",
    model: "GEMINI 1.5 PRO / LANGGRAPH",
    desc: "Deconstructs incident severity, coordinates cross-agent tasks, arbitrates competing routing priorities, and synthesizes the authoritative master recovery directive.",
    responsibilities: [
      "Incident decomposition & task graphs",
      "Dynamic agent workload allocation",
      "Consensus arbitration & priority weighting",
      "Cryptographic action-plan validation",
    ],
    status: "STANDBY // PRIORITY 1",
  },
  {
    id: "AGENT-02",
    name: "Network Analyst",
    role: "Spectral & Topology Intelligence",
    model: "CLAUDE 3.5 SONNET / GRAPH ENGINE",
    desc: "Simulates optical power drops across affected DWDM bands. Models alternate terrestrial and subsea routing corridors to avoid regional packet choke-points.",
    responsibilities: [
      "DWDM optical loss calculation",
      "Dynamic shortest-path reroute graphs",
      "Latency variance forecasting",
      "Landing station throughput balancing",
    ],
    status: "ACTIVE TELEMETRY STREAM",
  },
  {
    id: "AGENT-03",
    name: "Risk & Scenario Agent",
    role: "Threat & Cascade Forecaster",
    model: "GEMINI 1.5 PRO / MONTE CARLO",
    desc: "Executes Monte Carlo stress testing against neighboring trunk cables to quantify the probability of secondary cascading ruptures under surge conditions.",
    responsibilities: [
      "Cascading overload probability matrix",
      "Seismic & seabed slip assessment",
      "Worst-case isolation envelope modeling",
      "Secondary route failure mitigation",
    ],
    status: "MONTE CARLO RUNNING",
  },
  {
    id: "AGENT-04",
    name: "Logistics & Repair Agent",
    role: "Maritime Fleet Operations Planner",
    model: "ALGORITHM DISPATCH / SATELLITE AIS",
    desc: "Tracks and routes global DP2 cable repair ships, calculates nautical transit times, checks fiber-spool inventories and aligns ROV dive schedules.",
    responsibilities: [
      "Vessel AIS dynamic positioning dispatch",
      "Benthic ROV descent schedule planning",
      "Depot cable-tank stock verification",
      "Port mobilization timeline estimation",
    ],
    status: "4 SHIPS MONITORED",
  },
  {
    id: "AGENT-05",
    name: "Policy & Impact Agent",
    role: "Jurisdictional & Sovereign Regulatory Analyst",
    model: "LEGAL LLM CORE / UNCLOS PROTOCOL",
    desc: "Reviews UNCLOS territorial waters compliance, evaluates SLA penalty exposure for financial consortiums, and formats official governmental briefings.",
    responsibilities: [
      "Territorial sea & EEZ clearance check",
      "Financial consortium SLA breach exposure",
      "Sovereign emergency declaration briefs",
      "Regulatory compliance audit trail",
    ],
    status: "UNCLOS VERIFIED",
  },
];

export default function AgentsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });
  const [activeAgent, setActiveAgent] = useState(0);

  const active = agents[activeAgent];

  return (
    <section id="agents" className="section-py relative z-10" ref={ref}>
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
              LANGGRAPH AUTONOMOUS MULTI-AGENT SWARM
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white leading-tight">
              Five specialist AI agents.
              <br />
              <em className="italic font-light">One synchronized command.</em>
            </h2>
            <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed max-w-md">
              Engineered on LangGraph, each autonomous agent specializes in a critical
              domain of subsea infrastructure resilience to synthesize collective action plans.
            </p>
          </div>
        </div>

        {/* 2-Column Console Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 5 Agent List */}
          <div className="lg:col-span-5 space-y-2.5">
            {agents.map((agent, i) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(i)}
                className={`w-full text-left rounded-xl p-4 border transition-all duration-300 flex items-center justify-between ${
                  activeAgent === i
                    ? "bg-white/[0.1] border-white/40 shadow-lg"
                    : "glass-card hover:bg-white/[0.05]"
                } ${
                  inView
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-6"
                }`}
                style={{ transitionDelay: `${i * 60 + 100}ms` }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[9px] text-white/40">
                      {agent.id}
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="font-mono text-[9px] text-white/70 font-semibold">
                      {agent.model}
                    </span>
                  </div>
                  <div className="font-display font-bold text-white text-sm sm:text-base leading-tight">
                    {agent.name}
                  </div>
                  <div className="font-body text-xs text-white/60 mt-0.5">
                    {agent.role}
                  </div>
                </div>

                <div className="w-2 h-2 rounded-full border border-white/40 flex items-center justify-center shrink-0 ml-3">
                  {activeAgent === i && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right: Active Agent Command Dossier */}
          <div
            className={`lg:col-span-7 rounded-2xl p-6 sm:p-8 glass-card flex flex-col justify-between transition-all duration-500 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-5 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-white/50 mb-1">
                    <span>{active.id}</span>
                    <span>·</span>
                    <span className="text-white/80">{active.status}</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                    {active.name}
                  </h3>
                  <div className="font-body text-xs text-white/60 mt-1">
                    {active.role}
                  </div>
                </div>
                <span className="hud-badge text-[9px] text-white/90">
                  ONLINE
                </span>
              </div>

              <p className="font-body text-white/75 text-xs sm:text-sm leading-relaxed mb-6">
                {active.desc}
              </p>

              <div>
                <div className="font-mono text-[10px] text-white/50 tracking-[0.2em] uppercase mb-3">
                  Autonomous Operational Responsibilities
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {active.responsibilities.map((r) => (
                    <div
                      key={r}
                      className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                      <span className="font-body text-xs text-white/80 leading-snug">
                        {r}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-white/[0.06] flex items-center justify-between font-mono text-[9px] text-white/40">
              <span>SECURITY LEVEL: SOVEREIGN ENCLAVE</span>
              <span>VERIFIED AGENT POLICY</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
