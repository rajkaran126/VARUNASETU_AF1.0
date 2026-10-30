import type { Metadata } from 'next';
import CableBreakSim from '@/components/workspace/CableBreakSim';

export const metadata: Metadata = {
  title: 'Cable Break Simulation — VARUNASETU',
  description: 'AI-Powered Submarine Cable Failure Detection, Rerouting & ROV Repair Simulation.',
};

export default function CableSimPage() {
  return <CableBreakSim />;
}
