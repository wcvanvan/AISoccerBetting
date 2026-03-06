#!/usr/bin/env node

/**
 * CLI entry point for the web server.
 */

import { bootstrapEnv } from './cli-bootstrap';
bootstrapEnv();

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

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
