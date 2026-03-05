/**
 * PipelineService — orchestrates data collection (direct import) and
 * analysis (Claude Code CLI shell-out) for a given job.
 */

import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

import { configureAnthropicProxy } from '../../agent/configure-proxy';
import { MatchDataCollector } from '../../collector';
import { SoccerdataProvider } from '../../provider';
import {
  CORNER_MARKET_CONFIG,
  GOAL_MARKET_CONFIG,
  CARD_MARKET_CONFIG,
  MarketConfig,
} from '../../odds';
import { FormatOptions } from '../../formatter';
import { buildReportFilename } from '../../cli-shared';
import { jobManager, Job, MarketType } from './job-manager';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'data', 'reports');

interface MarketPipelineConfig {
  marketConfig: MarketConfig;
  formatOptions: Partial<FormatOptions>;
  toolName: string;
  marketLabel: string;
}

const MARKET_CONFIGS: Record<MarketType, MarketPipelineConfig> = {
  corners: {
    marketConfig: CORNER_MARKET_CONFIG,
    formatOptions: { showCorners: true, oddsLabel: 'Corner' },
    toolName: 'corners',
    marketLabel: 'corner',
  },
  goals: {
    marketConfig: GOAL_MARKET_CONFIG,
    formatOptions: { showCorners: false, oddsLabel: 'Goal' },
    toolName: 'goals',
    marketLabel: 'goal',
  },
  cards: {
    marketConfig: CARD_MARKET_CONFIG,
    formatOptions: { showCorners: false, oddsLabel: 'Card' },
    toolName: 'cards',
    marketLabel: 'card',
  },
};

/** Check if cached report/analysis files exist on disk for a given match+market. */
export function getCachedPaths(
  homeTeam: string,
  awayTeam: string,
  date: string,
  market: MarketType
): { reportPath: string | null; analysisPath: string | null } {
  const config = MARKET_CONFIGS[market];
  const filename = buildReportFilename(homeTeam, awayTeam, date, config.toolName);

  // Check data/reports/ first, then project root (CLI-generated reports)
  const candidates = [
    path.join(REPORTS_DIR, filename),
    path.join(PROJECT_ROOT, filename),
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

/** Run the full pipeline for a job: collect data, then optionally analyze. */
export async function runPipelineForJob(
  job: Job,
  analyze: boolean
): Promise<void> {
  configureAnthropicProxy();

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  try {
    await jobManager.enqueue(job.id);

    await collectData(job);

    if (analyze && job.reportPath) {
      await runAnalysis(job);
    } else {
      jobManager.setComplete(job.id);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    jobManager.setError(job.id, msg);
  } finally {
    jobManager.dequeue();
  }
}

async function collectData(job: Job): Promise<void> {
  jobManager.updateStatus(
    job.id,
    'collecting',
    `Collecting ${job.market} data for ${job.homeTeam} vs ${job.awayTeam}...`
  );

  const config = MARKET_CONFIGS[job.market];
  const provider = new SoccerdataProvider();

  try {
    const collector = new MatchDataCollector(
      provider,
      config.marketConfig,
      config.formatOptions
    );

    jobManager.addLog(job.id, 'Resolving team IDs and fetching match data...');

    const markdown = await collector.collect_data({
      teamA_name: job.homeTeam,
      teamB_name: job.awayTeam,
      match_date: job.date,
    });

    const filename = buildReportFilename(
      job.homeTeam,
      job.awayTeam,
      job.date,
      config.toolName
    );
    const reportPath = path.join(REPORTS_DIR, filename);
    fs.writeFileSync(reportPath, markdown, 'utf8');

    job.reportPath = reportPath;
    jobManager.updateStatus(
      job.id,
      'collected',
      `Data report saved (${(markdown.length / 1024).toFixed(0)}KB)`
    );
  } finally {
    provider.dispose();
  }
}

async function runAnalysis(job: Job): Promise<void> {
  jobManager.updateStatus(
    job.id,
    'analyzing',
    'Starting analysis via Claude Code agent...'
  );

  const config = MARKET_CONFIGS[job.market];
  const analysisPath = job.reportPath!.replace(/\.md$/, '-analysis.md');
  const reportContent = fs.readFileSync(job.reportPath!, 'utf8');

  // Pipe full report content via stdin since --print mode cannot access local files
  const prompt = [
    `You are a professional soccer betting analyst specializing in ${config.marketLabel} markets.`,
    `Analyze the following match data report and produce a comprehensive betting analysis.`,
    `Focus on identifying value bets with clear statistical reasoning.`,
    `Structure your output with these sections:`,
    `- Statistical Analysis (key metrics, trends)`,
    `- Predictions (expected outcomes with probabilities)`,
    `- Value Picks (specific bets with edge calculations)`,
    `- Bets to Avoid`,
    ``,
    `Here is the match data report:`,
    ``,
    reportContent,
  ].join('\n');

  return new Promise<void>((resolve, reject) => {
    // Use --print and pipe prompt via stdin to avoid OS arg length limits
    const child = spawn(
      'claude',
      ['--print', '--output-format', 'text'],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    let stdout = '';
    let timedOut = false;

    // 10-minute timeout
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, 10 * 60 * 1000);

    // Send prompt via stdin
    child.stdin.write(prompt);
    child.stdin.end();

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text) {
        jobManager.addLog(job.id, text);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Claude Code CLI not found. Install it: npm install -g @anthropic-ai/claude-code. ${err.message}`
        )
      );
    });

    child.on('exit', (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        reject(new Error('Analysis timed out after 10 minutes'));
        return;
      }

      // Claude --print outputs the analysis to stdout; save it
      if (stdout.trim()) {
        fs.writeFileSync(analysisPath, stdout.trim(), 'utf8');
      }

      if (fs.existsSync(analysisPath)) {
        job.analysisPath = analysisPath;
        jobManager.setComplete(job.id);
        resolve();
      } else if (code !== 0) {
        reject(
          new Error(`Claude Code exited with code ${code}`)
        );
      } else {
        reject(new Error('Analysis produced no output'));
      }
    });
  });
}
