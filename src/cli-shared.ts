/**
 * Shared CLI logic for both corner and goal pipelines.
 * Each pipeline is a thin wrapper that calls runPipeline() with its config.
 */

import * as path from 'path';
import * as fs from 'fs';

import { configureAnthropicProxy } from './agent/configure-proxy';
import { MatchDataCollector } from './collector';
import { runMatchNews, analyzeReport } from './agent';
import { OddsApiClient, OddsCollector, MarketConfig } from './odds';
import { FormatOptions } from './formatter';
import { SoccerdataProvider } from './provider';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
import { config } from './config';

// ── Pipeline configuration ──────────────────────────────────────────────────

export interface PipelineConfig {
  /** Which odds markets to fetch */
  marketConfig: MarketConfig;
  /** System prompt for analysis */
  analysisPrompt: string;
  /** Format options controlling report output */
  formatOptions: Partial<FormatOptions>;
  /** Tool name for usage text, e.g. "corners" or "goals" */
  toolName: string;
  /** Market label for display, e.g. "Corner" or "Goal" */
  marketLabel: string;
}

function errorMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ── Argument types ──────────────────────────────────────────────────────────

type CollectArgs = {
  mode: 'collect';
  teamA: string;
  teamB: string;
  date: string;
};

type AnalyzeArgs = {
  mode: 'analyze';
  reportPath: string;
};

type NewsArgs = {
  mode: 'news';
  teamA: string;
  teamB: string;
  date: string;
};

type OddsArgs = {
  mode: 'odds';
  teamA?: string;
  teamB?: string;
};

type TestArgs = {
  mode: 'test-connection';
};

type ParsedArgs = CollectArgs | AnalyzeArgs | NewsArgs | OddsArgs | TestArgs | null;

// ── Argument parsing ────────────────────────────────────────────────────────

function parseArgs(toolName: string, marketLabel: string): ParsedArgs {
  const argv = process.argv.slice(2);

  // --analyze <report.md>
  const analyzeIdx = argv.indexOf('--analyze');
  if (analyzeIdx !== -1) {
    const reportPath = argv[analyzeIdx + 1];
    if (!reportPath) {
      console.error('Error: --analyze requires a path to a report file');
      printUsage(toolName, marketLabel);
      return null;
    }
    return { mode: 'analyze', reportPath };
  }

  // --news teamA teamB date
  const newsIdx = argv.indexOf('--news');
  if (newsIdx !== -1) {
    const [teamA, teamB, date] = argv.slice(newsIdx + 1, newsIdx + 4);
    if (!teamA || !teamB || !date) {
      console.error('Error: --news requires three arguments: teamA teamB date');
      printUsage(toolName, marketLabel);
      return null;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('Error: Date must be in ISO format (YYYY-MM-DD)');
      printUsage(toolName, marketLabel);
      return null;
    }
    return { mode: 'news', teamA: teamA.trim(), teamB: teamB.trim(), date: date.trim() };
  }

  // --odds [teamA teamB]
  const oddsIdx = argv.indexOf('--odds');
  if (oddsIdx !== -1) {
    const teamA = argv[oddsIdx + 1]?.trim();
    const teamB = argv[oddsIdx + 2]?.trim();
    return { mode: 'odds', teamA: teamA || undefined, teamB: teamB || undefined };
  }

  // --test-connection
  if (argv.includes('--test-connection')) {
    return { mode: 'test-connection' };
  }

  // collect mode: teamA teamB date
  if (argv.length < 3) {
    console.error('Error: Three arguments required: teamA, teamB, date');
    printUsage(toolName, marketLabel);
    return null;
  }

  const teamA = argv[0]?.trim() ?? '';
  const teamB = argv[1]?.trim() ?? '';
  const date = argv[2]?.trim() ?? '';

  if (!teamA || !teamB) {
    console.error('Error: Team names cannot be empty');
    printUsage(toolName, marketLabel);
    return null;
  }
  if (!date) {
    console.error('Error: Date cannot be empty');
    printUsage(toolName, marketLabel);
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Error: Date must be in ISO format (YYYY-MM-DD)');
    printUsage(toolName, marketLabel);
    return null;
  }

  return { mode: 'collect', teamA, teamB, date };
}

