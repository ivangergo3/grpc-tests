import * as grpc from "@grpc/grpc-js";
import { getExpectedResponseCount } from "@utils/environments";

import {
  AuditServiceService,
  type ListAuditEventsRequest,
  type ListAuditEventsResponse,
  type WriteAuditEventRequest,
  type WriteAuditEventResponse
} from "@gen/acme/audit/v1/audit_service";
import {
  InventoryServiceService,
  type GetStockAggregatedResponse,
  type GetStockRequest,
  type GetStockResponse,
  type ReserveStockRequest,
  type ReserveStockResponse
} from "@gen/acme/inventory/v1/inventory_service";
import {
  NotificationServiceService,
  type SendEmailRequest,
  type SendEmailResponse,
  type SendSmsRequest,
  type SendSmsResponse
} from "@gen/acme/notification/v1/notification_service";
import {
  OrderServiceService,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type GetOrderRequest,
  type GetOrderResponse,
  type ListOrdersRequest,
  type ListOrdersResponse
} from "@gen/acme/order/v1/order_service";
import {
  PaymentServiceService,
  type AuthorizePaymentRequest,
  type AuthorizePaymentResponse,
  type CapturePaymentRequest,
  type CapturePaymentResponse
} from "@gen/acme/payment/v1/payment_service";
import {
  ShippingServiceService,
  type CreateShipmentRequest,
  type CreateShipmentResponse,
  type TrackShipmentRequest,
  type TrackShipmentResponse
} from "@gen/acme/shipping/v1/shipping_service";
import {
  UserServiceService,
  type GetUserRequest,
  type GetUserResponse,
  type SearchUsersRequest,
  type SearchUsersResponse
} from "@gen/acme/user/v1/user_service";
import { UserServiceApi } from "@services/user/userService";

export type started_server = {
  address: string;
  stop: () => Promise<void>;
};

const bindEphemeral = async (server: grpc.Server): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
    server.bindAsync("127.0.0.1:0", grpc.ServerCredentials.createInsecure(), (err, port) => {
      if (err) return reject(err);
      resolve(`127.0.0.1:${port}`);
    });
  });
};

const stopServer = async (server: grpc.Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.tryShutdown((err) => (err ? reject(err) : resolve()));
  });
};

export const startUserServiceServer = async (): Promise<started_server> => {
  const server = new grpc.Server();
  server.addService(UserServiceService, {
    getUser(
      call: grpc.ServerUnaryCall<GetUserRequest, GetUserResponse>,
      callback: grpc.sendUnaryData<GetUserResponse>
    ) {
      callback(null, {
        user: {
          userId: call.request.userId,
          email: "user@example.com",
          isActive: true,
          roles: ["USER", "ADMIN"],
          profile: {
            fullName: "Jane Doe",
            addresses: [
              {
                line1: "Main Street 1",
                line2: "Apt 2",
                city: "Tallinn",
                postalCode: "10111",
                country: "EE"
              }
            ],
            preferences: { language: "en", timezone: "Europe/Tallinn" }
          },
          attributes: {
            source: "local-stub",
            requestedIncludeFields: String(call.request.includeFields.length)
          }
        },
        context: call.request.context
      });
    },
    searchUsers(
      call: grpc.ServerUnaryCall<SearchUsersRequest, SearchUsersResponse>,
      callback: grpc.sendUnaryData<SearchUsersResponse>
    ) {
      const query = call.request.query.toLowerCase();
      const activeOnly = Boolean(call.request.activeOnly);

      const all = [
        {
          userId: "u-1",
          email: "jane.doe@example.com",
          isActive: true,
          roles: ["USER"],
          profile: {
            fullName: "Jane Doe",
            addresses: [
              {
                line1: "Main Street 1",
                line2: "Apt 2",
                city: "Tallinn",
                postalCode: "10111",
                country: "EE"
              }
            ],
            preferences: { language: "en", timezone: "Europe/Tallinn" }
          },
          attributes: { source: "local-stub" }
        },
        {
          userId: "u-2",
          email: "john.smith@example.com",
          isActive: false,
          roles: ["USER"],
          profile: {
            fullName: "John Smith",
            addresses: [],
            preferences: { language: "en", timezone: "Europe/Tallinn" }
          },
          attributes: { source: "local-stub" }
        }
      ] satisfies SearchUsersResponse["users"];

      const users = all
        .filter((u) => (!activeOnly ? true : Boolean(u.isActive)))
        .filter((u) =>
          !query
            ? true
            : `${u.userId} ${u.email} ${u.profile.fullName}`.toLowerCase().includes(query)
        );

      callback(null, {
        users,
        page: { nextPageToken: "" },
        context: call.request.context
      });
    }
  });

  const address = await bindEphemeral(server);
  return { address, stop: () => stopServer(server) };
};

