import { describe, it } from "vitest";

import { createLocalServices } from "@utils/fixtures";
import { verifyAuthorizeSuccess } from "@services/payment";

describe("Demo tests (report/logging examples)", () => {
  it.skip("skipped demo test", () => {
    // No-op; this is just to have one SKIPPED test in reports.
  });
});

/**
 * This is intentionally failing so you can see logs and assertion output.
 */
describe("Demo failing tests (intentionally red)", () => {
  const api = createLocalServices();

  it("fails after a real gRPC call", async () => {
    api.log.info("demo failing test starting");
    const res = await api.payment.authorizeWithParams({
      paymentId: "demo-pay-1",
      context: { requestId: "demo-req-id" }
    });
    api.log.info("demo authorize response", res);

    // Intentional failure: stub returns AUTHORIZED
    verifyAuthorizeSuccess(res, { expectedRequestId: "demo-req-id", expectedStatus: "CAPTURED" });
  });
});
