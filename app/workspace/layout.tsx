import type { Metadata } from 'next';
import { WorkspaceProvider } from '@/lib/workspace-context';
import { Sidebar } from '@/components/workspace/Sidebar';
import { Header } from '@/components/workspace/Header';

export const metadata: Metadata = {
  title: 'Workspace — VARUNASETU Submarine Cable Digital Twin',
  description: 'AI-Powered Submarine Cable Digital Twin Workspace for Network Resilience, Failure Simulation & Intelligent Recovery.',
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      {/* 
        Solid light-theme backdrop ensuring the landing page's background video
        does not bleed through into the light workspace environment.
      */}
      <div className="fixed inset-0 z-30 bg-[#FBF9F4] text-[#0E2A47] font-body flex overflow-hidden">
        {/* Workspace Sidebar (7 agreed sections) */}
        <Sidebar />

        {/* Main Content Workspace Column */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#FAF7F1]">
          {/* Workspace Global Header */}
          <Header />

          {/* Section Main Viewport Area (Strictly NO footer in workspace) */}
          <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 bg-[#FAF7F1]">
            <div className="max-w-[1600px] mx-auto pb-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
