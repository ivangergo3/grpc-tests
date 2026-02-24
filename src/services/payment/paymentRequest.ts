import type {
  AuthorizePaymentRequest,
  CapturePaymentRequest,
  PaymentMethod,
  WatchPaymentRequest
} from "@gen/acme/payment/v1/payment_service";
import { buildBaseRequestFields, withDefaults } from "@services/base";
import type { AuthorizePaymentParams, CapturePaymentParams, WatchPaymentParams } from "@services/types";

export const buildAuthorizePaymentRequest = (
  overrides: Partial<AuthorizePaymentParams> = {}
): AuthorizePaymentRequest => {
  const params = withDefaults<AuthorizePaymentParams>(
    {
      paymentId: "p-1",
      orderId: "ord-1",
      userId: "123",
      amount: { amount: "19.99", currency: "EUR" },
      method: { methodId: "pm-1", type: "CARD", attributes: {} } as PaymentMethod,
      context: undefined,
      actor: undefined,
      headers: undefined
    },
    overrides
  );
  const base = buildBaseRequestFields(params);
  return {
    paymentId: params.paymentId ?? "p-1",
    orderId: params.orderId ?? "ord-1",
    userId: params.userId ?? "123",
    amount: params.amount,
    method: params.method,
    context: base.context,
    actor: base.actor,
    headers: base.headers
  };
};

export const buildCapturePaymentRequest = (
  overrides: Partial<CapturePaymentParams> = {}
): CapturePaymentRequest => {
  const params = withDefaults<CapturePaymentParams>(
    {
      paymentId: "p-1",
      amount: { amount: "19.99", currency: "EUR" },
      context: undefined,
      actor: undefined,
      headers: undefined
    },
    overrides
  );
  const base = buildBaseRequestFields(params);
  return {
    paymentId: params.paymentId ?? "p-1",
    amount: params.amount,
    context: base.context,
    headers: base.headers,
    actor: base.actor
  };
};

export const buildWatchPaymentRequest = (
  overrides: Partial<WatchPaymentParams> = {}
): WatchPaymentRequest => {
  const params = withDefaults<WatchPaymentParams>(
    {
      paymentId: "p-1",
      afterEventIndex: undefined,
      context: undefined,
      actor: undefined,
      headers: undefined
    },
    overrides
  );
  const base = buildBaseRequestFields(params);
  return {
    paymentId: params.paymentId ?? "p-1",
    afterEventIndex: params.afterEventIndex,
    context: base.context,
    actor: base.actor,
    headers: base.headers
  };
};
