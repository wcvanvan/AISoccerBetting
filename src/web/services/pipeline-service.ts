/**
 * PipelineService — orchestrates data collection (direct import) and
 * analysis (Claude Code CLI shell-out) for a given job.
 */

import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

import { MatchDataCollector } from '../../collector';
import { SoccerdataProvider } from '../../provider';
import {
  CORNER_MARKET_CONFIG,
  GOAL_MARKET_CONFIG,
  CARD_MARKET_CONFIG,
  MarketConfig,
} from '../../odds';
import { FormatOptions } from '../../formatter';
import { jobManager, Job, MarketType } from './job-manager';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'data', 'reports');

interface MarketPipelineConfig {
  marketConfig: MarketConfig;
  formatOptions: Partial<FormatOptions>;
  toolName: string;
}

const MARKET_CONFIGS: Record<MarketType, MarketPipelineConfig> = {
  corners: {
    marketConfig: CORNER_MARKET_CONFIG,
    formatOptions: { showCorners: true, oddsLabel: 'Corner' },
    toolName: 'corners',
  },
  goals: {
    marketConfig: GOAL_MARKET_CONFIG,
    formatOptions: { showCorners: false, oddsLabel: 'Goal' },
    toolName: 'goals',
  },
  cards: {
    marketConfig: CARD_MARKET_CONFIG,
    formatOptions: { showCorners: false, oddsLabel: 'Card' },
    toolName: 'cards',
  },
};

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function buildReportFilename(
  teamA: string,
  teamB: string,
  date: string,
  toolName: string
): string {
  return `${slug(teamA)}-vs-${slug(teamB)}-${date}-${toolName}.md`;
}

/** Run the full pipeline for a job: collect data, then optionally analyze. */
export async function runPipelineForJob(
  job: Job,
  analyze: boolean
): Promise<void> {
  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  try {
    await jobManager.enqueue(job.id);

    // Phase 1: Data collection
    await collectData(job);

    // Phase 2: Analysis (if requested)
    if (analyze && job.reportPath) {
      await runAnalysis(job);
    } else if (!analyze) {
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

    jobManager.addLog(job.id, 'Fetching team data from ESPN...');

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

  const analysisPath = job.reportPath!.replace(/\.md$/, '-analysis.md');
  const reportContent = fs.readFileSync(job.reportPath!, 'utf8');

  const marketLabel =
    job.market === 'goals'
      ? 'goal'
      : job.market === 'corners'
      ? 'corner'
      : 'card';

  const prompt = [
    `Read the match data report below and write a comprehensive ${marketLabel} market betting analysis.`,
    `Save the analysis to the file: ${analysisPath}`,
    ``,
    `The report content:`,
    ``,
    reportContent,
  ].join('\n');

  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      'claude',
      ['--print', '--output-format', 'text', prompt],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    let stdout = '';

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
      reject(
        new Error(
          `Claude Code CLI not found. Install it with: npm install -g @anthropic-ai/claude-code. Error: ${err.message}`
        )
      );
    });

    child.on('exit', (code) => {
      if (stdout.trim()) {
        fs.writeFileSync(analysisPath, stdout.trim(), 'utf8');
      }

      if (fs.existsSync(analysisPath)) {
        job.analysisPath = analysisPath;
        jobManager.setComplete(job.id);
        resolve();
      } else if (code !== 0) {
        reject(
          new Error(`Claude Code exited with code ${code}. Analysis file was not created.`)
        );
      } else {
        reject(new Error('Analysis file was not created'));
      }
    });
  });
}
