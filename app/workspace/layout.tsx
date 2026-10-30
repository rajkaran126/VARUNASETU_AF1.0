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
        Refined Workspace Shell:
        - Midnight Navy Sidebar (#0B1D33)
        - Clean Light Header (Strictly minimal: Notifications, Date/Time, User Profile)
        - Warm Ivory & Soft Cream Base (#F7F8F5) with Pale Blue-Grey surfaces
        - Strictly NO footers inside any workspace section
      */}
      <div className="fixed inset-0 z-30 bg-[#F7F8F5] text-[#152D46] font-body flex overflow-hidden">
        {/* Workspace Sidebar (Compact Icon Navigation by default) */}
        <Sidebar />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F7F8F5]">
          {/* Strictly Minimal Header */}
          <Header />

          {/* Section Main Viewport Area */}
          <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 bg-[#F7F8F5]">
            <div className="max-w-[1600px] mx-auto pb-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
