/**
 * Fastify web server for Soccer Betting Analyzer frontend.
 */

import * as path from 'path';
import * as fs from 'fs';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';

import { eventsRoutes } from './routes/events';
import { analysisRoutes } from './routes/analysis';
import { reportsRoutes } from './routes/reports';

/**
 * Resolve the public directory. Works in both ts-node (src/) and compiled (dist/) modes.
 * Falls back from dist/web/public -> src/web/public.
 */
function resolvePublicDir(): string {
  const candidate = path.join(__dirname, 'public');
  if (fs.existsSync(candidate)) return candidate;
  // When running from dist/, public files are in src/web/public
  const srcPublic = path.resolve(__dirname, '../../src/web/public');
  if (fs.existsSync(srcPublic)) return srcPublic;
  return candidate;
}

export async function createServer() {
  const app = Fastify({ logger: true });

  // Serve static frontend files
  await app.register(fastifyStatic, {
    root: resolvePublicDir(),
    prefix: '/',
  });

  // API routes
  await app.register(eventsRoutes);
  await app.register(analysisRoutes);
  await app.register(reportsRoutes);

  // Health check
  app.get('/api/health', async () => {
    const checks = {
      oddsApiKey: !!process.env.THE_ODDS_API_KEY?.trim(),
      python: true,
    };
    return { status: 'ok', checks };
  });

  return app;
}
