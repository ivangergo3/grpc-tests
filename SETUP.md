## Setup guide (copy this harness into your own repo)

This is a step-by-step checklist for creating **your own gRPC test harness** based on this folder, while swapping in **your real proto files** and adding your own service wrappers/tests.

---

## 0) Prerequisites (new computer)

- **Bun** installed (runner + package manager)
- **Java** installed (required for the Allure CLI used by `bun run allure:serve`)

---

## 1) Setup on a different computer (manual copy workflow)

If you can’t copy the whole `grpc-tests/` folder as-is, create a new `grpc-tests/` directory in your target repo and manually copy the **minimum harness files** below.

### 1.1) Copy these files (core config)

- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `eslint.config.js`
- `.prettierrc.json`
- `.gitignore`
- `SETUP.md`

### 1.2) Copy these files (proto generation)

- `scripts/gen-protos.sh`
- `scripts/gen-protos.ps1`

### 1.3) Copy these files (framework “engine”)

- `src/utils/environments.ts`
- `src/utils/logger.ts`
- `src/utils/fixtures.ts`
- `src/utils/grpc/credentials.ts`
- `src/utils/test/globals.d.ts`
- `src/utils/test/vitest.setup.ts`
- `src/services/base.ts`

### 1.4) Optional: copy local demo infra (offline tests)

- `src/utils/test/servers.ts`
- `src/utils/test/fixtures.ts`
- `src/tests/*local*.test.ts`

### 1.5) What you provide per project

- `proto/**` (your actual proto tree)
- `src/services/*.ts` (your ApiObjects / service wrappers)
- `src/tests/*.test.ts` (your tests)

After you copy in your protos:

- delete any existing `src/gen/**` (if present)
- regenerate with `bun run gen`

---

## 2) Install dependencies

From `grpc-tests/`:

```bash
bun install
```

### 2.1) Dependencies (keep these in sync)

This project uses **Bun**, but it installs standard **npm packages** into `node_modules/`.

The source-of-truth is:

- `package.json` (direct deps)
- `bun.lock` / `bun.lockb` (transitive deps pinned by Bun)

Current direct deps (top-level):

- **Dependencies**
  - `@grpc/grpc-js`
  - `protobufjs`
- **Dev dependencies**
  - `vitest` (v4)
  - `@vitest/runner` (v4)
  - `allure-vitest` + `allure-commandline`
  - `grpc-tools` + `ts-proto`
  - `typescript`
  - `eslint` + `typescript-eslint` + `@eslint/js`
  - `prettier` + `eslint-config-prettier`

---

## 3) Add your proto files

Put your `.proto` files under:

- `grpc-tests/proto/**`

Keep the same directory structure your org uses (e.g. `acme/user/v1/...`).

Important:

- All protos must be reachable from the **proto root**: `proto/`
- Imports in protos must be relative to that root, e.g.:
  - `import "acme/common/v1/common.proto";`

---

## 4) Generate TypeScript from protos (and commit it)

Generate:

```bash
bun run gen
```

Output:

- `src/gen/**`

What to commit:

- `proto/**`
- `src/gen/**`

Why commit `src/gen/**`:

- CI doesn’t need codegen toolchain to run tests
- devs can run tests immediately after `bun install`

---

## 5) Create ApiObjects (service wrappers)

ApiObjects live here:

- `src/services/*.ts`

They are thin wrappers around generated `grpc-js` clients that:

- provide a consistent call style (promise-based unary calls)
- apply a **global default deadline** (request timeout)
- centralize metadata/deadline handling

Base class:

- `src/services/base.ts` (`BaseGrpcService`)

Typical workflow for a new service:

1. Find generated client in `src/gen/**` (ex: `@gen/foo/bar/v1/my_service`)
2. Create `src/services/my-service.ts`
3. Extend `BaseGrpcService<...Client>`
4. Implement methods for each RPC (unary calls)

---

## 6) Configure environments (targets, certs, timeouts, retries)

All “global variables” are in:

- `src/utils/environments.ts`

Select an environment at runtime:

- `TEST_ENV=local|dev`

### What to fill in

For each environment, set per-service config:

- `target` (host:port)
- `insecure` (plaintext for local/dev only)
- `caCertPath` (TLS)
- `clientCertPath` + `clientKeyPath` (mTLS)

### Global timeouts

In `environments.ts`:

- `timeouts.grpcDefaultDeadlineMs`: default per-request deadline for all unary calls
- `timeouts.testTimeoutMs`: Vitest per-test timeout
- `timeouts.hookTimeoutMs`: Vitest hook timeout
- `timeouts.runTimeoutMs`: whole test-run watchdog (hard-fail if hung)

### Global retries

In `vitest.config.ts`:

- CI default: **2 retries** when `CI` is set
- local default: environment’s `timeouts.retry` (usually 0)
- override:
  - `VITEST_RETRY=3 bun run test`
  - `TEST_RETRY=3 bun run test`

---

## 7) Choose local vs remote testing style

### A) Remote-only (recommended for real cluster connectivity tests)