export const startOrderServiceServerStandalone = async (): Promise<started_server> => {
  const server = new grpc.Server();
  server.addService(OrderServiceService, {
    createOrder(
      call: grpc.ServerUnaryCall<CreateOrderRequest, CreateOrderResponse>,
      callback: grpc.sendUnaryData<CreateOrderResponse>
    ) {
      callback(null, {
        order: {
          orderId: "ord-1",
          userId: call.request.userId,
          status: "CREATED",
          items: call.request.items,
          total: { amount: "19.99", currency: "EUR" },
          metadata: { source: "local-stub" }
        },
        context: call.request.context
      });
    },
    getOrder(
      call: grpc.ServerUnaryCall<GetOrderRequest, GetOrderResponse>,
      callback: grpc.sendUnaryData<GetOrderResponse>
    ) {
      callback(null, {
        order: {
          orderId: call.request.orderId,
          userId: "123",
          status: "CREATED",
          items: [],
          total: { amount: "0.00", currency: "EUR" },
          metadata: { source: "local-stub" }
        },
        context: call.request.context
      });
    },
    listOrders(
      call: grpc.ServerUnaryCall<ListOrdersRequest, ListOrdersResponse>,
      callback: grpc.sendUnaryData<ListOrdersResponse>
    ) {
      const all = [
        {
          orderId: "ord-1",
          userId: call.request.userId,
          status: "CREATED",
          items: [],
          total: { amount: "9.99", currency: "EUR" },
          metadata: { source: "local-stub" }
        },
        {
          orderId: "ord-2",
          userId: call.request.userId,
          status: "SHIPPED",
          items: [],
          total: { amount: "19.99", currency: "EUR" },
          metadata: { source: "local-stub" }
        }
      ];

      const status = call.request.status;
      const orders = status ? all.filter((o) => o.status === status) : all;

      callback(null, {
        orders,
        page: { nextPageToken: "" },
        context: call.request.context
      });
    }
  });

  const address = await bindEphemeral(server);
  return { address, stop: () => stopServer(server) };
};

export const startInventoryServiceServer = async (): Promise<started_server> => {
  const server = new grpc.Server();
  server.addService(InventoryServiceService, {
    getStock(
      call: grpc.ServerUnaryCall<GetStockRequest, GetStockResponse>,
      callback: grpc.sendUnaryData<GetStockResponse>
    ) {
      const items = call.request.skus.map((sku) => ({
        sku,
        available: 100,
        reserved: 0,
        warehouse: { warehouseId: "wh-1", region: call.request.region },
        attributes: { source: "local-stub" }
      }));

      callback(null, {
        items,
        context: call.request.context
      });
    },
    reserveStock(
      call: grpc.ServerUnaryCall<ReserveStockRequest, ReserveStockResponse>,
      callback: grpc.sendUnaryData<ReserveStockResponse>
    ) {
      const items = call.request.lines.map((l) => ({
        sku: l.sku,
        available: 100,
        reserved: l.quantity,
        warehouse: { warehouseId: "wh-1", region: call.request.region },
        attributes: { ...l.attributes, source: "local-stub" }
      }));

      callback(null, {
        reservationId: call.request.reservationId,
        reservedItems: items,
        context: call.request.context
      });
    },
    getStockAggregated(
      call: grpc.ServerUnaryCall<GetStockRequest, GetStockAggregatedResponse>,
      callback: grpc.sendUnaryData<GetStockAggregatedResponse>
    ) {
      const n = getExpectedResponseCount();
      const responses: GetStockResponse[] = [];
      for (let i = 0; i < n; i++) {
        const items = call.request.skus.map((sku) => ({
          sku,
          available: 100,
          reserved: 0,
          warehouse: { warehouseId: `wh-${i + 1}`, region: call.request.region },
          attributes: { source: `local-stub-${i}` }
        }));
        responses.push({
          items,
          context: call.request.context
        });
      }
      callback(null, { responses });
    }
  });

  const address = await bindEphemeral(server);
  return { address, stop: () => stopServer(server) };
};

