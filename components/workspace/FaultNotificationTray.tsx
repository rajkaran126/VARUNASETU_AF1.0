'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';

interface FaultNotificationTrayProps {
  onClose?: () => void;
}

export function FaultNotificationTray({ onClose }: FaultNotificationTrayProps) {
  const { 
    notifications, 
    pendingNotificationsCount, 
    approveFaultNotification, 
    declineFaultNotification,
    activeConfirmedNotification,
    dismissConfirmedNotification
  } = useWorkspace();

  const [filter, setFilter] = useState<'Pending' | 'Approved' | 'Declined' | 'All'>('Pending');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    return n.status === filter;
  });

  return (
    <div className="bg-white rounded-2xl border border-[#D4C4A8] shadow-2xl flex flex-col overflow-hidden text-[#454640]">
      {/* Popover Header */}
      <div className="p-3.5 px-4 bg-[#F7F3EA] border-b border-[#D4C4A8] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FCEFE7] border border-[#C87954]/30 flex items-center justify-center text-[#C87954]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-bold text-sm font-bold text-[#454640]">
                Fault Verification
              </h3>
              {pendingNotificationsCount > 0 ? (
                <span className="font-mono text-[9px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                  {pendingNotificationsCount} PENDING
                </span>
              ) : (
                <span className="font-mono text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ALL CLEAR
                </span>
              )}
            </div>
            <p className="font-mono text-[10px] text-[#A69B89]">
              Review detected anomalies for operational triage
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A69B89] hover:bg-[#EDF3F7] hover:text-[#454640] transition-colors"
            title="Close"
            aria-label="Close notification box"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-[#D4C4A8]">
        {(['Pending', 'Approved', 'Declined', 'All'] as const).map((tab) => {
          const count = tab === 'All' 
            ? notifications.length 
            : notifications.filter(n => n.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-[#83B9A9] text-[#454640] font-bold shadow-2xs'
                  : 'bg-[#EDF3F7] text-[#A69B89] hover:bg-[#E2EBF2] hover:text-[#454640]'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded ${filter === tab ? 'bg-white/20 text-white' : 'bg-white text-[#A69B89]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Confirmed Notice Banner */}
      {activeConfirmedNotification && (
        <div className="m-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <strong className="font-sans font-bold text-xs text-emerald-900">
                Active Fault: {activeConfirmedNotification.cableName}
              </strong>
            </div>
            <button
              onClick={dismissConfirmedNotification}
              className="text-emerald-700 hover:text-emerald-950 p-0.5 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="font-body text-emerald-800 text-[11px] leading-relaxed">
            Registered as <strong>active canonical fault</strong>. Blast radius calculated.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Link
              href="/workspace/digital-twin"
              onClick={() => onClose && onClose()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[10px] font-bold transition-all"
            >
              <span>Digital Twin</span>
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              href="/workspace/operations"
              onClick={() => onClose && onClose()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold transition-all"
            >
              <span>Operations</span>
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              href="/workspace/war-room"
              onClick={() => onClose && onClose()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold transition-all"
            >
              <span>War Room</span>
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Scrollable Notification List */}
      <div className="p-3 space-y-2.5 overflow-y-auto max-h-[380px]">
        {filteredNotifications.length === 0 ? (
          <div className="py-8 px-4 text-center text-xs text-[#A69B89] font-mono bg-[#F7F3EA] rounded-xl border border-[#D4C4A8]">
            <svg className="w-6 h-6 text-emerald-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <p className="font-semibold text-[#454640]">All Systems Nominal</p>
            <p className="text-[10px] mt-0.5">No unverified faults in {filter.toLowerCase()} queue.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isPending = notif.status === 'Pending';
            const isApproved = notif.status === 'Approved';
            const isDeclined = notif.status === 'Declined';

            return (
              <div
                key={notif.id}
                className={`p-3 rounded-xl border transition-all ${
                  isApproved
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : isDeclined
                    ? 'bg-[#FAFBF9] border-[#E2DBD0] opacity-75'
                    : 'bg-white border-[#D4C4A8] shadow-2xs'
                }`}
              >
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#454640]">
                        {notif.cableName}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                          notif.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : notif.severity === 'Major'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-[#E8D9BF] text-[#687B59] border border-sky-200'
                        }`}
                      >
                        {notif.severity}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-[#A69B89]">
                      {notif.nearestLandingStation} · {notif.lat.toFixed(2)}°N, {notif.lon.toFixed(2)}°E (-{notif.depthMeters}m)
                    </span>
                  </div>

                  <span className="font-mono text-[9px] text-[#91A1AF] whitespace-nowrap">
                    {new Date(notif.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-[#A69B89] font-body leading-relaxed mb-2">
                  {notif.description}
                </p>

                {/* Metrics Pill Strip */}
                <div className="flex items-center gap-3 py-1.5 px-2 bg-[#F7F3EA] rounded-lg border border-[#D4C4A8] font-mono text-[9px] mb-2">
                  <span>Loss: <strong className="text-rose-700">{notif.opticalLossDb} dB</strong></span>
                  <span>·</span>
                  <span>Impact: <strong className="text-amber-700">{notif.affectedTrafficTbps} Tbps</strong></span>
                  <span>·</span>
                  <span className="truncate">Type: <strong>{notif.faultType}</strong></span>
                </div>

                {/* Asking for Approval Buttons */}
                {isPending && (
                  <div className="pt-2 border-t border-[#D4C4A8] flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] text-[#A69B89]">
                      Action required:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => declineFaultNotification(notif.id)}
                        className="btn-secondary py-1 px-2.5 text-[10px] font-mono"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => approveFaultNotification(notif.id)}
                        className="btn-primary py-1 px-3 text-[10px] font-mono"
                      >
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Approve Fault</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Approved State */}
                {isApproved && (
                  <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                      <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Approved Canonical Fault</span>
                    </span>
                    <Link
                      href="/workspace/digital-twin"
                      onClick={() => onClose && onClose()}
                      className="font-mono text-[10px] text-emerald-800 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Proceed</span>
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                )}

                {/* Declined State */}
                {isDeclined && (
                  <div className="pt-2 border-t border-[#D4C4A8] flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-[#91A1AF] flex items-center gap-1">
                      <svg className="w-3 h-3 text-[#91A1AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Declined (Sensor Noise)</span>
                    </span>
                    <button
                      onClick={() => approveFaultNotification(notif.id)}
                      className="font-mono text-[10px] text-[#C87954] hover:underline"
                    >
                      Re-evaluate
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-[#F7F3EA] border-t border-[#D4C4A8] flex items-center justify-between font-mono text-[9px] text-[#91A1AF]">
        <span>Sensors: Ingesting OTDR & Benthic telemetry</span>
        <span>VARUNASETU Enclave</span>
      </div>
    </div>
  );
}
