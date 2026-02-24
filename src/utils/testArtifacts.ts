import { AsyncLocalStorage } from "node:async_hooks";

export type TestLogEntry = {
  ts: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
};

export type GrpcStatusSnapshot = {
  code?: unknown;
  details?: unknown;
  metadata?: unknown;
};

export type GrpcMessageSnapshot = {
  receivedAtIso: string;
  message: unknown;
};

export type GrpcCallEntry = {
  startedAtIso: string;
  requestSentAtIso?: string;
  target?: string;
  method?: string;
  requestMetadata?: Record<string, unknown>;
  request?: unknown;
  responses: GrpcMessageSnapshot[];
  status?: GrpcStatusSnapshot;
  statusReceivedAtIso?: string;
  /**
   * Duration from request send -> status receive (ms).
   * Falls back to startedAt -> status receive if requestSentAtIso is missing.
   */
  durationMs?: number;
  /**
   * Duration from request send -> first response message received (ms).
   * Useful for streaming and unary latency.
   */
  timeToFirstResponseMs?: number;
};

export type TestArtifacts = {
  testName: string;
  allure?: unknown;
  logs: TestLogEntry[];
  grpc: GrpcCallEntry[];
};

export const testArtifactsStorage = new AsyncLocalStorage<TestArtifacts>();

export const startTestArtifacts = (testName: string, allure?: unknown): TestArtifacts => {
  const ctx: TestArtifacts = { testName, allure, logs: [], grpc: [] };
  testArtifactsStorage.enterWith(ctx);
  return ctx;
};

export const getTestArtifacts = (): TestArtifacts | undefined => testArtifactsStorage.getStore();

export const recordLog = (entry: TestLogEntry): void => {
  const ctx = getTestArtifacts();
  if (!ctx) return;
  ctx.logs.push(entry);
};

export const beginGrpcCall = (partial?: Omit<GrpcCallEntry, "responses" | "startedAtIso">): GrpcCallEntry | undefined => {
  const ctx = getTestArtifacts();
  if (!ctx) return undefined;
  const entry: GrpcCallEntry = {
    startedAtIso: new Date().toISOString(),
    responses: [],
    ...partial
  };
  ctx.grpc.push(entry);
  return entry;
};

export const safeJson = (value: unknown): string => {
  try {
    const replacer = (_k: string, v: unknown): unknown =>
      typeof v === "bigint" ? v.toString() : v;
    const s: string | undefined = JSON.stringify(value, replacer as unknown as (key: string, value: unknown) => unknown, 2);
    return typeof s === "string" ? s : "[unserializable]";
  } catch {
    try {
      return String(value);
    } catch {
      return "[unserializable]";
    }
  }
};

const toMs = (iso: string | undefined): number => {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

export const attachArtifactsToAllure = (ctx: TestArtifacts): void => {
  const allure = ctx.allure as { attachment?: (name: string, content: string, type?: string) => void } | undefined;
  if (!allure?.attachment) return;

  if (ctx.logs.length > 0) {
    const lines = [...ctx.logs]
      .sort((a, b) => toMs(a.ts) - toMs(b.ts))
      .map((l) => `${l.ts} [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    allure.attachment("framework.log", lines, "text/plain");
  }

  if (ctx.grpc.length > 0) {
    const ordered = [...ctx.grpc]
      .map((c) => ({
        ...c,
        responses: [...c.responses].sort((a, b) => toMs(a.receivedAtIso) - toMs(b.receivedAtIso)),
      }))
      .sort((a, b) => toMs(a.startedAtIso) - toMs(b.startedAtIso));

    allure.attachment("grpc.calls.json", safeJson(ordered), "application/json");

    const errors = ordered.filter((c) => typeof c.status?.code === "number" && c.status.code !== 0);
    if (errors.length > 0) {
      const inline = (value: unknown): string => {
        if (value == null) return "";
        if (typeof value === "string") return value;
        // safeJson never returns "[object Object]"; collapse whitespace for readability.
        return safeJson(value).replace(/\s+/g, " ").trim();
      };

      const errorAttachment = errors.map((c) => ({
        startedAtIso: c.startedAtIso,
        requestSentAtIso: c.requestSentAtIso,
        statusReceivedAtIso: c.statusReceivedAtIso,
        durationMs: c.durationMs,
        timeToFirstResponseMs: c.timeToFirstResponseMs,
        target: c.target,
        method: c.method,
        requestMetadata: c.requestMetadata,
        request: c.request,
        responses: c.responses,
        status: c.status,
        message: `${String(c.status?.code)}: ${inline(c.status?.details)}`.trim(),
      }));

      allure.attachment("grpc.error.json", safeJson(errorAttachment), "application/json");
    }
  }
};

