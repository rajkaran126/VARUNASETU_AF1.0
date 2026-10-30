'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { FaultNotification } from '@/lib/types';

interface FaultNotificationTrayProps {
  isSlideOver?: boolean;
  onClose?: () => void;
}

export function FaultNotificationTray({ isSlideOver = false, onClose }: FaultNotificationTrayProps) {
  const { 
    notifications, 
    pendingNotificationsCount, 
    approveFaultNotification, 
    declineFaultNotification,
    activeConfirmedNotification,
    dismissConfirmedNotification
  } = useWorkspace();

  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Declined'>('Pending');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    return n.status === filter;
  });

  return (
    <div
      className={`${
        isSlideOver
          ? 'fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-[#E2DBD0] flex flex-col'
          : 'bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs space-y-4'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b border-[#F0EBE0] ${isSlideOver ? 'p-5' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <h2 className="font-grotesk text-base font-bold text-[#0E2A47]">
              Fault Alerts & Telemetry Notifications
            </h2>
            <p className="font-mono text-[10px] text-[#59738A]">
              Sensor-detected benthic ruptures requiring operator verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingNotificationsCount > 0 && (
            <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full animate-pulse">
              {pendingNotificationsCount} PENDING
            </span>
          )}

          {isSlideOver && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#69829A] hover:bg-[#F0EBE0] hover:text-[#0E2A47] transition-colors"
              title="Close notification tray"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`flex items-center gap-1.5 ${isSlideOver ? 'px-5 py-2 border-b border-[#F0EBE0] bg-[#FAF7F2]' : 'pt-1'}`}>
        {(['Pending', 'Approved', 'Declined', 'All'] as const).map((tab) => {
          const count = tab === 'All' 
            ? notifications.length 
            : notifications.filter(n => n.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-[#0E2A47] text-white font-bold shadow-xs'
                  : 'bg-[#F2ECE1] text-[#4A647D] hover:bg-[#EAE2D4]'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded ${filter === tab ? 'bg-white/20 text-white' : 'bg-white/80 text-[#59738A]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Confirmed Notice Banner */}
      {activeConfirmedNotification && (
        <div className={`p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-2.5 ${isSlideOver ? 'mx-5' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <strong className="font-grotesk text-sm text-emerald-900">
                Fault Confirmed: {activeConfirmedNotification.cableName}
              </strong>
            </div>
            <button
              onClick={dismissConfirmedNotification}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-md hover:bg-emerald-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="font-body text-emerald-800 text-[11px] leading-relaxed">
            This incident has been verified and registered as the <strong>active canonical fault</strong>. Network graph simulation has recalculated blast radius and unserved capacity. Choose where to proceed:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href="/workspace/digital-twin"
              onClick={() => onClose && onClose()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[11px] font-bold shadow-xs transition-all"
            >
              <span>Underwater Digital Twin</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              href="/workspace/operations"
              onClick={() => onClose && onClose()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold shadow-xs transition-all"
            >
              <span>Operations & Simulation</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              href="/workspace/war-room"
              onClick={() => onClose && onClose()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold shadow-xs transition-all"
            >
              <span>Recovery War Room</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Notification List Stream */}
      <div className={`space-y-3 overflow-y-auto ${isSlideOver ? 'flex-1 p-5' : 'max-h-[500px]'}`}>
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#69829A] font-mono bg-[#FAF7F2] rounded-xl border border-[#E8E1D5]">
            No {filter.toLowerCase()} fault notifications in queue.
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isPending = notif.status === 'Pending';
            const isApproved = notif.status === 'Approved';
            const isDeclined = notif.status === 'Declined';

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all ${
                  isApproved
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : isDeclined
                    ? 'bg-[#F9F7F5] border-[#E8E1D5] opacity-75'
                    : 'bg-white border-[#E2DBD0] hover:border-[#CFC5B6] shadow-xs'
                }`}
              >
                {/* Notification Top Metadata */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#59738A] uppercase tracking-wider font-semibold">
                      {notif.cableName} ({notif.cableId.toUpperCase()})
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                        notif.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : notif.severity === 'Major'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-sky-100 text-sky-800 border border-sky-300'
                      }`}
                    >
                      {notif.severity}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-[#7A8E9F]">
                    {new Date(notif.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                  </span>
                </div>

                {/* Anomaly Title */}
                <h3 className="font-grotesk text-sm font-bold text-[#0E2A47] leading-snug">
                  {notif.title}
                </h3>

                {/* Telemetry Description */}
                <p className="text-xs text-[#3E576F] font-body leading-relaxed mt-1.5">
                  {notif.description}
                </p>

                {/* Technical Parameter Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8E1D5] font-mono text-[10px]">
                  <div>
                    <span className="text-[#69829A] block">Coordinates:</span>
                    <strong className="text-[#0E2A47]">{notif.lat.toFixed(2)}°N, {notif.lon.toFixed(2)}°E</strong>
                  </div>
                  <div>
                    <span className="text-[#69829A] block">Benthic Depth:</span>
                    <strong className="text-[#0E2A47]">-{notif.depthMeters}m</strong>
                  </div>
                  <div>
                    <span className="text-[#69829A] block">Optical Loss:</span>
                    <strong className="text-rose-700">{notif.opticalLossDb} dB</strong>
                  </div>
                  <div>
                    <span className="text-[#69829A] block">Impacted Flow:</span>
                    <strong className="text-amber-700">{notif.affectedTrafficTbps} Tbps</strong>
                  </div>
                </div>

                {/* Sensor Source Stamp */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#7A8E9F] mt-2.5 pt-2 border-t border-[#F0EBE0]">
                  <span>Source: {notif.sourceSensor}</span>
                  <span>Terminal: {notif.nearestLandingStation}</span>
                </div>

                {/* Interactive Decision Actions */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2.5 mt-3 pt-3 border-t border-[#F0EBE0]">
                    <button
                      onClick={() => declineFaultNotification(notif.id)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#D5CCBC] bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-[#4A647D] text-xs font-semibold font-mono transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Decline (False Alarm)</span>
                    </button>

                    <button
                      onClick={() => approveFaultNotification(notif.id)}
                      className="px-4 py-1.5 rounded-lg bg-[#0E2A47] hover:bg-[#153B5B] text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Approve Fault & Proceed</span>
                    </button>
                  </div>
                )}

                {/* Status Banners for Handled Notifications */}
                {isApproved && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Confirmed as Active Canonical Fault</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/workspace/digital-twin"
                        onClick={() => onClose && onClose()}
                        className="font-mono text-[11px] text-emerald-800 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Proceed to Digital Twin</span>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}

                {isDeclined && (
                  <div className="mt-3 pt-2 border-t border-[#E8E1D5] flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-[#7A8E9F] flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-[#91A1AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Alert Dismissed as Sensor Calibration Noise</span>
                    </span>
                    <button
                      onClick={() => approveFaultNotification(notif.id)}
                      className="font-mono text-[10px] text-[#1677B8] hover:underline"
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
    </div>
  );
}

