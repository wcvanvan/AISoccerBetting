/**
 * Reports routes — serve collected data reports and analysis as HTML.
 */

import * as fs from 'fs';
import { FastifyInstance } from 'fastify';
import { marked } from 'marked';
import { jobManager } from '../services/job-manager';

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

    const markdown = fs.readFileSync(job.reportPath, 'utf8');
    const html = await marked(markdown);
    return { html, markdown };
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

    const markdown = fs.readFileSync(job.analysisPath, 'utf8');
    const html = await marked(markdown);
    return { html, markdown };
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
    const html = await marked(concise);
    return { html, markdown: concise };
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
