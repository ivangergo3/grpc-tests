import type {
  CreateOrderResponse,
  GetOrderResponse,
  ListOrdersResponse
} from "@gen/acme/order/v1/order_service";
import { asResponses, verifySuccessContext, type SuccessOneOrMany } from "../baseSuccess";

export type VerifyCreateOrderSuccessOptions = {
  expectedRequestId?: string;
  expectedUserId?: string;
  expectedStatus?: string;
};

export const verifyCreateOrderSuccess = (
  res: SuccessOneOrMany<CreateOrderResponse>,
  options?: VerifyCreateOrderSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    expect(r.order).toBeDefined();
    if (options?.expectedUserId !== undefined) {
      expect(r.order!.userId).toBe(options.expectedUserId);
    }
    if (options?.expectedStatus !== undefined) {
      expect(r.order!.status).toBe(options.expectedStatus);
    }
  });
};

export type VerifyGetOrderSuccessOptions = {
  expectedRequestId?: string;
  expectedOrderId?: string;
};

export const verifyGetOrderSuccess = (
  res: SuccessOneOrMany<GetOrderResponse>,
  options?: VerifyGetOrderSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    expect(r.order).toBeDefined();
    if (options?.expectedOrderId !== undefined) {
      expect(r.order!.orderId).toBe(options.expectedOrderId);
    }
  });
};

export type VerifyListOrdersSuccessOptions = {
  expectedRequestId?: string;
  expectedCount?: number;
  expectedStatus?: string;
};

export const verifyListOrdersSuccess = (
  res: SuccessOneOrMany<ListOrdersResponse>,
  options?: VerifyListOrdersSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedCount !== undefined) {
      expect(r.orders.length).toBe(options.expectedCount);
    }
    if (options?.expectedStatus !== undefined && r.orders.length > 0) {
      expect(r.orders[0].status).toBe(options.expectedStatus);
    }
  });
};
