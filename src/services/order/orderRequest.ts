import type {
  CreateOrderRequest,
  GetOrderRequest,
  ListOrdersRequest,
  OrderItem
} from "@gen/acme/order/v1/order_service";
import type { Address, Pagination } from "@gen/acme/common/v1/common";
import { defaultBaseRequestFields, type BaseRequestFields } from "../baseRequest";

export type CreateOrderParams = BaseRequestFields & {
  userId: string;
  items: OrderItem[];
  shippingAddress?: Address;
};

export const buildCreateOrderRequest = (params: CreateOrderParams): CreateOrderRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    userId: params.userId,
    items: params.items,
    shippingAddress: params.shippingAddress,
    context: base.context,
    actor: base.actor,
    headers: base.headers ?? {}
  };
};

export type GetOrderParams = BaseRequestFields & {
  orderId: string;
};

export const buildGetOrderRequest = (params: GetOrderParams): GetOrderRequest => {
  const base = defaultBaseRequestFields({ context: params.context, headers: params.headers });
  return {
    orderId: params.orderId,
    context: base.context,
    headers: base.headers ?? {}
  };
};

export type ListOrdersParams = BaseRequestFields & {
  userId: string;
  status: string;
  page?: Pagination;
};

export const buildListOrdersRequest = (params: ListOrdersParams): ListOrdersRequest => {
  const base = defaultBaseRequestFields({ context: params.context, headers: params.headers });
  return {
    userId: params.userId,
    status: params.status,
    page: params.page,
    context: base.context,
    headers: base.headers ?? {}
  };
};
