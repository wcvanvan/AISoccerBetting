/**
 * Analysis routes — trigger data collection + analysis, stream progress via SSE.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FastifyInstance } from 'fastify';
import { jobManager, MarketType } from '../services/job-manager';
import { runPipelineForJob, getCachedPaths, REPORTS_DIR } from '../services/pipeline-service';

export async function analysisRoutes(app: FastifyInstance): Promise<void> {
  /** Launch a new analysis job */
  app.post('/api/analysis', async (request, reply) => {
    const body = request.body as {
      homeTeam?: string;
      awayTeam?: string;
      date?: string;
      market?: string;
      analyze?: boolean;
      force?: boolean;
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

    // Check for cached results on disk (unless force re-run)
    if (!body.force) {
      const cached = getCachedPaths(homeTeam, awayTeam, date, market);
      if (cached.reportPath) {
        const analyze = body.analyze !== false;

        // Report exists but no analysis, and user wants analysis → run analysis only
        if (analyze && !cached.analysisPath) {
          if (request.user?.role !== 'admin') {
            reply.status(403);
            return { error: 'Read-only access. Only admin can run analyses.' };
          }

          // Check for duplicate running job
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

          const job = jobManager.create(homeTeam, awayTeam, date, market);
          job.reportPath = cached.reportPath;
          job.logs.push({ time: Date.now(), message: 'Using cached data report, skipping collection' });

          runPipelineForJob(job, true).catch(() => {});
          return { jobId: job.id, status: job.status };
        }

        // Fully cached (report + optional analysis) → return immediately
        const job = jobManager.create(homeTeam, awayTeam, date, market);
        job.reportPath = cached.reportPath;
        job.analysisPath = cached.analysisPath;
        job.status = 'complete';
        job.updatedAt = Date.now();
        job.logs.push({ time: Date.now(), message: 'Loaded from cached results' });
        return {
          jobId: job.id,
          status: 'complete',
          cached: true,
          hasReport: true,
          hasAnalysis: !!cached.analysisPath,
        };
      }
    }

    // Beyond cache lookup, write operations require admin role
    if (request.user?.role !== 'admin') {
      reply.status(403);
      return { error: 'Read-only access. Only admin can run analyses.' };
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

  /** Check cache status for all markets of a given match */
  app.get('/api/cache-status', async (request) => {
    const query = request.query as { homeTeam?: string; awayTeam?: string; date?: string };
    const homeTeam = query.homeTeam?.trim();
    const awayTeam = query.awayTeam?.trim();
    const date = query.date?.trim();

    if (!homeTeam || !awayTeam || !date) {
      return { markets: {} };
    }

    const markets: Record<string, { hasReport: boolean; hasAnalysis: boolean }> = {};
    for (const m of ['goals', 'corners', 'cards'] as MarketType[]) {
      const cached = getCachedPaths(homeTeam, awayTeam, date, m);
      markets[m] = {
        hasReport: !!cached.reportPath,
        hasAnalysis: !!cached.analysisPath,
      };
    }
    return { markets };
  });

  /** List all jobs (in-memory, for active/running jobs) */
  app.get('/api/jobs', async () => {
    const jobs = jobManager.getAll().map((j) => ({
      id: j.id,
      homeTeam: j.homeTeam,
      awayTeam: j.awayTeam,
      date: j.date,
      market: j.market,
      status: j.status,
      error: j.error,
      logs: j.logs,
      hasReport: !!j.reportPath,
      hasAnalysis: !!j.analysisPath,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    }));
    return { jobs };
  });

  /**
   * History endpoint — scans data/reports/ directory to discover all matches
   * (both web- and CLI-generated). Supports both directory layout
   * ({matchDir}/{market}.md) and legacy flat layout ({matchDir}-{market}.md).
   */
  app.get('/api/history', async () => {
    if (!fs.existsSync(REPORTS_DIR)) return { matches: [] };

    const matchMap = new Map<
      string,
      {
        date: string;
        homeTeam: string;
        awayTeam: string;
        markets: Record<string, { hasReport: boolean; hasAnalysis: boolean }>;
        mtime: number;
      }
    >();

    const filePattern = /^(goals|corners|cards)(-analysis)?\.md$/;
    const dirPattern = /^(.+)-vs-(.+)-(\d{4}-\d{2}-\d{2})$/;
    // Legacy flat: {slug}-vs-{slug}-{date}-{market}[-analysis].md
    const flatPattern =
      /^(.+)-vs-(.+)-(\d{4}-\d{2}-\d{2})-(goals|corners|cards)(-analysis)?\.md$/;

    const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });

    // Scan subdirectories (new layout)
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dm = entry.name.match(dirPattern);
      if (!dm) continue;

      const [, homeSlug, awaySlug, date] = dm;
      const matchKey = entry.name;
      const dirPath = path.join(REPORTS_DIR, entry.name);
      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'));

      if (files.length === 0) continue;

      // Read team names from first data report
      let homeTeam = unslug(homeSlug);
      let awayTeam = unslug(awaySlug);
      const firstReport = files.find((f) => filePattern.test(f) && !f.includes('-analysis'));
      if (firstReport) {
        const parsed = parseTitle(readFirstLine(path.join(dirPath, firstReport)));
        if (parsed) { homeTeam = parsed.home; awayTeam = parsed.away; }
      }

      const match = { date, homeTeam, awayTeam, markets: {} as Record<string, { hasReport: boolean; hasAnalysis: boolean }>, mtime: 0 };

      for (const file of files) {
        const fm = file.match(filePattern);
        if (!fm) continue;
        const [, market, isAnalysis] = fm;
        if (!match.markets[market]) match.markets[market] = { hasReport: false, hasAnalysis: false };
        if (isAnalysis) match.markets[market].hasAnalysis = true;
        else match.markets[market].hasReport = true;

        const stat = fs.statSync(path.join(dirPath, file));
        if (stat.mtimeMs > match.mtime) match.mtime = stat.mtimeMs;
      }

      matchMap.set(matchKey, match);
    }

    // Scan flat files (legacy layout)
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const fm = entry.name.match(flatPattern);
      if (!fm) continue;

      const [, homeSlug, awaySlug, date, market, isAnalysis] = fm;
      const matchKey = `${homeSlug}-vs-${awaySlug}-${date}`;

      // Skip if already found as directory
      if (matchMap.has(matchKey)) {
        const existing = matchMap.get(matchKey)!;
        if (!existing.markets[market]) existing.markets[market] = { hasReport: false, hasAnalysis: false };
        if (isAnalysis) existing.markets[market].hasAnalysis = true;
        else existing.markets[market].hasReport = true;
        const stat = fs.statSync(path.join(REPORTS_DIR, entry.name));
        if (stat.mtimeMs > existing.mtime) existing.mtime = stat.mtimeMs;
        continue;
      }

      let homeTeam = unslug(homeSlug);
      let awayTeam = unslug(awaySlug);
      if (!isAnalysis) {
        const parsed = parseTitle(readFirstLine(path.join(REPORTS_DIR, entry.name)));
        if (parsed) { homeTeam = parsed.home; awayTeam = parsed.away; }
      }

      const match = matchMap.get(matchKey) || {
        date, homeTeam, awayTeam,
        markets: {} as Record<string, { hasReport: boolean; hasAnalysis: boolean }>,
        mtime: 0,
      };
      if (!match.markets[market]) match.markets[market] = { hasReport: false, hasAnalysis: false };
      if (isAnalysis) match.markets[market].hasAnalysis = true;
      else match.markets[market].hasReport = true;

      const stat = fs.statSync(path.join(REPORTS_DIR, entry.name));
      if (stat.mtimeMs > match.mtime) match.mtime = stat.mtimeMs;

      matchMap.set(matchKey, match);
    }

    const matches = Array.from(matchMap.values())
      .sort((a, b) => b.mtime - a.mtime)
      .map(({ homeTeam, awayTeam, date, markets, mtime }) => ({
        homeTeam, awayTeam, date, markets, lastModified: mtime,
      }));

    return { matches };
  });
}

/** Convert slug back to title case: "tottenham-hotspur" → "Tottenham Hotspur" */
function unslug(s: string): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Read the first non-empty line of a file */
function readFirstLine(filePath: string): string {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(512);
  fs.readSync(fd, buf, 0, 512, 0);
  fs.closeSync(fd);
  const lines = buf.toString('utf8').split('\n');
  return lines.find((l) => l.trim().length > 0) || '';
}

/** Parse "# Team A vs Team B" or "# Team A vs Team B — ..." title line */
function parseTitle(line: string): { home: string; away: string } | null {
  const m = line.match(/^#{1,2}\s+(.+?)\s+vs\s+(.+?)(?:\s*[—–\-]\s+.*)?$/i);
  if (!m) return null;
  return { home: m[1].trim(), away: m[2].trim() };
}
