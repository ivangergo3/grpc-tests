import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startLocalStandaloneServices } from "@utils/test/fixtures";
import { verifyGetStockSuccess, verifyReserveStockSuccess } from "@services/inventory/inventorySuccess";

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
    const params = {
      skus: ["SKU-1", "SKU-2"],
      region: "EU",
      context: { requestId: "inv-1" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    };
    const res = await api.inventory.getStockWithParams(params);
    verifyGetStockSuccess(res, {
      expectedRequestId: "inv-1",
      expectedItemCount: 2,
      expectedAvailable: 100,
      expectedRegion: "EU"
    });
  });

  it("ReserveStock echoes reservation id", async () => {
    const params = {
      reservationId: "r-1",
      lines: [{ sku: "SKU-1", quantity: 2, attributes: {} }],
      region: "EU",
      context: { requestId: "inv-2" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    };
    const res = await api.inventory.reserveStockWithParams(params);
    verifyReserveStockSuccess(res, {
      expectedRequestId: "inv-2",
      expectedReservationId: "r-1",
      expectedReservedQuantity: 2,
      expectedSource: "local-stub"
    });
  });

  it("GetStock includes warehouse region", async () => {
    const params = {
      skus: ["SKU-9"],
      region: "US",
      context: { requestId: "inv-3" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    };
    const res = await api.inventory.getStockWithParams(params);
    verifyGetStockSuccess(res, {
      expectedRequestId: "inv-3",
      expectedRegion: "US"
    });
  });

  it("GetStock returns empty list when no SKUs", async () => {
    const params = {
      skus: [],
      region: "EU",
      context: { requestId: "inv-4" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    };
    const res = await api.inventory.getStockWithParams(params);
    verifyGetStockSuccess(res, { expectedRequestId: "inv-4", expectedItemCount: 0 });
    expect(res.items).toEqual([]);
  });

  it("GetStockAggregated: send + verify in one step (params + verifier, no conditionals)", async () => {
    const params = {
      skus: ["SKU-A"],
      region: "EU",
      context: { requestId: "inv-agg" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    };
    await api.inventory.getStockAggregatedSendAndVerify(params, {}, {
      expectedRequestId: "inv-agg",
      expectedItemCount: 1
    });
    // Verifier asserted exact N (from env) and per-response checks (6.1 / 6.2)
  });

  it("GetStockAggregated: send then verify with expectedCount from env (6.2 / 6.3)", async () => {
    const params = {
      skus: ["SKU-B"],
      region: "EU",
      context: { requestId: "inv-agg-n" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    };
    const { getExpectedResponseCountForRpc } = await import("@services/baseRequest");
    const responses = await api.inventory.getStockAggregatedWithParams(params);
    verifyGetStockSuccess(responses, {
      expectedCount: getExpectedResponseCountForRpc("InventoryService.GetStockAggregated"),
      expectedRequestId: "inv-agg-n",
      expectedItemCount: 1
    });
    // N = 1 (default), 2 with SYSTEM_B_ENABLED=1, 3 with SYSTEM_B_ENABLED=1 SYSTEM_C_ENABLED=1
  });
});
