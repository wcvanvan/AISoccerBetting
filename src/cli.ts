#!/usr/bin/env node

/**
 * CLI interface for ESPN Corner Data Collector
 */

import * as path from 'path';
import * as fs from 'fs';
import { config as loadEnv } from 'dotenv';

// Load shared defaults first, then local secrets (local wins on conflicts)
loadEnv({ path: path.join(process.cwd(), '.env.defaults') });
loadEnv({ path: path.join(process.cwd(), '.env'), override: true });

import { configureAnthropicProxy } from './agent/configure-proxy';
import { CornerDataCollector } from './collector';
import { ConfigLoader } from './config';
import { runMatchNews, analyzeReport } from './agent';
import { OddsApiClient, OddsCollector } from './odds';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';

configureAnthropicProxy();

// ── Argument parsing ──────────────────────────────────────────────────────────

type CollectArgs = {
  mode: 'collect';
  teamA: string;
  teamB: string;
  date: string;
  configPath?: string;
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

function parseArgs(): ParsedArgs {
  const argv = process.argv.slice(2);

  // --analyze <report.md>  — run analysis only on an existing report
  const analyzeIdx = argv.indexOf('--analyze');
  if (analyzeIdx !== -1) {
    const reportPath = argv[analyzeIdx + 1];
    if (!reportPath) {
      console.error('Error: --analyze requires a path to a report file');
      printUsage();
      return null;
    }
    return { mode: 'analyze', reportPath };
  }

  // --news teamA teamB date  — fetch match news only
  const newsIdx = argv.indexOf('--news');
  if (newsIdx !== -1) {
    const [teamA, teamB, date] = argv.slice(newsIdx + 1, newsIdx + 4);
    if (!teamA || !teamB || !date) {
      console.error('Error: --news requires three arguments: teamA teamB date');
      printUsage();
      return null;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('Error: Date must be in ISO format (YYYY-MM-DD)');
      printUsage();
      return null;
    }
    return { mode: 'news', teamA: teamA.trim(), teamB: teamB.trim(), date: date.trim() };
  }

  // --odds [teamA teamB]  — fetch corner odds or list events
  const oddsIdx = argv.indexOf('--odds');
  if (oddsIdx !== -1) {
    const teamA = argv[oddsIdx + 1]?.trim();
    const teamB = argv[oddsIdx + 2]?.trim();
    return { mode: 'odds', teamA: teamA || undefined, teamB: teamB || undefined };
  }

  // --test-connection  — smoke test the Claude analysis model
  if (argv.includes('--test-connection')) {
    return { mode: 'test-connection' };
  }

  // --init-config [path]
  if (argv[0] === '--init-config') {
    const configOutputPath = argv[1] || 'espn-collector.config.json';
    ConfigLoader.createSampleConfig(configOutputPath);
    return null;
  }

  // collect mode: teamA teamB date [--config path]
  let args = [...argv];
  let configPath: string | undefined;
  let i = 0;
  while (i < args.length) {
    if ((args[i] === '--config' || args[i] === '-c') && args[i + 1]) {
      configPath = args[i + 1];
      args.splice(i, 2);
    } else {
      i++;
    }
  }

  if (args.length < 3) {
    console.error('Error: Three arguments required: teamA, teamB, date');
    printUsage();
    return null;
  }

  const teamA = args[0]?.trim() ?? '';
  const teamB = args[1]?.trim() ?? '';
  const date = args[2]?.trim() ?? '';

  if (!teamA || !teamB) {
    console.error('Error: Team names cannot be empty');
    printUsage();
    return null;
  }
  if (!date) {
    console.error('Error: Date cannot be empty');
    printUsage();
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Error: Date must be in ISO format (YYYY-MM-DD)');
    printUsage();
    return null;
  }

  return { mode: 'collect', teamA, teamB, date, configPath };
}

function printUsage(): void {
  console.log(`
ESPN Corner Data Collector
==========================

Usage:
  npm start <teamA> <teamB> <date> [options]   Collect data → {slug}.md
  npm run analyze <report.md>                  Analyse existing report → {slug}-analysis.md
  npm run news <teamA> <teamB> <date>          Fetch match news → {slug}-news.md
  npm run odds <teamA> <teamB>                 Fetch corner odds for a match
  npm run odds                                 List upcoming events
  npm run test:connection                      Smoke test Claude API connection
  npm start --init-config [<path>]             Create a sample config file

Arguments:
  teamA  - Name of the first team (e.g., "Manchester United")
  teamB  - Name of the second team (e.g., "Liverpool")
  date   - Match date in ISO format (e.g., "2026-03-15")

Options:
  --config, -c <path>  Path to configuration file

Examples:
  npm start "Wolverhampton" "Aston Villa" "2026-02-27"
  npm run analyze wolverhampton-vs-aston-villa-2026-02-27.md
  npm run news "Wolverhampton" "Aston Villa" "2026-02-27"
  npm run odds "Wolverhampton" "Aston Villa"

Environment (see .env.defaults for all):
  MATCH_NEWS_FETCHING=true  Fetch live match news via Claude + Tavily
  ANALYSIS_ENABLED=true     Auto-run analysis after data collection
  ANALYSIS_MODEL            Claude model for analysis (default: claude-opus-4-6)
  ANALYSIS_TIMEOUT          Timeout in seconds
  THE_ODDS_API_KEY          Required for odds lookup
  `);
}

// ── Filename helpers ──────────────────────────────────────────────────────────

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function buildReportFilename(teamA: string, teamB: string, date: string): string {
  return `${slug(teamA)}-vs-${slug(teamB)}-${date}.md`;
}

function buildAnalysisFilename(reportFilename: string): string {
  return reportFilename.replace(/\.md$/, '-analysis.md');
}

function buildNewsFilename(teamA: string, teamB: string, date: string): string {
  return `${slug(teamA)}-vs-${slug(teamB)}-${date}-news.md`;
}

// ── Analysis runner ───────────────────────────────────────────────────────────

async function runAnalysis(reportMarkdown: string, analysisFilename: string): Promise<void> {
  console.log('Running corner betting analysis with Opus...');
  const analysis = await analyzeReport(reportMarkdown);
  fs.writeFileSync(analysisFilename, analysis, 'utf8');
  console.log(`Analysis saved → ${analysisFilename}`);
}

// ── Odds helpers ─────────────────────────────────────────────────────────────

async function showCornerOdds(apiKey: string, teamA: string, teamB: string): Promise<void> {
  const collector = new OddsCollector(apiKey);
  const result = await collector.collectCornerOdds(teamA, teamB);

  if (!result.found) {
    console.log(`No event found for "${teamA}" vs "${teamB}".`);
    console.log('Run without team names to list available events.');
    return;
  }

  console.log(`\n${result.homeTeam} vs ${result.awayTeam}\n`);

  if (result.markets.length === 0) {
    console.log('No corner markets available yet.');
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
    : ['soccer_epl', 'soccer_uefa_champs_league'];

  const client = new OddsApiClient(apiKey);

  for (const sportKey of sportKeys) {
    let events;
    try { events = await client.getEvents(sportKey); }
    catch (err) { console.warn(`[skip] ${sportKey}: ${err instanceof Error ? err.message : err}`); continue; }
    if (events.length === 0) continue;

    console.log(`\n${sportKey}:`);
    for (const e of events) {
      console.log(`  ${e.commence_time.slice(0, 10)}  ${e.home_team} vs ${e.away_team}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();
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
    const analysisFilename = buildAnalysisFilename(reportPath);
    try {
      await runAnalysis(reportMarkdown, analysisFilename);
      process.exit(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Analysis failed: ${msg}`);
      process.exit(1);
    }
  }

  // ── Standalone match news mode ──
  if (args.mode === 'news') {
    const newsFilename = buildNewsFilename(args.teamA, args.teamB, args.date);
    try {
      console.log(`Fetching match news for ${args.teamA} vs ${args.teamB}...`);
      const news = await runMatchNews(args.teamA, args.teamB, args.date);
      fs.writeFileSync(newsFilename, news, 'utf8');
      console.log(`Match news saved → ${newsFilename}`);
      process.exit(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
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
        await showCornerOdds(apiKey, args.teamA, args.teamB);
      } else {
        await listOddsEvents(apiKey);
      }
      process.exit(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Odds lookup failed: ${msg}`);
      process.exit(1);
    }
  }

  // ── Connection smoke test ──
  if (args.mode === 'test-connection') {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      console.error('Error: ANTHROPIC_API_KEY is not set in .env');
      process.exit(1);
    }
    const model = process.env.ANALYSIS_MODEL?.trim() || 'claude-opus-4-6';
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
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`FAILED after ${elapsed}s: ${msg}`);
      process.exit(1);
    }
  }

  // ── Full collection mode ──
  try {
    const configLoader = new ConfigLoader(args.configPath);
    const config = configLoader.getConfig();
    const collector = new CornerDataCollector(config);

    let matchNewsSummary: string | undefined;
    const useMatchNews =
      process.env.MATCH_NEWS_FETCHING === 'true' || process.env.MATCH_NEWS_FETCHING === '1';
    if (useMatchNews) {
      try {
        matchNewsSummary = await runMatchNews(args.teamA, args.teamB, args.date);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Match news skipped: ${msg}`);
      }
    }

    const markdown = await collector.collect_data({
      teamA_name: args.teamA,
      teamB_name: args.teamB,
      match_date: args.date,
      matchNewsSummary,
    });

    const reportFilename = buildReportFilename(args.teamA, args.teamB, args.date);
    fs.writeFileSync(reportFilename, markdown, 'utf8');
    console.log(`Report saved → ${reportFilename}`);

    const useAnalysis =
      process.env.ANALYSIS_ENABLED === 'true' || process.env.ANALYSIS_ENABLED === '1';
    if (useAnalysis) {
      try {
        const analysisFilename = buildAnalysisFilename(reportFilename);
        await runAnalysis(markdown, analysisFilename);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Analysis skipped: ${msg}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR: Failed to collect data\n');

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
    console.error('  - You have an active internet connection');
    console.error('  - ESPN API is accessible\n');

    process.exit(1);
  }
}

main();
