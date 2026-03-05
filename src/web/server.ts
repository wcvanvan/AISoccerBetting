/**
 * Fastify web server for Soccer Betting Analyzer frontend.
 */

import * as path from 'path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';

import { eventsRoutes } from './routes/events';
import { analysisRoutes } from './routes/analysis';
import { reportsRoutes } from './routes/reports';

export async function createServer() {
  const app = Fastify({ logger: true });

  // Serve static frontend files
  await app.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
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