Keep:

- `src/utils/fixtures.ts` (`createRemoteServicesFromEnv`)
- `src/tests/*.remote.test.ts` pattern

Delete:

- `src/utils/test/servers.ts`
- `src/utils/test/fixtures.ts`
- `src/tests/*local*.test.ts`

Write tests that:

- use `@utils/fixtures` to build ApiObjects
- call deployed endpoints
- assert stable business outcomes (known test tenants/users/etc)

### B) Hybrid: local demos + remote cluster tests (best of both)

Keep everything.

Use:

- `@utils/test/fixtures` for local tests
- `@utils/fixtures` for remote tests

This is great for onboarding/demos: local runs offline, remote validates real deployments.

---

## 8) Run the suite locally

```bash
bun run typecheck
bun run lint
bun run test
```

### 8.1) Allure report (human-friendly)

Run tests (produces `allure-results/`), then open the report UI:

```bash
bun run test
bun run allure:serve
```

JUnit output:

- `test-results/junit.xml`

---

## 9) CI notes (minimal configuration)

CI examples:

- Jenkins pipelines live in `grpc-tests/jenkins/`
- Local Jenkins demo setup: see `grpc-tests/Jenkins.md`

Recommended CI env vars:

- `TEST_ENV=dev` (or another env you add)
- `CI=true` (most CI sets this automatically)

Optional overrides:

- `VITEST_RETRY=2` (if your CI doesn’t set `CI`)
- `GRPC_DEFAULT_DEADLINE_MS=15000` (quickly tune request timeout without editing code)

Certificates:

- mount cert files into the CI job container/runner
- point `caCertPath`, `clientCertPath`, `clientKeyPath` in `environments.ts` to those mounted paths

---

## Config files explained (what they do and why)

### `package.json`

- **scripts**
  - `gen`: proto → TS generation (bash)
  - `gen:ps`: proto → TS generation (PowerShell)
  - `test`: runs Vitest (JUnit reporter enabled)
  - `allure:serve`: serve Allure report UI from `allure-results/`
  - `allure:generate`: generate static HTML report into `allure-report/`
  - `allure:open`: open a generated `allure-report/`
  - `typecheck`: strict TS typechecking
  - `lint`: ESLint (typed rules enabled)
  - `format` / `format:check`: Prettier formatting
- **deps**
  - `@grpc/grpc-js`: runtime client/server implementation
  - `protobufjs`: required by ts-proto runtime bits
- **dev deps**
  - `grpc-tools`: bundled protoc
  - `ts-proto`: TS generation plugin
  - `vitest`: test runner (v4)
  - `allure-vitest` + `allure-commandline`: Allure reporting
  - `eslint` + `typescript-eslint`: typed linting
  - `prettier`: formatting

### `tsconfig.json`

- Enables TS strict mode and modern JS target.
- Defines path aliases:
  - `@gen/*` → `src/gen/*`
  - `@services/*` → `src/services/*`
  - `@utils/*` → `src/utils/*`

### `vitest.config.ts`

- Sets:
  - `testTimeout` / `hookTimeout` from `environments.ts`
  - `retry` (2 in CI by default, 0 locally)
  - reporters: `verbose` + `junit` + Allure (`allure-vitest`)
- Adds runtime aliases (`resolve.alias`) matching `tsconfig.json`

### `eslint.config.js`

Typed linting is enabled (important for catching async bugs).

Key rules:

- **No floating promises**: forces `await`/handling for gRPC calls
- **No `any`** (project-wide)
- **Consistent type imports**: encourages `import type` to keep runtime clean
- **Prefer arrow style** and discourages `function` keyword for declarations

Test folders relax some style rules to keep tests readable:

- `src/tests/**`
- `src/utils/test/**`

### `.prettierrc.json`

Formatting defaults that avoid cross-OS churn:

- `arrowParens: "always"`
- `endOfLine: "lf"`

### `.gitignore`

Ignores:

- `node_modules/`, `dist/`, `test-results/`, etc.

### `scripts/gen-protos.sh` / `scripts/gen-protos.ps1`

Runs protoc (from `grpc-tools`) + `ts-proto` plugin.

- Input: `proto/**`
- Output: `src/gen/**`

### `src/utils/environments.ts`

Your single place for:

- service targets/cert paths per environment
- global timeouts + retries defaults

### `src/utils/grpc/credentials.ts`

Turns `{ insecure, caCertPath, clientCertPath, clientKeyPath }` into:

- plaintext creds OR TLS creds OR mTLS creds

### `src/utils/fixtures.ts`

Creates ApiObjects for **remote testing** using `environments.ts`.

### `src/utils/test/servers.ts` + `src/utils/test/fixtures.ts`

Local-only helpers:

- start in-process gRPC servers (for demos/offline tests)
- build ApiObjects against those servers

### `src/utils/test/vitest.setup.ts`

Global test setup:

- provides global `log`
- adds watchdog (`runTimeoutMs`)
- hard-fails on `unhandledRejection` / `uncaughtException`
