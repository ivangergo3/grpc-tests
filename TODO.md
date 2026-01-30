# TODO (next real-life improvements)

This file tracks the next upgrades to make this gRPC test harness more usable in production-like environments (clusters, TLS/mTLS, CI).

## 1) Failure artifacts in Allure (request/response/error) **[in progress]**

Goal: **no noisy terminal logs**, but when a gRPC call fails you can open the Allure report and see the useful payloads immediately.

- [x] Add a reporting-capable unary wrapper in `src/services/base.ts` that can attach artifacts to Allure on error (and optionally on success).
- [x] Route ApiObjects through the wrapper (User/Order/Inventory/Payment/Shipping/Notification/Audit).
- [ ] Add a stable demo test that triggers a gRPC failure in a normal local run (blocked in this sandbox because local servers can’t bind to `127.0.0.1`).
- [ ] Add “response-on-error” where available (today we attach request + error summary; responses often don’t exist on gRPC unary failures).
- [ ] Make attachment names consistent + searchable (service + rpc + env + correlation id).

Notes:

- We already redact common secret-like keys (authorization/token/secret/etc.) in attachments.
- Attachments are guarded so they won’t crash if Allure context isn’t available.

## 2) Standard report metadata (labels/tags) **[pending]**

Goal: make it easy to filter large suites in Allure.

- [ ] Add labels per test: `service`, `rpc`, `env`, `severity`, `owner` (or whatever your org uses).
- [ ] Optional: suite hierarchy conventions (parentSuite/suite/subSuite).

## 3) Sanitization + size limits **[pending]**

Goal: avoid leaking secrets/PII into CI artifacts, and keep reports fast.

- [ ] Central “redactor” rules for headers + known sensitive fields.
- [ ] Payload truncation limits per attachment (request/response/error).
- [ ] Optional: allowlist mode for remote environments.

## 4) Resilience helpers for remote envs **[pending]**

Goal: reduce flaky failures while keeping tests honest.

- [ ] Helpers for eventual consistency (poll with clear time bounds).
- [ ] Classify errors: transient infra (UNAVAILABLE/DEADLINE_EXCEEDED) vs contract/business errors.
- [ ] Selective retries only for transient errors.

## 5) Environment/endpoint selection ergonomics **[pending]**

Goal: keep `environments.ts` as source-of-truth, but allow practical overrides.

- [ ] Per-service target overrides via env vars (optional).
- [ ] “smoke mode” (connectivity + a few critical RPCs).
- [ ] Tag-based selection to run subsets in CI.

## 6) CI artifact publishing **[pending]**

Goal: make reports easy to access from CI runs.

- [ ] Document how to publish `allure-results/` + generated report as CI artifacts.
- [ ] Keep JUnit XML for CI test summaries / PR annotations.
- [ ] Optional: publish Allure HTML to a static location (depends on CI).

## 7) Multi-proto/app version strategy **[pending]**

Goal: test multiple API versions without breaking ApiObjects/tests.

- [ ] Decide structure: parallel generated trees (`src/gen/v1`, `src/gen/v2`) vs separate packages vs separate harness folders.
- [ ] Adapter layer in ApiObjects to select version at runtime.
- [ ] Test selection per version (env var / config).

## 8) Low-effort “daily usability” wins **[pending]**

These are intentionally small and practical.

- [ ] Add a `test:smoke` script / tag convention (quick connectivity gate for CI).
- [ ] Add a small “known test data” convention for remote tests (one place to document tenant/user/order ids).
- [ ] Add a short troubleshooting section (Java required for Allure CLI, TLS file paths, common gRPC error codes).
