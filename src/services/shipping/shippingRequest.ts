import type {
  CreateShipmentRequest,
  TrackShipmentRequest,
  WatchShipmentRequest
} from "@gen/acme/shipping/v1/shipping_service";
import { buildBaseRequestFields, withDefaults } from "@services/base";
import type { CreateShipmentParams, TrackShipmentParams, WatchShipmentParams } from "@services/types";

export const buildCreateShipmentRequest = (
  overrides: Partial<CreateShipmentParams> = {}
): CreateShipmentRequest => {
  const params = withDefaults<CreateShipmentParams>(
    {
      shipmentId: "sh-1",
      orderId: "ord-1",
      items: [],
      destination: {
        line1: "Main Street 1",
        line2: "",
        city: "Tallinn",
        postalCode: "10111",
        country: "EE"
      },
      context: undefined,
      actor: undefined,
      headers: undefined
    },
    overrides
  );
  const base = buildBaseRequestFields(params);
  return {
    shipmentId: params.shipmentId ?? "sh-1",
    orderId: params.orderId ?? "ord-1",
    items: params.items ?? [],
    destination: params.destination,
    context: base.context,
    actor: base.actor,
    headers: base.headers
  };
};

export const buildTrackShipmentRequest = (
  overrides: Partial<TrackShipmentParams> = {}
): TrackShipmentRequest => {
  const params = withDefaults<TrackShipmentParams>(
    {
      shipmentId: "sh-1",
      context: undefined,
      actor: undefined,
      headers: undefined
    },
    overrides
  );
  const base = buildBaseRequestFields(params);
  return {
    shipmentId: params.shipmentId ?? "sh-1",
    context: base.context,
    headers: base.headers,
    actor: base.actor
  };
};

export const buildWatchShipmentRequest = (
  overrides: Partial<WatchShipmentParams> = {}
): WatchShipmentRequest => {
  const params = withDefaults<WatchShipmentParams>(
    {
      shipmentId: "sh-1",
      afterEventIndex: undefined,
      context: undefined,
      actor: undefined,
      headers: undefined
    },
    overrides
  );
  const base = buildBaseRequestFields(params);
  return {
    shipmentId: params.shipmentId ?? "sh-1",
    afterEventIndex: params.afterEventIndex,
    context: base.context,
    actor: base.actor,
    headers: base.headers
  };
};
