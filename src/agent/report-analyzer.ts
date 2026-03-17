/**
 * Report analyzer: analyses a collected match report to identify value bets.
 *
 * Uses Claude Code CLI (`claude --print`) for analysis.
 */

import { stripCodeFences } from './strip-code-fences';
import { runClaudeCli } from './claude-cli';
import { CORNER_ANALYSIS_SYSTEM_PROMPT } from './prompts/corner-analysis-system-prompt';

const PROGRESS_INTERVAL_SEC = 60;

export interface AnalyzeReportOptions {
  onLog?: (line: string) => void;
}

/**
 * Analyse a match report markdown string and return a human-readable
 * markdown analysis identifying value betting opportunities.
 */
export async function analyzeReport(
  report: string,
  systemPrompt?: string,
  opts?: AnalyzeReportOptions,
): Promise<string> {
  const prompt = systemPrompt ?? CORNER_ANALYSIS_SYSTEM_PROMPT;
  return analyzeViaCli(report, prompt, opts);
}

async function analyzeViaCli(
  report: string,
  systemPrompt: string,
  opts?: AnalyzeReportOptions,
): Promise<string> {
  const cliPrompt = [systemPrompt, '', '---', '', report].join('\n');

  const log = opts?.onLog ?? ((msg: string) => console.error(msg));
  log(`  Analysis via Claude CLI (no timeout, output written on completion)...`);
  const startMs = Date.now();

  const progress = setInterval(() => {
    const elapsed = Math.round((Date.now() - startMs) / 1000);
    log(`  Analysis in progress... ${elapsed}s elapsed`);
  }, PROGRESS_INTERVAL_SEC * 1000);

  try {
    const result = await runClaudeCli(cliPrompt, {
      onLog: opts?.onLog,
    });
    return stripCodeFences(result);
  } finally {
    clearInterval(progress);
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    log(`  Analysis completed in ${elapsed}s`);
  }
}
