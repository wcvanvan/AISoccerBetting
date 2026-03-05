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
 * Looks for common section headers used in analysis prompts.
 */
function extractValuePicks(markdown: string): string {
  const lines = markdown.split('\n');
  const patterns = [
    /^#{1,3}\s*.*value\s*picks/i,
    /^#{1,3}\s*.*recommended\s*(bets|plays|wagers)/i,
    /^#{1,3}\s*.*top\s*picks/i,
    /^#{1,3}\s*.*best\s*bets/i,
    /^#{1,3}\s*.*final\s*recommendations/i,
    /^#{1,3}\s*.*summary.*recommendations/i,
    /^#{1,3}\s*.*betting\s*recommendations/i,
  ];

  let startIdx = -1;
  let startLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    for (const pattern of patterns) {
      if (pattern.test(lines[i])) {
        startIdx = i;
        const match = lines[i].match(/^(#{1,3})/);
        startLevel = match ? match[1].length : 2;
        break;
      }
    }
    if (startIdx >= 0) break;
  }

  if (startIdx < 0) {
    // Fallback: return the last ~30% of the document (usually where recommendations are)
    const cutoff = Math.max(0, Math.floor(lines.length * 0.7));
    return lines.slice(cutoff).join('\n');
  }

  // Find the end of this section (next heading of same or higher level, or EOF)
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^(#{1,3})\s/);
    if (headingMatch && headingMatch[1].length <= startLevel) {
      endIdx = i;
      break;
    }
  }

  return lines.slice(startIdx, endIdx).join('\n');
}
