/**
 * GET /api/ai/status
 * Groq Multi-Key Health Monitoring Endpoint
 */

import { NextResponse } from 'next/server';
import { groqKeyManager } from '@/lib/services/groq-key-manager';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const health = groqKeyManager.getHealthReport();
  return NextResponse.json(health, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

