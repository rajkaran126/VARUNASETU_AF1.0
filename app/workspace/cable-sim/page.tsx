import type { Metadata } from 'next';
import CableBreakSim from '@/components/workspace/CableBreakSim';

export const metadata: Metadata = {
  title: 'Resilience Theatre — VARUNASETU',
  description: 'Resilience Theatre: AI-Powered Submarine Cable Failure Detection, Rerouting & ROV Repair.',
};

export default function CableSimPage() {
  return <CableBreakSim />;
}
