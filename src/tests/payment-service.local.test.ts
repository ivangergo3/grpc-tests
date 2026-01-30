import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startLocalStandaloneServices } from "@utils/test/fixtures";

describe("PaymentService (local)", () => {
  let stop: () => Promise<void>;
  let api: Awaited<ReturnType<typeof startLocalStandaloneServices>>["api"];

  beforeAll(async () => {
    const started = await startLocalStandaloneServices();
    api = started.api;
    stop = started.stop;
  });

  afterAll(async () => {
    await stop();
  });

  it("Authorize returns AUTHORIZED status", async () => {
    const res = await api.payment.authorize({
      paymentId: "p-1",
      orderId: "ord-1",
      userId: "123",
      amount: { amount: "19.99", currency: "EUR" },
      method: {
        methodId: "pm-1",
        type: "CARD",
        card: { panLast4: "4242", brand: "VISA", expMonth: 12, expYear: 2030 },
        attributes: { tokenized: "true" }
      },
      context: { requestId: "pay-1" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });
    expect(res.status).toBe("AUTHORIZED");
    expect(res.authCode).toBeTruthy();
  });

  it("Capture returns CAPTURED status", async () => {
    const res = await api.payment.capture({
      paymentId: "p-1",
      amount: { amount: "19.99", currency: "EUR" },
      context: { requestId: "pay-2" },
      headers: {}
    });
    expect(res.status).toBe("CAPTURED");
    expect(res.captureId).toBeTruthy();
    expect(res.paymentId).toBe("p-1");
  });

  it("Authorize echoes payment id", async () => {
    const res = await api.payment.authorize({
      paymentId: "p-xyz",
      orderId: "ord-1",
      userId: "123",
      amount: { amount: "1.00", currency: "EUR" },
      method: { methodId: "pm-2", type: "CARD", attributes: {} },
      context: { requestId: "pay-3" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });
    expect(res.paymentId).toBe("p-xyz");
  });

  it("Authorize returns metadata + echoed context", async () => {
    const res = await api.payment.authorize(
      {
        paymentId: "p-meta",
        orderId: "ord-1",
        userId: "123",
        amount: { amount: "1.00", currency: "EUR" },
        method: { methodId: "pm-3", type: "CARD", attributes: {} },
        context: { requestId: "pay-4" },
        actor: { subject: "me", tenant: "t1", roles: ["USER"] },
        headers: {}
      },
      { deadlineMs: 2_000 }
    );

    expect(res.metadata.source).toBe("local-stub");
    expect(res.context).toBeDefined();
    expect(res.context!.requestId).toBe("pay-4");
  });
});
