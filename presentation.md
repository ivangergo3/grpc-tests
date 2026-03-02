# gRPC Tests Framework (API + UI) walkthrough 

Use this file as a **scrollable presentation**.

---

## 1) What is this repo?

This repository is a **small test framework** for validating a gRPC system using:

- **API tests** (Vitest) against an **external stub server** ( this can be easily changed for actual services )
- **UI tests** (Playwright) that can also call the same gRPC APIs ( reusability )
- **Allure reporting** with a **merged report** across API + UI runs

The key idea: **tests stay simple** (Given / When / Then) while the framework owns:

- request building
- success + failure verification
- consistent logging + artifacts
- streaming aggregation (server-stream → “one big response”)

---

## 2) Repo map (what lives where)

- **Protos**: `proto/**`
- **Generated code (committed)**: `src/gen/**`
- **API layer (ApiObjects / Service APIs)**: `src/services/**`
  - base: `src/services/base/**`
  - domains: `src/services/{user,payment,shipping}/**`
- **UI layer (Page Objects)**: `src/pages/**`
- **Utilities**: `src/utils/**`
  - `env.ts` (env parsing, dotenv)
  - `fixturesApi.ts` (API test surface: `api`, `build`, `verify`, `log`)
  - `fixturesUi.ts` (UI test surface: Playwright `test`, plus `api/build/verify/log/pages`)
- **Test server (stub)**: `test-server/**` **( demoing purposes )**
- **Tests**
  - API: `tests/api/**`
  - UI: `tests/ui/**`

---

## 2.1) Main packages used (what they’re for)

I usually show this right after the repo map, so people know what’s “ours” vs “third-party”.

### Runtime dependencies

- **`@grpc/grpc-js`**: Node gRPC runtime (clients/transport).
- **`protobufjs`**: protobuf runtime helpers used by generated code.

### Tooling / test runner dependencies

- **`vitest`**: API test runner.
- **`@playwright/test`**: UI test runner (Chromium).
- **`allure-vitest`** + **`allure-playwright`** + **`allure-commandline`**: results + report generation.
- **`grpc-tools`** + **`ts-proto`**: proto → TypeScript codegen into `src/gen/**`.
- **`typescript`**: typechecking.
- **`eslint`** + **`typescript-eslint`**: linting.
- **`prettier`**: formatting.

### Runtime / package manager

- **`bun`**: installs deps and runs scripts (tests, codegen, tooling).

---

## 2.2) Connections: insecure vs TLS / mTLS (supported, not demoed)

In this demo repo we run a local stub server on `127.0.0.1:50051`, so the default setup is **insecure plaintext**.

In a real environment, the same service layer can use **TLS or mTLS** by supplying gRPC `ChannelCredentials` to the service APIs:

- **Insecure (demo)**: default when credentials are not provided.
- **TLS / mTLS (real env)**: pass credentials (e.g. `grpc.credentials.createSsl(...)`) into the service constructors.

Why it’s not shown in the demo:

- the stub server is intentionally minimal and runs locally
- certificate provisioning/rotation and trust chains belong to the real deployment environment, not this sample

---

## 3) Architecture (big picture)

```mermaid
flowchart LR
  subgraph Tests
    A[Vitest API tests\n tests/api/*] -->|api fixture| Svc[Service APIs\nUser/Payment/Shipping]
    U[Playwright UI tests\n tests/ui/*] -->|ui fixture| Pages[Page Objects\nsrc/pages/*]
    U -->|api fixture reuse| Svc
  end

  subgraph Framework
    Svc --> Base[BaseGrpcService\n(unary + streaming aggregation)]
    Svc --> Build[Request builders\nbuild.*]
    Svc --> Verify[Verifiers\nverify.*]
    Base --> Artifacts[Artifacts + logging\nsrc/utils/testArtifacts.ts]
  end

  subgraph External
    Server[test-server\n(standalone gRPC stub)] <-->|grpc-js| Base
    Web[example.com] <-->|Playwright| Pages
  end

  Verify --> Allure[Allure results\napi + ui]
  Allure --> Merge[merge + generate]
  Merge --> Report[allure-report/]
```

**Talking points**

- Tests call **Service APIs** (not raw grpc-js clients, but service layer).
- Streaming RPCs are **aggregated** into a single response to simplify assertions.
- Both runners (Vitest + Playwright) produce Allure results → merged report.

---

## 3.1) Reporting pipeline (Allure): how the report gets built

```mermaid
flowchart TB
  subgraph Runs["Test runs"]
    A["bun run test:api:allure\n(Vitest + allure-vitest)"]
    U["bun run test:ui:allure\n(Playwright + allure-playwright)"]
  end

  subgraph Results["Allure results folders"]
    RA["allure-results-api/**"]
    RU["allure-results-ui/**"]
    RM["allure-results/** (merged)"]
  end

  subgraph Report["HTML report output"]
    HTML["allure-report/**"]
  end

  subgraph Commands["Commands"]
    M["bun run allure:merge"]
    G["bun run allure:generate:merged"]
    S["bun run allure:serve"]
  end

  A --> RA
  U --> RU
  RA --> M
  RU --> M
  M --> RM --> G --> HTML
  RM --> S
```

---

## 3.2) Connectivity map (main): test cases → framework → external dependencies

