import type { Actor, RequestContext } from "@gen/acme/common/v1/common";
import { getExpectedResponseCount } from "@utils/environments";

/**
 * Common request fields shared across gRPC requests (context, actor, headers).
 * Use with defaultBaseRequestFields() and merge into service-specific request params.
 */
export type BaseRequestFields = {
  context?: RequestContext;
  actor?: Actor;
  headers?: Record<string, string>;
};

/**
 * Default base request fields so tests don't repeat context/actor/headers.
 * Override any field when building a request (e.g. requestId, subject, tenant, roles).
 */
export const defaultBaseRequestFields = (overrides?: Partial<BaseRequestFields>): BaseRequestFields => ({
  context: { requestId: "req-1" },
  actor: { subject: "me", tenant: "t1", roles: ["USER"] },
  headers: {},
  ...overrides
});

/**
 * RPCs that return multiple responses (1–3) based on system flags (System A always; B and C when enabled).
 * Used so the verification layer can derive expected response count from config + request type (2.4).
 */
export const MULTI_RESPONSE_RPCS: readonly string[] = [
  "NotificationService.SendEmailStream",
  "InventoryService.GetStockAggregated"
];

/**
 * Whether the given RPC is a multi-response RPC (hits A/B/C per env; returns 1–3 responses).
 */
export const isMultiResponseRpc = (rpc: string): boolean =>
  MULTI_RESPONSE_RPCS.includes(rpc);

/**
 * Expected response count for a given RPC: 1 for unary, 1–3 for multi-response RPCs (from env flags).
 */
export const getExpectedResponseCountForRpc = (rpc: string): number =>
  isMultiResponseRpc(rpc) ? getExpectedResponseCount() : 1;
