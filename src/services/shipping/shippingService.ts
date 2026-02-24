import type * as grpc from "@grpc/grpc-js";
import type {
  CreateShipmentRequest,
  CreateShipmentResponse,
  TrackShipmentRequest,
  TrackShipmentResponse,
  WatchShipmentRequest
} from "@gen/acme/shipping/v1/shipping_service";
import { ShippingServiceClient } from "@gen/acme/shipping/v1/shipping_service";

import { BaseGrpcService } from "@services/base";

import type {
  ShippingServiceStreamClient,
  ChannelCredentialsInput,
  WatchShipmentResponse,
  CreateShipmentParams,
  TrackShipmentParams,
  WatchShipmentParams
} from "@services/types";

import {
  buildCreateShipmentRequest,
  buildTrackShipmentRequest,
  buildWatchShipmentRequest
} from "./shippingRequest";

export class ShippingServiceApi extends BaseGrpcService<ShippingServiceClient> {
  constructor(target: string, creds: ChannelCredentialsInput, options?: grpc.ClientOptions) {
    super(ShippingServiceClient, target, creds, options);
  }

  createShipment(
    req: CreateShipmentRequest,
    metadata?: grpc.Metadata
  ): Promise<CreateShipmentResponse> {
    const md = this.metadata(metadata);
    return this.unaryCall<CreateShipmentResponse>((cb) => {
      return this.client.createShipment(req, md, cb);
    });
  }

  /** Build request from params (base + child) */
  createShipmentWithParams(
    params: CreateShipmentParams,
    metadata?: grpc.Metadata
  ): Promise<CreateShipmentResponse> {
    return this.createShipment(buildCreateShipmentRequest(params), metadata);
  }

  trackShipment(
    req: TrackShipmentRequest,
    metadata?: grpc.Metadata
  ): Promise<TrackShipmentResponse> {
    const md = this.metadata(metadata);
    return this.unaryCall<TrackShipmentResponse>((cb) => {
      return this.client.trackShipment(req, md, cb);
    });
  }

  /** Build request from params (base + child) */
  trackShipmentWithParams(
    params: TrackShipmentParams,
    metadata?: grpc.Metadata
  ): Promise<TrackShipmentResponse> {
    return this.trackShipment(buildTrackShipmentRequest(params), metadata);
  }

  /**
   * Server-streaming: returns one "big" response object for easy verification.
   */
  watchShipment(
    req: WatchShipmentRequest,
    metadata?: grpc.Metadata
  ): Promise<WatchShipmentResponse> {
    const md = this.metadata(metadata);
    const streamClient = this.client as unknown as ShippingServiceStreamClient;

    return this.streamAggregate(
      () => streamClient.watchShipment(req, md, {}),
      (chunks) => {
        return {
          events: chunks,
          context: req.context
        };
      }
    );
  }

  /** Build request from params (base + child) */
  watchShipmentWithParams(
    params: WatchShipmentParams,
    metadata?: grpc.Metadata
  ): Promise<WatchShipmentResponse> {
    const req = buildWatchShipmentRequest(params) as unknown as WatchShipmentRequest;
    return this.watchShipment(req, metadata);
  }
}
