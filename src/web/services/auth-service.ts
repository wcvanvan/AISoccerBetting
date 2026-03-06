/**
 * Stateless session auth using HMAC-signed cookies.
 * Works in serverless (Vercel) — no in-memory session store.
 */

import * as crypto from 'crypto';

export type UserRole = 'admin' | 'reader';

export interface SessionUser {
  username: string;
  role: UserRole;
}

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Secret for signing session tokens.
 * Required in production; falls back to a random value in dev (sessions lost on restart).
 */
function getSecret(): string {
  const env = process.env.SESSION_SECRET?.trim();
  if (env) return env;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET env var is required in production');
  }
  // Dev fallback — random per process (sessions cleared on restart)
  return crypto.randomBytes(32).toString('hex');
}

let _secret: string | null = null;
function secret(): string {
  if (!_secret) _secret = getSecret();
  return _secret;
}

/**
 * Parse users from environment variables.
 * Format: WEB_USERS=username:password:role,username:password:role
 * Falls back to WEB_ADMIN_PASSWORD / WEB_READER_PASSWORD for simpler config.
 */
function loadUsers(): Record<string, { password: string; role: UserRole }> {
  const users: Record<string, { password: string; role: UserRole }> = {};

  const envUsers = process.env.WEB_USERS?.trim();
  if (envUsers) {
    for (const entry of envUsers.split(',')) {
      const [username, password, role] = entry.trim().split(':');
      if (username && password) {
        users[username] = {
          password,
          role: (role === 'reader' ? 'reader' : 'admin') as UserRole,
        };
      }
    }
    return users;
  }

  // Fallback: individual env vars
  const adminPass = process.env.WEB_ADMIN_PASSWORD?.trim();
  const readerPass = process.env.WEB_READER_PASSWORD?.trim();

  if (adminPass) users.admin = { password: adminPass, role: 'admin' };
  if (readerPass) users.reader = { password: readerPass, role: 'reader' };

  // Built-in defaults when no env config is provided
  if (Object.keys(users).length === 0) {
    users.admin = { password: '020710', role: 'admin' };
    users.james = { password: 'thankyou', role: 'reader' };
  }

  return users;
}

let USERS: Record<string, { password: string; role: UserRole }> | null = null;

function getUsers() {
  if (!USERS) USERS = loadUsers();
  return USERS;
}

export function authenticate(
  username: string,
  password: string
): SessionUser | null {
  const user = getUsers()[username];
  if (!user || user.password !== password) return null;
  return { username, role: user.role };
}

/** Create a signed session token: base64url(payload).hmac */
export function createSession(user: SessionUser): string {
  const payload = JSON.stringify({
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

/** Verify a signed token and return the session user, or null if invalid/expired. */
export function getSession(token: string): SessionUser | null {
  const dot = token.indexOf('.');
  if (dot < 0) return null;

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = crypto
    .createHmac('sha256', secret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);

  // timingSafeEqual throws on length mismatch — reject early
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

/** No-op — stateless tokens have no server-side state to clean up. */
export function destroySession(_token: string): void {
  // Cookie is cleared by the caller; nothing to do here.
}
