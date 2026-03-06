import { parseNonNegativeInt } from "@utils/env";

export type Release = () => void;

export type RateLimiter = {
  acquire: () => Promise<Release>;
};

class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefillMs = Date.now();
  private inFlight = 0;
  private readonly queue: Array<(release: Release) => void> = [];
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly cfg: {
      rps: number; // tokens per second
      burst: number; // max tokens
      maxInFlight: number;
      leaseTimeoutMs?: number;
    }
  ) {
    this.tokens = cfg.burst;
  }

  acquire(): Promise<Release> {
    return new Promise<Release>((resolve) => {
      this.queue.push(resolve);
      this.pump();
    });
  }

  private refill(): void {
    if (!Number.isFinite(this.cfg.rps)) return;
    const now = Date.now();
    const deltaMs = now - this.lastRefillMs;
    if (deltaMs <= 0) return;
    const add = (deltaMs * this.cfg.rps) / 1000;
    if (add <= 0) return;
    this.tokens = Math.min(this.cfg.burst, this.tokens + add);
    this.lastRefillMs = now;
  }

  private pump(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    this.refill();

    while (this.queue.length > 0 && this.canAcquireNow()) {
      this.tokens = Number.isFinite(this.cfg.rps) ? this.tokens - 1 : this.tokens;
      this.inFlight++;

      let released = false;
      let leaseTimer: ReturnType<typeof setTimeout> | undefined;

      const release: Release = () => {
        if (released) return;
        released = true;
        if (leaseTimer) {
          clearTimeout(leaseTimer);
          leaseTimer = undefined;
        }
        this.inFlight = Math.max(0, this.inFlight - 1);
        this.pump();
      };

      const leaseTimeoutMs = this.cfg.leaseTimeoutMs;
      if (leaseTimeoutMs !== undefined && leaseTimeoutMs > 0) {
        leaseTimer = setTimeout(() => release(), leaseTimeoutMs);
      }

      const resolve = this.queue.shift()!;
      resolve(release);
    }

    if (this.queue.length > 0 && !this.canAcquireNow()) {
      // If we're blocked by concurrency, we don't schedule anything; a release() will re-pump.
      if (this.inFlight >= this.cfg.maxInFlight) return;

      // Otherwise, we're blocked by tokens; schedule the next attempt.
      const waitMs = this.nextTokenWaitMs();
      this.timer = setTimeout(() => this.pump(), waitMs);
    }
  }

  private canAcquireNow(): boolean {
    const hasInflight = this.inFlight < this.cfg.maxInFlight;
    const hasToken = !Number.isFinite(this.cfg.rps) || this.tokens >= 1;
    return hasInflight && hasToken;
  }

  private nextTokenWaitMs(): number {
    if (!Number.isFinite(this.cfg.rps)) return 1;
    this.refill();
    if (this.tokens >= 1) return 1;
    const missing = 1 - this.tokens;
    const msPerToken = 1000 / this.cfg.rps;
    return Math.max(1, Math.ceil(missing * msPerToken));
  }
}

export const createRateLimiterFromEnv = (): RateLimiter => {
  const rps = parseNonNegativeInt(process.env.GRPC_RATE_LIMIT_RPS);
  const maxInFlight = parseNonNegativeInt(process.env.GRPC_MAX_INFLIGHT);
  const burstRaw = parseNonNegativeInt(process.env.GRPC_RATE_LIMIT_BURST);
  const leaseTimeoutMs = parseNonNegativeInt(process.env.GRPC_RATE_LIMIT_LEASE_TIMEOUT_MS);

  const hasRps = rps !== undefined && rps > 0;
  const hasMaxInFlight = maxInFlight !== undefined && maxInFlight > 0;

  if (!hasRps && !hasMaxInFlight) {
    return { acquire: () => Promise.resolve(() => {}) };
  }

  const resolvedRps = rps !== undefined && rps > 0 ? rps : Infinity;
  const burst = rps !== undefined && rps > 0 ? Math.max(1, burstRaw ?? rps) : 1;
  const resolvedMaxInFlight =
    maxInFlight !== undefined && maxInFlight > 0 ? maxInFlight : Number.POSITIVE_INFINITY;

  return new TokenBucketRateLimiter({
    rps: resolvedRps,
    burst,
    maxInFlight: resolvedMaxInFlight,
    leaseTimeoutMs: leaseTimeoutMs !== undefined && leaseTimeoutMs > 0 ? leaseTimeoutMs : undefined
  });
};
