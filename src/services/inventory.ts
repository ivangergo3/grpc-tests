import type * as grpc from "@grpc/grpc-js";

import type {
  GetStockRequest,
  GetStockResponse,
  ReserveStockRequest,
  ReserveStockResponse
} from "@gen/acme/inventory/v1/inventory_service";
import { InventoryServiceClient } from "@gen/acme/inventory/v1/inventory_service";
import { BaseGrpcService, type unary_call_options } from "@services/base";

export class InventoryServiceApi extends BaseGrpcService<InventoryServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(InventoryServiceClient, target, creds, options);
  }

  getStock(req: GetStockRequest, opts: unary_call_options = {}): Promise<GetStockResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    return this.unaryCallWithReport<GetStockRequest, GetStockResponse>(
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
  }

  reserveStock(
    req: ReserveStockRequest,
    opts: unary_call_options = {}
  ): Promise<ReserveStockResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    const deadlineMs = opts.deadlineMs ?? this.defaultDeadlineMs();
    return this.unaryCallWithReport<ReserveStockRequest, ReserveStockResponse>(
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
  }
}
