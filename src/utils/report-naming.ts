/**
 * Report file naming utilities — zero heavy dependencies.
 * Extracted from cli-shared.ts so lightweight consumers (report-paths, Vercel)
 * can resolve report paths without pulling in LangChain/soccerdata/etc.
 */

import * as path from 'path';

export function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Match directory name: {slug-a}-vs-{slug-b}-{date} */
export function buildMatchDir(teamA: string, teamB: string, date: string): string {
  return `${slug(teamA)}-vs-${slug(teamB)}-${date}`;
}

/** Report path within a match directory: {matchDir}/{market}.md */
export function buildReportFilename(teamA: string, teamB: string, date: string, market: string): string {
  return path.join(buildMatchDir(teamA, teamB, date), `${market}.md`);
}

/** Analysis path: {matchDir}/{market}-analysis.md */
export function buildAnalysisFilename(teamA: string, teamB: string, date: string, market: string): string {
  return path.join(buildMatchDir(teamA, teamB, date), `${market}-analysis.md`);
}

/** News path: {matchDir}/news.md */
export function buildNewsFilename(teamA: string, teamB: string, date: string): string {
  return path.join(buildMatchDir(teamA, teamB, date), 'news.md');
}
