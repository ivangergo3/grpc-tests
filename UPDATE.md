# UPDATE: Request/Response object model + multi-response + system flags

This document lists tasks for the refactor: base request/response objects, verification hierarchy, multi-response handling (streaming + aggregated), and env-driven system flags (System A/B/C). Tests stay free of conditionals; logic lives in the object layer.

---

## 0. Proto + server (test harness for multi-response)

So the request/verification layer and tests can exercise both “streaming” and “aggregated” behavior, add proto and server support first.

- [x] **0.1** **Proto: streaming** – In at least one service (e.g. Notification or Inventory), add a **server-streaming** RPC that returns multiple response messages (e.g. `rpc SendEmailStream(...) returns (stream SendEmailResponse);` or `rpc GetStockStream(...) returns (stream GetStockResponse);`). Keep existing unary RPCs so current tests still work.
- [x] **0.2** **Proto: aggregated** – In the same (or another) service, add an **aggregated** response type and RPC that returns one message containing N logical responses (e.g. `message GetStockAggregatedResponse { repeated GetStockResponse responses = 1; }` and `rpc GetStockAggregated(...) returns (GetStockAggregatedResponse);`). This lets tests exercise “one object with many responses” without streaming.
- [x] **0.3** **Regenerate** – Run the existing proto codegen (e.g. `scripts/gen-protos.sh` or `bun run` equivalent) so the new RPCs and messages are available in `src/gen/` and the service interfaces in `src/services/` can call them.
- [x] **0.4** **servers.ts: streaming** – Implement the new server-streaming RPC in `src/utils/test/servers.ts`: in the handler, write N responses (e.g. 1, 2, or 3) based on env/system flags (System A always 1; if B enabled add one more; if C enabled add one more), then end the stream. So the same test can run with 1/2/3 responses by toggling flags.
- [x] **0.5** **servers.ts: aggregated** – Implement the new aggregated RPC in `servers.ts`: return one response object that contains N sub-responses, again driven by system flags so tests can assert “we got one message with N responses” and verifiers can iterate over them.
- [x] **0.6** **Document** – In UPDATE.md or README, note which RPC(s) are used for multi-response tests (streaming vs aggregated) and how system flags (A/B/C) map to response count so the rest of the refactor (request objects, verifiers, tests) can rely on this behavior.

**Implemented:** Streaming = `NotificationService.SendEmailStream` (server-streaming). Aggregated = `InventoryService.GetStockAggregated` (returns `GetStockAggregatedResponse.responses[]`). Response count N = 1 + (1 if `SYSTEM_B_ENABLED=true|1`) + (1 if `SYSTEM_C_ENABLED=true|1`). See `getMultiResponseCount()` in `src/utils/test/servers.ts`.

---

## 1. Environment / system flags

- [x] **1.1** Add env-driven system flags: System A = on always; System B and System C = off by default, can be enabled via env vars (e.g. `SYSTEM_B_ENABLED`, `SYSTEM_C_ENABLED`).
- [x] **1.2** Expose these flags in a single place (e.g. `environments.ts` or a small `systems.ts`) so the service layer and request/verification layer know which systems are “online” and thus how many responses to expect for a given request.
- [x] **1.3** (Optional) Document expected response count rules: e.g. “request that hits System A only → 1 response; A+B → 2; A+B+C → 3” so request/verification objects can derive expected count from the active systems for that request.

---

## 2. Base request layer

- [x] **2.1** Define a **base request** abstraction that sets common things (headers, metadata, deadline, context, actor, etc.). No service-specific fields here.
- [x] **2.2** Add **child request** types that extend/compose the base: e.g. `OrderRequest`, `PaymentRequest`, `NotificationRequest`, etc., each adding their own fields while reusing base behavior.
- [x] **2.3** Ensure the base (and children) can be used to build the actual gRPC request objects (or wrappers) so tests and service layer call “orderRequest”, “paymentRequest”, etc., without touching raw headers/metadata in every test.
- [x] **2.4** (Optional) Allow request builders to be tagged with “which systems this hits” so the verification layer can know expected response count (1/2/3) from config + request type.

---

## 3. Base verification / response layer

- [x] **3.1** Define a **base verification** abstraction: given one or more responses (streaming list or single aggregated result), it can validate common aspects (e.g. status, context, requestId, no unexpected errors).
- [x] **3.2** Add **child verifiers** for specific outcomes:
  - Success (e.g. 200-style) for Notification, Payment, etc.
  - Bad request / error path verifier (reusable).
  - Optional: service-specific verifiers (e.g. “notification 200”, “payment 200”) that delegate to the base and add service-specific checks.