export const startPaymentServiceServer = async (): Promise<started_server> => {
  const server = new grpc.Server();
  server.addService(PaymentServiceService, {
    authorize(
      call: grpc.ServerUnaryCall<AuthorizePaymentRequest, AuthorizePaymentResponse>,
      callback: grpc.sendUnaryData<AuthorizePaymentResponse>
    ) {
      callback(null, {
        paymentId: call.request.paymentId,
        status: "AUTHORIZED",
        authCode: "AUTH-123",
        metadata: { source: "local-stub" },
        context: call.request.context
      });
    },
    capture(
      call: grpc.ServerUnaryCall<CapturePaymentRequest, CapturePaymentResponse>,
      callback: grpc.sendUnaryData<CapturePaymentResponse>
    ) {
      callback(null, {
        paymentId: call.request.paymentId,
        status: "CAPTURED",
        captureId: "CAP-123",
        metadata: { source: "local-stub" },
        context: call.request.context
      });
    }
  });

  const address = await bindEphemeral(server);
  return { address, stop: () => stopServer(server) };
};

export const startShippingServiceServer = async (): Promise<started_server> => {
  const server = new grpc.Server();
  server.addService(ShippingServiceService, {
    createShipment(
      call: grpc.ServerUnaryCall<CreateShipmentRequest, CreateShipmentResponse>,
      callback: grpc.sendUnaryData<CreateShipmentResponse>
    ) {
      callback(null, {
        shipment: {
          shipmentId: call.request.shipmentId,
          orderId: call.request.orderId,
          carrier: "DHL",
          status: "CREATED",
          items: call.request.items,
          destination: call.request.destination,
          metadata: { source: "local-stub" }
        },
        context: call.request.context
      });
    },
    trackShipment(
      call: grpc.ServerUnaryCall<TrackShipmentRequest, TrackShipmentResponse>,
      callback: grpc.sendUnaryData<TrackShipmentResponse>
    ) {
      callback(null, {
        shipment: {
          shipmentId: call.request.shipmentId,
          orderId: "ord-1",
          carrier: "DHL",
          status: "IN_TRANSIT",
          items: [],
          destination: {
            line1: "Main Street 1",
            line2: "",
            city: "Tallinn",
            postalCode: "10111",
            country: "EE"
          },
          metadata: { source: "local-stub" }
        },
        events: [
          {
            eventId: "evt-1",
            timestamp: "2026-01-01T00:00:00Z",
            location: "Tallinn",
            description: "Departed",
            attributes: { source: "local-stub" }
          }
        ],
        context: call.request.context
      });
    }
  });

  const address = await bindEphemeral(server);
  return { address, stop: () => stopServer(server) };
};

export const startNotificationServiceServer = async (): Promise<started_server> => {
  const server = new grpc.Server();
  server.addService(NotificationServiceService, {
    sendEmail(
      call: grpc.ServerUnaryCall<SendEmailRequest, SendEmailResponse>,
      callback: grpc.sendUnaryData<SendEmailResponse>
    ) {
      // Test hook: force a specific gRPC error for error-code table tests
      if (call.request.messageId === "force-error-code-4") {
        callback(
          {
            name: "DeadlineExceeded",
            message: "Deadline exceeded (test)",
            code: grpc.status.DEADLINE_EXCEEDED,
            details: "test"
          } as grpc.ServiceError,
          null
        );
        return;
      }
      callback(null, {
        status: "SENT",
        messageId: call.request.messageId,
        metadata: { source: "local-stub" },
        context: call.request.context
      });
    },
    sendSms(
      call: grpc.ServerUnaryCall<SendSmsRequest, SendSmsResponse>,
      callback: grpc.sendUnaryData<SendSmsResponse>
    ) {
      callback(null, {
        status: "SENT",
        messageId: call.request.messageId,
        metadata: { source: "local-stub" },
        context: call.request.context
      });
    },
    sendEmailStream(call: grpc.ServerWritableStream<SendEmailRequest, SendEmailResponse>) {
      const n = getExpectedResponseCount();
      for (let i = 0; i < n; i++) {
        call.write({
          messageId: call.request.messageId,
          status: "SENT",
          metadata: { source: `local-stub-${i}` },
          context: call.request.context
        });
      }
      call.end();
    }
  });

  const address = await bindEphemeral(server);
  return { address, stop: () => stopServer(server) };
};

