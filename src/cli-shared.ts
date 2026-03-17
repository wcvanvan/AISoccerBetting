/**
 * Shared CLI logic for both corner and goal pipelines.
 * Each pipeline is a thin wrapper that calls runPipeline() with its config.
 */

import * as path from 'path';
import * as fs from 'fs';

const REPORTS_DIR = path.join(__dirname, '..', 'data', 'reports');

import { MatchDataCollector } from './collector';
import { runMatchNews, runCornerOdds, analyzeReport } from './agent';
import { OddsApiClient, OddsCollector, MarketConfig, getLeagueLabel, resolveSportKeys } from './odds';
import { OddsEvent } from './odds/types';
import * as readline from 'readline';
import { FormatOptions } from './formatter';
import { SoccerdataProvider } from './provider';
import { config } from './config';

// ── Pipeline configuration ──────────────────────────────────────────────────

export interface PipelineConfig {
  /** Which odds markets to fetch */
  marketConfig: MarketConfig;
  /** System prompt for analysis */
  analysisPrompt: string;
  /** Narrative prompt for post-game results collection (via Claude CLI) */
  resultsNarrativePrompt: string;
  /** System prompt for review/reflection generation */
  reviewPrompt: string;
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
};

type AnalyzeArgs = {
  mode: 'analyze';
  reportPath: string;
};

type NewsArgs = {
  mode: 'news';
  teamA: string;
  teamB: string;
};

type OddsArgs = {
  mode: 'odds';
  teamA?: string;
  teamB?: string;
};

type CornerOddsArgs = {
  mode: 'corner-odds';
  teamA: string;
  teamB: string;
};

type ResultsArgs = {
  mode: 'results';
  matchDir: string;
};

type ReviewArgs = {
  mode: 'review';
  matchDir: string;
};

type ParsedArgs = CollectArgs | AnalyzeArgs | NewsArgs | OddsArgs | CornerOddsArgs | ResultsArgs | ReviewArgs | null;

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

  // --news teamA teamB
  const newsIdx = argv.indexOf('--news');
  if (newsIdx !== -1) {
    const [teamA, teamB] = argv.slice(newsIdx + 1, newsIdx + 3);
    if (!teamA || !teamB) {
      console.error('Error: --news requires two arguments: teamA teamB');
      printUsage(toolName, marketLabel);
      return null;
    }
    return { mode: 'news', teamA: teamA.trim(), teamB: teamB.trim() };
  }

  // --corner-odds teamA teamB
  const cornerOddsIdx = argv.indexOf('--corner-odds');
  if (cornerOddsIdx !== -1) {
    const [teamA, teamB] = argv.slice(cornerOddsIdx + 1, cornerOddsIdx + 3);
    if (!teamA || !teamB) {
      console.error('Error: --corner-odds requires two arguments: teamA teamB');
      printUsage(toolName, marketLabel);
      return null;
    }
    return { mode: 'corner-odds', teamA: teamA.trim(), teamB: teamB.trim() };
  }

  // --odds [teamA teamB]
  const oddsIdx = argv.indexOf('--odds');
  if (oddsIdx !== -1) {
    const teamA = argv[oddsIdx + 1]?.trim();
    const teamB = argv[oddsIdx + 2]?.trim();
    return { mode: 'odds', teamA: teamA || undefined, teamB: teamB || undefined };
  }

  // --results <match-dir>
  const resultsIdx = argv.indexOf('--results');
  if (resultsIdx !== -1) {
    const matchDir = argv[resultsIdx + 1];
    if (!matchDir) {
      console.error('Error: --results requires a match directory name (e.g. "man-united-vs-liverpool-2026-03-15")');
      printUsage(toolName, marketLabel);
      return null;
    }
    return { mode: 'results', matchDir: matchDir.trim() };
  }

  // --review <match-dir>
  const reviewIdx = argv.indexOf('--review');
  if (reviewIdx !== -1) {
    const matchDir = argv[reviewIdx + 1];
    if (!matchDir) {
      console.error('Error: --review requires a match directory name (e.g. "man-united-vs-liverpool-2026-03-15")');
      printUsage(toolName, marketLabel);
      return null;
    }
    return { mode: 'review', matchDir: matchDir.trim() };
  }

  // collect mode: teamA teamB
  if (argv.length < 2) {
    console.error('Error: Two arguments required: teamA, teamB');
    printUsage(toolName, marketLabel);
    return null;
  }

  const teamA = argv[0]?.trim() ?? '';
  const teamB = argv[1]?.trim() ?? '';

  if (!teamA || !teamB) {
    console.error('Error: Team names cannot be empty');
    printUsage(toolName, marketLabel);
    return null;
  }

  return { mode: 'collect', teamA, teamB };
}

