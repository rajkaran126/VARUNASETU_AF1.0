'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { detectAllSRLGGroups } from '@/lib/services/srlg.service';
import { executeScenario, FALSE_REDUNDANCY_SCENARIO_PRESETS, compareScenarios } from '@/lib/services/scenario-execution.service';
import { CorrelatedFailureResult } from '@/lib/types-phase4a';

// ─── Evidence Badge ────────────────────────────────────────────────────────
function EvidenceBadge({ label }: { label: string }) {
  const colours: Record<string, string> = {
    Observed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Derived: 'bg-[#E8D9BF] text-[#454640] border-[#D4C4A8]',
    Synthetic: 'bg-purple-50 text-purple-700 border-purple-200',
    Assumption: 'bg-amber-50 text-amber-700 border-amber-200',
    Unverified: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${colours[label] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {label.toUpperCase()}
    </span>
  );
}

// ─── Scenario Card ─────────────────────────────────────────────────────────
function ScenarioCard({
  preset,
  isActive,
  result,
  onRun,
  loading,
}: {
  preset: typeof FALSE_REDUNDANCY_SCENARIO_PRESETS[0];
  isActive: boolean;
  result?: CorrelatedFailureResult;
  onRun: () => void;
  loading: boolean;
}) {
  const typeLabel: Record<string, string> = {
    A_independent_paths: 'A',
    B_shared_corridor: 'B',
    C_shared_landing: 'C',
    D_shared_hazard: 'D',
    E_vessel_scarcity: 'E',
    F_weather_constraints: 'F',
    G_permit_constraints: 'G',
    H_priority_recovery: 'H',
    I_combined: 'I',
  };

  const scenarioLabel = typeLabel[preset.type] ?? '?';
  const isSynthetic = ['D_shared_hazard', 'F_weather_constraints', 'G_permit_constraints'].includes(preset.type);

  return (
    <div className={`rounded-2xl border transition-all ${isActive ? 'border-[#C87954] bg-[#FDF8F2] shadow-md' : 'border-[#E2DBD0] bg-white hover:border-[#C87954]/50 hover:shadow-sm'}`}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 ${isActive ? 'bg-[#C87954] text-white' : 'bg-[#E8D9BF] text-[#454640]'}`}>
              {scenarioLabel}
            </div>
            <div>
              <p className="font-sans font-bold text-xs text-[#0E2A47]">{preset.title}</p>
              {isSynthetic && (
                <span className="text-[9px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  ⚠ SYNTHETIC DATA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Brief */}
        <p className="text-[11px] text-[#59738A] leading-relaxed">{preset.brief}</p>

        {/* Config summary */}
        <div className="flex flex-wrap gap-1">
          {preset.config.affectedCableIds.map((id) => (
            <span key={id} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-mono">
              {id.toUpperCase()}
            </span>
          ))}
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${preset.config.repairConstraintsEnabled ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
            {preset.config.repairConstraintsEnabled ? 'Repair constraints' : 'No repair constraints'}
          </span>
          {preset.config.weatherConstraintsEnabled && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-mono">Weather</span>
          )}
          {preset.config.permitConstraintsEnabled && (
            <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[9px] font-mono">Permits</span>
          )}
        </div>

        {/* Result preview */}
        {result && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F0EBE0]">
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-[#0E2A47]">
                {result.allocationResult.totalServedTbps.toFixed(1)}
              </p>
              <p className="text-[9px] text-[#59738A] font-mono">Tbps Served</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-rose-700">
                {result.allocationResult.totalUnservedTbps.toFixed(1)}
              </p>
              <p className="text-[9px] text-[#59738A] font-mono">Tbps Unserved</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-sm font-bold text-[#0E2A47]">
                {result.networkRecoveryTimeHours}h
              </p>
              <p className="text-[9px] text-[#59738A] font-mono">Recovery Time</p>
            </div>
            <div className="text-center">
              <p className={`font-mono text-sm font-bold ${result.allocationResult.congestedEdges.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {result.allocationResult.congestedEdges.length > 0 ? 'Congested' : 'Clear'}
              </p>
              <p className="text-[9px] text-[#59738A] font-mono">Route Status</p>
            </div>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={loading}
          className={`w-full py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all ${
            loading
              ? 'bg-[#E8D9BF] text-[#A69B89] cursor-not-allowed'
              : isActive
              ? 'bg-[#C87954] text-white hover:bg-[#B56840]'
              : 'bg-[#F7F3EA] text-[#454640] border border-[#D4C4A8] hover:bg-[#E8D9BF]'
          }`}
        >
          {loading ? 'RUNNING...' : result ? 'RE-RUN SCENARIO' : 'RUN SCENARIO'}
        </button>
      </div>
    </div>
  );
}

// ─── Comparison Panel ──────────────────────────────────────────────────────
function ComparisonPanel({ results }: { results: Map<string, CorrelatedFailureResult> }) {
  const entries = Array.from(results.entries());
  if (entries.length < 2) {
    return (
      <div className="bg-[#FAF7F2] rounded-2xl border border-[#E2DBD0] p-8 text-center">
        <p className="text-xs text-[#59738A] font-mono">Run at least 2 scenarios to compare results</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2DBD0] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#F0EBE0] bg-[#FAF7F2] flex items-center justify-between">
        <div>
          <h3 className="font-sans font-bold text-sm text-[#0E2A47]">Strategy Comparison</h3>
          <p className="text-[10px] text-[#59738A] font-mono">Same seed ({entries[0][1].config.seed}) · Same dataset version · Identical starting conditions</p>
        </div>
        <EvidenceBadge label="Derived" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
              <th className="py-2.5 px-3 text-left">Scenario</th>
              <th className="py-2.5 px-3 text-right">Offered (Tbps)</th>
              <th className="py-2.5 px-3 text-right">Served (Tbps)</th>
              <th className="py-2.5 px-3 text-right">Unserved (Tbps)</th>
              <th className="py-2.5 px-3 text-right">Utilisation %</th>
              <th className="py-2.5 px-3 text-right">Recovery (h)</th>
              <th className="py-2.5 px-3 text-right">Congested Routes</th>
              <th className="py-2.5 px-3 text-center">Conservation ✓</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE0]">
            {entries.map(([type, result]) => {
              const preset = FALSE_REDUNDANCY_SCENARIO_PRESETS.find((p) => p.type === type);
              const conserved = result.allocationResult.conservationError <= 0.001;
              const utilPct = result.allocationResult.totalOfferedTbps > 0
                ? (result.allocationResult.totalServedTbps / result.allocationResult.totalOfferedTbps * 100).toFixed(1)
                : '0';
              return (
                <tr key={type} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-[#0E2A47]">{preset?.title ?? type}</p>
                    <p className="text-[10px] text-[#59738A]">{result.allocationResult.policy.policy}</p>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#0E2A47]">
                    {result.allocationResult.totalOfferedTbps.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                    {result.allocationResult.totalServedTbps.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-bold">
                    {result.allocationResult.totalUnservedTbps.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span className={`font-bold ${Number(utilPct) >= 80 ? 'text-emerald-700' : Number(utilPct) >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                      {utilPct}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#0E2A47]">
                    {result.networkRecoveryTimeHours}h
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span className={result.allocationResult.congestedEdges.length > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700'}>
                      {result.allocationResult.congestedEdges.length}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {conserved ? (
                      <span className="text-emerald-600">✓</span>
                    ) : (
                      <span className="text-rose-600" title={`Error: ${result.allocationResult.conservationError.toFixed(4)} Tbps`}>✗</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function FalseRedundancyLabPage() {
  const { cables } = useWorkspace();
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [results, setResults] = useState<Map<string, CorrelatedFailureResult>>(new Map());
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'comparison' | 'detail'>('scenarios');

  const srlgGroups = useMemo(() => detectAllSRLGGroups(cables), [cables]);

  const handleRunScenario = async (type: string, config: typeof FALSE_REDUNDANCY_SCENARIO_PRESETS[0]['config']) => {
    setRunningScenario(type);
    setActiveType(type);
    // Simulate async (engine is synchronous — yield to browser)
    await new Promise((r) => setTimeout(r, 300));
    const result = executeScenario(config, cables);
    setResults((prev) => new Map(prev).set(type, result));
    setRunningScenario(null);
    setActiveTab('detail');
  };

  const activeResult = activeType ? results.get(activeType) : null;
  const activePreset = FALSE_REDUNDANCY_SCENARIO_PRESETS.find((p) => p.type === activeType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-3 border-b border-[#D4C4A8]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 08 // RESILIENCE ENGINEERING LAB
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
              ENGINEERING CHALLENGE
            </span>
          </div>
          <h1 className="font-sans font-bold text-2xl lg:text-3xl text-[#0E2A47] tracking-tight mt-1">
            False Redundancy Lab
          </h1>
          <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 max-w-2xl">
            <p className="text-xs font-semibold text-amber-900 mb-1">Hurdle Brief</p>
            <p className="text-xs text-amber-800 leading-relaxed italic">
              &ldquo;Two cables that share a corridor or landing station are not real backups: one earthquake or dragged anchor cuts both. Repairs depend on ships, weather and permits, and rerouted traffic congests the surviving routes.&rdquo;
            </p>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 max-w-2xl">
            {[
              { hint: 'Hint 1', text: 'Two cables aren\'t really backups for each other if one event can cut both.' },
              { hint: 'Hint 2', text: 'Fixing a cable needs a ship, time and weather. None of those are unlimited.' },
              { hint: 'Hint 3', text: 'When traffic moves to surviving routes, not all of it is equally urgent.' },
            ].map((h) => (
              <div key={h.hint} className="p-2 bg-[#F7F3EA] rounded-lg border border-[#E2DBD0]">
                <p className="text-[9px] font-mono font-bold text-[#C87954] uppercase mb-0.5">{h.hint}</p>
                <p className="text-[10px] text-[#59738A] leading-snug">{h.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="px-4 py-3 bg-white rounded-xl border border-[#E2DBD0] shadow-xs text-right">
            <p className="font-mono text-[10px] text-[#59738A]">SRLG Groups Detected</p>
            <p className="font-mono text-xl font-bold text-[#C87954]">{srlgGroups.length}</p>
          </div>
          <div className="px-4 py-3 bg-white rounded-xl border border-[#E2DBD0] shadow-xs text-right">
            <p className="font-mono text-[10px] text-[#59738A]">Scenarios Available</p>
            <p className="font-mono text-xl font-bold text-[#0E2A47]">{FALSE_REDUNDANCY_SCENARIO_PRESETS.length}</p>
          </div>
          <div className="px-4 py-3 bg-white rounded-xl border border-[#E2DBD0] shadow-xs text-right">
            <p className="font-mono text-[10px] text-[#59738A]">Scenarios Executed</p>
            <p className="font-mono text-xl font-bold text-emerald-700">{results.size}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0EBE0] rounded-xl p-1 w-fit">
        {(['scenarios', 'comparison', 'detail'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-white text-[#C87954] shadow-xs'
                : 'text-[#69829A] hover:text-[#454640]'
            }`}
          >
            {tab === 'scenarios' ? 'Scenario Lab' : tab === 'comparison' ? `Compare (${results.size})` : 'Run Detail'}
          </button>
        ))}
      </div>

      {/* Scenarios Grid */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {FALSE_REDUNDANCY_SCENARIO_PRESETS.map((preset) => (
            <ScenarioCard
              key={preset.type}
              preset={preset}
              isActive={activeType === preset.type}
              result={results.get(preset.type)}
              onRun={() => handleRunScenario(preset.type, preset.config)}
              loading={runningScenario === preset.type}
            />
          ))}
        </div>
      )}

      {/* Comparison Table */}
      {activeTab === 'comparison' && (
        <ComparisonPanel results={results} />
      )}

      {/* Detail Panel */}
      {activeTab === 'detail' && (
        <div className="space-y-4">
          {activeResult && activePreset ? (
            <>
              {/* Run Metadata */}
              <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0] mb-4">
                  <div>
                    <h2 className="font-sans font-bold text-base text-[#0E2A47]">{activePreset.title}</h2>
                    <p className="text-[10px] text-[#59738A] font-mono">
                      Run ID: {activeResult.runId} · Seed: {activeResult.config.seed} · Engine: {activeResult.engineVersion}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <EvidenceBadge label="Derived" />
                    {activePreset.config.weatherConstraintsEnabled && <EvidenceBadge label="Synthetic" />}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Affected Cables', value: activeResult.affectedCables.length.toString(), sub: activeResult.affectedCables.join(', '), colour: 'text-rose-700' },
                    { label: 'Surviving Cables', value: activeResult.survivingCables.length.toString(), sub: `${activeResult.connectivity.remainingCapacityTbps.toFixed(1)} Tbps available`, colour: 'text-emerald-700' },
                    { label: 'Served Demand', value: `${activeResult.allocationResult.totalServedTbps.toFixed(1)} Tbps`, sub: `of ${activeResult.allocationResult.totalOfferedTbps.toFixed(1)} Tbps offered`, colour: 'text-[#0E2A47]' },
                    { label: 'Network Recovery', value: `${activeResult.networkRecoveryTimeHours}h`, sub: 'ASSUMED — repair duration', colour: 'text-amber-700' },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E1D5]">
                      <p className={`font-mono text-xl font-bold ${m.colour}`}>{m.value}</p>
                      <p className="text-[10px] font-semibold text-[#0E2A47] mt-0.5">{m.label}</p>
                      <p className="text-[9px] text-[#69829A] mt-0.5 truncate" title={m.sub}>{m.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic Classes */}
              <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5">
                <h3 className="font-sans font-bold text-sm text-[#0E2A47] mb-3 pb-2 border-b border-[#F0EBE0]">
                  Traffic Priority Allocation — Policy: <span className="text-[#C87954]">{activeResult.allocationResult.policy.policy}</span>
                </h3>
                <div className="space-y-2">
                  {activeResult.allocationResult.trafficClasses.map((cls) => {
                    const servedPct = cls.offeredDemandTbps > 0
                      ? (cls.servedDemandTbps ?? 0) / cls.offeredDemandTbps * 100
                      : 0;
                    return (
                      <div key={cls.id} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#E8D9BF] flex items-center justify-center text-[9px] font-mono font-bold text-[#454640] flex-shrink-0">
                          {cls.priority}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold text-[#0E2A47]">{cls.name}</span>
                            <span className="text-[10px] font-mono text-[#59738A]">
                              {(cls.servedDemandTbps ?? 0).toFixed(2)} / {cls.offeredDemandTbps.toFixed(2)} Tbps
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#E8E1D5] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${servedPct >= 90 ? 'bg-emerald-500' : servedPct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${servedPct}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-xs font-mono font-bold w-12 text-right ${servedPct >= 90 ? 'text-emerald-700' : servedPct >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>
                          {servedPct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className={`mt-3 p-2 rounded-lg text-[10px] font-mono ${activeResult.allocationResult.conservationError <= 0.001 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  Conservation check: served ({activeResult.allocationResult.totalServedTbps.toFixed(3)}) + unserved ({activeResult.allocationResult.totalUnservedTbps.toFixed(3)}) = offered ({activeResult.allocationResult.totalOfferedTbps.toFixed(3)}) ·
                  Error: {activeResult.allocationResult.conservationError.toFixed(6)} Tbps ·
                  {activeResult.allocationResult.conservationError <= 0.001 ? ' ✓ PASSES' : ' ✗ VIOLATION — check engine'}
                </div>
              </div>

              {/* Recovery Timeline */}
              <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5">
                <h3 className="font-sans font-bold text-sm text-[#0E2A47] mb-3 pb-2 border-b border-[#F0EBE0]">Recovery Milestones</h3>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-[#E2DBD0]" />
                  <div className="space-y-3">
                    {activeResult.recoveryMilestones.map((m, i) => (
                      <div key={i} className="pl-8 relative">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#C87954]" />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#0E2A47]">{m.phase}</p>
                            <p className="text-[10px] text-[#59738A] mt-0.5">{m.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                            <span className="text-xs font-mono font-bold text-emerald-700">{m.capacityRecoveredPct}%</span>
                            <EvidenceBadge label={m.evidenceClass === 'Assumption' ? 'Assumption' : 'Derived'} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Repair Schedule */}
              {activeResult.repairSchedule && (
                <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0] mb-4">
                    <h3 className="font-sans font-bold text-sm text-[#0E2A47]">Repair Schedule</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] font-mono text-[#59738A]">
                        All durations: ASSUMED · Sources: {activeResult.repairSchedule.assumptionSources.join(' | ')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {activeResult.repairSchedule.assignments.map((a) => (
                      <div key={a.faultId} className={`p-3 rounded-xl border ${a.feasible ? 'border-[#E2DBD0] bg-[#FAF7F2]' : 'border-rose-200 bg-rose-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs font-bold text-[#0E2A47]">{a.vesselName}</p>
                            <p className="text-[10px] text-[#59738A] font-mono">Fault: {a.faultId}</p>
                          </div>
                          {!a.feasible && (
                            <span className="text-[9px] font-mono bg-rose-100 text-rose-700 border border-rose-300 px-1.5 py-0.5 rounded">
                              CONFLICT
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { v: `${a.dispatchHours}h`, l: 'Dispatch' },
                            { v: `${a.onStationHours}h`, l: 'On Station' },
                            { v: `${a.weatherDelayHours}h`, l: 'Weather Delay' },
                            { v: `${a.repairCompleteHours}h`, l: 'Complete' },
                          ].map((s) => (
                            <div key={s.l}>
                              <p className="font-mono text-sm font-bold text-[#0E2A47]">{s.v}</p>
                              <p className="text-[9px] text-[#59738A]">{s.l}</p>
                            </div>
                          ))}
                        </div>
                        {a.infeasibilityReason && (
                          <p className="mt-2 text-[10px] text-rose-700 font-mono">{a.infeasibilityReason}</p>
                        )}
                      </div>
                    ))}
                    {activeResult.repairSchedule.resourceConflicts.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-xs font-bold text-amber-800 mb-1">Resource Conflicts Detected</p>
                        {activeResult.repairSchedule.resourceConflicts.map((c) => (
                          <p key={c.vesselId} className="text-[10px] text-amber-700 font-mono">
                            Vessel {c.vesselId} assigned to {c.conflictingFaultIds.length} faults.
                            Resolution: {c.resolution}. Priority: {c.prioritisedFaultId}.
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weather Windows (synthetic) */}
              {activeResult.weatherWindows && activeResult.weatherWindows.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0] mb-4">
                    <h3 className="font-sans font-bold text-sm text-[#0E2A47]">Weather Windows</h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      ⚠ SYNTHETIC WEATHER — Not for operational use
                    </span>
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-2">
                    {activeResult.weatherWindows.slice(0, 14).map((w, i) => (
                      <div
                        key={i}
                        className={`flex-shrink-0 w-16 rounded-lg p-2 text-center border ${
                          w.operationally_feasible
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-rose-50 border-rose-200'
                        }`}
                      >
                        <div className={`text-xs font-mono font-bold ${w.operationally_feasible ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {w.operationally_feasible ? '✓' : '✗'}
                        </div>
                        <p className="text-[9px] font-mono text-[#59738A] mt-0.5">{w.startHour}h</p>
                        <p className="text-[9px] text-[#69829A]">{w.averageWaveHeightM.toFixed(1)}m</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E2DBD0] p-12 text-center">
              <p className="text-xs text-[#59738A] font-mono">Run a scenario from the Scenario Lab tab to see detailed results here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
