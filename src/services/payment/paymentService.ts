import type * as grpc from "@grpc/grpc-js";
import type {
  AuthorizePaymentRequest,
  AuthorizePaymentResponse,
  CapturePaymentRequest,
  CapturePaymentResponse,
  WatchPaymentRequest
} from "@gen/acme/payment/v1/payment_service";
import { PaymentServiceClient } from "@gen/acme/payment/v1/payment_service";

import { BaseGrpcService } from "@services/base";

import type {
  PaymentServiceStreamClient,
  ChannelCredentialsInput,
  WatchPaymentResponse,
  AuthorizePaymentParams,
  CapturePaymentParams,
  WatchPaymentParams
} from "@services/types";

import {
  buildAuthorizePaymentRequest,
  buildCapturePaymentRequest,
  buildWatchPaymentRequest
} from "./paymentRequest";

export class PaymentServiceApi extends BaseGrpcService<PaymentServiceClient> {
  constructor(target: string, creds: ChannelCredentialsInput, options?: grpc.ClientOptions) {
    super(PaymentServiceClient, target, creds, options);
  }

  authorize(
    req: AuthorizePaymentRequest,
    metadata?: grpc.Metadata
  ): Promise<AuthorizePaymentResponse> {
    const md = this.metadata(metadata);
    return this.unaryCall<AuthorizePaymentResponse>((cb) => {
      return this.client.authorize(req, md, cb);
    });
  }

  /** Build request from params (base + child) */
  authorizeWithParams(
    params: AuthorizePaymentParams,
    metadata?: grpc.Metadata
  ): Promise<AuthorizePaymentResponse> {
    return this.authorize(buildAuthorizePaymentRequest(params), metadata);
  }

  capture(req: CapturePaymentRequest, metadata?: grpc.Metadata): Promise<CapturePaymentResponse> {
    const md = this.metadata(metadata);
    return this.unaryCall<CapturePaymentResponse>((cb) => {
      return this.client.capture(req, md, cb);
    });
  }

  /** Build request from params (base + child) */
  captureWithParams(
    params: CapturePaymentParams,
    metadata?: grpc.Metadata
  ): Promise<CapturePaymentResponse> {
    return this.capture(buildCapturePaymentRequest(params), metadata);
  }

  /**
   * Server-streaming: returns one "big" response object for easy verification.
   */
  watchPayment(req: WatchPaymentRequest, metadata?: grpc.Metadata): Promise<WatchPaymentResponse> {
    const md = this.metadata(metadata);
    const streamClient = this.client as unknown as PaymentServiceStreamClient;

    return this.streamAggregate(
      () => streamClient.watchPayment(req, md, {}),
      (chunks) => {
        return {
          events: chunks,
          context: chunks.length > 0 ? chunks[chunks.length - 1]?.context : req.context
        };
      }
    );
  }

  /** Build request from params (base + child) */
  watchPaymentWithParams(
    params: WatchPaymentParams,
    metadata?: grpc.Metadata
  ): Promise<WatchPaymentResponse> {
    return this.watchPayment(buildWatchPaymentRequest(params), metadata);
  }
}
