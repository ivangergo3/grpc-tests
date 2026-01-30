import { defineConfig } from "vitest/config";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { getEnvironment } from "./src/utils/environments";
import AllureVitestReporter from "allure-vitest/reporter";

const parseRetry = (raw: string | undefined): number | undefined => {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
};

const retry =
  parseRetry(process.env.VITEST_RETRY ?? process.env.TEST_RETRY) ??
  (process.env.CI ? 2 : getEnvironment().timeouts.retry);

const parsePositiveInt = (raw: string | undefined): number | undefined => {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
};

// Global defaults for `expect.poll(...)` (override via env vars if needed)
const expectPollTimeout =
  parsePositiveInt(process.env.VITEST_EXPECT_POLL_TIMEOUT_MS) ??
  parsePositiveInt(process.env.EXPECT_POLL_TIMEOUT_MS) ??
  1_000;
const expectPollInterval =
  parsePositiveInt(process.env.VITEST_EXPECT_POLL_INTERVAL_MS) ??
  parsePositiveInt(process.env.EXPECT_POLL_INTERVAL_MS) ??
  50;

const readBunVersion = (): string => {
  const raw = (process.versions as Record<string, unknown>).bun;
  return typeof raw === "string" ? raw : "";
};

const allureResultsDir = process.env.ALLURE_RESULTS_DIR ?? "allure-results";
const junitOutputFile = process.env.JUNIT_OUTPUT_FILE ?? "test-results/junit.xml";

export default defineConfig({
  resolve: {
    alias: {
      "@gen": fileURLToPath(new URL("./src/gen", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url))
    }
  },
  test: {
    testTimeout: getEnvironment().timeouts.testTimeoutMs,
    hookTimeout: getEnvironment().timeouts.hookTimeoutMs,
    retry,
    expect: {
      poll: {
        timeout: expectPollTimeout,
        interval: expectPollInterval
      }
    },
    setupFiles: ["allure-vitest/setup", "src/utils/test/vitest.setup.ts"],
    reporters: [
      // More diagnostic output in terminal, and plays nicely with Allure’s hierarchy.
      "verbose",
      "junit",
      new AllureVitestReporter({
        resultsDir: allureResultsDir,
        environmentInfo: {
          os_platform: os.platform(),
          os_release: os.release(),
          os_version: os.version(),
          node_version: process.version,
          bun_version: readBunVersion(),
          test_env: String(process.env.TEST_ENV ?? "local")
        }
      })
    ],
    outputFile: {
      junit: junitOutputFile
    }
  }
});
