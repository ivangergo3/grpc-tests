import type { GetStockResponse, ReserveStockResponse } from "@gen/acme/inventory/v1/inventory_service";
import { expect } from "vitest";
import { asResponses, verifyResponseCount, verifySuccessContext, type SuccessOneOrMany } from "../baseSuccess";

export type VerifyGetStockSuccessOptions = {
  expectedRequestId?: string;
  expectedItemCount?: number;
  expectedAvailable?: number;
  expectedRegion?: string;
  /** From getExpectedResponseCountForRpc(rpc) for multi-response (GetStockAggregated); asserts exactly N responses (3.4). */
  expectedCount?: number;
};

export const verifyGetStockSuccess = (
  res: SuccessOneOrMany<GetStockResponse>,
  options?: VerifyGetStockSuccessOptions
): void => {
  const arr = asResponses(res);
  if (options?.expectedCount !== undefined) {
    verifyResponseCount(arr, options.expectedCount);
  }
  arr.forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedItemCount !== undefined) {
      expect(r.items.length).toBe(options.expectedItemCount);
    }
    if (options?.expectedAvailable !== undefined && r.items.length > 0) {
      expect(r.items[0].available).toBe(options.expectedAvailable);
    }
    if (options?.expectedRegion !== undefined && r.items.length > 0 && r.items[0].warehouse) {
      expect(r.items[0].warehouse.region).toBe(options.expectedRegion);
    }
  });
};

export type VerifyReserveStockSuccessOptions = {
  expectedRequestId?: string;
  expectedReservationId?: string;
  expectedReservedQuantity?: number;
  expectedSource?: string;
};

export const verifyReserveStockSuccess = (
  res: SuccessOneOrMany<ReserveStockResponse>,
  options?: VerifyReserveStockSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedReservationId !== undefined) {
      expect(r.reservationId).toBe(options.expectedReservationId);
    }
    if (
      options?.expectedReservedQuantity !== undefined &&
      r.reservedItems.length > 0
    ) {
      expect(r.reservedItems[0].reserved).toBe(options.expectedReservedQuantity);
    }
    if (
      options?.expectedSource !== undefined &&
      r.reservedItems.length > 0
    ) {
      expect(r.reservedItems[0].attributes.source).toBe(options.expectedSource);
    }
  });
};
