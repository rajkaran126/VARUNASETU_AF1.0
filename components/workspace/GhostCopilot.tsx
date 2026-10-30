'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';

export interface GhostCopilotProps {
  initialOpen?: boolean;
}

export function GhostCopilot({ initialOpen = false }: GhostCopilotProps) {
  const {
    selectedCable,
    activeFault,
    simulationResult,
    isRerouteActive,
    activeReroutePlan,
    executeSimulation,
    approveFaultNotification,
    incomingWhatIfAlert,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<
    {
      id: string;
      role: 'user' | 'copilot';
      content: string;
      citations?: string[];
      action?: {
        label: string;
        actionType: 'approve_fix' | 'run_simulation' | 'toggle_reroute';
        status?: 'pending' | 'executed';
      };
      timestamp: string;
    }[]
  >([
    {
      id: 'copilot-init',
      role: 'copilot',
      content: `👋 **Ghost Copilot Online.** I am synchronized with the active digital twin.\n\nCurrently monitoring **${selectedCable.name}** at fault location **${activeFault.nearestLandingStation}** (Depth: ${activeFault.depthMeters}m).\n\nAsk me about corridor vulnerability, false redundancy, reroute capacity, or repair vessel logistics.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user' as const,
      content: userText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `[Context: Active cable ${selectedCable.name}, Fault at ${activeFault.nearestLandingStation} (-${activeFault.depthMeters}m), Reroute bypass ${isRerouteActive ? 'ACTIVE' : 'INACTIVE'}]: ${userText}`,
          activeSimulation: simulationResult,
        }),
      });

      if (!res.ok) throw new Error('Inference error');
      const data = await res.json();

      let replyContent = data.report?.consensusAssessment?.summary || 'Analysis complete based on active digital twin context.';
      const citations = data.report?.consensusAssessment?.keyFindings || [];

      // Check for action intent
      let action: { label: string; actionType: 'approve_fix' | 'run_simulation' | 'toggle_reroute'; status?: 'pending' } | undefined = undefined;
      const lower = userText.toLowerCase();

      if (lower.includes('approve') || lower.includes('fix') || lower.includes('remediate')) {
        action = {
          label: '⚡ Confirm & Execute Remediation Fix',
          actionType: 'approve_fix',
          status: 'pending',
        };
      } else if (lower.includes('simulate') || lower.includes('run model') || lower.includes('re-run')) {
        action = {
          label: '▶ Execute Deterministic Network Simulation',
          actionType: 'run_simulation',
          status: 'pending',
        };
      }

      setMessages(prev => [
        ...prev,
        {
          id: `copilot-${Date.now()}`,
          role: 'copilot',
          content: replyContent,
          citations,
          action,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch {
      // Offline fallback
      setMessages(prev => [
        ...prev,
        {
          id: `copilot-${Date.now()}`,
          role: 'copilot',
          content: `Digital Twin Context for **${selectedCable.name}**:\n- Active corridor: ${activeFault.nearestLandingStation}\n- Baseline latency: ${simulationResult.baselineLatencyMs}ms\n- Post-failure latency: ${simulationResult.impactedLatencyMs}ms (+${simulationResult.latencyDeltaMs}ms)\n- Capacity served: ${simulationResult.servedDemandTbps} / ${simulationResult.totalOfferedDemandTbps} Tbps\n- Reroute status: ${isRerouteActive ? 'Operational bypass active' : 'Direct path compromised'}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (msgId: string, actionType: string) => {
    if (actionType === 'approve_fix') {
      if (incomingWhatIfAlert) {
        approveFaultNotification(incomingWhatIfAlert.id);
      } else {
        approveFaultNotification('notif-1');
      }
    } else if (actionType === 'run_simulation') {
      executeSimulation();
    }

    setMessages(prev =>
      prev.map(m =>
        m.id === msgId && m.action
          ? { ...m, action: { ...m.action, status: 'executed' } }
          : m
      )
    );
  };

  return (
    <>
      {/* Floating Trigger Button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 px-3.5 py-2.5 rounded-2xl bg-[#0E2A47] hover:bg-[#153B5B] text-white shadow-xl flex items-center gap-2 font-grotesk text-xs font-bold transition-all active:scale-95 border border-[#DDD3C3]"
          title="Open Ghost Copilot AI"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ghost Copilot</span>
          <span className="font-mono text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white">AI</span>
        </button>
      )}

      {/* Slide-out / Floating Copilot Panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[560px] bg-white rounded-2xl border-2 border-[#C87954]/40 shadow-2xl flex flex-col overflow-hidden text-[#454640] animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="p-3 px-4 bg-[#F7F3EA] border-b border-[#D4C4A8] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0E2A47] flex items-center justify-center text-white text-xs font-mono font-bold">
                GC
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-grotesk font-bold text-xs text-[#0E2A47]">
                    Ghost Copilot
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    TWIN-AWARE
                  </span>
                </div>
                <p className="font-mono text-[9px] text-[#A69B89] truncate max-w-[220px]">
                  {selectedCable.name} · {activeFault.nearestLandingStation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#A69B89] hover:bg-[#EDF3F7] hover:text-[#454640] transition-colors"
                title="Minimize Copilot"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FAF7F2]/60 text-xs font-body">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-xl shadow-2xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0E2A47] text-white rounded-br-none'
                      : 'bg-white border border-[#E8E1D5] text-[#36506A] rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Findings / Citations Accordion */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#F0EBE0] space-y-1">
                      <p className="font-mono text-[9px] uppercase font-bold text-[#69829A]">
                        Verified Evidence Findings:
                      </p>
                      {msg.citations.slice(0, 3).map((c, i) => (
                        <p key={i} className="font-mono text-[10px] text-[#4A647D] leading-snug">
                          • {c}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* State-Changing Action Gate (Requires Operator Confirmation) */}
                  {msg.action && (
                    <div className="mt-2.5 pt-2 border-t border-[#F0EBE0]">
                      {msg.action.status === 'executed' ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                          ✅ Action Executed Successfully
                        </span>
                      ) : (
                        <button
                          onClick={() => handleExecuteAction(msg.id, msg.action!.actionType)}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-[#C87954] hover:bg-[#B36845] text-white font-mono text-[10px] font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <span>{msg.action.label}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span className="font-mono text-[9px] text-[#A69B89] mt-0.5 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E8E1D5] text-xs text-[#59738A] w-fit">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C87954] animate-ping" />
                <span className="font-mono text-[10px]">Ghost Copilot synthesizing digital twin telemetry…</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 px-3 bg-[#F7F3EA] border-t border-[#E8E1D5] flex gap-1.5 overflow-x-auto">
            {[
              'Are SMW4 and SMW5 genuinely redundant?',
              'Show nearest repair ship',
              'Explain current reroute bypass',
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt);
                }}
                className="whitespace-nowrap px-2 py-1 rounded-lg bg-white border border-[#DDD3C3] hover:border-[#C87954] text-[10px] font-mono text-[#59738A] hover:text-[#0E2A47] transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-[#E8E1D5] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Ghost Copilot about active digital twin..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#DDD3C3] text-xs text-[#0E2A47] placeholder-[#A69B89] focus:outline-none focus:border-[#C87954]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-xl bg-[#0E2A47] hover:bg-[#153B5B] text-white disabled:opacity-40 transition-colors"
              title="Send"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

