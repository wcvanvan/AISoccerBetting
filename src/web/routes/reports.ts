/**
 * Reports routes — serve collected data reports and analysis as HTML.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FastifyInstance } from 'fastify';
import { jobManager } from '../services/job-manager';
import { getCachedPaths, REPORTS_DIR } from '../services/report-paths';
import { MarketType } from '../services/job-manager';

// Lazy-load marked (ESM-only package) via dynamic import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _safeMarked: any = null;
async function getSafeMarked() {
  if (!_safeMarked) {
    const { Marked } = await import('marked');
    _safeMarked = new Marked({
      renderer: { html: () => '' },
    });
  }
  return _safeMarked;
}

/** Server-side cache: rendered HTML keyed by filepath + mtime to avoid re-parsing */
const htmlCache = new Map<string, { mtime: number; html: string }>();

async function renderCached(filePath: string): Promise<string> {
  const stat = fs.statSync(filePath);
  const entry = htmlCache.get(filePath);
  if (entry && entry.mtime === stat.mtimeMs) {
    return entry.html;
  }
  const safeMarked = await getSafeMarked();
  const markdown = fs.readFileSync(filePath, 'utf8');
  const html = wrapTables(await safeMarked.parse(markdown));
  htmlCache.set(filePath, { mtime: stat.mtimeMs, html });
  return html;
}

