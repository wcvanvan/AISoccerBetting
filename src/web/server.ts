/**
 * Fastify web server for Soccer Betting Analyzer frontend.
 */

import * as path from 'path';
import * as fs from 'fs';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';

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
const IS_PROD = process.env.NODE_ENV === 'production';

// Rate limiter for login attempts (in-memory, per IP).
// Note: ineffective on serverless (fresh state per cold start) but useful for local dev.
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60_000; // 60 seconds

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

    // Allow public paths (login page, css, login API)
    if (PUBLIC_PATHS.some((p) => urlPath === p)) return;

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
    // Rate limiting by IP
    const ip = request.ip;
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (entry) {
      if (now - entry.lastAttempt > RATE_LIMIT_WINDOW) {
        loginAttempts.delete(ip);
      } else if (entry.count >= RATE_LIMIT_MAX) {
        reply.status(429);
        return { ok: false, error: 'Too many login attempts. Try again later.' };
      }
    }

    const body = request.body as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      reply.status(400);
      return { ok: false, error: 'Username and password required' };
    }

    const user = authenticate(username, password);
    if (!user) {
      // Track failed attempt
      const current = loginAttempts.get(ip);
      loginAttempts.set(ip, {
        count: (current?.count ?? 0) + 1,
        lastAttempt: now,
      });
      reply.status(401);
      return { ok: false, error: 'Invalid username or password' };
    }

    // Successful login — reset rate limiter for this IP
    loginAttempts.delete(ip);

    const token = createSession(user);
    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD,
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

  // Dynamically import events + analysis to avoid loading heavy deps at module level
  const { eventsRoutes } = await import('./routes/events');
  const { analysisRoutes } = await import('./routes/analysis');
  await app.register(eventsRoutes);
  await app.register(analysisRoutes);
  await app.register(reportsRoutes);

  // Health check
  app.get('/api/health', async () => {
    const checks = {
      oddsApiKey: !!process.env.THE_ODDS_API_KEY?.trim(),
    };
    return { status: 'ok', checks };
  });

  return app;
}
