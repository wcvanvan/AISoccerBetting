#!/usr/bin/env node

/**
 * CLI entry point for the web server.
 */

import * as path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.join(process.cwd(), '.env.defaults'), quiet: true });
loadEnv({ path: path.join(process.cwd(), '.env'), override: true, quiet: true });

import { createServer } from './web/server';

const PORT = parseInt(process.env.WEB_PORT || '3000', 10);
const HOST = process.env.WEB_HOST || '127.0.0.1';

async function main() {
  const app = await createServer();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\nSoccer Betting Analyzer`);
    console.log(`http://${HOST}:${PORT}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
