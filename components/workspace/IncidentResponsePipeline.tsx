'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';

export function IncidentResponsePipeline() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    activeFault, 
    selectedCable, 
    demoStep, 
    setDemoStep, 
    generateWhatIfBreakage,
    isRerouteActive
  } = useWorkspace();

  const steps = [
    {
      step: 1,
      name: 'Section 01 // Model 1 Red Dot',
      subtitle: 'Earth Globe Fault Pin',
      href: '/workspace',
      icon: '📍',
    },
    {
      step: 2,
      name: 'Section 02 // 3D Underwater Sim',
      subtitle: 'Daylight Seabed & ROV Splice',
      href: '/workspace/digital-twin',
      icon: '🌊',
    },
    {
      step: 3,
      name: 'Section 03 // Network Operations',
      subtitle: 'OTDR Loss & Optical Bypass',
      href: '/workspace/operations',
      icon: '⚡',
    },
    {
      step: 4,
      name: 'Section 04 // Recovery War Room',
      subtitle: 'CS Sovereign Fleet Dispatch',
      href: '/workspace/war-room',
      icon: '🚢',
    },
    {
      step: 5,
      name: 'Section 05 // False Redundancy',
      subtitle: 'SRLG Terrestrial Ducts',
      href: '/workspace/false-redundancy',
      icon: '🛡️',
    },
    {
      step: 6,
      name: 'Section 06 // Multi-Agent AI',
      subtitle: 'Consensus & Copilot',
      href: '/workspace/mission-control',
      icon: '🤖',
    },
  ];

  // Determine current step index from pathname
  const currentStepIndex = steps.findIndex(s => s.href === pathname);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const currentStep = steps[activeIndex];
  const nextStep = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;
  const prevStep = activeIndex > 0 ? steps[activeIndex - 1] : null;

  const handleNext = () => {
    if (nextStep) {
      setDemoStep(nextStep.step);
      router.push(nextStep.href);
    }
  };

  const handlePrev = () => {
    if (prevStep) {
      setDemoStep(prevStep.step);
      router.push(prevStep.href);
    }
  };

  const handleTriggerNewScene = () => {
    generateWhatIfBreakage();
  };

  return (
    <div className="bg-[#1C1917] text-white rounded-2xl border-2 border-[#E06D3B] shadow-2xl p-4 lg:p-5 mb-6 animate-in slide-in-from-top-2 duration-300">
      {/* Top Header: Scenario Title & Fast Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500 flex items-center justify-center flex-shrink-0 text-rose-300">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white tracking-widest uppercase">
                INCIDENT RESPONSE & REMEDIATION PIPELINE · ACTIVE
              </span>
              <span className="font-mono text-xs text-rose-300">
                Phase {activeIndex + 1} of {steps.length}
              </span>
              {isRerouteActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-700/80 text-emerald-100">
                  ⚡ Autonomous Optical Bypass Active
                </span>
              )}
            </div>
            <h2 className="font-sans font-bold text-base sm:text-lg text-white tracking-tight mt-0.5">
              🔴 Incident: {activeFault?.cableName || selectedCable.name} — {activeFault?.nearestLandingStation || 'Zafarana / Suez Corridor'}
            </h2>
          </div>
        </div>

        {/* Quick Stepper Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {prevStep && (
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold transition-all flex items-center gap-1 active:scale-95"
            >
              <span>◀</span>
              <span className="hidden sm:inline">Back: {prevStep.name.split('//')[0]}</span>
            </button>
          )}

          {nextStep ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shadow-lg shadow-rose-900/50 transition-all flex items-center gap-2 active:scale-95 animate-pulse"
            >
              <span>Proceed to {nextStep.name}</span>
              <span>➔</span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/workspace')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <span>Return to Section 01 (Model 1)</span>
              <span>🔄</span>
            </button>
          )}

          <button
            onClick={handleTriggerNewScene}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 font-mono text-xs transition-colors"
            title="Generate What-If Breakage Scene"
          >
            ⚡ What-If Scene
          </button>
        </div>
      </div>

      {/* Interactive Step-by-Step Progress Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3">
        {steps.map((st, idx) => {
          const isCurrent = idx === activeIndex;
          const isCompleted = idx < activeIndex;

          return (
            <Link
              key={st.step}
              href={st.href}
              onClick={() => setDemoStep(st.step)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isCurrent
                  ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/40'
                  : isCompleted
                  ? 'bg-emerald-950/40 border-emerald-500/50 hover:bg-emerald-900/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{st.icon}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isCurrent
                    ? 'bg-rose-500 text-white'
                    : isCompleted
                    ? 'bg-emerald-500/80 text-white'
                    : 'bg-white/10 text-white/60'
                }`}>
                  {isCurrent ? 'ACTIVE' : isCompleted ? 'CONFIRMED ✓' : `PHASE ${st.step}`}
                </span>
              </div>
              <p className={`font-mono text-xs font-bold truncate ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-200' : 'text-white/80'}`}>
                {st.name.split('//')[0]}
              </p>
              <p className="font-sans text-[10px] text-white/60 truncate mt-0.5">
                {st.subtitle}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

