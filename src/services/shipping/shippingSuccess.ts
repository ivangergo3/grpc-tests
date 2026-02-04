import type {
  CreateShipmentResponse,
  TrackShipmentResponse
} from "@gen/acme/shipping/v1/shipping_service";
import { asResponses, verifySuccessContext, type SuccessOneOrMany } from "../baseSuccess";

export type VerifyCreateShipmentSuccessOptions = {
  expectedRequestId?: string;
  expectedShipmentId?: string;
  expectedStatus?: string;
  expectedCountry?: string;
};

export const verifyCreateShipmentSuccess = (
  res: SuccessOneOrMany<CreateShipmentResponse>,
  options?: VerifyCreateShipmentSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedShipmentId !== undefined) {
      expect(r.shipment?.shipmentId).toBe(options.expectedShipmentId);
    }
    if (options?.expectedStatus !== undefined) {
      expect(r.shipment?.status).toBe(options.expectedStatus);
    }
    if (options?.expectedCountry !== undefined) {
      expect(r.shipment?.destination?.country).toBe(options.expectedCountry);
    }
  });
};

export type VerifyTrackShipmentSuccessOptions = {
  expectedRequestId?: string;
  expectedShipmentId?: string;
  expectedStatus?: string;
  expectedEventsMin?: number;
  expectedDestinationLine2?: string;
};

export const verifyTrackShipmentSuccess = (
  res: SuccessOneOrMany<TrackShipmentResponse>,
  options?: VerifyTrackShipmentSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedShipmentId !== undefined) {
      expect(r.shipment?.shipmentId).toBe(options.expectedShipmentId);
    }
    if (options?.expectedStatus !== undefined) {
      expect(r.shipment?.status).toBe(options.expectedStatus);
    }
    if (options?.expectedEventsMin !== undefined) {
      expect(r.events.length).toBeGreaterThanOrEqual(options.expectedEventsMin);
    }
    if (options?.expectedDestinationLine2 !== undefined) {
      expect(r.shipment?.destination?.line2).toBe(options.expectedDestinationLine2);
    }
  });
};
