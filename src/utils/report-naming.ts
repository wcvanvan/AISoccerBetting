/**
 * Report file naming utilities — zero heavy dependencies.
 * Extracted from cli-shared.ts so lightweight consumers (report-paths, Vercel)
 * can resolve report paths without pulling in soccerdata or other heavy dependencies.
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

/** Prediction path: {matchDir}/{market}-prediction.md */
export function buildPredictionFilename(teamA: string, teamB: string, date: string, market: string): string {
  return path.join(buildMatchDir(teamA, teamB, date), `${market}-prediction.md`);
}

/** News path: {matchDir}/news.md */
export function buildNewsFilename(teamA: string, teamB: string, date: string): string {
  return path.join(buildMatchDir(teamA, teamB, date), 'news.md');
}

/** Results path: {matchDir}/{market}-results.md */
export function buildResultsFilename(matchDir: string, market: string): string {
  return path.join(matchDir, `${market}-results.md`);
}

/** Review path: {matchDir}/{market}-review.md */
export function buildReviewFilename(matchDir: string, market: string): string {
  return path.join(matchDir, `${market}-review.md`);
}

