'use client';

import React, { useState } from 'react';
import { CableRoute, LandingStation } from '@/lib/types';
import { useWorkspace } from '@/lib/workspace-context';

interface CableExplorerMapProps {
  cables: CableRoute[];
  landingStations: LandingStation[];
  selectedCable: CableRoute;
  onSelectCable: (cable: CableRoute) => void;
}

export function CableExplorerMap({
  cables,
  landingStations,
  selectedCable,
  onSelectCable,
}: CableExplorerMapProps) {
  const { activeFault } = useWorkspace();
  const [hoveredCable, setHoveredCable] = useState<CableRoute | null>(null);
  const [hoveredStation, setHoveredStation] = useState<LandingStation | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>('All');

  // Map dimensions
  const width = 1000;
  const height = 500;

  // Convert Lon/Lat [-180, 180], [-90, 90] to SVG Coordinates [0, 1000], [0, 500]
  const project = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [Math.max(0, Math.min(width, x)), Math.max(0, Math.min(height, y))];
  };

  const getPathData = (coords: [number, number][]): string => {
    if (coords.length < 2) return '';
    const points = coords.map(([lon, lat]) => project(lon, lat));
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth spline interpolation for nautical subsea curvature
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev[0] + curr[0]) / 2;
      const cy = (prev[1] + curr[1]) / 2;
      d += ` Q ${prev[0]} ${prev[1]}, ${cx} ${cy} T ${curr[0]} ${curr[1]}`;
    }
    return d;
  };

  const filteredCables = activeRegionFilter === 'All'
    ? cables
    : cables.filter(c => c.region.toLowerCase().includes(activeRegionFilter.toLowerCase()));

  const faultProjected = project(activeFault.lon, activeFault.lat);

  return (
    <div className="relative w-full rounded-2xl bg-[#09182B] border border-[#193351] overflow-hidden shadow-md">
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#071322]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-white/70 text-[11px] tracking-wider uppercase">Benthic GIS Layer:</span>
          <span className="font-mono text-white font-semibold">WGS84 Subsea Topology</span>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#071322]/85 backdrop-blur-md p-1 rounded-xl border border-white/10">
          {['All', 'Euro-Asia', 'Transatlantic', 'Transpacific'].map((reg) => (
            <button
              key={reg}
              onClick={() => setActiveRegionFilter(reg)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                activeRegionFilter === reg
                  ? 'bg-[#1E4E79] text-white font-bold shadow-xs'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#071322]/85 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setZoomLevel(prev => Math.min(1.8, +(prev + 0.2).toFixed(1)))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold"
            title="Zoom in"
          >
            +
          </button>
          <span className="font-mono text-[10px] text-white/60 px-1">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.8, +(prev - 0.2).toFixed(1)))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold"
            title="Zoom out"
          >
            -
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="w-full aspect-[2/1] overflow-hidden flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full transition-transform duration-300 ease-out select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Ambient Water Grid Pattern */}
            <pattern id="ocean-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#122842" strokeWidth="0.5" strokeOpacity="0.6" />
            </pattern>
            {/* Linear Glow Gradients for Selected Routes */}
            <linearGradient id="selected-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Deep Ocean Base */}
          <rect width={width} height={height} fill="#0A1828" />
          <rect width={width} height={height} fill="url(#ocean-grid)" />

          {/* Continental Shelf Outlines (Simplified World Landmass Polygons for Context) */}
          <g fill="#10253B" stroke="#163757" strokeWidth="0.8" opacity="0.85">
            {/* North America */}
            <path d="M 120 70 L 220 60 L 280 80 L 310 130 L 260 210 L 210 240 L 160 170 L 110 110 Z" />
            {/* South America */}
            <path d="M 230 250 L 300 260 L 340 330 L 290 440 L 260 410 L 220 300 Z" />
            {/* Europe */}
            <path d="M 460 70 L 530 65 L 560 120 L 510 160 L 460 150 L 440 100 Z" />
            {/* Africa */}
            <path d="M 460 170 L 550 170 L 590 250 L 570 370 L 510 390 L 460 300 L 440 200 Z" />
            {/* Asia */}
            <path d="M 540 60 L 750 50 L 840 90 L 800 190 L 730 210 L 640 230 L 570 170 Z" />
            {/* Australia */}
            <path d="M 770 300 L 870 290 L 880 370 L 800 390 L 750 340 Z" />
          </g>

          {/* Equator & Meridian Guide Lines */}
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#173554" strokeWidth="0.6" strokeDasharray="3 3" />
          <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#173554" strokeWidth="0.6" strokeDasharray="3 3" />

          {/* Submarine Cable Routes */}
          <g>
            {filteredCables.map((cable) => {
              const isSelected = selectedCable.id === cable.id;
              const isHovered = hoveredCable?.id === cable.id;
              const pathD = getPathData(cable.routeCoordinates);
              if (!pathD) return null;

              // Color based on status and selection
              let strokeColor = '#3B82F6';
              if (cable.status === 'Degraded') strokeColor = '#F59E0B';
              if (cable.status === 'Severed') strokeColor = '#EF4444';
              if (isSelected) strokeColor = '#38BDF8';

              return (
                <g key={cable.id} className="cursor-pointer" onClick={() => onSelectCable(cable)}>
                  {/* Invisible wide hit area for easy hover/clicking */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="16"
                    onMouseEnter={() => setHoveredCable(cable)}
                    onMouseLeave={() => setHoveredCable(null)}
                  />

                  {/* Outer glow for selected or hovered */}
                  {(isSelected || isHovered) && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isSelected ? '#38BDF8' : '#60A5FA'}
                      strokeWidth={isSelected ? '6' : '4'}
                      strokeOpacity="0.45"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Core Route Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '2.8' : isHovered ? '2.2' : '1.4'}
                    strokeDasharray={cable.status === 'Severed' ? '4 3' : 'none'}
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}
          </g>

          {/* Active Fault Indicator Marker */}
          <g transform={`translate(${faultProjected[0]}, ${faultProjected[1]})`}>
            <circle r="12" fill="#EF4444" fillOpacity="0.25" className="animate-ping" />
            <circle r="7" fill="#EF4444" fillOpacity="0.5" />
            <circle r="3.5" fill="#FFFFFF" />
            <line x1="0" y1="-14" x2="0" y2="-8" stroke="#EF4444" strokeWidth="1.5" />
            <line x1="0" y1="8" x2="0" y2="14" stroke="#EF4444" strokeWidth="1.5" />
            <line x1="-14" y1="0" x2="-8" y2="0" stroke="#EF4444" strokeWidth="1.5" />
            <line x1="8" y1="0" x2="14" y2="0" stroke="#EF4444" strokeWidth="1.5" />
          </g>

          {/* Landing Stations (CLS Nodes) */}
          <g>
            {landingStations.map((station) => {
              const [sx, sy] = project(station.lon, station.lat);
              const isConnectedToSelected = selectedCable.landingStations.some(ls => ls.id === station.id);

              return (
                <g
                  key={station.id}
                  transform={`translate(${sx}, ${sy})`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredStation(station)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  <circle
                    r={isConnectedToSelected ? '4.5' : '2.5'}
                    fill={isConnectedToSelected ? '#FBBF24' : '#E2E8F0'}
                    stroke="#0B1A2C"
                    strokeWidth="1.2"
                    className="transition-all"
                  />
                  {isConnectedToSelected && (
                    <circle r="8" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 2" className="animate-spin-slow" />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating Status Dossier on Hover / Selected */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto bg-[#071322]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-3 text-xs">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">ACTIVE FOCUSED SYSTEM</p>
            <p className="font-bold text-white text-xs tracking-tight">
              {hoveredCable ? hoveredCable.name : selectedCable.name}
            </p>
          </div>
          <span className="h-6 w-[1px] bg-white/15" />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">STATUS</p>
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                (hoveredCable || selectedCable).status === 'Operational'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : (hoveredCable || selectedCable).status === 'Degraded'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {(hoveredCable || selectedCable).status}
            </span>
          </div>
          <span className="h-6 w-[1px] bg-white/15" />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">PROVENANCE</p>
            <span className="font-mono text-[10px] text-[#83B9A9]">
              {(hoveredCable || selectedCable).provenance}
            </span>
          </div>
        </div>

        {/* Fault Notification Pill */}
        <div className="pointer-events-auto bg-rose-950/80 backdrop-blur-md border border-rose-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-rose-200 text-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-mono text-[10px]">
            FAULT AT {activeFault.lat.toFixed(2)}°N, {activeFault.lon.toFixed(2)}°E ({activeFault.depthMeters}m benthic)
          </span>
        </div>
      </div>
    </div>
  );
}