export const startAuditServiceServer = async (): Promise<started_server> => {
  const server = new grpc.Server();
  server.addService(AuditServiceService, {
    writeEvent(
      call: grpc.ServerUnaryCall<WriteAuditEventRequest, WriteAuditEventResponse>,
      callback: grpc.sendUnaryData<WriteAuditEventResponse>
    ) {
      callback(null, {
        eventId: call.request.event?.eventId ?? "evt-1",
        status: "WRITTEN",
        context: call.request.context
      });
    },
    listEvents(
      call: grpc.ServerUnaryCall<ListAuditEventsRequest, ListAuditEventsResponse>,
      callback: grpc.sendUnaryData<ListAuditEventsResponse>
    ) {
      callback(null, {
        events: [
          {
            eventId: "evt-1",
            timestamp: "2026-01-01T00:00:00Z",
            type: "demo",
            entityType: call.request.entityType || "order",
            entityId: call.request.entityId || "ord-1",
            actor: { subject: "me", tenant: "t1", roles: ["USER"] },
            details: { source: "local-stub" }
          }
        ],
        page: { nextPageToken: "" },
        context: call.request.context
      });
    }
  });

  const address = await bindEphemeral(server);
  return { address, stop: () => stopServer(server) };
};

export const startUserOrderStack = async (): Promise<{
  user: started_server;
  order: started_server;
}> => {
  const user = await startUserServiceServer();
  const userApi = new UserServiceApi(user.address, grpc.credentials.createInsecure());

  const orderServer = new grpc.Server();
  orderServer.addService(OrderServiceService, {
    async createOrder(
      call: grpc.ServerUnaryCall<CreateOrderRequest, CreateOrderResponse>,
      callback: grpc.sendUnaryData<CreateOrderResponse>
    ) {
      try {
        const userRes = await userApi.getUser({
          userId: call.request.userId,
          context: call.request.context,
          actor: call.request.actor,
          includeFields: ["roles"],
          headers: {}
        });

        // Example of service-to-service logic:
        // If user is missing or inactive, fail the order creation.
        if (!userRes.user || userRes.user.isActive === false) {
          callback(
            {
              name: "FailedPrecondition",
              message: "user is inactive",
              code: grpc.status.FAILED_PRECONDITION,
              details: "user is inactive"
            } as grpc.ServiceError,
            null
          );
          return;
        }

        callback(null, {
          order: {
            orderId: "ord-1",
            userId: call.request.userId,
            status: "CREATED",
            items: call.request.items,
            total: { amount: "19.99", currency: "EUR" },
            metadata: { source: "local-stub", userRoles: userRes.user.roles.join(",") }
          },
          context: call.request.context
        });
      } catch (err) {
        callback(err as grpc.ServiceError, null);
      }
    },
    getOrder(
      call: grpc.ServerUnaryCall<GetOrderRequest, GetOrderResponse>,
      callback: grpc.sendUnaryData<GetOrderResponse>
    ) {
      callback(null, {
        order: {
          orderId: call.request.orderId,
          userId: "123",
          status: "CREATED",
          items: [],
          total: { amount: "0.00", currency: "EUR" },
          metadata: { source: "local-stub" }
        },
        context: call.request.context
      });
    },
    listOrders(
      call: grpc.ServerUnaryCall<ListOrdersRequest, ListOrdersResponse>,
      callback: grpc.sendUnaryData<ListOrdersResponse>
    ) {
      callback(null, {
        orders: [],
        page: { nextPageToken: "" },
        context: call.request.context
      });
    }
  });

  const orderAddress = await bindEphemeral(orderServer);
  const order: started_server = { address: orderAddress, stop: () => stopServer(orderServer) };

  return { user, order };
};
