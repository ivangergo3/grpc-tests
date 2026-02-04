import type * as grpc from "@grpc/grpc-js";

import type {
  AuthorizePaymentRequest,
  AuthorizePaymentResponse,
  CapturePaymentRequest,
  CapturePaymentResponse
} from "@gen/acme/payment/v1/payment_service";
import { PaymentServiceClient } from "@gen/acme/payment/v1/payment_service";
import { BaseGrpcService, type unary_call_options } from "@services/baseService";
import {
  buildAuthorizePaymentRequest,
  buildCapturePaymentRequest,
  type AuthorizePaymentParams,
  type CapturePaymentParams
} from "./paymentRequest";

export class PaymentServiceApi extends BaseGrpcService<PaymentServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(PaymentServiceClient, target, creds, options);
  }

  authorize(
    req: AuthorizePaymentRequest,
    opts: unary_call_options = {}
  ): Promise<AuthorizePaymentResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    const result: Promise<AuthorizePaymentResponse> = this.unaryCallWithReport<
      AuthorizePaymentRequest,
      AuthorizePaymentResponse
    >(
      {
        rpc: "PaymentService.Authorize",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.authorize(req, metadata, callOpts, cb);
        return this.client.authorize(req, metadata, cb);
      }
    );
    return result;
  }

  capture(
    req: CapturePaymentRequest,
    opts: unary_call_options = {}
  ): Promise<CapturePaymentResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    const result: Promise<CapturePaymentResponse> = this.unaryCallWithReport<
      CapturePaymentRequest,
      CapturePaymentResponse
    >(
      {
        rpc: "PaymentService.Capture",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.capture(req, metadata, callOpts, cb);
        return this.client.capture(req, metadata, cb);
      }
    );
    return result;
  }

  /** Build request from params (base + child), send, return raw response (5.1). */
  authorizeWithParams(
    params: AuthorizePaymentParams,
    opts: unary_call_options = {}
  ): Promise<AuthorizePaymentResponse> {
    return this.authorize(buildAuthorizePaymentRequest(params), opts);
  }

  /** Build request from params (base + child), send, return raw response (5.1). */
  captureWithParams(
    params: CapturePaymentParams,
    opts: unary_call_options = {}
  ): Promise<CapturePaymentResponse> {
    return this.capture(buildCapturePaymentRequest(params), opts);
  }
}
