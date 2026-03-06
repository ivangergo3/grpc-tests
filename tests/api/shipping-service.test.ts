import { test, expect } from "@utils/fixtures";
import { status } from "@grpc/grpc-js";

test.describe("ShippingService", () => {
  test("CreateShipment returns shipment", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "sh-1",
      items: [{ sku: "SKU-1", quantity: 1, attributes: {} }],
      context: { requestId: "ship-1" }
    };

    // when
    const res = await api.shipping.createShipmentWithParams(params);

    // then
    verify.shipping.createShipmentSuccess(res, {
      expectedRequestId: "ship-1",
      expectedShipmentId: "sh-1"
    });
  });

  test("TrackShipment returns events", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "sh-1",
      context: { requestId: "ship-2" }
    };

    // when
    const res = await api.shipping.trackShipmentWithParams(params);

    // then
    verify.shipping.trackShipmentSuccess(res, {
      expectedRequestId: "ship-2",
      expectedShipmentId: "sh-1"
    });
  });

  test("TrackShipment echoes shipment id", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "sh-xyz",
      context: { requestId: "ship-3" }
    };

    // when
    const res = await api.shipping.trackShipmentWithParams(params);

    // then
    verify.shipping.trackShipmentSuccess(res, {
      expectedRequestId: "ship-3",
      expectedShipmentId: "sh-xyz",
      expectedEventsMin: 1
    });
  });

  test("TrackShipment echoes request context", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "sh-ctx",
      context: { requestId: "ship-4" }
    };

    // when
    const res = await api.shipping.trackShipmentWithParams(params);

    // then
    verify.shipping.trackShipmentSuccess(res, {
      expectedRequestId: "ship-4",
      expectedShipmentId: "sh-ctx"
    });
  });

  test("WatchShipment returns a stream aggregated into events[]", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "sh-stream-1",
      context: { requestId: "ship-stream-1" }
    };

    // when
    const res = await api.shipping.watchShipmentWithParams(params);

    // then
    verify.shipping.watchShipmentSuccess(res, {
      expectedRequestId: "ship-stream-1",
      expectedCount: 2,
      verifyAllEvents: (events) => {
        expect(events.map((e) => e.eventId)).toEqual(["evt-1", "evt-2"]);
      }
    });
  });

  test("WatchShipment can resume with afterEventIndex", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "sh-stream-2",
      afterEventIndex: 1,
      context: { requestId: "ship-stream-2" }
    };

    // when
    const res = await api.shipping.watchShipmentWithParams(params);

    // then
    verify.shipping.watchShipmentSuccess(res, {
      expectedRequestId: "ship-stream-2",
      expectedCount: 1,
      verifyAllEvents: (events) => {
        expect(events.map((e) => e.eventId)).toEqual(["evt-2"]);
      }
    });
  });

  test("CreateShipment returns INVALID_ARGUMENT for fail-* ids", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "fail-ship-1",
      items: [{ sku: "SKU-1", quantity: 1, attributes: {} }],
      context: { requestId: "ship-fail-1" }
    };

    // when/then
    await verify.shipping.failurePromise(
      api.shipping.createShipmentWithParams(params),
      {
        expectedCode: status.INVALID_ARGUMENT,
        messageContains: "invalid shipment_id"
      },
      { label: "shipping.createShipment" }
    );
  });

  test("TrackShipment returns INVALID_ARGUMENT for fail-* ids", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "fail-ship-2",
      context: { requestId: "ship-fail-2" }
    };

    // when/then
    await verify.shipping.failurePromise(
      api.shipping.trackShipmentWithParams(params),
      {
        expectedCode: status.INVALID_ARGUMENT,
        messageContains: "invalid shipment_id"
      },
      { label: "shipping.trackShipment" }
    );
  });

  test("WatchShipment returns INVALID_ARGUMENT for fail-* ids", async ({ api, verify }) => {
    // given
    const params = {
      shipmentId: "fail-ship-stream",
      context: { requestId: "ship-fail-3" }
    };

    // when/then
    await verify.shipping.failurePromise(
      api.shipping.watchShipmentWithParams(params),
      {
        expectedCode: status.INVALID_ARGUMENT,
        messageContains: "invalid shipment_id"
      },
      { label: "shipping.watchShipment" }
    );
  });
});