- [x] **3.3** Design verifiers so they accept **either** a single response **or** multiple responses (array/stream). So the same verifier can be used for “1 aggregated result” or “N streamed results”; no `if (responseCount === 1)` in tests.
- [x] **3.4** (Optional) From the request type + system flags, compute expected response count (1/2/3) and pass that into the verifier so it can assert “we got exactly N responses” and then run the same checks on each (or on the aggregated view).

---

## 4. Multi-response handling (streaming + aggregated)

- [x] **4.1** Support **streaming**: RPC returns multiple response objects (e.g. via a stream or repeated callbacks). The service layer (or a thin wrapper) should collect them and present “list of responses” to the verification layer.
- [x] **4.2** Support **aggregated**: backend returns one object that logically contains “all” results (e.g. a list of sub-responses). The verification layer should be able to treat this as “N logical responses” and run the same verifiers (e.g. one per system) so tests don’t branch on “streaming vs aggregated”.
- [x] **4.3** Unify the API: verification objects receive “one or many” (single object or array) and handle both; tests always call something like `verifyNotification200(responses)` or `verifyPayment200(responses)` without `if (Array.isArray(responses) …)`.
- [x] **4.4** Ensure Allure/reporting still works: attach request + all responses (or aggregated payload) on failure so debugging stays easy.

---

## 5. Service layer integration

- [x] **5.1** In the **service layer** (e.g. `InventoryServiceApi`, `OrderServiceApi`, etc.), add (or refactor to) functions that:
  - Build the request using the new request objects (base + child).
  - Send the request.
  - Return “raw” response(s): either one value or an array, depending on whether the RPC is unary vs streaming / aggregated.
- [x] **5.2** Where an RPC can return multiple responses (streaming or aggregated), the service layer should return a consistent shape (e.g. always `TRes | TRes[]` or a small `{ responses: TRes[] }`) so verifiers don’t need to branch on “one vs many”.
- [x] **5.3** (Optional) Service layer could expose “sendAndVerify” helpers that take a request object + a verifier and return (response(s), verification result) so tests only call one method when you want “send + verify” in one step. Keep “send” and “verify” separate so tests can still do send-then-verify when needed.

---

## 6. Tests: no conditionals

- [x] **6.1** Refactor tests so they **never** branch on “how many responses” or “streaming vs aggregated”. They call request builders and verifiers only.
- [x] **6.2** Each test uses something like: build request (from base/child) → call service → get response(s) → pass to verifier. The verifier (and possibly the request object + system config) encapsulates “expected count” and “how to check each response”.
- [x] **6.3** Add at least one test that expects 1 response, one that expects 2, one that expects 3 (or document which env/flags produce which) so the design is validated.

---

## 7. Documentation and cleanup

- [x] **7.1** Update README (or SETUP.md) to describe: system flags (env vars), how to run with System B/C on/off, and how that affects expected response count.
- [x] **7.2** Add a short “Request/Response model” section: base request, child requests, base verifier, child verifiers, and how multi-response (streaming vs aggregated) is handled.
- [x] **7.3** Optionally add a small “Testing with N systems” guide: “Local = 1 system, Dev with B enabled = 2, Full = 3” and how to set env vars for each.
- [x] **7.4** Remove or refactor any duplicated request-building or inline assertions that the new objects replace; keep TODO.md/UPDATE.md in sync when tasks are done.

---

## Order of work (suggested)

0. **Proto + server** (0.1–0.6): add streaming and aggregated RPCs, regenerate, implement in `servers.ts` with system-flag–driven response count so multi-response can be tested end-to-end.
1. **Env + system flags** (1.1–1.3): single source of truth for “which systems are on” and (if needed) “expected response count” for a given request type.
2. **Base request** (2.1–2.3): base + one or two child requests (e.g. order, payment) so the pattern is clear.
3. **Base verification** (3.1–3.3): base verifier + one success + one bad-request verifier; ensure they accept one or many responses.
4. **Multi-response in service layer** (4.1–4.4, 5.1–5.2): support streaming and aggregated in the API and service layer; return a unified “one or many” shape.
5. **Wire to system flags** (1.3, 3.4, 5.2): optional “expected count” from request type + flags.
6. **Refactor tests** (6.1–6.3): switch tests to request objects + verifiers only; add 1/2/3 response scenarios.
7. **Docs and cleanup** (7.1–7.4).

You can tackle “base request + one child” and “base verifier + one success + one error” first, then add more children and multi-response support.


---- Error code table on returns --- better logs for debugging


---- Github actions