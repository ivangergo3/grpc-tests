import type {
  CreateShipmentResponse,
  TrackShipmentResponse
} from "@gen/acme/shipping/v1/shipping_service";
import { expect } from "vitest";
import type {
  SuccessOneOrMany,
  VerifyCreateShipmentSuccessOptions,
  VerifyTrackShipmentSuccessOptions,
  VerifyWatchShipmentSuccessOptions,
  WatchShipmentResponse
} from "@services/types";
import { asResponses, verifySuccessContext } from "@services/base";

export const verifyCreateShipmentSuccess = (
  res: SuccessOneOrMany<CreateShipmentResponse>,
  options?: VerifyCreateShipmentSuccessOptions
): void => {
  const o: VerifyCreateShipmentSuccessOptions = {
    expectedStatus: "CREATED",
    expectedCountry: "EE",
    ...options
  };
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: o.expectedRequestId });
    expect(r.shipment).toBeDefined();
    if (o.expectedShipmentId !== undefined) {
      expect(r.shipment?.shipmentId).toBe(o.expectedShipmentId);
    }
    if (o.expectedStatus !== undefined) {
      expect(r.shipment?.status).toBe(o.expectedStatus);
    }
    if (o.expectedCountry !== undefined) {
      expect(r.shipment?.destination?.country).toBe(o.expectedCountry);
    }
  });
};

export const verifyTrackShipmentSuccess = (
  res: SuccessOneOrMany<TrackShipmentResponse>,
  options?: VerifyTrackShipmentSuccessOptions
): void => {
  const o: VerifyTrackShipmentSuccessOptions = {
    expectedStatus: "IN_TRANSIT",
    expectedEventsMin: 1,
    expectedDestinationLine2: "",
    ...options
  };
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: o.expectedRequestId });
    expect(r.shipment).toBeDefined();
    if (o.expectedShipmentId !== undefined) {
      expect(r.shipment?.shipmentId).toBe(o.expectedShipmentId);
    }
    if (o.expectedStatus !== undefined) {
      expect(r.shipment?.status).toBe(o.expectedStatus);
    }
    if (o.expectedEventsMin !== undefined) {
      expect(r.events.length).toBeGreaterThanOrEqual(o.expectedEventsMin);
    }
    if (o.expectedDestinationLine2 !== undefined) {
      expect(r.shipment?.destination?.line2).toBe(o.expectedDestinationLine2);
    }
  });
};

export const verifyWatchShipmentSuccess = (
  res: WatchShipmentResponse,
  options?: VerifyWatchShipmentSuccessOptions
): void => {
  const o: VerifyWatchShipmentSuccessOptions = { expectedMinCount: 1, ...options };
  verifySuccessContext(res.context, { expectedRequestId: o.expectedRequestId });

  if (o.expectedMinCount !== undefined) {
    expect(res.events.length).toBeGreaterThanOrEqual(o.expectedMinCount);
  }
  if (o.expectedCount !== undefined) {
    expect(res.events.length).toBe(o.expectedCount);
  }

  if (o.expectedLastEvent !== undefined) {
    const last = res.events.length > 0 ? res.events[res.events.length - 1] : undefined;
    expect(last).toEqual(o.expectedLastEvent);
  }
  if (o.expectedEvents !== undefined) {
    expect(res.events).toEqual(o.expectedEvents);
  }
  if (o.verifyAllEvents !== undefined) {
    o.verifyAllEvents(res.events);
  }
  if (o.verifyEvent !== undefined) {
    res.events.forEach((e, idx) => o.verifyEvent?.(e, idx, res.events));
  }
};
