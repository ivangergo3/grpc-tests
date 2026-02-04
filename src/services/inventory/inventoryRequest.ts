import type {
  GetStockRequest,
  ReserveStockRequest,
  ReservationLine
} from "@gen/acme/inventory/v1/inventory_service";
import { defaultBaseRequestFields, type BaseRequestFields } from "../baseRequest";

export type GetStockParams = BaseRequestFields & {
  skus: string[];
  region: string;
};

/**
 * Builds GetStockRequest. Used for both unary GetStock and aggregated GetStockAggregated.
 * GetStockAggregated is a multi-response RPC (tagged in baseRequest.MULTI_RESPONSE_RPCS); expected count from env.
 */
export const buildGetStockRequest = (params: GetStockParams): GetStockRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    skus: params.skus,
    region: params.region,
    context: base.context,
    actor: base.actor,
    headers: base.headers ?? {}
  };
};

export type ReserveStockParams = BaseRequestFields & {
  reservationId: string;
  lines: ReservationLine[];
  region: string;
};

export const buildReserveStockRequest = (params: ReserveStockParams): ReserveStockRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    reservationId: params.reservationId,
    lines: params.lines,
    region: params.region,
    context: base.context,
    actor: base.actor,
    headers: base.headers ?? {}
  };
};
