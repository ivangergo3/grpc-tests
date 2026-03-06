## gRPC test framework (Bun + TypeScript + Playwright)

This repo is a small **gRPC testing framework** + an **external stub server** you can run locally or in CI to validate:

- **Service connectivity** (can I call the service?)
- **Contracts** (request/response shape and expectations)
- **Streaming aggregation** (server-streaming → aggregated response)
- **Rich Allure reporting** (logs + request/response/error artifacts attached automatically)

### What’s in here

- **Protos**: `proto/**`
- **Generated TypeScript** (committed): `src/gen/**`
- **Service wrappers (ApiObjects)**: `src/services/**`
  - Base: `src/services/base/` (`BaseGrpcService`, verifiers, helpers)
  - Domains: `src/services/{user,payment,shipping}/`
- **Tests**:
  - API (Playwright): `tests/api/**`
  - UI (Playwright): `tests/ui/**`
- **Test fixtures**:
  - Shared Playwright fixtures: `src/utils/fixtures.ts` (exports Playwright `test`, `expect`, plus `api`, `log`, `build`, `verify`, `exampleDomainPage`)
- **External local stub server**: `test-server/` (run separately)

---

## Quickstart

### 1) Install

```bash
bun install
```

Install Playwright browser binaries (Chromium):

```bash
bun run test:ui:install
```

### 2) Create your env file

Copy `.env.example` → `.env` and adjust values as needed.

Minimum required for local API runs:

- `TEST_SERVER_BASE_URL`
- `JUNIT_OUTPUT_FILE`
- `ALLURE_RESULTS_DIR`
- `RUN_TIMEOUT`

Minimum required for local UI runs:

- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_TEST_TIMEOUT`, `PLAYWRIGHT_EXPECT_TIMEOUT`, `PLAYWRIGHT_ACTION_TIMEOUT`
- `PLAYWRIGHT_RETRIES`
- `ALLURE_RESULTS_DIR` (set to `allure-results-ui` for UI runs)

### 3) Start the local stub server

In terminal A:

```bash
bun run test-server
```

By default it listens on `127.0.0.1:50051`.

### 4) Run tests

In terminal B:

```bash
bun run test
```

Notes:

- `bun run test` runs **API then UI** and does **not** fail the overall command if either fails (useful for demo / report generation).
- For strict behavior (CI-style): `bun run test:strict`
- Run individually:
  - API: `bun run test:api`
  - UI: `bun run test:ui`

---

## Allure reporting (local)

Note: generating/serving the Allure HTML report requires **Java** (JRE/JDK).

We keep **separate results folders** so API/UI can run independently (or in parallel in CI):

- API results: `allure-results-api/`
- UI results: `allure-results-ui/`
- Merged results: `allure-results/`
- HTML report: `allure-report/`

Typical local flow:

```bash
bun run allure:local
```

Or step-by-step:

```bash
bun run allure:clean
(bun run test:api:allure || true)
(bun run test:ui:allure || true)
bun run allure:generate:merged
bun run allure:open
```

### What gets attached automatically

Every test attaches:

- **`framework.log`**: combined framework logs + `console.*` output
- **`grpc.calls.json`**: ordered list of captured gRPC calls

If any gRPC call ends with a non-OK status (`code != 0`), the test also attaches:

- **`grpc.error.json`**: request + error status metadata + timing

`grpc.calls.json` includes timestamps and timing for easier debugging:

- `startedAtIso`, `requestSentAtIso`
- `responses[].receivedAtIso`
- `statusReceivedAtIso`
- `timeToFirstResponseMs`, `durationMs`

---

## CI (GitHub Actions)

Workflow: `.github/workflows/test.yml`

Behavior:

- starts `test-server` inside the job
- installs Playwright Chromium
- runs API tests (Allure) and UI tests (Allure)
- merges results and generates `allure-report/` (HTML)
- uploads artifacts:
  - `test-results/`, `allure-results-api/`, `allure-results-ui/`, `allure-results/`, `test-server.log`
  - `allure-report/`
- posts a PR comment linking to:
  - the workflow run
  - the Allure report artifact download

No GitHub Pages deployment is used.

---

## Proto → TypeScript generation

We generate TS using:

- `grpc-tools` (bundled `protoc`)
- `ts-proto` (`outputServices=grpc-js`)

Generate:

```bash
bun run gen
```

PowerShell:

```powershell
bun run gen:ps
```

Commit whenever protos change:

- `proto/**`
- `src/gen/**` (generated output; do not hand-edit)

---

## Test style & framework conventions

### Given / When / Then

Service tests follow a consistent pattern:

- **given**: build `params`
- **when**: call `api.<service>.<rpc>WithParams(params)`
- **then**: verify with `verify*Success(...)` or failure helpers

### Failure verification

gRPC failures are **rejections** (errors), not response messages. The framework provides:

- `verifyFailure(err, options?)`
- `verifyFailurePromise(promise, options?, { label?, onUnexpectedSuccess? })`

### Single worker execution

This framework is intended to run with **limited in-run parallelism**. Parallelism is intended to be handled at the CI level instead (e.g. sharding API tests per file).

---

## Notes

### Intentionally failing demo test

`tests/api/demo-failure.test.ts` contains an intentionally failing test to show how failures look in logs/reports.

If you want a fully green run, remove or skip that test file.

