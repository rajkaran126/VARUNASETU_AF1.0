import type { Metadata } from 'next';
import { WorkspaceProvider } from '@/lib/workspace-context';
import WorkspaceFrame from "@/components/workspace/WorkspaceFrame";

export const metadata: Metadata = {
  title: 'Workspace — VARUNASETU Submarine Cable Digital Twin',
  description: 'AI-Powered Submarine Cable Digital Twin Workspace for Network Resilience, Failure Simulation & Intelligent Recovery.',
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceProvider><WorkspaceFrame>{children}</WorkspaceFrame></WorkspaceProvider>;
}
