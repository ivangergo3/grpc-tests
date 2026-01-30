import type * as grpc from "@grpc/grpc-js";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderRequest,
  GetOrderResponse,
  ListOrdersRequest,
  ListOrdersResponse
} from "@gen/acme/order/v1/order_service";
import { OrderServiceClient } from "@gen/acme/order/v1/order_service";
import { BaseGrpcService, type unary_call_options } from "@services/base";

export class OrderServiceApi extends BaseGrpcService<OrderServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(OrderServiceClient, target, creds, options);
  }

  createOrder(
    req: CreateOrderRequest,
    opts: unary_call_options = {}
  ): Promise<CreateOrderResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    return this.unaryCall<CreateOrderResponse>((cb) => {
      if (callOpts) return this.client.createOrder(req, metadata, callOpts, cb);
      return this.client.createOrder(req, metadata, cb);
    });
  }

  getOrder(req: GetOrderRequest, opts: unary_call_options = {}): Promise<GetOrderResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    return this.unaryCall<GetOrderResponse>((cb) => {
      if (callOpts) return this.client.getOrder(req, metadata, callOpts, cb);
      return this.client.getOrder(req, metadata, cb);
    });
  }

  listOrders(req: ListOrdersRequest, opts: unary_call_options = {}): Promise<ListOrdersResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    return this.unaryCall<ListOrdersResponse>((cb) => {
      if (callOpts) return this.client.listOrders(req, metadata, callOpts, cb);
      return this.client.listOrders(req, metadata, cb);
    });
  }
}
