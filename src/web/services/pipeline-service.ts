/**
 * PipelineService — orchestrates data collection (direct import) and
 * analysis (unified analyzeReport with LLM_MODE switching) for a given job.
 */

import * as path from 'path';
import * as fs from 'fs';

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
import { buildReportFilename, buildNewsFilename } from '../../utils/report-naming';
import {
  runMatchNews,
  analyzeReport,
  REPORT_ANALYSIS_SYSTEM_PROMPT,
  GOAL_ANALYSIS_SYSTEM_PROMPT,
  CARD_ANALYSIS_SYSTEM_PROMPT,
} from '../../agent';
import { jobManager, Job, MarketType } from './job-manager';
import { REPORTS_DIR } from './report-paths';

interface MarketPipelineConfig {
  marketConfig: MarketConfig;
  formatOptions: Partial<FormatOptions>;
  toolName: string;
  marketLabel: string;
  analysisPrompt: string;
}

const MARKET_CONFIGS: Record<MarketType, MarketPipelineConfig> = {
  corners: {
    marketConfig: CORNER_MARKET_CONFIG,
    formatOptions: { showCorners: true, oddsLabel: 'Corner' },
    toolName: 'corners',
    marketLabel: 'corner',
    analysisPrompt: REPORT_ANALYSIS_SYSTEM_PROMPT,
  },
  goals: {
    marketConfig: GOAL_MARKET_CONFIG,
    formatOptions: { showCorners: false, oddsLabel: 'Goal' },
    toolName: 'goals',
    marketLabel: 'goal',
    analysisPrompt: GOAL_ANALYSIS_SYSTEM_PROMPT,
  },
  cards: {
    marketConfig: CARD_MARKET_CONFIG,
    formatOptions: { showCorners: false, oddsLabel: 'Card' },
    toolName: 'cards',
    marketLabel: 'card',
    analysisPrompt: CARD_ANALYSIS_SYSTEM_PROMPT,
  },
};

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

    // Skip collection if report already cached (e.g. from a previous collect-only run)
    if (!job.reportPath) {
      await collectData(job);
    } else if (job.leagueKey || job.leagueLabel) {
      // Persist league info even when collection was skipped (analysis-only re-run)
      writeMetaJson(path.dirname(job.reportPath), job);
    }

    if (analyze && job.reportPath) {
      await runAnalysis(job);
    } else {
      jobManager.setComplete(job.id);
    }
  } catch (err) {
    const msg = (err instanceof Error) ? err.message : String(err);
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

    // News is shared across all markets — stored once as news.md in the match dir
    const newsRelPath = buildNewsFilename(job.homeTeam, job.awayTeam, job.date);
    const newsPath = path.join(REPORTS_DIR, newsRelPath);
    let matchNewsSummary: string | undefined;

    if (fs.existsSync(newsPath)) {
      matchNewsSummary = fs.readFileSync(newsPath, 'utf8').trim() || undefined;
      if (matchNewsSummary) {
        jobManager.addLog(job.id, 'Loaded cached match news.');
      }
    } else {
      try {
        jobManager.addLog(job.id, 'Fetching match news...');
        const news = await runMatchNews(job.homeTeam, job.awayTeam, job.date);
        const newsDir = path.dirname(newsPath);
        if (!fs.existsSync(newsDir)) fs.mkdirSync(newsDir, { recursive: true });
        fs.writeFileSync(newsPath, news, 'utf8');
        matchNewsSummary = news;
        jobManager.addLog(job.id, 'Match news collected and cached.');
      } catch (err) {
        const msg = (err instanceof Error) ? err.message : String(err);
        jobManager.addLog(job.id, `Match news skipped: ${msg}`);
      }
    }

    const markdown = await collector.collect_data({
      teamA_name: job.homeTeam,
      teamB_name: job.awayTeam,
      match_date: job.date,
      matchNewsSummary,
    });

    const relPath = buildReportFilename(
      job.homeTeam,
      job.awayTeam,
      job.date,
      config.toolName
    );
    const reportPath = path.join(REPORTS_DIR, relPath);
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(reportPath, markdown, 'utf8');

    job.reportPath = reportPath;

    // Write meta.json with league info for history filtering
    writeMetaJson(reportDir, job);

    jobManager.updateStatus(
      job.id,
      'collected',
      `Data report saved (${(markdown.length / 1024).toFixed(0)}KB)`
    );
  } finally {
    provider.dispose();
  }
}

/** Persist league metadata to meta.json in the report directory. */
function writeMetaJson(reportDir: string, job: Job): void {
  if (!job.leagueKey && !job.leagueLabel) return;
  const metaPath = path.join(reportDir, 'meta.json');
  // Read existing meta first, then overlay new league values
  let meta: Record<string, string> = {};
  if (fs.existsSync(metaPath)) {
    try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch {}
  }
  if (job.leagueKey) meta.leagueKey = job.leagueKey;
  if (job.leagueLabel) meta.leagueLabel = job.leagueLabel;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
}

async function runAnalysis(job: Job): Promise<void> {
  jobManager.updateStatus(
    job.id,
    'analyzing',
    'Starting analysis...'
  );

  const config = MARKET_CONFIGS[job.market];
  const analysisPath = job.reportPath!.replace(/\.md$/, '-analysis.md');
  const reportContent = fs.readFileSync(job.reportPath!, 'utf8');

  const analysis = await analyzeReport(
    reportContent,
    config.analysisPrompt,
    { onLog: (line) => jobManager.addLog(job.id, line) },
  );

  fs.writeFileSync(analysisPath, analysis, 'utf8');
  job.analysisPath = analysisPath;
  jobManager.setComplete(job.id);
}
