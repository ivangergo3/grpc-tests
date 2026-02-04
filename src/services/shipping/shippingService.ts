import type * as grpc from "@grpc/grpc-js";

import type {
  CreateShipmentRequest,
  CreateShipmentResponse,
  TrackShipmentRequest,
  TrackShipmentResponse
} from "@gen/acme/shipping/v1/shipping_service";
import { ShippingServiceClient } from "@gen/acme/shipping/v1/shipping_service";
import { BaseGrpcService, type unary_call_options } from "@services/baseService";
import {
  buildCreateShipmentRequest,
  buildTrackShipmentRequest,
  type CreateShipmentParams,
  type TrackShipmentParams
} from "./shippingRequest";

export class ShippingServiceApi extends BaseGrpcService<ShippingServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(ShippingServiceClient, target, creds, options);
  }

  createShipment(
    req: CreateShipmentRequest,
    opts: unary_call_options = {}
  ): Promise<CreateShipmentResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    const result: Promise<CreateShipmentResponse> = this.unaryCallWithReport<
      CreateShipmentRequest,
      CreateShipmentResponse
    >(
      {
        rpc: "ShippingService.CreateShipment",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.createShipment(req, metadata, callOpts, cb);
        return this.client.createShipment(req, metadata, cb);
      }
    );
    return result;
  }

  trackShipment(
    req: TrackShipmentRequest,
    opts: unary_call_options = {}
  ): Promise<TrackShipmentResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    const result: Promise<TrackShipmentResponse> = this.unaryCallWithReport<
      TrackShipmentRequest,
      TrackShipmentResponse
    >(
      {
        rpc: "ShippingService.TrackShipment",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.trackShipment(req, metadata, callOpts, cb);
        return this.client.trackShipment(req, metadata, cb);
      }
    );
    return result;
  }

  /** Build request from params (base + child), send, return raw response (5.1). */
  createShipmentWithParams(
    params: CreateShipmentParams,
    opts: unary_call_options = {}
  ): Promise<CreateShipmentResponse> {
    return this.createShipment(buildCreateShipmentRequest(params), opts);
  }

  /** Build request from params (base + child), send, return raw response (5.1). */
  trackShipmentWithParams(
    params: TrackShipmentParams,
    opts: unary_call_options = {}
  ): Promise<TrackShipmentResponse> {
    return this.trackShipment(buildTrackShipmentRequest(params), opts);
  }
}
