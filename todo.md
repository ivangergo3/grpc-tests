# Vitest → Playwright (API + UI) migration TODO

This checklist tracks the migration from:

- **API runner**: Vitest → Playwright (no browser expected)
- **UI runner**: Playwright (unchanged conceptually)
- **Fixtures**: `fixturesApi.ts` + `fixturesUi.ts` → **one** shared Playwright fixture module
- **Config**: one `playwright.config.ts` with two projects (`api`, `ui`)
- **Commands**: keep **two separate commands** (api vs ui) and keep **merged Allure** flow
- **CI**: keep **per-file API sharding** (matrix) but execute via Playwright

---

## Phase 0: Baseline / guardrails

- [ ] **Confirm** API tests live in `tests/api/*.test.ts` and UI tests in `tests/ui/*.test.ts`.
- [ ] **Goal behavior**:
  - [ ] `bun run test:api` should run via Playwright and **not install or require browsers**.
  - [ ] `bun run test:ui` should still run chromium UI tests.
  - [ ] `bun run allure:local` should still create merged report from `allure-results-api/` + `allure-results-ui/`.

---

## Phase 1: Shared Playwright fixtures (`src/utils/fixtures.ts`)

### Files to create / modify

- [ ] Create `src/utils/fixtures.ts` (new, shared fixture entrypoint).
- [ ] Create `src/utils/consoleCapture.ts` (new; extracted from current Vitest setup).
- [ ] Leave existing `src/utils/fixturesUi.ts` and `src/utils/fixturesApi.ts` in place initially; migrate callers first.

### Fixture API surface (what `fixtures.ts` should export)

- [ ] `export { expect }`
- [ ] `export const test = base.extend<...>(...)` with fixtures:
  - [ ] `api`: service clients (same as `createLocalServices`)
  - [ ] `log`
  - [ ] `build` / `request` / `req` / `verify` (re-export from `fixturesApi.ts`)
  - [ ] `pages`

### `pages` behavior

- [ ] In **UI project**:
  - [ ] `pages.exampleDomain` exists and wraps Playwright `page`.
- [ ] In **API project**:
  - [ ] Accessing `pages` should **throw immediately** with a clear message, e.g.:
    - `"pages are not available in Playwright project=api"`
  - [ ] (Note) We accept that accidental access might still start a browser; fail-fast is the key requirement.

### Global expect bridge

- [ ] Ensure framework verifiers that rely on global `expect` keep working:
  - [ ] if `globalThis.expect` is not set, set it to Playwright `expect`.

---

## Phase 2: Artifacts + Allure attachments (Playwright hooks)

### Replace Vitest setup behavior

Current Vitest-only behavior lives in:

- `src/utils/vitest.setup.ts` (console patching, global handlers, artifacts)

Port to Playwright:

- [ ] In `fixtures.ts`:
  - [ ] `test.beforeEach`:
    - [ ] create artifacts context via `startTestArtifacts(testInfo.titlePath().join(" › "), allureRuntime)`
  - [ ] `test.afterEach`:
    - [ ] `attachArtifactsToAllure(ctx)`

### Use correct Allure runtime API in Playwright

- [ ] Use `allure-js-commons` runtime API (used by `allure-playwright`):
  - [ ] `import * as allure from "allure-js-commons"`
  - [ ] `await allure.attachment(...)` for `framework.log`, `grpc.calls.json`, `grpc.error.json`

### Console capture

- [ ] Extract console patching to `src/utils/consoleCapture.ts`:
  - [ ] `patchConsoleOnce()` mirrors `vitest.setup.ts` behavior and calls `recordLog(...)`.
  - [ ] Ensure it is invoked once when fixtures load (import side effect or explicit call).

### Run-wide watchdog / global handlers

- [ ] Decide how to handle `RUN_TIMEOUT` / unhandled rejections previously enforced by Vitest:
  - [ ] Implement Playwright-side equivalents (likely `globalSetup`/`globalTeardown` or process handlers installed once).
  - [ ] Keep semantics: fail hard on unhandled rejections/uncaught exceptions; optional run watchdog.

---

## Phase 3: One Playwright config, two projects

### Update `playwright.config.ts`

- [ ] Set `testDir: "./tests"` (or keep per-project testMatch).
- [ ] Define two projects:
  - [ ] `api`:
    - [ ] `testMatch: ["tests/api/**/*.test.ts"]`
    - [ ] No browser should be needed (headless, but ideally do not create context/page).
  - [ ] `ui`:
    - [ ] `testMatch: ["tests/ui/**/*.test.ts"]`
    - [ ] Use chromium project settings.