function printUsage(toolName: string, marketLabel: string): void {
  console.log(`
Soccer Betting Analyzer — ${marketLabel} Markets
${'='.repeat(42 + marketLabel.length)}

Usage:
  npm run ${toolName} "TeamA" "TeamB"             Collect data (date auto-resolved from Odds API)
  npm run ${toolName}:analyze <report.md>         Analyse existing report → {slug}-analysis.md
  npm run ${toolName}:news "TeamA" "TeamB"        Fetch match news → {slug}-news.md
  npm run ${toolName}:odds "TeamA" "TeamB"        ${toolName === 'corners' ? 'Collect corner odds via agent (API + sportsbooks)' : `Fetch ${marketLabel.toLowerCase()} odds for a match`}${toolName !== 'corners' ? `
  npm run ${toolName}:odds                        List upcoming events` : ''}
  npm run ${toolName}:results <match-dir>         Collect post-game results (soccerdata + CLI narrative)
  npm run ${toolName}:review <match-dir>          Generate review (compare forecast vs actuals)

Arguments:
  TeamA      - Name of the first team (e.g., "Manchester United")
  TeamB      - Name of the second team (e.g., "Liverpool")
  match-dir  - Match directory name (e.g., "man-united-vs-liverpool-2026-03-15")

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
  buildMatchDir,
  buildReportFilename as _buildReportFilename,
  buildAnalysisFilename as _buildAnalysisFilename,
  buildNewsFilename as _buildNewsFilename,
  buildResultsFilename as _buildResultsFilename,
  buildReviewFilename as _buildReviewFilename,
} from './utils/report-naming';
import { collectMatchResults, type MatchMeta } from './collector/match-results-collector';

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
  const sportKeys = resolveSportKeys();
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

// ── Event resolution ─────────────────────────────────────────────────────────

interface ResolvedEvent {
  event: OddsEvent;
  sportKey: string;
  commenceTime: string;
  date: string;
  leagueKey: string;
  leagueLabel: string;
}

/** Prompt the user to pick one of several matches. */
function promptUserChoice(matches: { event: OddsEvent; sportKey: string }[]): Promise<number> {
  return new Promise((resolve) => {
    console.log('\nMultiple matches found:\n');
    matches.forEach((m, i) => {
      const league = getLeagueLabel(m.sportKey);
      const dt = m.event.commence_time.replace('T', ' ').replace('Z', ' UTC');
      console.log(`  [${i + 1}] ${league.label} — ${m.event.home_team} vs ${m.event.away_team} — ${dt}`);
    });
    console.log();
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Select match: ', (answer) => {
      rl.close();
      const n = parseInt(answer.trim(), 10);
      if (isNaN(n) || n < 1 || n > matches.length) {
        console.error('Invalid selection');
        process.exit(1);
      }
      resolve(n - 1);
    });
  });
}

/** Resolve a match event via live Odds API lookup with interactive disambiguation. */
async function resolveEvent(teamA: string, teamB: string, marketConfig: MarketConfig): Promise<ResolvedEvent> {
  const apiKey = process.env.THE_ODDS_API_KEY?.trim();
  if (!apiKey) {
    console.error('Error: THE_ODDS_API_KEY is not set in .env');
    process.exit(1);
  }

  const collector = new OddsCollector(apiKey, marketConfig);
  const matches = await collector.findAllEvents(teamA, teamB);

  if (matches.length === 0) {
    console.error(`No upcoming match found for "${teamA}" vs "${teamB}"`);
    process.exit(1);
  }

  let chosen: { event: OddsEvent; sportKey: string };
  if (matches.length === 1) {
    chosen = matches[0];
  } else {
    const idx = await promptUserChoice(matches);
    chosen = matches[idx];
  }

  const league = getLeagueLabel(chosen.sportKey);
  return {
    event: chosen.event,
    sportKey: chosen.sportKey,
    commenceTime: chosen.event.commence_time,
    date: chosen.event.commence_time.slice(0, 10),
    leagueKey: league.key,
    leagueLabel: league.label,
  };
}

// ── Main pipeline ───────────────────────────────────────────────────────────

export async function runPipeline(pipelineConfig: PipelineConfig): Promise<void> {

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
    const resolved = await resolveEvent(args.teamA, args.teamB, marketConfig);
    const newsFilename = path.join(REPORTS_DIR, _buildNewsFilename(args.teamA, args.teamB, resolved.date));
    const newsDir = path.dirname(newsFilename);
    if (!fs.existsSync(newsDir)) fs.mkdirSync(newsDir, { recursive: true });
    try {
      console.log(`Fetching match news for ${args.teamA} vs ${args.teamB}...`);
      const news = await runMatchNews(args.teamA, args.teamB, resolved.date);
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

  // ── Standalone corner-odds agent mode ──
  if (args.mode === 'corner-odds') {
    const resolved = await resolveEvent(args.teamA, args.teamB, marketConfig);
    console.error(`Resolved: ${resolved.event.home_team} vs ${resolved.event.away_team} — ${resolved.leagueLabel}`);
    const oddsFilename = path.join(REPORTS_DIR, buildMatchDir(args.teamA, args.teamB, resolved.date), 'corner-odds.md');
    const oddsDir = path.dirname(oddsFilename);
    if (!fs.existsSync(oddsDir)) fs.mkdirSync(oddsDir, { recursive: true });
    try {
      console.error('Running corner odds agent...');
      const oddsMarkdown = await runCornerOdds(
        resolved.event.home_team,
        resolved.event.away_team,
        resolved.date,
        resolved.sportKey,
        resolved.event.id,
      );
      fs.writeFileSync(oddsFilename, oddsMarkdown, 'utf8');
      console.error(`Corner odds saved → ${oddsFilename}`);
      process.exit(0);
    } catch (err) {
      const msg = errorMsg(err);
      console.error(`Corner odds agent failed: ${msg}`);
      process.exit(1);
    }
  }

  // ── Post-game results collection ──
  if (args.mode === 'results') {
    try {
      const meta = readMatchMeta(args.matchDir);
      const resultsPath = path.join(REPORTS_DIR, _buildResultsFilename(args.matchDir, toolName));
      const resultsDir = path.dirname(resultsPath);
      if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
      const markdown = await collectMatchResults({
        matchDir: args.matchDir,
        meta,
        market: toolName,
        narrativePrompt: pipelineConfig.resultsNarrativePrompt,
      });
      fs.writeFileSync(resultsPath, markdown, 'utf8');
      console.log(`Results saved → ${resultsPath}`);
      process.exit(0);
    } catch (err) {
      const msg = errorMsg(err);
      console.error(`Results collection failed: ${msg}`);
      process.exit(1);
    }
  }

  // ── Post-game review/reflection ──
  if (args.mode === 'review') {
    try {
      const meta = readMatchMeta(args.matchDir);
      const resultsPath = path.join(REPORTS_DIR, _buildResultsFilename(args.matchDir, toolName));
      const analysisPath = path.join(REPORTS_DIR, args.matchDir, `${toolName}-analysis.md`);
      const reviewPath = path.join(REPORTS_DIR, _buildReviewFilename(args.matchDir, toolName));
      const reviewDir = path.dirname(reviewPath);
      if (!fs.existsSync(reviewDir)) fs.mkdirSync(reviewDir, { recursive: true });

      if (!fs.existsSync(resultsPath)) {
        console.error(`Error: ${toolName}-results.md not found. Run "${toolName}:results ${args.matchDir}" first.`);
        process.exit(1);
      }

      const resultsMarkdown = fs.readFileSync(resultsPath, 'utf8');
      let analysisMarkdown = '';
      if (fs.existsSync(analysisPath)) {
        analysisMarkdown = fs.readFileSync(analysisPath, 'utf8');
      } else {
        console.warn(`Warning: ${toolName}-analysis.md not found — review will proceed without pre-game analysis.`);
      }

      // Concatenate with clear headers for the review agent
      const combined = [
        analysisMarkdown ? `# PRE-GAME ANALYSIS\n\n${analysisMarkdown}` : '# PRE-GAME ANALYSIS\n\n*No pre-game analysis available.*',
        `# POST-GAME RESULTS\n\n${resultsMarkdown}`,
      ].join('\n\n---\n\n');

      console.log(`Running ${marketLabel.toLowerCase()} post-game review...`);
      const review = await analyzeReport(combined, pipelineConfig.reviewPrompt);
      fs.writeFileSync(reviewPath, review, 'utf8');
      console.log(`Review saved → ${reviewPath}`);
      process.exit(0);
    } catch (err) {
      const msg = errorMsg(err);
      console.error(`Review generation failed: ${msg}`);
      process.exit(1);
    }
  }

  // ── Full collection mode ──
  const resolved = await resolveEvent(args.teamA, args.teamB, marketConfig);
  console.log(`Resolved: ${resolved.event.home_team} vs ${resolved.event.away_team} — ${resolved.leagueLabel} — ${resolved.commenceTime}`);

  const provider = new SoccerdataProvider();
  try {
    const collector = new MatchDataCollector(provider, formatOptions);

    // Run data collection, match news, and corner odds concurrently
    const isCornerPipeline = toolName === 'corners';
    const [collectorResult, matchNewsSummary, agentOdds] = await Promise.all([
      collector.collect_data({
        teamA_name: args.teamA,
        teamB_name: args.teamB,
        match_date: resolved.date,
        eventId: resolved.event.id,
        sportKey: resolved.sportKey,
      }),
      config.matchNewsFetching
        ? runMatchNews(args.teamA, args.teamB, resolved.date).catch((err) => {
            console.error(`Match news skipped: ${errorMsg(err)}`);
            return undefined;
          })
        : Promise.resolve(undefined),
      isCornerPipeline
        ? runCornerOdds(
            resolved.event.home_team,
            resolved.event.away_team,
            resolved.date,
            resolved.sportKey,
            resolved.event.id,
          ).catch((err) => {
            console.error(`Corner odds agent skipped: ${errorMsg(err)}`);
            return undefined;
          })
        : Promise.resolve(undefined),
    ]);

    // Append agent sections to the report
    let markdown = collectorResult;
    if (matchNewsSummary) {
      markdown += '\n## Match News\n\n' + matchNewsSummary.trim() + '\n';
    }
    if (agentOdds) {
      markdown += '\n' + agentOdds + '\n';
    }

    const reportFilename = path.join(REPORTS_DIR, _buildReportFilename(args.teamA, args.teamB, resolved.date, toolName));
    const reportDir = path.dirname(reportFilename);
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(reportFilename, markdown, 'utf8');
    writeMetaJson(reportDir, {
      commenceTime: resolved.commenceTime,
      leagueKey: resolved.leagueKey,
      leagueLabel: resolved.leagueLabel,
      homeTeam: resolved.event.home_team,
      awayTeam: resolved.event.away_team,
    });
    console.log(`Report saved → ${reportFilename}`);

    if (config.analysisEnabled) {
      try {
        const analysisFilename = path.join(REPORTS_DIR, _buildAnalysisFilename(args.teamA, args.teamB, resolved.date, toolName));
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
    console.error('  - Python 3 + soccerdata are installed (pip install -r scripts/requirements.txt)');
    console.error('  - You have an active internet connection\n');

    process.exit(1);
  }
}

// ── Match metadata ───────────────────────────────────────────────────────────

/** Read meta.json from a match directory. Throws if missing or incomplete. */
function readMatchMeta(matchDir: string): MatchMeta {
  const dirPath = path.join(REPORTS_DIR, matchDir);
  const metaPath = path.join(dirPath, 'meta.json');

  if (!fs.existsSync(metaPath)) {
    throw new Error(`meta.json not found in ${dirPath}. Run the collection pipeline first.`);
  }

  const raw = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  if (!raw.homeTeam || !raw.awayTeam) {
    throw new Error(`meta.json in ${matchDir} is missing homeTeam/awayTeam. Re-run collection to populate.`);
  }

  return {
    homeTeam: raw.homeTeam,
    awayTeam: raw.awayTeam,
    date: (raw.commenceTime || '').slice(0, 10),
    commenceTime: raw.commenceTime || '',
    leagueKey: raw.leagueKey || '',
    leagueLabel: raw.leagueLabel || '',
  };
}

/** Write meta.json with event metadata into the report directory. */
function writeMetaJson(reportDir: string, meta: {
  commenceTime: string;
  leagueKey: string;
  leagueLabel: string;
  homeTeam?: string;
  awayTeam?: string;
}): void {
  const metaPath = path.join(reportDir, 'meta.json');
  let existing: Record<string, string> = {};
  if (fs.existsSync(metaPath)) {
    try { existing = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { /* overwrite */ }
  }
  Object.assign(existing, meta);
  fs.writeFileSync(metaPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
}
