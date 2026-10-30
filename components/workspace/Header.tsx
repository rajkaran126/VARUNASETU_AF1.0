'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { FaultNotificationTray } from './FaultNotificationTray';

export function Header() {
  const { 
    selectedCable, 
    activeFault, 
    simulationResult, 
    executeSimulation,
    pendingNotificationsCount,
    isNotificationTrayOpen,
    setIsNotificationTrayOpen
  } = useWorkspace();

  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 flex-shrink-0 bg-[#FAF7F1] border-b border-[#E2DBD0] px-6 flex items-center justify-between gap-4 relative z-10">
        {/* Left: Active Canonical Context */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          {/* Selected Cable Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#DDD3C3] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#1A5B8C]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#5A738A]">Target:</span>
            <span className="font-medium text-xs text-[#0E2A47] whitespace-nowrap">
              {selectedCable.name}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-semibold ${
                selectedCable.status === 'Operational'
                  ? 'bg-emerald-50 text-emerald-700'
                  : selectedCable.status === 'Degraded'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {selectedCable.status}
            </span>
          </div>

          {/* Active Incident Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3EDE2] border border-[#DDD3C3]">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#68533F]">Incident:</span>
            <span className="font-mono text-xs text-[#2A1D13] font-medium whitespace-nowrap">
              {activeFault.nearestLandingStation} ({activeFault.depthMeters}m)
            </span>
            <span className="font-mono text-[10px] text-rose-700 font-semibold bg-rose-100/70 px-1.5 py-0.2 rounded">
              {activeFault.faultType}
            </span>
          </div>

          {/* Data Provenance Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E9F0F6] border border-[#CBDDEB]">
            <span className="text-[10px] font-mono text-[#18486E] uppercase tracking-wider">Provenance:</span>
            <span className="text-[10px] font-mono font-bold text-[#0E3452] bg-white/80 px-1.5 py-0.5 rounded">
              {selectedCable.provenance}
            </span>
          </div>
        </div>

        {/* Right: Notification Center Trigger, Quick Controls, UTC Time & Profile */}
        <div className="flex items-center gap-3">
          {/* Fault Notification Center Bell Button */}
          <button
            onClick={() => setIsNotificationTrayOpen(!isNotificationTrayOpen)}
            className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
              pendingNotificationsCount > 0
                ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 shadow-xs'
                : 'bg-white border-[#D5CCBC] text-[#36506A] hover:bg-[#FAF7F2]'
            }`}
            title="Open Fault Notifications & Verification Center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {pendingNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs animate-bounce">
                {pendingNotificationsCount}
              </span>
            )}
          </button>

          {/* Quick Scenario Run Trigger */}
          <button
            onClick={() => executeSimulation()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E2A47] hover:bg-[#153B5B] text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            title="Re-run deterministic capacity and latency simulation"
          >
            <svg className="w-3.5 h-3.5 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span className="hidden sm:inline">Recalculate Blast</span>
          </button>

          {/* UTC Clock */}
          <div className="hidden xl:flex flex-col text-right">
            <span className="font-mono text-[10px] text-[#5A738A] leading-tight">CHRONOMETER</span>
            <span className="font-mono text-xs font-semibold text-[#0E2A47]">
              {utcTime || '2026-10-30 09:30 UTC'}
            </span>
          </div>

          {/* User Enclave Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#DDD3C3]">
            <div className="w-8 h-8 rounded-full bg-[#E5DFD4] border border-[#CFC5B4] flex items-center justify-center text-xs font-bold font-mono text-[#0E2A47]">
              OP1
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-bold text-[#0E2A47] leading-tight">NOC Command</p>
              <p className="font-mono text-[9px] text-[#637C94]">Subsea Ops Tier-3</p>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-over Fault Notification Drawer */}
      {isNotificationTrayOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsNotificationTrayOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />
          {/* Slide-over panel */}
          <div className="relative z-10 w-full max-w-xl h-full">
            <FaultNotificationTray
              isSlideOver={true}
              onClose={() => setIsNotificationTrayOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