function printUsage(toolName: string, marketLabel: string): void {
  console.log(`
Soccer Betting Analyzer — ${marketLabel} Markets
${'='.repeat(42 + marketLabel.length)}

Usage:
  npm run ${toolName} "TeamA" "TeamB" "YYYY-MM-DD"       Collect data → {slug}-${toolName}.md
  npm run ${toolName}:analyze <report.md>                 Analyse existing report → {slug}-analysis.md
  npm run ${toolName}:news "TeamA" "TeamB" "YYYY-MM-DD"  Fetch match news → {slug}-news.md
  npm run ${toolName}:odds "TeamA" "TeamB"                Fetch ${marketLabel.toLowerCase()} odds for a match
  npm run ${toolName}:odds                                List upcoming events
  npm run test:connection                                 Smoke test Claude API connection

Arguments:
  TeamA  - Name of the first team (e.g., "Manchester United")
  TeamB  - Name of the second team (e.g., "Liverpool")
  date   - Match date in ISO format (e.g., "2026-03-15")

Prerequisites:
  pip install -r scripts/requirements.txt
  API keys configured in .env (see .env.defaults for options)
  `);
}

// ── Filename helpers ────────────────────────────────────────────────────────
// Canonical implementations live in utils/report-naming.ts (no heavy deps).
// Re-exported here for backward compatibility with existing callers.

export { slug, buildMatchDir, buildReportFilename } from './utils/report-naming';

import {
  buildReportFilename as _buildReportFilename,
  buildAnalysisFilename as _buildAnalysisFilename,
  buildNewsFilename as _buildNewsFilename,
} from './utils/report-naming';

// ── Analysis runner ─────────────────────────────────────────────────────────

async function runAnalysis(
  reportMarkdown: string,
  analysisFilename: string,
  systemPrompt: string,
  marketLabel: string,
): Promise<void> {
  console.log(`Running ${marketLabel.toLowerCase()} betting analysis with Opus...`);
  const analysis = await analyzeReport(reportMarkdown, systemPrompt);
  fs.writeFileSync(analysisFilename, analysis, 'utf8');
  console.log(`Analysis saved → ${analysisFilename}`);
}

// ── Odds helpers ────────────────────────────────────────────────────────────

async function showOdds(
  apiKey: string,
  teamA: string,
  teamB: string,
  marketConfig: MarketConfig,
): Promise<void> {
  const collector = new OddsCollector(apiKey, marketConfig);
  const result = await collector.collectOdds(teamA, teamB);

  if (!result.found) {
    console.log(`No event found for "${teamA}" vs "${teamB}".`);
    console.log('Run without team names to list available events.');
    return;
  }

  console.log(`\n${result.homeTeam} vs ${result.awayTeam}\n`);

  if (result.markets.length === 0) {
    console.log(`No ${marketConfig.label.toLowerCase()} markets available yet.`);
    return;
  }

  for (const market of result.markets) {
    console.log(`${market.key}`);
    const w = { bm: 22, outcome: 16, line: 8 };
    console.log(`  ${'Bookmaker'.padEnd(w.bm)}${'Outcome'.padEnd(w.outcome)}${'Line'.padEnd(w.line)}Odds`);
    console.log(`  ${'─'.repeat(w.bm + w.outcome + w.line + 6)}`);
    for (const bm of market.bookmakers) {
      for (const o of bm.outcomes) {
        const line = o.point !== undefined ? String(o.point) : '—';
        console.log(`  ${bm.name.padEnd(w.bm)}${o.name.padEnd(w.outcome)}${line.padEnd(w.line)}${o.price.toFixed(2)}`);
      }
    }
    console.log();
  }
}

async function listOddsEvents(apiKey: string): Promise<void> {
  const rawKeys = process.env.ODDS_SPORT_KEYS?.trim();
  const sportKeys = rawKeys
    ? rawKeys.split(',').map(s => s.trim()).filter(Boolean)
    : ['soccer_epl', 'soccer_fa_cup', 'soccer_uefa_champs_league', 'soccer_france_ligue_one'];

  const client = new OddsApiClient(apiKey);

  for (const sportKey of sportKeys) {
    let events;
    try { events = await client.getEvents(sportKey); }
    catch (err) { console.warn(`[skip] ${sportKey}: ${errorMsg(err)}`); continue; }
    if (events.length === 0) continue;

    console.log(`\n${sportKey}:`);
    for (const e of events) {
      console.log(`  ${e.commence_time.slice(0, 10)}  ${e.home_team} vs ${e.away_team}`);
    }
  }
}

// ── Test connection ─────────────────────────────────────────────────────────

async function testConnection(): Promise<void> {
  const apiKey = config.anthropicApiKey;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY is not set in .env');
    process.exit(1);
  }
  const model = config.analysis.model;
  console.log(`Testing connection to ${model}...`);
  const start = Date.now();
  try {
    const llm = new ChatAnthropic({ model, apiKey });
    const result = await llm.invoke([new HumanMessage('Reply with "ok".')]);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const content =
      typeof result.content === 'string'
        ? result.content.trim()
        : JSON.stringify(result.content);
    console.log(`OK — ${model} responded in ${elapsed}s`);
    console.log(`Response: "${content}"`);
    process.exit(0);
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const msg = errorMsg(err);
    console.error(`FAILED after ${elapsed}s: ${msg}`);
    process.exit(1);
  }
}

