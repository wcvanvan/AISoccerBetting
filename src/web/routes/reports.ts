/**
 * Reports routes — serve collected data reports and analysis as HTML.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FastifyInstance } from 'fastify';
import { Marked } from 'marked';
import { jobManager } from '../services/job-manager';
import { getCachedPaths, REPORTS_DIR } from '../services/pipeline-service';
import { MarketType } from '../services/job-manager';

/** Marked instance configured to strip raw HTML (XSS prevention) */
const safeMarked = new Marked({
  renderer: {
    html: () => '', // Strip raw HTML blocks
  },
});

/** Server-side cache: rendered HTML keyed by filepath + mtime to avoid re-parsing */
const htmlCache = new Map<string, { mtime: number; html: string }>();

async function renderCached(filePath: string): Promise<string> {
  const stat = fs.statSync(filePath);
  const entry = htmlCache.get(filePath);
  if (entry && entry.mtime === stat.mtimeMs) {
    return entry.html;
  }
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
      html = wrapTables(await safeMarked.parse(concise));
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
      html = wrapTables(await safeMarked.parse(concise));
      htmlCache.set(conciseKey, { mtime: stat.mtimeMs, html });
    }
    return { html };
  });
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
