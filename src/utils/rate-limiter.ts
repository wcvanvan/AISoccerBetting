/**
 * Simple serial rate limiter — ensures a minimum interval between calls.
 * Queues concurrent requests and drains them one at a time.
 */
export class RateLimiter {
  private intervalMs: number;
  private lastCallTime = 0;
  private queue: Promise<void> = Promise.resolve();

  /** @param intervalMs Minimum milliseconds between consecutive calls. */
  constructor(intervalMs: number) {
    this.intervalMs = intervalMs;
  }

  /** Wrap an async function so it respects the rate limit. */
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        const now = Date.now();
        const elapsed = now - this.lastCallTime;
        if (elapsed < this.intervalMs) {
          await sleep(this.intervalMs - elapsed);
        }
        this.lastCallTime = Date.now();
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
