/**
 * GET /api/stream
 * Server-Sent Events endpoint for real-time data synchronisation.
 * Clients subscribe here; when any seed file changes the server pushes an event.
 */

import { NextRequest } from 'next/server';
import { subscribe, startFileWatcher, broadcast, DataEvent } from '@/lib/data-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  startFileWatcher();

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      const heartbeat = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString(), message: 'VARUNASETU real-time stream connected' })}\n\n`;
      controller.enqueue(encoder.encode(heartbeat));

      // Subscribe to data events
      unsubscribe = subscribe((event: DataEvent) => {
        try {
          const msg = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(msg));
        } catch { /* client disconnected */ }
      });

      // Heartbeat every 25s to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 25000);

      // Clean up on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        if (unsubscribe) unsubscribe();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