```mermaid
flowchart TB
  subgraph Test cases
    T_api["API test cases"]
    T_ui["UI test cases"]
  end

  subgraph Framework["Framework"]
    F_api["fixturesApi.ts"]
    F_ui["fixturesUi.ts"]
    F_user["user/*"]
    F_pay["payment/*"]
    F_ship["shipping/*"]
    F_base["base/BaseGrpcService"]
    F_types["types.ts"]
    F_utils["utils folder"]
  end

  subgraph ExternalDeps["External inputs"]
    subgraph Gen["Generated client/types (src/gen/**)"]
      G["ts-proto output\nmessage types + grpc-js clients"]
    end

    subgraph Transport["Transport package"]
      GRPC["@grpc/grpc-js"]
    end
  end

  T_api --> F_api
  T_ui --> F_ui
  F_api --> F_user & F_pay & F_ship
  F_ui --> F_user & F_pay & F_ship
  F_user --> F_base
  F_pay --> F_base
  F_ship --> F_base
  F_base --> F_types
  F_user --> G
  F_pay --> G
  F_ship --> G
  G --> GRPC
  F_base --> F_utils
```

---



## 4) The “test style” goal

We aim for a consistent 3-part structure:

- **Given**: build params / input
- **When**: call `api.<service>.<rpc>WithParams(...)`
- **Then**: verify via `verify.<service>.*(...)`

Example shape (conceptual):

```ts
// given
const params = { ... };

// when
const res = await api.user.getUserWithParams(params);

// then
verify.user.getUserSuccess(res, { expectedRequestId: "..." });
```

Why this matters:

- give it a go, even if we are not using strict cucumber at this moment

---

## 5) Why Api Objects + Page Objects?

Instead of writing raw gRPC calls or raw UI selectors directly in tests:

- We wrap generated gRPC clients in typed **Api Objects** (`src/services/**`)
- We wrap UI flows in **Page Objects** (`src/pages/**`)

Both follow the same idea: tests should read like a spec and hide low-level details.

ApiObjects typically expose:

- `<rpc>(req)` (typed request)
- `<rpc>WithParams(params)` (request-builder path)

Page Objects typically expose:

- `goto(...)`, `expectLoaded()`, and higher-level user actions for the domain UI

This gives:

- fewer imports in tests
- consistent patterns across API + UI tests
- more useful logs and debugging artifacts when things fail

---

## 6) Streaming: why we aggregate

Server-streaming responses are collected and turned into a **single aggregated response**.

**Why**

- tests can verify *one object* instead of event listeners
- verifiers can reuse the same patterns as unary responses

---

## 7) Failures: promise rejection is the “response”

gRPC “failures” are **rejected promises** (ServiceError), not response objects.

We verify failures through helpers like:

- `verify.<service>.failurePromise(promise, expectedFailure, ctx)`

This:

- standardizes what we log on reject
- keeps failure assertions out of individual tests

---

## 8) Fixtures: the “single import” experience

### API fixture (`src/utils/fixturesApi.ts`)

Exports:

- `api` (ready-to-use clients)
- `log`
- `build` / `request`
- `verify`
- (and re-exports framework helpers)

### UI fixture (`src/utils/fixturesUi.ts`)

Exports:

- Playwright `test`, `expect`
- fixtures: `api`, `log`, `pages`, plus `build/req/verify`

**Important detail**

- UI `api` clients are now **closed after each test** (prevents leaked sockets in CI). If we will see hot things are working with a real application, maybe we can change this.

---

## 9) Allure strategy: API + UI merge

We write separate result folders:

- API → `allure-results-api/`
- UI → `allure-results-ui/`

Then merge into:

- merged → `allure-results/`
- report → `allure-report/`

This supports:

- running API and UI separately
- running them in CI in sequence or in parallel and still producing one report

---

## 10) Commands (local)

### Start stub server (terminal A)

```bash
bun run test-server
```

### Run tests (terminal B)

```bash
# API only
bun run test:api

# UI only
bun run test:ui

# Both (non-strict; continues even if failures)
bun run test

# Strict (CI style)
bun run test:strict
```

### Install Playwright browser (first time)

```bash
bun run test:ui:install
```

---

## 11) Allure (local)

One-command “do everything”:

```bash
bun run allure:local
```

Manual steps:

```bash
bun run allure:clean
(bun run test:api:allure || true)
(bun run test:ui:allure || true)
bun run allure:generate:merged
bun run allure:serve
```

---

## 12) CI overview (what happens on PR)

In `.github/workflows/test.yml` the job:

- installs dependencies **(cached)**
- installs Playwright (Chromium) **(cached)**
- starts `test-server` **(as a demo)**
- runs API tests (Allure) + UI tests (Allure) **(parallel)**
- generates merged Allure report
- uploads artifacts
- posts a PR comment with:
  - run link
  - counts (passed/failed/skipped)
  - artifact link + how to serve it locally

---

## 13) Live demo (3 minutes)

1) Start server:

```bash
bun run test-server
```

2) Run a small subset:

```bash
bun run test:api -- tests/api/shipping-service.test.ts
bun run test:ui -- tests/ui/ui-and-grpc.test.ts
```

3) Generate merged report:

```bash
bun run allure:local
```

4) Open:

```bash
bun run allure:open
```

---

## 14) Design decisions (quick Q&A bullets)

- **Why commit `src/gen/**`?**
  - repeatable builds, less local toolchain pain, easier onboarding
  - is this one of the suggested ways by gRPC to handle protos
- **Why external `test-server/`?**
  - test framework stays pure; server process is explicit and debuggable
  - this is por testing purposes, with a deployed service we have a better solution
- **Why no `expect` imports in verifiers?**
  - avoids cross-runner collisions; Vitest uses globals, UI uses injected expect
  - meaning, when we run API tests we use Vitest runner and verifier, when we run UI tests, we use Playwright
  - this might cause some problems later, we will need to test it with a real service
- **Why merge Allure results?**
  - single view of “end-to-end”: UI + API in one report
  - usability

---

## 15) Roadmap ideas (optional)

- use this as a skeleton for a real framework
- add one service at a time with API test
- introduce UI tests later
- gradual rolling out

