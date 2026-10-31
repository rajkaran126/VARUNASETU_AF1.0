'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { FaultNotificationTray } from './FaultNotificationTray';

export function Header() {
  const { 
    pendingNotificationsCount,
    isNotificationTrayOpen,
    setIsNotificationTrayOpen,
    incomingWhatIfAlert,
    dismissIncomingWhatIfAlert,
    approveFaultNotification,
    generateWhatIfBreakage,
    activeConfirmedNotification,
    dismissConfirmedNotification
  } = useWorkspace();

  const [formattedDateTime, setFormattedDateTime] = useState<string>('');
  const [justApproved, setJustApproved] = useState<string | null>(null);
  const router = useRouter();

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

  const handleApproveIncoming = (id: string, cableName: string) => {
    approveFaultNotification(id);
    setJustApproved(cableName);
    router.push('/workspace');
    setTimeout(() => {
      setJustApproved(null);
    }, 6000);
  };

  return (
    <>
      {/* 
        Workspace Top Bar with:
        1. Brand / Status
        2. Quick What-If Simulator Trigger
        3. Notification Icon (with pending count)
        4. Current Date & Time
        5. User Name & Profile / Avatar
      */}
      <header className="h-14 flex-shrink-0 bg-[#F7F3EA] border-b border-[#D4C4A8] px-4 sm:px-6 flex items-center justify-between gap-4 relative z-20 shadow-2xs">
        {/* Left: Brand / System Status Indicator */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group" title="Return to Home">
            <div className="w-7 h-7 rounded-lg bg-[#EAE2D5] border border-[#D4C4A8] flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
              <Image src="/icon.png" alt="VARUNASETU" width={22} height={22} className="object-contain" />
            </div>
            <span className="font-grotesk text-xs font-bold tracking-wider text-[#454640]">
              VARUNASETU
            </span>
          </Link>
          <span className="w-2 h-2 rounded-full bg-[#C87954] animate-pulse" />
          <span className="text-[#CBDDEB] text-xs hidden sm:inline">/</span>
          <span className="font-mono text-[11px] text-[#A69B89] tracking-wide hidden sm:inline">
            Submarine Cable Resilience Twin
          </span>
        </div>

        {/* Right: What-If Trigger, Notification Bell, Current Date/Time, User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick What-If Breakage Trigger Button */}
          <button
            onClick={() => generateWhatIfBreakage()}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#C87954] hover:bg-[#B36845] text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 border border-[#B36845]"
            title="Simulate subsea cable breakage and test automated alert & remediation workflow"
          >
            <span className="text-amber-200"></span>
            <span>Simulate Breakage</span>
          </button>

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
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8D9BF] border border-[#D4C4A8]">
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

      {/* 
        ========================================================================
        HIGH-PRIORITY INCOMING WHAT-IF BREAKAGE ALERT TOAST / BANNER
        Pops up immediately when a what-if scene is generated or fault detected
        ========================================================================
      */}
      {incomingWhatIfAlert && (
        <div className="relative z-30 bg-rose-950 text-white border-b-2 border-rose-500 shadow-2xl px-4 py-3 sm:px-6 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Alert Details */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600/30 border border-rose-400 flex items-center justify-center flex-shrink-0 text-rose-300 mt-0.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white tracking-wider uppercase">
                    CRITICAL SEVERANCE DETECTED
                  </span>
                  <span className="text-xs font-mono text-rose-300">
                    What-If Simulation · {incomingWhatIfAlert.sourceSensor}
                  </span>
                </div>
                <h4 className="font-grotesk text-sm sm:text-base font-bold text-white tracking-tight">
                  {incomingWhatIfAlert.cableName} — {incomingWhatIfAlert.faultType} at {incomingWhatIfAlert.nearestLandingStation}
                </h4>
                <div className="flex items-center gap-4 text-xs font-mono text-rose-200/90 pt-0.5">
                  <span>Depth: <strong>{incomingWhatIfAlert.depthMeters}m</strong></span>
                  <span>Optical Loss: <strong className="text-amber-300">{incomingWhatIfAlert.opticalLossDb} dB</strong></span>
                  <span>Impacted Flow: <strong className="text-rose-300">{incomingWhatIfAlert.affectedTrafficTbps} Tbps</strong></span>
                </div>
              </div>
            </div>

            {/* Operator Actions */}
            <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
              <button
                onClick={() => handleApproveIncoming(incomingWhatIfAlert.id, incomingWhatIfAlert.cableName)}
                className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-mono text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Approve & Execute Fix</span>
              </button>
              <button
                onClick={() => setIsNotificationTrayOpen(true)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors"
              >
                Details
              </button>
              <button
                onClick={dismissIncomingWhatIfAlert}
                className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors"
                title="Dismiss alert banner"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        APPROVAL SUCCESS BANNER (Post-Approval Active Fix Activated)
        ========================================================================
      */}
      {justApproved && (
        <div className="relative z-30 bg-emerald-950 text-white border-b-2 border-emerald-500 shadow-xl px-4 py-2.5 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-400 font-bold">FIX APPROVED & EXECUTED:</span>
              <span className="text-emerald-200">
                Autonomous optical bypass operational for <strong>{justApproved}</strong>. DP2 Repair Vessel & ROV Hector 6000 mobilized.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/workspace/operations"
                className="text-white underline hover:text-emerald-200 font-mono text-[11px]"
              >
                View Monitoring
              </Link>
              <span className="text-emerald-600">·</span>
              <Link
                href="/workspace/digital-twin"
                className="text-white underline hover:text-emerald-200 font-mono text-[11px]"
              >
                View Digital Twin
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
