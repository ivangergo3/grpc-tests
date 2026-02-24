import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import AllureReporterEnhanced from "./src/utils/allureReporterEnhanced";
import { loadDotEnvOnce } from "./src/utils/env";

loadDotEnvOnce();

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

const requireNonEmptyString = (name: string): string => {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

const testTimeoutMs = requireNonNegativeInt("TEST_TIMEOUT_MS");
const hookTimeoutMs = requireNonNegativeInt("HOOK_TIMEOUT_MS");
const retry = requireNonNegativeInt("VITEST_RETRY");
const expectPollTimeout = requireNonNegativeInt("EXPECT_POLL_TIMEOUT_MS");
const expectPollInterval = requireNonNegativeInt("EXPECT_POLL_INTERVAL_MS");
const junitOutputFile = requireNonEmptyString("JUNIT_OUTPUT_FILE");
const allureResultsDir = requireNonEmptyString("ALLURE_RESULTS_DIR");

export default defineConfig({
  resolve: {
    alias: {
      "@gen": fileURLToPath(new URL("./src/gen", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url))
    }
  },
  test: {
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: testTimeoutMs,
    hookTimeout: hookTimeoutMs,
    retry,
    expect: {
      poll: {
        timeout: expectPollTimeout,
        interval: expectPollInterval
      }
    },
    includeTaskLocation: true,
    setupFiles: ["allure-vitest/setup", "src/utils/vitest.setup.ts"],
    reporters: [
      "verbose",
      "junit",
      new AllureReporterEnhanced({
        resultsDir: allureResultsDir
      })
    ],
    outputFile: {
      junit: junitOutputFile
    }
  }
});
