import type { Money } from "@gen/acme/common/v1/common";
import type {
  AuthorizePaymentRequest,
  CapturePaymentRequest,
  PaymentMethod
} from "@gen/acme/payment/v1/payment_service";
import { defaultBaseRequestFields, type BaseRequestFields } from "../baseRequest";

export type AuthorizePaymentParams = BaseRequestFields & {
  paymentId: string;
  orderId: string;
  userId: string;
  amount?: Money;
  method?: PaymentMethod;
};

export const buildAuthorizePaymentRequest = (params: AuthorizePaymentParams): AuthorizePaymentRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    paymentId: params.paymentId,
    orderId: params.orderId,
    userId: params.userId,
    amount: params.amount,
    method: params.method,
    context: base.context,
    actor: base.actor,
    headers: base.headers ?? {}
  };
};

export type CapturePaymentParams = BaseRequestFields & {
  paymentId: string;
  amount?: Money;
};

export const buildCapturePaymentRequest = (params: CapturePaymentParams): CapturePaymentRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    headers: params.headers
  });
  return {
    paymentId: params.paymentId,
    amount: params.amount,
    context: base.context,
    headers: base.headers ?? {}
  };
};
