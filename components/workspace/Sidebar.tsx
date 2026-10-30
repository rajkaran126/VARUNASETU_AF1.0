'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  id: string;
  name: string;
  path: string;
  badge?: string;
  icon: (active: boolean) => React.ReactNode;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      name: 'Network Overview',
      path: '/workspace',
      badge: '426 Cables',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-[#0E3A60]' : 'text-[#4A647D]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8" />
          <path d="M3.6 15h16.8" />
          <path d="M12 3a14 14 0 0 0 0 18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
        </svg>
      )
    },
    {
      id: 'digital-twin',
      name: 'Underwater Digital Twin',
      path: '/workspace/digital-twin',
      badge: 'Benthic',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-[#0E3A60]' : 'text-[#4A647D]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2 17c3-3 6-3 9 0s6 3 9 0" />
          <path d="M2 12c3-3 6-3 9 0s6 3 9 0" />
          <path d="M12 3v6" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      )
    },
    {
      id: 'operations',
      name: 'Network Operations & Simulation',
      path: '/workspace/operations',
      badge: 'SimKernel',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-[#0E3A60]' : 'text-[#4A647D]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    },
    {
      id: 'war-room',
      name: 'Recovery War Room',
      path: '/workspace/war-room',
      badge: '3 Strat',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-[#0E3A60]' : 'text-[#4A647D]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      )
    },
    {
      id: 'mission-control',
      name: 'Multi-Agent Mission Control',
      path: '/workspace/mission-control',
      badge: '5 Agents',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-[#0E3A60]' : 'text-[#4A647D]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="8" y1="9" x2="16" y2="9" />
          <line x1="8" y1="13" x2="13" y2="13" />
        </svg>
      )
    },
    {
      id: 'analytics',
      name: 'Analytics & Reports',
      path: '/workspace/analytics',
      badge: 'Audit',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-[#0E3A60]' : 'text-[#4A647D]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: 'data',
      name: 'Data & Infrastructure',
      path: '/workspace/data',
      badge: 'Registry',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-[#0E3A60]' : 'text-[#4A647D]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      )
    }
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col flex-shrink-0 bg-[#F8F5EE] border-r border-[#E2DBD0] transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand & Workspace Identity */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2DBD0] bg-[#F5F1E6]">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0E2A47] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M2 10 Q5 5, 10 7.5 Q15 10, 18 5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <path d="M2 13 Q5 8, 10 10.5 Q15 13, 18 8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
                <circle cx="10" cy="8.75" r="1.8" fill="#FFFFFF" />
              </svg>
            </div>
            <div>
              <span className="font-grotesk font-bold text-sm tracking-wider text-[#0E2A47]">VARUNASETU</span>
              <p className="font-mono text-[9px] text-[#4A647D] tracking-widest uppercase">Twin Kernel v2.4</p>
            </div>
          </Link>
        )}

        {collapsed && (
          <Link href="/" className="mx-auto">
            <div className="w-9 h-9 rounded-lg bg-[#0E2A47] flex items-center justify-center text-white shadow-sm">
              <span className="font-grotesk font-bold text-sm text-white">VS</span>
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[#5B738A] hover:bg-[#EAE4D7] hover:text-[#0E2A47] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-2 font-mono text-[10px] tracking-[0.2em] text-[#69829A] uppercase">
            Workspace Enclave
          </p>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/workspace' && pathname?.startsWith(item.path));
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#EAF1F8] text-[#0A3052] font-semibold shadow-xs'
                  : 'text-[#3E576F] hover:bg-[#EFE9DC] hover:text-[#0E2A47]'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#1E5685] rounded-r-full" />
              )}
              <div className="flex-shrink-0">{item.icon(isActive)}</div>

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider ${
                        isActive
                          ? 'bg-[#D2E4F2] text-[#0B3A65] font-semibold'
                          : 'bg-[#E8E2D5] text-[#556E84]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Workspace System & Exit Panel */}
      <div className="p-3 border-t border-[#E2DBD0] bg-[#F5F1E6] space-y-2">
        {!collapsed ? (
          <>
            <div className="p-2.5 rounded-xl bg-white border border-[#E0D7C9] shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#1E3A5F]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Twin Telemetry
                </span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                  LIVE
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#59738A] leading-tight">
                Benthic Sensors: 1,248 CLS Nodes Syncing
              </p>
            </div>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-[#D5CCBC] bg-[#FAF7F2] text-[#3A536B] hover:text-[#0E2A47] hover:bg-white text-xs font-semibold transition-all shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Exit to Landing</span>
            </Link>
          </>
        ) : (
          <Link
            href="/"
            className="flex items-center justify-center p-2 rounded-xl text-[#4A647D] hover:bg-white transition-colors"
            title="Exit to Landing"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
        )}
      </div>
    </aside>
  );
}
