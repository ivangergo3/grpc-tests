import { describe, it } from "vitest";

import { api, log, verify } from "@utils/fixturesApi";

describe("Demo tests (report/logging examples)", () => {
  it.skip("skipped demo test", () => {
    // No-op; this is just to have one SKIPPED test in reports.
  });
});

/**
 * This is intentionally failing so you can see logs and assertion output.
 */
describe("Demo failing tests (intentionally red)", () => {
  it("fails after a real gRPC call", async () => {
    log.info("demo failing test starting");
    const res = await api.payment.authorizeWithParams({
      paymentId: "demo-pay-1",
      context: { requestId: "demo-req-id" }
    });
    log.info("demo authorize response", res);

    // Intentional failure: stub returns AUTHORIZED
    verify.payment.authorizeSuccess(res, {
      expectedRequestId: "demo-req-id",
      expectedStatus: "CAPTURED"
    });
  });
});
