'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { FaultNotificationTray } from './FaultNotificationTray';

export function Header() {
  const { 
    pendingNotificationsCount,
    isNotificationTrayOpen,
    setIsNotificationTrayOpen
  } = useWorkspace();

  const [formattedDateTime, setFormattedDateTime] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // Formats as: "Fri, 30 Oct 2026 · 09:30:15 UTC"
      const datePart = now.toUTCString().slice(0, 16);
      const timePart = now.toTimeString().slice(0, 8);
      setFormattedDateTime(`${datePart} · ${timePart} UTC`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* 
        Strictly Minimal Workspace Top Bar:
        Contains ONLY:
        1. Notification Icon (with pending count)
        2. Current Date & Time
        3. User Name & Profile / Avatar
      */}
      <header className="h-14 flex-shrink-0 bg-[#F7F3EA] border-b border-[#D4C4A8] px-6 flex items-center justify-between gap-4 relative z-10 shadow-2xs">
        {/* Left: Brand / System Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C87954] animate-pulse" />
            <span className="font-grotesk text-xs font-bold tracking-wider text-[#454640]">
              VARUNASETU
            </span>
            <span className="text-[#CBDDEB] text-xs">/</span>
            <span className="font-mono text-[11px] text-[#A69B89] tracking-wide">
              Submarine Cable Resilience Twin
            </span>
          </div>
        </div>

        {/* Right: Notification Bell, Current Date/Time, User Profile */}
        <div className="flex items-center gap-4">
          {/* 1. Notification Icon Button & Anchored Pop-up Box */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationTrayOpen(!isNotificationTrayOpen)}
              className={`relative p-2 rounded-xl transition-all flex items-center justify-center border ${
                pendingNotificationsCount > 0
                  ? 'bg-[#FCEFE7] border-[#C87954]/40 text-[#C87954] hover:bg-[#c9f3f6]'
                  : 'bg-[#EDF3F7] border-[#CBDDEB] text-[#A69B89] hover:text-[#454640] hover:bg-[#E2EBF2]'
              }`}
              title="Fault Notifications & Alert Center"
              aria-label="Notifications"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {pendingNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#C87954] text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {pendingNotificationsCount}
                </span>
              )}
            </button>

            {/* Small - Medium Notification Pop-up Box */}
            {isNotificationTrayOpen && (
              <>
                {/* Subtle backdrop to close pop-up when clicking outside */}
                <div
                  onClick={() => setIsNotificationTrayOpen(false)}
                  className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px]"
                />
                
                {/* Small - Medium Pop-up Box */}
                <div className="absolute right-0 top-full mt-2.5 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)]">
                  <FaultNotificationTray onClose={() => setIsNotificationTrayOpen(false)} />
                </div>
              </>
            )}
          </div>

          {/* 2. Current Date and Time */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8D9BF] border border-[#D4C4A8]">
            <svg className="w-3.5 h-3.5 text-[#A69B89]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-mono text-xs font-medium text-[#454640]">
              {formattedDateTime || '30 Oct 2026 · UTC'}
            </span>
          </div>

          {/* 3. User Name & Profile Avatar */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#D4C4A8]">
            <div className="w-8 h-8 rounded-xl bg-[#E8D9BF] border border-[#D4C4A8] flex items-center justify-center text-xs font-bold font-mono text-[#454640] shadow-xs">
              VS
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-[#454640] leading-tight font-body">NOC Commander</p>
              <p className="font-mono text-[10px] text-[#A69B89]">Operations Lead</p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
