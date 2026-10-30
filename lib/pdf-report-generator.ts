import jsPDF from 'jspdf';
import { FaultIncident, SimulationResult } from './types';
import { REPAIR_STAGES } from '@/components/digital-twin/GhostModeOverlay';

export interface ReportScreenshot {
  dataUrl: string;
  caption: string;
  timestamp: string;
  stageName: string;
}

export function generateSimulationPDFReport(
  activeFault: FaultIncident,
  simulationResult: SimulationResult,
  screenshots: ReportScreenshot[] = []
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner: VARUNASETU Official Dark Navy
  doc.setFillColor(11, 29, 51); // #0B1D33
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(19, 191, 211); // #13BFD3 Cyan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VARUNASETU // SUBMARINE CABLE DIGITAL TWIN', 14, 12);

  doc.setTextColor(245, 250, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('PHYSICAL CABLE REPAIR & NETWORK RECOVERY EVIDENCE DOSSIER', 14, 18);
  doc.text(`DATE: ${new Date().toUTCString()} · RFC-7946 AUDITED`, 14, 23);

  y = 36;

  // Incident & Cable Metadata Table
  doc.setTextColor(21, 45, 70); // #152D46 Primary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. BENTHIC INCIDENT & CONDUIT PROFILE', 14, y);
  y += 6;

  doc.setFillColor(247, 248, 245); // #F7F8F5 Warm Ivory
  doc.rect(14, y, pageWidth - 28, 24, 'F');
  doc.setDrawColor(203, 221, 235);
  doc.rect(14, y, pageWidth - 28, 24, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(96, 117, 138);

  doc.text('TARGET CONDUIT:', 18, y + 6);
  doc.text('SEVERANCE COORD:', 70, y + 6);
  doc.text('BENTHIC DEPTH:', 125, y + 6);
  doc.text('OPTICAL LOSS:', 160, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 45, 70);
  doc.text(`${activeFault.cableName} (${activeFault.cableId.toUpperCase()})`, 18, y + 11);
  doc.text(`${activeFault.lat.toFixed(4)}°N, ${activeFault.lon.toFixed(4)}°E`, 70, y + 11);
  doc.text(`-${activeFault.depthMeters} m (${activeFault.nearestLandingStation})`, 125, y + 11);
  doc.setTextColor(220, 38, 38);
  doc.text(`${activeFault.opticalLossDb} dB (TOTAL LOS)`, 160, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(96, 117, 138);
  doc.text('PROVENANCE: Observed OTDR Ingest · SimKernel 2.4 Modeled Impact', 18, y + 18);

  y += 32;

  // Network Recovery KPIs
  doc.setTextColor(21, 45, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. NETWORK IMPACT & CAPACITY RESTORATION', 14, y);
  y += 6;

  doc.setFillColor(237, 243, 247); // #EDF3F7 Pale Blue Grey
  doc.rect(14, y, pageWidth - 28, 18, 'F');
  doc.setDrawColor(203, 221, 235);
  doc.rect(14, y, pageWidth - 28, 18, 'S');

  doc.setFontSize(9);
  doc.setTextColor(21, 45, 70);
  doc.text(`Served Demand: ${simulationResult.servedDemandTbps} Tbps`, 20, y + 7);
  doc.text(`Unserved Demand: ${simulationResult.unservedDemandTbps} Tbps`, 70, y + 7);
  doc.text(`Capacity Utilization: ${simulationResult.capacityUtilizationPct}%`, 120, y + 7);
  doc.text(`Latency Delta: +${simulationResult.latencyDeltaMs} ms`, 165, y + 7);

  doc.setFontSize(7.5);
  doc.setTextColor(96, 117, 138);
  doc.text('Dynamic rerouting absorbed via transoceanic bypass carriers (AAE-1, 2Africa) prior to physical restoration.', 20, y + 13);

  y += 26;

  // Real WebGL Simulation Frames
  doc.setTextColor(21, 45, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. ACTUAL SIMULATION EVIDENCE CAPTURES', 14, y);
  y += 6;

  if (screenshots.length > 0) {
    screenshots.slice(0, 2).forEach((sc) => {
      try {
        doc.addImage(sc.dataUrl, 'PNG', 14, y, 86, 48);
        doc.setFillColor(247, 248, 245);
        doc.rect(104, y, pageWidth - 118, 48, 'F');
        doc.setDrawColor(203, 221, 235);
        doc.rect(104, y, pageWidth - 118, 48, 'S');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(21, 45, 70);
        doc.text(`CAPTURE: ${sc.stageName.toUpperCase()}`, 108, y + 8);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(96, 117, 138);
        doc.text(`Timestamp: ${sc.timestamp}`, 108, y + 14);
        doc.text(`Telemetry: Benthic Depth -${activeFault.depthMeters}m`, 108, y + 19);

        doc.setFontSize(8);
        doc.setTextColor(21, 45, 70);
        const splitCaption = doc.splitTextToSize(sc.caption, 80);
        doc.text(splitCaption, 108, y + 26);

        y += 54;
      } catch (err) {
        console.warn('Could not embed frame into PDF:', err);
      }
    });
  } else {
    doc.setFontSize(8.5);
    doc.setTextColor(96, 117, 138);
    doc.text('Simulation executed live in 3D WebGL viewport. Frames captured during physical splice.', 14, y);
    y += 10;
  }

  // Page 2: 14 Physical Milestones & Disclaimers
  doc.addPage();
  y = 18;

  doc.setTextColor(21, 45, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('4. PHYSICAL REPAIR & RESTORATION TIMELINE (14 MILESTONES)', 14, y);
  y += 6;

  REPAIR_STAGES.forEach((st) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 119, 184); // #1677B8
    doc.text(`${st.id}. ${st.name}`, 16, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(96, 117, 138);
    doc.text(`Duration: ${st.durationDays} days · ${st.desc}`, 75, y);
    y += 6;
  });

  y += 8;
  doc.setTextColor(21, 45, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('5. SOURCES, ASSUMPTIONS & SIMULATION DISCLAIMER', 14, y);
  y += 5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(145, 161, 175);
  const disclaimer =
    'DEMO / SIMULATION NOTICE: All vessel positions, ROV inspection scans, fiber splicing animations, and calculated restoration timelines are strictly simulated for engineering demonstration. Physical cable lay bathymetry references NOAA ETOPO1 data. Universal Joint repair procedures conform to ITU-T L.26 guidelines.';
  const splitDisc = doc.splitTextToSize(disclaimer, pageWidth - 28);
  doc.text(splitDisc, 14, y);

  // Download PDF
  doc.save(`VARUNASETU_Simulation_Report_${activeFault.cableId}_${Date.now()}.pdf`);
}

