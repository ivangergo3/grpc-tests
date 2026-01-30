import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startLocalStandaloneServices } from "@utils/test/fixtures";

describe("ShippingService (local)", () => {
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

  it("CreateShipment returns shipment", async () => {
    const res = await api.shipping.createShipment({
      shipmentId: "sh-1",
      orderId: "ord-1",
      items: [{ sku: "SKU-1", quantity: 1, attributes: {} }],
      destination: {
        line1: "Main Street 1",
        line2: "",
        city: "Tallinn",
        postalCode: "10111",
        country: "EE"
      },
      context: { requestId: "ship-1" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });
    expect(res.shipment?.shipmentId).toBe("sh-1");
    expect(res.shipment?.status).toBe("CREATED");
    expect(res.shipment?.destination?.country).toBe("EE");
  });

  it("TrackShipment returns events", async () => {
    const res = await api.shipping.trackShipment({
      shipmentId: "sh-1",
      context: { requestId: "ship-2" },
      headers: {}
    });
    expect(res.events.length).toBeGreaterThan(0);
    expect(res.shipment?.status).toBe("IN_TRANSIT");
    expect(res.shipment?.destination?.line2).toBe("");
  });

  it("TrackShipment echoes shipment id", async () => {
    const res = await api.shipping.trackShipment({
      shipmentId: "sh-xyz",
      context: { requestId: "ship-3" },
      headers: {}
    });
    expect(res.shipment?.shipmentId).toBe("sh-xyz");
  });

  it("TrackShipment echoes request context", async () => {
    const res = await api.shipping.trackShipment({
      shipmentId: "sh-ctx",
      context: { requestId: "ship-4" },
      headers: {}
    });

    expect(res.context?.requestId).toBe("ship-4");
  });
});
