/**
 * File-based LLM response cache.
 * Hashes (model + systemPrompt + userMessage) → cached response.
 * Saves cost by reusing identical analysis/news requests.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const CACHE_DIR = path.resolve(__dirname, '../../.cache/llm');

interface CacheEntry {
  model: string;
  hash: string;
  response: string;
  createdAt: string;
}

function ensureCacheDir(): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function computeHash(model: string, systemPrompt: string, userMessage: string): string {
  const payload = JSON.stringify({ model, systemPrompt, userMessage });
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

function cachePath(hash: string): string {
  return path.join(CACHE_DIR, `${hash}.json`);
}

export function getCachedResponse(
  model: string,
  systemPrompt: string,
  userMessage: string,
): string | null {
  if (process.env.LLM_CACHE_DISABLED === '1') return null;

  const hash = computeHash(model, systemPrompt, userMessage);
  const fp = cachePath(hash);

  if (!fs.existsSync(fp)) return null;

  try {
    const entry: CacheEntry = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const maxAgeSec = parseInt(process.env.LLM_CACHE_TTL_SEC || '86400', 10);
    const ageMs = Date.now() - new Date(entry.createdAt).getTime();
    if (ageMs > maxAgeSec * 1000) {
      fs.unlinkSync(fp);
      return null;
    }
    console.error(`  [cache hit] ${hash} (${(ageMs / 1000).toFixed(0)}s old)`);
    return entry.response;
  } catch {
    return null;
  }
}

export function setCachedResponse(
  model: string,
  systemPrompt: string,
  userMessage: string,
  response: string,
): void {
  if (process.env.LLM_CACHE_DISABLED === '1') return;

  ensureCacheDir();
  const hash = computeHash(model, systemPrompt, userMessage);
  const entry: CacheEntry = {
    model,
    hash,
    response,
    createdAt: new Date().toISOString(),
  };

  const finalPath = cachePath(hash);
  const tempPath = `${finalPath}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(entry, null, 2), 'utf8');
    fs.renameSync(tempPath, finalPath);
    console.error(`  [cache write] ${hash}`);
  } catch (err) {
    try { fs.unlinkSync(tempPath); } catch {}
    console.error(`  [cache write failed] ${err instanceof Error ? err.message : err}`);
  }
}

export function clearCache(): number {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
  for (const f of files) {
    fs.unlinkSync(path.join(CACHE_DIR, f));
  }
  return files.length;
}