/** Wrap <table> elements in a scrollable container for wide data tables */
function wrapTables(html: string): string {
  return html.replace(/<table[^>]*>/g, '<div class="table-wrap">$&').replace(/<\/table>/g, '</table></div>');
}

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  /** Get the raw data report as rendered HTML */
  app.get('/api/reports/:id/raw', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobManager.get(id);

    if (!job) {
      reply.status(404);
      return { error: 'Job not found' };
    }

    if (!job.reportPath || !fs.existsSync(job.reportPath)) {
      reply.status(404);
      return { error: 'Report not yet available' };
    }

    const html = await renderCached(job.reportPath);
    return { html };
  });

  /** Get the full analysis as rendered HTML */
  app.get('/api/reports/:id/analysis', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobManager.get(id);

    if (!job) {
      reply.status(404);
      return { error: 'Job not found' };
    }

    if (!job.analysisPath || !fs.existsSync(job.analysisPath)) {
      reply.status(404);
      return { error: 'Analysis not yet available' };
    }

    const html = await renderCached(job.analysisPath);
    return { html };
  });

  /** Get concise value picks extracted from the analysis */
  app.get('/api/reports/:id/concise', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobManager.get(id);

    if (!job) {
      reply.status(404);
      return { error: 'Job not found' };
    }

    if (!job.analysisPath || !fs.existsSync(job.analysisPath)) {
      reply.status(404);
      return { error: 'Analysis not yet available' };
    }

    const markdown = fs.readFileSync(job.analysisPath, 'utf8');
    const concise = extractValuePicks(markdown);
    // Use a virtual key for concise cache (different from full analysis)
    const conciseKey = job.analysisPath + ':concise';
    const stat = fs.statSync(job.analysisPath);
    const entry = htmlCache.get(conciseKey);
    let html: string;
    if (entry && entry.mtime === stat.mtimeMs) {
      html = entry.html;
    } else {
      html = wrapTables(await (await getSafeMarked()).parse(concise));
      htmlCache.set(conciseKey, { mtime: stat.mtimeMs, html });
    }
    return { html };
  });

  /**
   * Serve report content by match + market (no job ID needed).
   * Used by the history page to view CLI-generated and cached reports.
   *
   * GET /api/reports/match/:tab?homeTeam=...&awayTeam=...&date=...&market=...
   * :tab is one of: raw, analysis, concise
   */
  app.get('/api/match-report/:tab', async (request, reply) => {
    const { tab } = request.params as { tab: string };
    const query = request.query as {
      homeTeam?: string;
      awayTeam?: string;
      date?: string;
      market?: string;
    };
    const homeTeam = query.homeTeam?.trim();
    const awayTeam = query.awayTeam?.trim();
    const date = query.date?.trim();
    const market = query.market?.trim() as MarketType | undefined;

    if (!homeTeam || !awayTeam || !date || !market) {
      reply.status(400);
      return { error: 'Missing required query params: homeTeam, awayTeam, date, market' };
    }

    if (!['raw', 'analysis', 'concise'].includes(tab)) {
      reply.status(400);
      return { error: 'Tab must be one of: raw, analysis, concise' };
    }

    const cached = getCachedPaths(homeTeam, awayTeam, date, market);

    if (tab === 'raw') {
      if (!cached.reportPath) {
        reply.status(404);
        return { error: 'Report not found' };
      }
      const html = await renderCached(cached.reportPath);
      return { html };
    }

    if (tab === 'analysis') {
      if (!cached.analysisPath) {
        reply.status(404);
        return { error: 'Analysis not found' };
      }
      const html = await renderCached(cached.analysisPath);
      return { html };
    }

    // concise
    if (!cached.analysisPath) {
      reply.status(404);
      return { error: 'Analysis not found' };
    }
    const markdown = fs.readFileSync(cached.analysisPath, 'utf8');
    const concise = extractValuePicks(markdown);
    const conciseKey = cached.analysisPath + ':concise';
    const stat = fs.statSync(cached.analysisPath);
    const entry = htmlCache.get(conciseKey);
    let html: string;
    if (entry && entry.mtime === stat.mtimeMs) {
      html = entry.html;
    } else {
      html = wrapTables(await (await getSafeMarked()).parse(concise));
      htmlCache.set(conciseKey, { mtime: stat.mtimeMs, html });
    }
    return { html };
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

/**
 * Extract value picks / recommended bets section from analysis markdown.
 *
 * Strategy:
 * 1. Try to find the "Output" phase (Phase 4) which contains predictions, value picks,
 *    bets to avoid, and caveats — all useful for the concise view.
 * 2. Failing that, find a "Value Picks" or "Recommended Bets" heading and include
 *    everything from there to the end (since these are typically near the end).
 * 3. Fallback: return the last ~30% of the document.
 */
function extractValuePicks(markdown: string): string {
  const lines = markdown.split('\n');

  // Strategy 1: Find "Phase 4 -- Output" or similar output section
  const outputIdx = lines.findIndex((l) =>
    /^#{1,3}\s*(phase\s*4|output)/i.test(l)
  );
  if (outputIdx >= 0) {
    // Include from output phase to end of document (it's the final phase)
    return lines.slice(outputIdx).join('\n');
  }

  // Strategy 2: Find value picks / recommendations heading, include to EOF
  const pickPatterns = [
    /^#{1,4}\s*.*value\s*picks/i,
    /^#{1,4}\s*.*recommended\s*(bets|plays|wagers)/i,
    /^#{1,4}\s*.*top\s*picks/i,
    /^#{1,4}\s*.*best\s*bets/i,
    /^#{1,4}\s*.*final\s*recommendations/i,
    /^#{1,4}\s*.*betting\s*recommendations/i,
    /^#{1,4}\s*.*predictions/i,
  ];

  for (const pattern of pickPatterns) {
    const idx = lines.findIndex((l) => pattern.test(l));
    if (idx >= 0) {
      // Also look backwards for a "Predictions" or "Summary" heading that precedes picks
      let startIdx = idx;
      for (let i = idx - 1; i >= Math.max(0, idx - 30); i--) {
        if (/^#{1,4}\s*(predictions|statistical\s*summary|summary)/i.test(lines[i])) {
          startIdx = i;
          break;
        }
      }
      return lines.slice(startIdx).join('\n');
    }
  }

  // Strategy 3: Fallback to last 30%
  const cutoff = Math.max(0, Math.floor(lines.length * 0.7));
  return lines.slice(cutoff).join('\n');
}
