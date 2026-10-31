/**
 * POST /api/ai/query
 * Real-time Groq Multi-Agent Orchestration Endpoint
 *
 * Ingests natural language operator query -> runs NLP -> hybrid RAG ->
 * executes 5 specialists in parallel -> synthesizes Chief Orchestrator consensus.
 */

import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/services/agent-orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, activeSimulation, digitalTwinContext } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query text is required.' }, { status: 400 });
    }

    const report = await agentOrchestrator.orchestrate(query, activeSimulation, digitalTwinContext);
    const messages = agentOrchestrator.toAgentMessages(report);

    return NextResponse.json({
      success: true,
      report,
      messages,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Multi-agent orchestration error';
    console.error('[API /api/ai/query] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

