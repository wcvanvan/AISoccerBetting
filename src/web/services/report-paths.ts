/**
 * Lightweight report path resolution — no heavy pipeline dependencies.
 * Used by readonly routes (reports, history) to find cached report files.
 */

import * as path from 'path';
import * as fs from 'fs';

import { buildReportFilename, buildMatchDir } from '../../cli-shared';
import { MarketType } from './job-manager';

export { buildReportFilename, buildMatchDir };

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
export const REPORTS_DIR = path.join(PROJECT_ROOT, 'data', 'reports');

/** Minimal market config — only the fields needed for path resolution. */
const MARKET_TOOL_NAMES: Record<MarketType, string> = {
  corners: 'corners',
  goals: 'goals',
  cards: 'cards',
};

/** Check if cached report/analysis files exist on disk for a given match+market. */
export function getCachedPaths(
  homeTeam: string,
  awayTeam: string,
  date: string,
  market: MarketType
): { reportPath: string | null; analysisPath: string | null } {
  const toolName = MARKET_TOOL_NAMES[market];
  // New layout: data/reports/{matchDir}/{market}.md
  const relPath = buildReportFilename(homeTeam, awayTeam, date, toolName);
  // Old flat layout: data/reports/{slug}-vs-{slug}-{date}-{market}.md
  const matchDir = buildMatchDir(homeTeam, awayTeam, date);
  const oldFlat = `${matchDir}-${toolName}.md`;

  const candidates = [
    path.join(REPORTS_DIR, relPath),
    path.join(REPORTS_DIR, oldFlat),
    path.join(PROJECT_ROOT, oldFlat),
  ];

  for (const reportPath of candidates) {
    if (fs.existsSync(reportPath)) {
      const analysisPath = reportPath.replace(/\.md$/, '-analysis.md');
      return {
        reportPath,
        analysisPath: fs.existsSync(analysisPath) ? analysisPath : null,
      };
    }
  }

  return { reportPath: null, analysisPath: null };
}
