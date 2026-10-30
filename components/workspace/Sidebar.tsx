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
  // Compact icon-based navigation by default as required
  const [collapsed, setCollapsed] = useState(true);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      name: 'Network Overview',
      path: '/workspace',
      badge: '426',
      icon: (active) => (
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      name: 'Cable Break Simulation',
      path: '/workspace/digital-twin',
      badge: 'SIM',
      icon: (active) => (
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      badge: 'Sim',
      icon: (active) => (
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    },
    {
      id: 'war-room',
      name: 'Recovery War Room',
      path: '/workspace/war-room',
      badge: 'Logistics',
      icon: (active) => (
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      badge: 'GIS Hub',
      icon: (active) => (
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      )
    },
    {
      id: 'srlg',
      name: 'SRLG Analysis',
      path: '/workspace/srlg',
      badge: 'SRLG',
      icon: (active) => (
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M4.93 4.93l14.14 14.14" />
          <path d="M12 8v4l3 3" />
        </svg>
      )
    },
    {
      id: 'false-redundancy',
      name: 'False Redundancy Lab',
      path: '/workspace/false-redundancy',
      badge: 'NEW',
      icon: (active) => (
        <svg className={`w-5 h-5 transition-colors ${active ? 'text-[#C87954]' : 'text-[#6D6E66]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    }
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col flex-shrink-0 bg-[#E8D9BF] border-r border-[#D4C4A8] text-[#454640] transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[70px]' : 'w-64'
      }`}
    >
      {/* Brand & Workspace Identity (Midnight Navy Header) */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#D4C4A8] bg-[#D4C4A8]">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#F7F3EA] border border-[#D4C4A8] flex items-center justify-center text-[#C87954] shadow-xs transition-transform group-hover:scale-105">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M2 10 Q5 5, 10 7.5 Q15 10, 18 5" stroke="#C87954" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M2 13 Q5 8, 10 10.5 Q15 13, 18 8" stroke="#C87954" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
                <circle cx="10" cy="8.75" r="1.8" fill="#FFFFFF" />
              </svg>
            </div>
            <div>
              <span className="font-grotesk font-bold text-xs tracking-wider text-[#454640]">VARUNASETU</span>
              <p className="font-mono text-[9px] text-[#C87954] tracking-widest uppercase font-semibold">Subsea Twin</p>
            </div>
          </Link>
        ) : (
          <Link href="/" className="mx-auto" title="VARUNASETU Home">
            <div className="w-8 h-8 rounded-xl bg-[#F7F3EA] border border-[#D4C4A8] flex items-center justify-center text-[#C87954] shadow-xs">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M2 10 Q5 5, 10 7.5 Q15 10, 18 5" stroke="#C87954" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="10" cy="8.75" r="1.8" fill="#FFFFFF" />
              </svg>
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-[#6D6E66] hover:bg-[#D4C4A8] hover:text-[#C87954] transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title="Collapse navigation"
          aria-label="Collapse sidebar"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-1 font-sans text-xs font-semibold text-[#A69B89]">
            Platform Sections
          </p>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/workspace' && pathname?.startsWith(item.path));
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#83B9A9] text-[#454640] shadow-xs'
                  : 'text-[#6D6E66] hover:bg-[#D4C4A8] hover:text-[#454640]'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              {/* Cyan Active Indicator on Midnight Navy */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#C87954] rounded-r-full" />
              )}

              <div className="flex-shrink-0">{item.icon(isActive)}</div>

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate font-body">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider ${
                        isActive
                          ? 'bg-[#F7F3EA] text-[#454640] border border-[#83B9A9] font-bold'
                          : 'bg-[#D4C4A8] text-[#6D6E66]'
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

      {/* Footer Controls / Expand Toggle */}
      <div className="p-2.5 border-t border-[#D4C4A8] bg-[#D4C4A8] space-y-1.5">
        {/* Expand / Collapse Button when Collapsed */}
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center p-2 rounded-xl text-[#6D6E66] hover:text-[#C87954] hover:bg-[#D4C4A8] transition-colors"
            title="Expand Navigation (Detailed)"
            aria-label="Expand sidebar"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[#6D6E66] hover:text-[#454640] hover:bg-[#D4C4A8] text-xs font-mono transition-colors"
            title="Compact Navigation"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Collapse Navigation</span>
          </button>
        )}

        {/* Exit Link */}
        <Link
          href="/"
          className={`flex items-center rounded-xl text-[#6D6E66] hover:text-[#454640] hover:bg-[#D4C4A8] text-xs font-body transition-colors ${
            collapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'
          }`}
          title="Exit to Landing"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {!collapsed && <span>Exit to Landing</span>}
        </Link>
      </div>
    </aside>
  );
}
