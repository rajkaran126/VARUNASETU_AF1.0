"use client";
import {usePathname} from "next/navigation";
import { Sidebar } from '@/components/workspace/Sidebar';
import { Header } from '@/components/workspace/Header';
import { GhostCopilot } from '@/components/workspace/GhostCopilot';

export default function WorkspaceFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const path=usePathname();
  if(path==="/workspace/digital-twin" || path==="/workspace/resilience-theatre") return <main>{children}</main>;
  return (
      <div className="fixed inset-0 z-30 bg-[#F7F3EA] text-[#454640] font-body flex overflow-hidden">
        {/* Workspace Sidebar (Compact Icon Navigation by default) */}
        <Sidebar />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F7F3EA]">
          {/* Strictly Minimal Header */}
          <Header />

          {/* Section Main Viewport Area */}
          <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 bg-[#F7F3EA]">
            <div className="max-w-[1600px] mx-auto pb-12">
              {children}
            </div>
          </main>
        </div>

        {/* Floating Digital Twin Ghost Copilot */}
        <GhostCopilot />
      </div>
  );
}
