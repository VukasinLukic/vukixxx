/**
 * Simple rate limiter for API calls.
 * Enforces minimum delay between calls and max concurrent requests.
 */
export class RateLimiter {
  private queue: (() => void)[] = [];
  private activeCount = 0;
  private lastCallTime = 0;

  constructor(
    private minDelayMs: number = 1000,
    private maxConcurrent: number = 1,
  ) {}

  async acquire(): Promise<void> {
    // Wait for available slot
    while (this.activeCount >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    // Enforce minimum delay between calls
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minDelayMs) {
      await new Promise(resolve => setTimeout(resolve, this.minDelayMs - elapsed));
    }

    this.activeCount++;
    this.lastCallTime = Date.now();
  }

  release(): void {
    this.activeCount--;
    const next = this.queue.shift();
    if (next) next();
  }

  /**
   * Wrap an async function with rate limiting
   */
  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// Shared rate limiter for AI classification calls
// 1 request at a time, minimum 1.5s between calls
export const classificationLimiter = new RateLimiter(1500, 1);
