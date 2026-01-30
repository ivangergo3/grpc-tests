import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startLocalStandaloneServices } from "@utils/test/fixtures";

describe("OrderService (local example server)", () => {
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

  it("responds to CreateOrder", async () => {
    const res = await api.order.createOrder({
      userId: "123",
      context: { requestId: "req-2" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      items: [
        {
          sku: "SKU-1",
          quantity: 2,
          unitPrice: { amount: "9.99", currency: "EUR" },
          attributes: { color: "black" }
        }
      ],
      shippingAddress: {
        line1: "Main Street 1",
        line2: "Apt 2",
        city: "Tallinn",
        postalCode: "10111",
        country: "EE"
      },
      headers: { "x-correlation-id": "corr-2" }
    });

    expect(res.order).toBeDefined();
    const createdOrder = res.order!;
    expect(createdOrder.userId).toBe("123");
    expect(createdOrder.status).toBe("CREATED");
  });

  it("responds to GetOrder", async () => {
    const res = await api.order.getOrder({
      orderId: "ord-xyz",
      context: { requestId: "req-2b" },
      headers: {}
    });

    expect(res.order).toBeDefined();
    expect(res.order!.orderId).toBe("ord-xyz");
  });

  it("responds to ListOrders (status filter)", async () => {
    const res = await api.order.listOrders({
      userId: "123",
      status: "CREATED",
      page: { pageSize: 10, pageToken: "" },
      context: { requestId: "req-2c" },
      headers: {}
    });

    expect(res.orders.length).toBe(1);
    expect(res.orders[0].status).toBe("CREATED");
  });

  it("responds to ListOrders (no filter)", async () => {
    const res = await api.order.listOrders({
      userId: "123",
      status: "",
      page: { pageSize: 10, pageToken: "" },
      context: { requestId: "req-2d" },
      headers: {}
    });

    expect(res.orders.length).toBe(2);
  });
});
