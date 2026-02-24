import { afterEach, beforeEach } from "vitest";
import { logger } from "@utils/logger";
import { attachArtifactsToAllure, getTestArtifacts, recordLog, startTestArtifacts } from "@utils/testArtifacts";

const log = logger;

const toError = (reason: unknown): Error => {
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === "string" ? reason : JSON.stringify(reason));
};

const parseNonNegativeInt = (raw: string | undefined): number | undefined => {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
};

const requireNonNegativeInt = (name: string): number => {
  const v = parseNonNegativeInt(process.env[name]);
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
};

// Extra safety net: fail hard on anything that slips past awaits/assertions.
const p = process as typeof process & {
  __vitestGlobalHandlersInstalled?: boolean;
  __frameworkConsolePatched?: boolean;
  __frameworkConsoleOriginals?: Partial<Record<"log" | "info" | "warn" | "error" | "debug", (...args: unknown[]) => void>>;
};
if (!p.__vitestGlobalHandlersInstalled) {
  p.__vitestGlobalHandlersInstalled = true;

  const runTimeoutMs = requireNonNegativeInt("RUN_TIMEOUT_MS");
  if (runTimeoutMs > 0) {
    const timeout = setTimeout(() => {
      const err = new Error(`Test run exceeded runTimeoutMs=${runTimeoutMs}ms`);
      log.error("Global test-run timeout exceeded", err);
      process.exitCode = 1;
      throw err;
    }, runTimeoutMs);

    // Don't keep the process alive just because of the watchdog.
    timeout.unref();

    process.on("beforeExit", () => clearTimeout(timeout));
  }

  process.on("unhandledRejection", (reason) => {
    const err = toError(reason);
    log.error("Unhandled promise rejection", err);
    process.exitCode = 1;
    throw err;
  });

  process.on("uncaughtException", (err) => {
    log.error("Uncaught exception", err);
    process.exitCode = 1;
    throw err;
  });
}

const safeToString = (v: unknown): string => {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    try {
      return String(v);
    } catch {
      return "[unserializable]";
    }
  }
};

const parseLoggerPrefix = (
  prefix: unknown
): { ts: string; level: "debug" | "info" | "warn" | "error"; scope?: string } | undefined => {
  if (typeof prefix !== "string") return undefined;
  const m = prefix.match(/^\[(?<ts>[^]+?)\] \[(?<level>[A-Z]+)\](?: (?<scope>.+))?$/);
  if (!m?.groups) return undefined;
  const ts = m.groups.ts;
  const rawLevel = m.groups.level.toLowerCase();
  const scope = m.groups.scope;
  if (rawLevel === "debug" || rawLevel === "info" || rawLevel === "warn" || rawLevel === "error") {
    return { ts, level: rawLevel, scope };
  }
  return undefined;
};

const patchConsoleOnce = (): void => {
  if (p.__frameworkConsolePatched) return;
  p.__frameworkConsolePatched = true;

  p.__frameworkConsoleOriginals = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };

  const wrap =
    (method: "log" | "info" | "warn" | "error" | "debug", level: "info" | "warn" | "error" | "debug") =>
    (...args: unknown[]) => {
      const original = p.__frameworkConsoleOriginals?.[method];
      const parsed = parseLoggerPrefix(args[0]);
      if (parsed) {
        const [, ...rest] = args;
        recordLog({
          ts: parsed.ts,
          level: parsed.level,
          message: [
            parsed.scope ? `[${parsed.scope}]` : undefined,
            ...rest.map((a) => (typeof a === "string" ? a : safeToString(a))),
          ]
            .filter((x): x is string => typeof x === "string" && x.trim() !== "")
            .join(" "),
        });
      } else {
        recordLog({
          ts: new Date().toISOString(),
          level,
          message: args.map((a) => (typeof a === "string" ? a : safeToString(a))).join(" "),
        });
      }

      original?.(...args);
    };

  console.log = wrap("log", "info");
  console.info = wrap("info", "info");
  console.warn = wrap("warn", "warn");
  console.error = wrap("error", "error");
  console.debug = wrap("debug", "debug");
};

patchConsoleOnce();

beforeEach(({ task }) => {
  // Capture allure API (set by allure-vitest/setup) if present.
  const allure = (globalThis as unknown as { allure?: unknown }).allure;
  startTestArtifacts(task.name, allure);
});

afterEach(() => {
  const ctx = getTestArtifacts();
  if (!ctx) return;
  attachArtifactsToAllure(ctx);
});

