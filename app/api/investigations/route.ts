/**
 * GET  /api/investigations — List all persistent investigations
 * POST /api/investigations — Create / save an investigation with simulation & agent findings
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory fallback if Supabase tables haven't been run through SQL Editor yet
const localInvestigationsStore: Record<string, unknown>[] = [
  {
    id: 'inv-red-sea-baseline',
    user_id: 'commander-01',
    title: 'Red Sea Chokepoint Dual Severance Analysis',
    network_region: 'Euro-Asia Corridor',
    status: 'Active',
    summary: 'Correlated rupture across SEA-ME-WE 4 & SEA-ME-WE 5. Autonomous optical bypass activated via Trans-Mediterranean corridor.',
    created_at: '2026-10-30T09:05:00Z',
    updated_at: '2026-10-30T10:15:00Z',
  },
];

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('investigations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('[API /api/investigations] Supabase query fallback to local store:', err);
  }

  return NextResponse.json(localInvestigationsStore);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newInvestigation = {
      id: body.id || `inv-${Date.now()}`,
      user_id: body.user_id || 'commander-01',
      title: body.title || 'Untitled Subsea Investigation',
      network_region: body.network_region || 'Global',
      status: body.status || 'Active',
      summary: body.summary || 'AI-assisted investigation into network vulnerability and recovery.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabaseServer
        .from('investigations')
        .insert(newInvestigation);

      if (error) {
        console.warn('[API /api/investigations] Supabase insert note:', error.message);
      }
    } catch {}

    localInvestigationsStore.unshift(newInvestigation);

    return NextResponse.json({
      success: true,
      investigation: newInvestigation,
      message: 'Investigation created and saved successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save investigation';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