// ── Main pipeline ───────────────────────────────────────────────────────────

export async function runPipeline(pipelineConfig: PipelineConfig): Promise<void> {
  configureAnthropicProxy();

  const {
    marketConfig,
    analysisPrompt,
    formatOptions,
    toolName,
    marketLabel,
  } = pipelineConfig;

  const args = parseArgs(toolName, marketLabel);
  if (!args) {
    process.exit(1);
  }

  // ── Standalone analysis mode ──
  if (args.mode === 'analyze') {
    const reportPath = path.resolve(args.reportPath);
    if (!fs.existsSync(reportPath)) {
      console.error(`Error: File not found: ${reportPath}`);
      process.exit(1);
    }
    const reportMarkdown = fs.readFileSync(reportPath, 'utf8');
    const analysisFilename = reportPath.replace(/\.md$/, '-analysis.md');
    try {
      await runAnalysis(reportMarkdown, analysisFilename, analysisPrompt, marketLabel);
      process.exit(0);
    } catch (err) {
      const msg = errorMsg(err);
      console.error(`Analysis failed: ${msg}`);
      process.exit(1);
    }
  }

  // ── Standalone match news mode ──
  if (args.mode === 'news') {
    const newsFilename = _buildNewsFilename(args.teamA, args.teamB, args.date);
    const newsDir = path.dirname(newsFilename);
    if (!fs.existsSync(newsDir)) fs.mkdirSync(newsDir, { recursive: true });
    try {
      console.log(`Fetching match news for ${args.teamA} vs ${args.teamB}...`);
      const news = await runMatchNews(args.teamA, args.teamB, args.date);
      fs.writeFileSync(newsFilename, news, 'utf8');
      console.log(`Match news saved → ${newsFilename}`);
      process.exit(0);
    } catch (err) {
      const msg = errorMsg(err);
      console.error(`Match news failed: ${msg}`);
      process.exit(1);
    }
  }

  // ── Standalone odds mode ──
  if (args.mode === 'odds') {
    const apiKey = process.env.THE_ODDS_API_KEY?.trim();
    if (!apiKey) {
      console.error('Error: THE_ODDS_API_KEY is not set in .env');
      process.exit(1);
    }
    try {
      if (args.teamA && args.teamB) {
        await showOdds(apiKey, args.teamA, args.teamB, marketConfig);
      } else {
        await listOddsEvents(apiKey);
      }
      process.exit(0);
    } catch (err) {
      const msg = errorMsg(err);
      console.error(`Odds lookup failed: ${msg}`);
      process.exit(1);
    }
  }

  // ── Connection smoke test ──
  if (args.mode === 'test-connection') {
    await testConnection();
    return;
  }

  // ── Full collection mode ──
  const provider = new SoccerdataProvider();
  try {
    const collector = new MatchDataCollector(provider, marketConfig, formatOptions);

    let matchNewsSummary: string | undefined;
    if (config.matchNewsFetching) {
      try {
        matchNewsSummary = await runMatchNews(args.teamA, args.teamB, args.date);
      } catch (err) {
        const msg = errorMsg(err);
        console.error(`Match news skipped: ${msg}`);
      }
    }

    const markdown = await collector.collect_data({
      teamA_name: args.teamA,
      teamB_name: args.teamB,
      match_date: args.date,
      matchNewsSummary,
    });

    const reportFilename = _buildReportFilename(args.teamA, args.teamB, args.date, toolName);
    const reportDir = path.dirname(reportFilename);
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(reportFilename, markdown, 'utf8');
    console.log(`Report saved → ${reportFilename}`);

    if (config.analysisEnabled) {
      try {
        const analysisFilename = _buildAnalysisFilename(args.teamA, args.teamB, args.date, toolName);
        await runAnalysis(markdown, analysisFilename, analysisPrompt, marketLabel);
      } catch (err) {
        const msg = errorMsg(err);
        console.error(`Analysis skipped: ${msg}`);
      }
    }

    provider.dispose();
    process.exit(0);
  } catch (error) {
    provider.dispose();
    console.error('\nERROR: Failed to collect data\n');

    if (error instanceof Error) {
      console.error(`Message: ${error.message}\n`);
      if (process.env.DEBUG) {
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`Unknown error: ${String(error)}\n`);
    }

    console.error('Please check:');
    console.error('  - Team names are spelled correctly');
    console.error('  - Date is in ISO format (YYYY-MM-DD)');
    console.error('  - Python 3 + soccerdata are installed (pip install -r scripts/requirements.txt)');
    console.error('  - You have an active internet connection\n');

    process.exit(1);
  }
}
