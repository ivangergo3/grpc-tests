import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import AllureReporterEnhanced from "./src/utils/allureReporterEnhanced";
import { loadDotEnvOnce, requireNonEmptyString, requireNonNegativeInt } from "./src/utils/env";

loadDotEnvOnce();

const testTimeoutMs = requireNonNegativeInt("TEST_TIMEOUT");
const hookTimeoutMs = requireNonNegativeInt("HOOK_TIMEOUT");
const retry = requireNonNegativeInt("VITEST_RETRY");
const expectPollTimeout = requireNonNegativeInt("EXPECT_POLL_TIMEOUT");
const expectPollInterval = requireNonNegativeInt("EXPECT_POLL_INTERVAL");
const junitOutputFile = requireNonEmptyString("JUNIT_OUTPUT_FILE");
const allureResultsDir = requireNonEmptyString("ALLURE_RESULTS_DIR");

export default defineConfig({
  resolve: {
    alias: {
      "@gen": fileURLToPath(new URL("./src/gen", import.meta.url)),
      "@pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url))
    }
  },
  test: {
    globals: true,
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: testTimeoutMs,
    hookTimeout: hookTimeoutMs,
    retry,
    include: ["tests/api/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/ui/**", "playwright-results/**", "playwright-report/**"],
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
