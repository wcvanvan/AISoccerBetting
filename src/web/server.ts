/**
 * Fastify web server for Soccer Betting Analyzer frontend.
 */

import * as path from 'path';
import * as fs from 'fs';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';

import { eventsRoutes } from './routes/events';
import { analysisRoutes } from './routes/analysis';
import { reportsRoutes } from './routes/reports';
import {
  authenticate,
  createSession,
  getSession,
  destroySession,
  SessionUser,
} from './services/auth-service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
  }
}

const SESSION_COOKIE = 'session';
const PUBLIC_PATHS = ['/login.html', '/style.css', '/api/login'];

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
  const app = Fastify({ logger: false });

  // Cookie support
  await app.register(fastifyCookie);

  // Serve static frontend files
  await app.register(fastifyStatic, {
    root: resolvePublicDir(),
    prefix: '/',
  });

  // Auth hook — protect all routes except login page and login API
  app.addHook('onRequest', async (request, reply) => {
    const urlPath = request.url.split('?')[0];

    // Allow public paths (login page, css, fonts, login API)
    if (PUBLIC_PATHS.some((p) => urlPath === p)) return;
    // Allow Google Fonts requests (external, won't hit this)
    if (urlPath.startsWith('/api/login')) return;

    const token = request.cookies[SESSION_COOKIE];
    if (token) {
      const user = getSession(token);
      if (user) {
        request.user = user;
        return;
      }
    }

    // Not authenticated
    if (urlPath.startsWith('/api/')) {
      reply.status(401).send({ error: 'Not authenticated' });
    } else {
      reply.redirect('/login.html');
    }
  });

  // Login / Logout routes
  app.post('/api/login', async (request, reply) => {
    const body = request.body as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      reply.status(400);
      return { ok: false, error: 'Username and password required' };
    }

    const user = authenticate(username, password);
    if (!user) {
      reply.status(401);
      return { ok: false, error: 'Invalid username or password' };
    }

    const token = createSession(user);
    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return { ok: true, user: { username: user.username, role: user.role } };
  });

  app.post('/api/logout', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token) destroySession(token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/me', async (request) => {
    return {
      user: request.user
        ? { username: request.user.username, role: request.user.role }
        : null,
    };
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
