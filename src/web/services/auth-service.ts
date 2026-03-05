/**
 * Simple session-based authentication service.
 * Users and passwords are configured via environment variables.
 */

import * as crypto from 'crypto';

export type UserRole = 'admin' | 'reader';

export interface SessionUser {
  username: string;
  role: UserRole;
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

const sessions = new Map<string, SessionUser>();

export function authenticate(
  username: string,
  password: string
): SessionUser | null {
  const user = getUsers()[username];
  if (!user || user.password !== password) return null;
  return { username, role: user.role };
}

export function createSession(user: SessionUser): string {
  const token = crypto.randomUUID();
  sessions.set(token, user);
  return token;
}

export function getSession(token: string): SessionUser | null {
  return sessions.get(token) ?? null;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}
