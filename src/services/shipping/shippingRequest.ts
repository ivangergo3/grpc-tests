import type {
  CreateShipmentRequest,
  ShipmentItem,
  TrackShipmentRequest
} from "@gen/acme/shipping/v1/shipping_service";
import type { Address } from "@gen/acme/common/v1/common";
import { defaultBaseRequestFields, type BaseRequestFields } from "../baseRequest";

export type CreateShipmentParams = BaseRequestFields & {
  shipmentId: string;
  orderId: string;
  items: ShipmentItem[];
  destination?: Address;
};

export const buildCreateShipmentRequest = (params: CreateShipmentParams): CreateShipmentRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    shipmentId: params.shipmentId,
    orderId: params.orderId,
    items: params.items,
    destination: params.destination,
    context: base.context,
    actor: base.actor,
    headers: base.headers ?? {}
  };
};

export type TrackShipmentParams = BaseRequestFields & {
  shipmentId: string;
};

export const buildTrackShipmentRequest = (params: TrackShipmentParams): TrackShipmentRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    headers: params.headers
  });
  return {
    shipmentId: params.shipmentId,
    context: base.context,
    headers: base.headers ?? {}
  };
};
