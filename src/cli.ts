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
import { runMatchNews } from './agent';

configureAnthropicProxy();

/**
 * Parse command-line arguments
 */
function parseArgs(): {
  teamA: string;
  teamB: string;
  date: string;
  configPath?: string;
} | null {
  let args = process.argv.slice(2);

  // Check for --init-config flag first
  if (args[0] === '--init-config') {
    const configOutputPath = args[1] || 'espn-collector.config.json';
    ConfigLoader.createSampleConfig(configOutputPath);
    return null;
  }

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

  // Positional: teamA, teamB, date (all required)
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

  return {
    teamA,
    teamB,
    date,
    configPath,
  };
}

/**
 * Print usage instructions
 */
function printUsage(): void {
  console.log(`
ESPN Corner Data Collector
==========================

Usage:
  npm start <teamA> <teamB> <date> [options]
  npm start --init-config [<path>]

Arguments:
  teamA  - Name of the first team (e.g., "Manchester United")
  teamB  - Name of the second team (e.g., "Liverpool")
  date   - Match date in ISO format (e.g., "2024-03-15")

Options:
  --config, -c <path>  - Path to configuration file
  --init-config [path] - Create a sample configuration file (default: espn-collector.config.json)

Examples:
  npm start "Atlético Madrid" "Club Brugge" "2026-02-26"
  npm start "Manchester United" "Liverpool" "2024-03-15"

Configuration:
  The tool looks for configuration files in the following order:
  1. Path specified with --config flag
  2. ./espn-collector.config.json (current directory)
  3. ./.espn-collector.json (current directory)
  4. ~/.espn-collector.json (home directory)

Notes:
  - Team names with spaces should be quoted
  - Date must be in ISO format (YYYY-MM-DD)
  - Report is printed to the console
  `);
}

/**
 * Build a safe filename for the Markdown report, e.g. "atalanta-vs-dortmund-2026-02-25.md"
 */
function buildMarkdownFilename(teamA: string, teamB: string, date: string): string {
  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${slug(teamA)}-vs-${slug(teamB)}-${date}.md`;
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  // Parse arguments
  const args = parseArgs();

  if (!args) {
    process.exit(args === null ? 1 : 0);
  }

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

    const mdFilename = buildMarkdownFilename(args.teamA, args.teamB, args.date);
    fs.writeFileSync(mdFilename, markdown, 'utf8');
    console.log(`Markdown report saved → ${mdFilename}`);

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

// Run CLI
main();
