import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startLocalStandaloneServices } from "@utils/test/fixtures";

describe("InventoryService (local)", () => {
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

  it("GetStock returns items for skus", async () => {
    const res = await api.inventory.getStock({
      skus: ["SKU-1", "SKU-2"],
      region: "EU",
      context: { requestId: "inv-1" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });
    expect(res.items.length).toBe(2);
    expect(res.items[0].available).toBe(100);
    expect(res.context).toBeDefined();
    expect(res.context!.requestId).toBe("inv-1");
  });

  it("ReserveStock echoes reservation id", async () => {
    const res = await api.inventory.reserveStock({
      reservationId: "r-1",
      lines: [{ sku: "SKU-1", quantity: 2, attributes: {} }],
      region: "EU",
      context: { requestId: "inv-2" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });
    expect(res.reservationId).toBe("r-1");
    expect(res.reservedItems[0].reserved).toBe(2);
    expect(res.reservedItems[0].attributes.source).toBe("local-stub");
  });

  it("GetStock includes warehouse region", async () => {
    const res = await api.inventory.getStock({
      skus: ["SKU-9"],
      region: "US",
      context: { requestId: "inv-3" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });
    expect(res.items[0].warehouse?.region).toBe("US");
  });

  it("GetStock returns empty list when no SKUs", async () => {
    const res = await api.inventory.getStock({
      skus: [],
      region: "EU",
      context: { requestId: "inv-4" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });

    expect(res.items).toEqual([]);
    expect(res.context).toBeDefined();
    expect(res.context!.requestId).toBe("inv-4");
  });
});
