'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { AgentRole } from '@/lib/types';

export default function MissionControlPage() {
  const { 
    selectedCable, 
    activeFault, 
    simulationResult, 
    agentMessages, 
    sendAgentQuery, 
    resetAgentChat, 
    isAgentThinking 
  } = useWorkspace();

  const [inputQuery, setInputQuery] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true);

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    sendAgentQuery(inputQuery);
    setInputQuery('');
  };

  const promptSuggestions = [
    'Assess blast radius for SEA-ME-WE 5 break in Red Sea',
    'Dispatch nearest DP2 repair vessel to Bab el-Mandeb fault',
    'Calculate geopolitical chokepoint cascade risk',
    'Verify consortium SLA and regulatory cabotage constraints'
  ];

  const agentBadges: Record<AgentRole, { color: string; bg: string }> = {
    'Chief Orchestrator': { color: 'text-indigo-900', bg: 'bg-indigo-100' },
    'Network Analyst': { color: 'text-[#454640]', bg: 'bg-[#E8D9BF]' },
    'Risk & Scenario Agent': { color: 'text-amber-900', bg: 'bg-amber-100' },
    'Logistics & Repair Agent': { color: 'text-emerald-900', bg: 'bg-emerald-100' },
    'Policy & Impact Agent': { color: 'text-purple-900', bg: 'bg-purple-100' }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E2DBD0] flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 05 // MULTI-AGENT AUTONOMOUS ORCHESTRATION
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">
              5 SPECIALIST AGENTS ONLINE
            </span>
          </div>
          <h1 className="font-sans font-bold text-xl lg:text-2xl font-bold text-[#1C1917] tracking-tight">
            Multi-Agent Mission Control
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetAgentChat}
            className="btn-outline text-xs"
          >
            Reset Thread
          </button>
          <button
            onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
            className="btn-secondary text-xs"
          >
            {rightDrawerOpen ? 'Hide Dossier' : 'Show Dossier'}
          </button>
        </div>
      </div>

      {/* Main ChatGPT-Style Three-Panel Interface */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Drawer: Thread History & Specialist Directory */}
        <div className="hidden lg:flex flex-col w-64 bg-white rounded-2xl border border-[#E2DBD0] p-4 shadow-xs space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#69829A] font-semibold">
              Incident Threads
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <button className="w-full text-left p-2.5 rounded-xl bg-[#EAF1F8] text-[#0A3052] font-semibold text-xs border border-[#CBDDEB] shadow-2xs">
              <span className="block truncate">Red Sea Dual Rupture 2026</span>
              <span className="font-mono text-[9px] text-[#59738A]">Active Session · 5 Agents</span>
            </button>
            <button className="w-full text-left p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#36506A] text-xs transition-colors">
              <span className="block truncate">Luzon Strait Seismic Sweep</span>
              <span className="font-mono text-[9px] text-[#7A8E9F]">Archived · 14 Days Ago</span>
            </button>
            <button className="w-full text-left p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#36506A] text-xs transition-colors">
              <span className="block truncate">MAREA Transatlantic Bypass</span>
              <span className="font-mono text-[9px] text-[#7A8E9F]">Completed · 1 Mo Ago</span>
            </button>
          </div>

          <div className="pt-3 border-t border-[#F0EBE0] flex-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#69829A] mb-2 font-semibold">
              Specialist Agent Roster
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-bold text-[#1C1917]">Chief Orchestrator</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#83B9A9]" />
                <span className="text-[#36506A]">Network Analyst</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[#36506A]">Risk & Scenario Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[#36506A]">Logistics & Repair Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[#36506A]">Policy & Impact Agent</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F0EBE0]">
            <p className="font-mono text-[9px] text-[#7A8E9F] leading-tight">
              LangGraph Multi-Agent Architecture powered by deterministic state synchronization.
            </p>
          </div>
        </div>

        {/* Center Panel: Conversational Stream & Prompt Input */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-[#E2DBD0] shadow-xs overflow-hidden">
          {/* Scrollable Chat Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {agentMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              const badge = !isUser ? agentBadges[msg.agentRole] : null;
              const hasReasoning = msg.reasoningChain && msg.reasoningChain.length > 0;
              const isReasoningOpen = expandedReasoning[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                    isUser ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="font-mono text-[10px] text-[#59738A] uppercase font-semibold">
                      {msg.agentName}
                    </span>
                    {badge && (
                      <span className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold ${badge.bg} ${badge.color}`}>
                        {msg.agentRole}
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-[#7A8E9F]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed font-body shadow-2xs ${
                      isUser
                        ? 'bg-[#C87954] text-white rounded-tr-none'
                        : 'bg-[#FAF7F2] text-[#1C1917] border border-[#E8E1D5] rounded-tl-none'
                    }`}
                  >
                    {/* Render content with simple line breaks */}
                    <div className="whitespace-pre-line font-normal space-y-2">
                      {msg.content}
                    </div>

                    {/* Quantitative Key Metrics Pills */}
                    {msg.metrics && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#E8E1D5]/70">
                        {msg.metrics.map((m, i) => (
                          <div key={i} className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD3C3] font-mono text-[10px]">
                            <span className="text-[#69829A]">{m.label}: </span>
                            <strong className="text-[#1C1917]">{m.value}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agent Thought / Reasoning Chain Accordion */}
                    {hasReasoning && (
                      <div className="mt-3 pt-2 border-t border-[#E8E1D5]/70">
                        <button
                          onClick={() => toggleReasoning(msg.id)}
                          className="flex items-center gap-1.5 font-mono text-[10px] text-[#185382] hover:underline font-semibold"
                        >
                          <svg
                            className={`w-3 h-3 transition-transform ${isReasoningOpen ? 'rotate-90' : ''}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <span>{isReasoningOpen ? 'Hide Agent Reasoning Chain' : 'View Chain of Thought (3 Steps)'}</span>
                        </button>

                        {isReasoningOpen && (
                          <div className="mt-2 pl-3 border-l-2 border-[#185382]/40 space-y-1 font-mono text-[10px] text-[#4A647D] bg-white/70 p-2 rounded">
                            {msg.reasoningChain?.map((r, idx) => (
                              <p key={idx}>› {r}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Actions */}
                    {msg.suggestedActions && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-[#E8E1D5]/70">
                        {msg.suggestedActions.map((act) => (
                          <button
                            key={act.actionId}
                            onClick={() => sendAgentQuery(act.label)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F2ECE1] border border-[#CBDDEB] font-mono text-[10px] text-[#1C1917] font-semibold transition-colors shadow-2xs"
                          >
                            <svg className="w-3 h-3 text-[#C87954]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isAgentThinking && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] text-xs text-[#59738A] w-fit font-mono">
                <span className="w-2 h-2 rounded-full bg-[#C87954] animate-ping" />
                <span>Specialist agents synthesizing consensus across network graph...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-5 py-2 bg-[#FBF9F4] border-t border-[#E8E1D5] flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#69829A] whitespace-nowrap">
              Suggestions:
            </span>
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendAgentQuery(s)}
                className="px-2.5 py-1 rounded-full bg-white border border-[#DDD3C3] hover:border-[#B5A894] text-[#36506A] whitespace-nowrap text-[11px] font-body transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#E2DBD0] flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask the 5 specialist agents anything about subsea topology, blast radius, vessel logistics, or SLAs..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#FAF7F2] border border-[#DDD3C3] rounded-xl text-xs text-[#1C1917] placeholder-[#7990A4] focus:outline-none focus:border-[#C87954] font-body"
            />
            <button
              type="submit"
              disabled={isAgentThinking || !inputQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#C87954] hover:bg-[#B36845] disabled:opacity-50 text-white text-xs font-semibold font-mono tracking-wider shadow-xs transition-all"
            >
              TRANSMIT
            </button>
          </form>
        </div>

        {/* Right Collapsible Dossier Drawer */}
        {rightDrawerOpen && (
          <div className="hidden xl:flex flex-col w-72 bg-white rounded-2xl border border-[#E2DBD0] p-4 shadow-xs space-y-4 flex-shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#69829A] font-semibold">
                Incident Dossier
              </span>
              <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                CRITICAL
              </span>
            </div>

            {/* Target Cable Info */}
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#69829A]">Target Conduit</p>
              <h4 className="font-bold text-xs text-[#1C1917] mt-0.5">{selectedCable.name}</h4>
              <p className="font-mono text-[10px] text-[#59738A] mt-1">
                Lit: {selectedCable.litCapacityTbps} Tbps · Length: {selectedCable.lengthKm} km
              </p>
            </div>

            {/* Active Fault Position */}
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#69829A]">Benthic Coordinates</p>
              <p className="font-mono text-xs font-bold text-[#1C1917] mt-0.5">
                {activeFault.lat.toFixed(4)}°N, {activeFault.lon.toFixed(4)}°E
              </p>
              <p className="font-mono text-[10px] text-rose-700 font-semibold mt-1">
                Depth: -{activeFault.depthMeters}m ({activeFault.nearestLandingStation})
              </p>
            </div>

            {/* Live Simulation Snapshot */}
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#69829A]">SimKernel Metrics</p>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-[#7A8E9F]">Served:</span>
                  <p className="font-bold text-emerald-700">{simulationResult.servedDemandTbps} T</p>
                </div>
                <div>
                  <span className="text-[9px] text-[#7A8E9F]">Unserved:</span>
                  <p className="font-bold text-rose-700">{simulationResult.unservedDemandTbps} T</p>
                </div>
                <div>
                  <span className="text-[9px] text-[#7A8E9F]">Latency:</span>
                  <p className="font-bold text-amber-700">+{simulationResult.latencyDeltaMs}ms</p>
                </div>
                <div>
                  <span className="text-[9px] text-[#7A8E9F]">Resilience:</span>
                  <p className="font-bold text-[#1C1917]">{simulationResult.capacityUtilizationPct}%</p>
                </div>
              </div>
            </div>

            {/* Multi-Agent Consensus Status */}
            <div className="pt-2 border-t border-[#F0EBE0]">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#69829A] mb-2 font-semibold">
                Consensus Matrix
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Network Analyst:</span>
                  <strong>ALIGNED</strong>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Risk Agent:</span>
                  <strong>ALIGNED</strong>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Logistics Agent:</span>
                  <strong>ALIGNED</strong>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Policy Agent:</span>
                  <strong>ALIGNED</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

