/**
 * Shared environment bootstrap for all CLI entry points.
 * Loads .env.defaults first, then .env (local wins on conflicts).
 */

import * as path from 'path';
import { config as loadEnv } from 'dotenv';

export function bootstrapEnv(): void {
  loadEnv({ path: path.join(process.cwd(), '.env.defaults'), quiet: true });
  loadEnv({ path: path.join(process.cwd(), '.env'), override: true, quiet: true });
}