- [ ] Make config env parsing **non-fatal**:
  - [ ] Avoid `requireNonEmptyString/requireNonNegativeInt` for UI-only vars at module load.
  - [ ] Use defaults and/or only validate UI vars when running UI project.
- [ ] Keep allure reporter with results dir selectable by env:
  - [ ] API: `ALLURE_RESULTS_DIR` (e.g. `allure-results-api`)
  - [ ] UI: `ALLURE_RESULTS_DIR_UI` (e.g. `allure-results-ui`)
- [ ] Add JUnit reporter output compatible with CI (optional but recommended):
  - [ ] Use env `JUNIT_OUTPUT_FILE` for API sharded jobs

---

## Phase 4: Convert API tests from Vitest → Playwright

### Files to convert

- [ ] `tests/api/user-service.test.ts`
- [ ] `tests/api/payment-service.test.ts`
- [ ] `tests/api/shipping-service.test.ts`
- [ ] `tests/api/demo-failure.test.ts`

### Mechanical conversion rules

- [ ] Replace Vitest imports:
  - [ ] from `vitest` → from shared fixtures: `import { test, expect } from "@utils/fixtures"`
- [ ] Replace `describe`/`it` with `test.describe` / `test(...)`:
  - [ ] `it.skip` → `test.skip`
- [ ] Replace global fixture imports (`api`, `verify`, `log`) with Playwright fixture params:
  - [ ] `test("...", async ({ api, verify, log }) => { ... })`
- [ ] Keep existing verifier helpers; ensure they still resolve `expect` (global bridge).

---

## Phase 5: Scripts (`package.json`) and local commands

- [ ] Update scripts:
  - [ ] `test:api` → `playwright test --project api`
  - [ ] `test:api:allure` → `ALLURE_RESULTS_DIR=allure-results-api playwright test --project api`
  - [ ] `test:ui` → `playwright test --project ui`
  - [ ] `test:ui:allure` → `ALLURE_RESULTS_DIR_UI=allure-results-ui playwright test --project ui`
- [ ] Ensure `test` and `test:strict` still do “API then UI” and preserve current semantics.
- [ ] Keep `allure:merge` logic the same (still merges `allure-results-api/` and `allure-results-ui/` into `allure-results/`).

---

## Phase 6: CI (`.github/workflows/test.yml`) — keep API matrix sharding

- [ ] Keep `discover_api_tests` step unchanged (per-file matrix).
- [ ] In `api` job:
  - [ ] Replace `bun run test:api:allure -- "${{ matrix.file }}"` with Playwright invocation:
    - [ ] either keep script passthrough: `bun run test:api:allure -- "${{ matrix.file }}"`
    - [ ] or direct: `node ./node_modules/.bin/playwright test --project api "${{ matrix.file }}"`
  - [ ] Keep `JUNIT_OUTPUT_FILE` behavior (one file per shard).
  - [ ] Do **not** install Playwright browsers in API job.
- [ ] In `ui` job:
  - [ ] Keep browser install step.
- [ ] In `report` job:
  - [ ] Keep artifact collection + merge unchanged.

---

## Phase 7: Remove Vitest (final cleanup)

Only after Playwright API runs are green:

- [ ] Remove dependencies from `devDependencies`:
  - [ ] `vitest`
  - [ ] `@vitest/runner`
  - [ ] `allure-vitest`
- [ ] Delete or stop using:
  - [ ] `vitest.config.ts`
  - [ ] `src/utils/vitest.setup.ts`
  - [ ] `src/utils/allureReporterEnhanced.ts`
- [ ] Update `tsconfig.json`:
  - [ ] remove `vitest/globals` from `compilerOptions.types`
- [ ] Update docs:
  - [ ] `README.md` (API tests are Playwright now; update env var list)
  - [ ] `.env.example` (remove unused Vitest vars; add/repurpose Playwright/JUnit vars)

---

## Done when (acceptance checklist)

- [ ] `bun run test:api` runs Playwright API tests successfully on a fresh machine without installing browsers.
- [ ] `bun run test:ui` runs UI tests successfully.
- [ ] `bun run allure:local` produces a merged Allure report with:
  - [ ] `framework.log` attachment
  - [ ] `grpc.calls.json` attachment
  - [ ] `grpc.error.json` attachment when failures occur
- [ ] CI passes with API sharding preserved and merged report still generated.

