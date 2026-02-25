import { defineConfig } from "@playwright/test";

import { loadDotEnvOnce, requireNonEmptyString, requireNonNegativeInt } from "./src/utils/env";

loadDotEnvOnce();

const testTimeoutMs = requireNonNegativeInt("PLAYWRIGHT_TEST_TIMEOUT");
const expectTimeoutMs = requireNonNegativeInt("PLAYWRIGHT_EXPECT_TIMEOUT");
const actionTimeoutMs = requireNonNegativeInt("PLAYWRIGHT_ACTION_TIMEOUT");
const retries = requireNonNegativeInt("PLAYWRIGHT_RETRIES");
const baseURL = requireNonEmptyString("PLAYWRIGHT_BASE_URL");
const allureResultsUiDir = requireNonEmptyString("ALLURE_RESULTS_DIR_UI");

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  timeout: testTimeoutMs,
  expect: { timeout: expectTimeoutMs },
  retries: retries,
  use: {
    headless: true,
    baseURL,
    actionTimeout: actionTimeoutMs,
    viewport: { width: 1920, height: 1080 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
    // Maybe for debugging purposes
    // video: "retain-on-failure",
    // launchOptions: {
    //   slowMo: 1000,
    // }
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" }
    }
  ],
  reporter: [["list"], ["html"], ["allure-playwright", { resultsDir: allureResultsUiDir }]],
  outputDir: "playwright-results"
});
