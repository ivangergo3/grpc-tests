import type * as grpc from "@grpc/grpc-js";

import type {
  GetStockRequest,
  GetStockResponse,
  GetStockAggregatedResponse,
  ReserveStockRequest,
  ReserveStockResponse
} from "@gen/acme/inventory/v1/inventory_service";
import { InventoryServiceClient } from "@gen/acme/inventory/v1/inventory_service";
import { getExpectedResponseCountForRpc } from "@services/baseRequest";
import { BaseGrpcService, type unary_call_options } from "@services/baseService";
import {
  buildGetStockRequest,
  buildReserveStockRequest,
  type GetStockParams,
  type ReserveStockParams
} from "./inventoryRequest";
import { verifyGetStockSuccess, type VerifyGetStockSuccessOptions } from "./inventorySuccess";

export class InventoryServiceApi extends BaseGrpcService<InventoryServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(InventoryServiceClient, target, creds, options);
  }

  /**
   * Aggregated: returns one message with N GetStockResponse entries (1–3) based on system flags.
   * Returns the responses array so verifiers receive "one or many" (4.2).
   */
  getStockAggregated(
    req: GetStockRequest,
    opts: unary_call_options = {}
  ): Promise<GetStockResponse[]> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access -- base class method from BaseGrpcService */
    const aggregated: Promise<GetStockAggregatedResponse> =
      this.unaryCallWithReport<GetStockRequest, GetStockAggregatedResponse>(
        {
          rpc: "InventoryService.GetStockAggregated",
          request: req,
          metadata,
          deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
        },
        opts,
        (cb) => {
          if (callOpts) return this.client.getStockAggregated(req, metadata, callOpts, cb);
          return this.client.getStockAggregated(req, metadata, cb);
        }
      );
    const out: Promise<GetStockResponse[]> = aggregated.then((res) => res.responses);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
    return out;
  }

  getStock(req: GetStockRequest, opts: unary_call_options = {}): Promise<GetStockResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    const result: Promise<GetStockResponse> = this.unaryCallWithReport<
      GetStockRequest,
      GetStockResponse
    >(
      {
        rpc: "InventoryService.GetStock",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.getStock(req, metadata, callOpts, cb);
        return this.client.getStock(req, metadata, cb);
      }
    );
    return result;
  }

  reserveStock(
    req: ReserveStockRequest,
    opts: unary_call_options = {}
  ): Promise<ReserveStockResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    const result: Promise<ReserveStockResponse> = this.unaryCallWithReport<
      ReserveStockRequest,
      ReserveStockResponse
    >(
      {
        rpc: "InventoryService.ReserveStock",
        request: req,
        metadata,
        deadlineMs: deadlineMs > 0 ? deadlineMs : undefined
      },
      opts,
      (cb) => {
        if (callOpts) return this.client.reserveStock(req, metadata, callOpts, cb);
        return this.client.reserveStock(req, metadata, cb);
      }
    );
    return result;
  }

  /** Build request from params, send aggregated RPC, return responses array (5.1 / 5.2). */
  getStockAggregatedWithParams(
    params: GetStockParams,
    opts: unary_call_options = {}
  ): Promise<GetStockResponse[]> {
    return this.getStockAggregated(buildGetStockRequest(params), opts);
  }

  /**
   * Send + verify in one step (5.3). Sends GetStockAggregated, runs verifyGetStockSuccess, returns responses.
   * Defaults expectedCount from getExpectedResponseCountForRpc when not provided.
   */
  async getStockAggregatedSendAndVerify(
    params: GetStockParams,
    callOpts: unary_call_options = {},
    verifyOptions?: VerifyGetStockSuccessOptions
  ): Promise<GetStockResponse[]> {
    const responses = await this.getStockAggregatedWithParams(params, callOpts);
    const options: VerifyGetStockSuccessOptions = {
      ...verifyOptions,
      expectedCount: verifyOptions?.expectedCount ?? getExpectedResponseCountForRpc("InventoryService.GetStockAggregated")
    };
    verifyGetStockSuccess(responses, options);
    return responses;
  }

  /** Build request from params (base + child), send, return raw response (5.1). */
  getStockWithParams(
    params: GetStockParams,
    opts: unary_call_options = {}
  ): Promise<GetStockResponse> {
    return this.getStock(buildGetStockRequest(params), opts);
  }

  /** Build request from params (base + child), send, return raw response (5.1). */
  reserveStockWithParams(
    params: ReserveStockParams,
    opts: unary_call_options = {}
  ): Promise<ReserveStockResponse> {
    return this.reserveStock(buildReserveStockRequest(params), opts);
  }
}
