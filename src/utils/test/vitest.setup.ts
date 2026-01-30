import { logger } from "@utils/logger";
import { getEnvironment } from "@utils/environments";

// Make logger available globally in tests as `log`.
// Use LOG_LEVEL=debug|info|warn|error|silent to control verbosity.
globalThis.log = logger;

const toError = (reason: unknown): Error => {
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === "string" ? reason : JSON.stringify(reason));
};

// Extra safety net: fail hard on anything that slips past awaits/assertions.
const p = process as typeof process & { __vitestGlobalHandlersInstalled?: boolean };
if (!p.__vitestGlobalHandlersInstalled) {
  p.__vitestGlobalHandlersInstalled = true;

  const runTimeoutMs = getEnvironment().timeouts.runTimeoutMs;
  if (runTimeoutMs > 0) {
    const timeout = setTimeout(() => {
      const err = new Error(
        `Test run exceeded runTimeoutMs=${runTimeoutMs}ms (env=${getEnvironment().name})`
      );
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
