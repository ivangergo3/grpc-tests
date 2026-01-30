import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startLocalUserOrderStackServices } from "@utils/test/fixtures";

describe("UserService <-> OrderService (local interaction)", () => {
  let stop: () => Promise<void>;
  let api: Awaited<ReturnType<typeof startLocalUserOrderStackServices>>["api"];

  beforeAll(async () => {
    const started = await startLocalUserOrderStackServices();
    api = started.api;
    stop = started.stop;
  });

  afterAll(async () => {
    await stop();
  });

  it("test calls OrderService; OrderService calls UserService internally", async () => {
    const res = await api.order.createOrder({
      userId: "123",
      context: { requestId: "req-3" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      items: [
        {
          sku: "SKU-2",
          quantity: 1,
          unitPrice: { amount: "19.99", currency: "EUR" },
          attributes: { channel: "web" }
        }
      ],
      shippingAddress: {
        line1: "Main Street 1",
        line2: "Apt 2",
        city: "Tallinn",
        postalCode: "10111",
        country: "EE"
      },
      headers: {}
    });

    expect(res.order).toBeDefined();
    const createdOrder = res.order!;
    expect(createdOrder.userId).toBe("123");
    expect(createdOrder.status).toBe("CREATED");
  });
});
