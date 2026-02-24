import { describe, expect, it } from "vitest";
import { createLocalServices } from "@utils/fixtures";
import { status } from "@grpc/grpc-js";
import { verifyFailurePromise } from "@services/base";
import {
  verifyCreateShipmentSuccess,
  verifyTrackShipmentSuccess,
  verifyWatchShipmentSuccess
} from "@services/shipping";

describe("ShippingService", () => {
  const api = createLocalServices();

  it("CreateShipment returns shipment", async () => {
    // given
    const params = {
      shipmentId: "sh-1",
      items: [{ sku: "SKU-1", quantity: 1, attributes: {} }],
      context: { requestId: "ship-1" }
    };

    // when
    const res = await api.shipping.createShipmentWithParams(params);

    // then
    verifyCreateShipmentSuccess(res, { expectedRequestId: "ship-1", expectedShipmentId: "sh-1" });
  });

  it("TrackShipment returns events", async () => {
    // given
    const params = {
      shipmentId: "sh-1",
      context: { requestId: "ship-2" }
    };

    // when
    const res = await api.shipping.trackShipmentWithParams(params);

    // then
    verifyTrackShipmentSuccess(res, { expectedRequestId: "ship-2", expectedShipmentId: "sh-1" });
  });

  it("TrackShipment echoes shipment id", async () => {
    // given
    const params = {
      shipmentId: "sh-xyz",
      context: { requestId: "ship-3" }
    };

    // when
    const res = await api.shipping.trackShipmentWithParams(params);

    // then
    verifyTrackShipmentSuccess(res, {
      expectedRequestId: "ship-3",
      expectedShipmentId: "sh-xyz",
      expectedEventsMin: 1
    });
  });

  it("TrackShipment echoes request context", async () => {
    // given
    const params = {
      shipmentId: "sh-ctx",
      context: { requestId: "ship-4" }
    };

    // when
    const res = await api.shipping.trackShipmentWithParams(params);

    // then
    verifyTrackShipmentSuccess(res, { expectedRequestId: "ship-4", expectedShipmentId: "sh-ctx" });
  });

  it("WatchShipment returns a stream aggregated into events[]", async () => {
    // given
    const params = {
      shipmentId: "sh-stream-1",
      context: { requestId: "ship-stream-1" }
    };

    // when
    const res = await api.shipping.watchShipmentWithParams(params);

    // then
    verifyWatchShipmentSuccess(res, {
      expectedRequestId: "ship-stream-1",
      expectedCount: 2,
      verifyAllEvents: (events) => {
        expect(events.map((e) => e.eventId)).toEqual(["evt-1", "evt-2"]);
      }
    });
  });

  it("WatchShipment can resume with afterEventIndex", async () => {
    // given
    const params = {
      shipmentId: "sh-stream-2",
      afterEventIndex: 1,
      context: { requestId: "ship-stream-2" }
    };

    // when
    const res = await api.shipping.watchShipmentWithParams(params);

    // then
    verifyWatchShipmentSuccess(res, {
      expectedRequestId: "ship-stream-2",
      expectedCount: 1,
      verifyAllEvents: (events) => {
        expect(events.map((e) => e.eventId)).toEqual(["evt-2"]);
      }
    });
  });

  it("CreateShipment returns INVALID_ARGUMENT for fail-* ids", async () => {
    // given
    const params = {
      shipmentId: "fail-ship-1",
      items: [{ sku: "SKU-1", quantity: 1, attributes: {} }],
      context: { requestId: "ship-fail-1" }
    };

    // when/then
    await verifyFailurePromise(api.shipping.createShipmentWithParams(params), {
      expectedCode: status.INVALID_ARGUMENT,
      messageContains: "invalid shipment_id"
    }, { label: "shipping.createShipment" });
  });

  it("TrackShipment returns INVALID_ARGUMENT for fail-* ids", async () => {
    // given
    const params = {
      shipmentId: "fail-ship-2",
      context: { requestId: "ship-fail-2" }
    };

    // when/then
    await verifyFailurePromise(api.shipping.trackShipmentWithParams(params), {
      expectedCode: status.INVALID_ARGUMENT,
      messageContains: "invalid shipment_id"
    }, { label: "shipping.trackShipment" });
  });

  it("WatchShipment returns INVALID_ARGUMENT for fail-* ids", async () => {
    // given
    const params = {
      shipmentId: "fail-ship-stream",
      context: { requestId: "ship-fail-3" }
    };

    // when/then
    await verifyFailurePromise(api.shipping.watchShipmentWithParams(params), {
      expectedCode: status.INVALID_ARGUMENT,
      messageContains: "invalid shipment_id"
    }, { label: "shipping.watchShipment" });
  });
});
