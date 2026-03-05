/**
 * Analysis routes — trigger data collection + analysis, stream progress via SSE.
 */

import { FastifyInstance } from 'fastify';
import { jobManager, MarketType } from '../services/job-manager';
import { runPipelineForJob } from '../services/pipeline-service';

export async function analysisRoutes(app: FastifyInstance): Promise<void> {
  /** Launch a new analysis job */
  app.post('/api/analysis', async (request, reply) => {
    const body = request.body as {
      homeTeam?: string;
      awayTeam?: string;
      date?: string;
      market?: string;
      analyze?: boolean;
    };

    const homeTeam = body.homeTeam?.trim();
    const awayTeam = body.awayTeam?.trim();
    const date = body.date?.trim();
    const market = body.market?.trim() as MarketType | undefined;

    if (!homeTeam || !awayTeam || !date || !market) {
      reply.status(400);
      return { error: 'Missing required fields: homeTeam, awayTeam, date, market' };
    }

    if (!['goals', 'corners', 'cards'].includes(market)) {
      reply.status(400);
      return { error: 'Market must be one of: goals, corners, cards' };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      reply.status(400);
      return { error: 'Date must be in ISO format (YYYY-MM-DD)' };
    }

    // Check for duplicate: same teams + date + market, still running
    const existing = jobManager.getAll().find(
      (j) =>
        j.homeTeam === homeTeam &&
        j.awayTeam === awayTeam &&
        j.date === date &&
        j.market === market &&
        !['complete', 'failed'].includes(j.status)
    );
    if (existing) {
      return { jobId: existing.id, status: existing.status, duplicate: true };
    }

    const analyze = body.analyze !== false;
    const job = jobManager.create(homeTeam, awayTeam, date, market);

    // Start pipeline in background (don't await)
    runPipelineForJob(job, analyze).catch(() => {
      // Error is already tracked in the job
    });

    return { jobId: job.id, status: job.status };
  });

  /** SSE stream for job progress */
  app.get('/api/analysis/:id/stream', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobManager.get(id);

    if (!job) {
      reply.status(404);
      return { error: 'Job not found' };
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const send = (event: string, data: unknown) => {
      try {
        if (!reply.raw.destroyed) {
          reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
      } catch {
        // Connection closed — ignore broken pipe
      }
    };

    // Send current state
    send('status', { status: job.status, message: 'Connected' });
    for (const log of job.logs) {
      send('log', { message: log.message, time: log.time });
    }

    // If already terminal, send and close
    if (job.status === 'complete') {
      send('complete', {
        reportPath: job.reportPath,
        analysisPath: job.analysisPath,
      });
      reply.raw.end();
      return;
    }
    if (job.status === 'failed') {
      send('error', { error: job.error });
      reply.raw.end();
      return;
    }

    const emitter = jobManager.emitter(id);
    if (!emitter) {
      reply.raw.end();
      return;
    }

    const onStatus = (data: unknown) => send('status', data);
    const onLog = (message: string) =>
      send('log', { message, time: Date.now() });
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      emitter.off('status', onStatus);
      emitter.off('log', onLog);
      emitter.off('complete', onComplete);
      emitter.off('error', onError);
    };

    const onComplete = (data: unknown) => {
      send('complete', data);
      cleanup();
      if (!reply.raw.writableEnded) reply.raw.end();
    };
    const onError = (error: string) => {
      send('error', { error });
      cleanup();
      if (!reply.raw.writableEnded) reply.raw.end();
    };

    emitter.on('status', onStatus);
    emitter.on('log', onLog);
    emitter.on('complete', onComplete);
    emitter.on('error', onError);

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        if (!reply.raw.destroyed) {
          reply.raw.write(': heartbeat\n\n');
        } else {
          clearInterval(heartbeat);
          cleanup();
        }
      } catch {
        clearInterval(heartbeat);
        cleanup();
      }
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      cleanup();
    });
  });

  /** Get job status */
  app.get('/api/analysis/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobManager.get(id);

    if (!job) {
      reply.status(404);
      return { error: 'Job not found' };
    }

    return {
      id: job.id,
      homeTeam: job.homeTeam,
      awayTeam: job.awayTeam,
      date: job.date,
      market: job.market,
      status: job.status,
      error: job.error,
      logs: job.logs,
      hasReport: !!job.reportPath,
      hasAnalysis: !!job.analysisPath,
      createdAt: job.createdAt,
    };
  });

  /** List all jobs */
  app.get('/api/jobs', async () => {
    return { jobs: jobManager.getAll() };
  });
}
