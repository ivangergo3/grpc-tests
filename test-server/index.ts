import * as grpc from "@grpc/grpc-js";

import {
  type AuthorizePaymentRequest,
  type AuthorizePaymentResponse,
  type CapturePaymentRequest,
  type CapturePaymentResponse,
  PaymentServiceService,
  PaymentStatus,
  type PaymentEvent,
  type WatchPaymentRequest,
} from "../src/gen/acme/payment/v1/payment_service";
import {
  type CreateShipmentRequest,
  type CreateShipmentResponse,
  type TrackShipmentRequest,
  type TrackShipmentResponse,
  ShippingServiceService,
  type TrackingEvent,
  type WatchShipmentRequest,
} from "../src/gen/acme/shipping/v1/shipping_service";
import {
  type GetUserRequest,
  type GetUserResponse,
  UserServiceService,
  type SearchUsersRequest,
  type SearchUsersResponse,
  type SearchUsersStreamResponse,
} from "../src/gen/acme/user/v1/user_service";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 50051;

const getArg = (name: string): string | undefined => {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const v = process.argv[idx + 1];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
};

const host = getArg("host") ?? DEFAULT_HOST;
const port = Number(getArg("port") ?? DEFAULT_PORT);
const address = `${host}:${port}`;

const makeUsers = (): SearchUsersResponse["users"] => [
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
          country: "EE",
        },
      ],
      preferences: { language: "en", timezone: "Europe/Tallinn" },
    },
    attributes: { source: "local-stub" },
  },
  {
    userId: "u-2",
    email: "john.smith@example.com",
    isActive: false,
    roles: ["USER"],
    profile: {
      fullName: "John Smith",
      addresses: [],
      preferences: { language: "en", timezone: "Europe/Tallinn" },
    },
    attributes: { source: "local-stub" },
  },
];

const filterUsers = (req: SearchUsersRequest): SearchUsersResponse["users"] => {
  const query = req.query.toLowerCase();
  const activeOnly = Boolean(req.activeOnly);
  return makeUsers()
    .filter((u) => (!activeOnly ? true : Boolean(u.isActive)))
    .filter((u) =>
      !query ? true : `${u.userId} ${u.email} ${u.profile?.fullName ?? ""}`.toLowerCase().includes(query),
    );
};

const start = async (): Promise<void> => {
  const server = new grpc.Server();

  const error = (code: grpc.status, message: string) => {
    const md = new grpc.Metadata();
    md.set("x-test-server", "true");
    const err = new Error(message) as grpc.ServiceError;
    err.code = code;
    err.details = message;
    err.metadata = md;
    return err;
  };
  const streamFail = <Req, Res>(call: grpc.ServerWritableStream<Req, Res>, err: grpc.ServiceError) => {
    // Ensure the client has time to attach listeners before we error out.
    setImmediate(() => {
      // grpc-js server-streaming error signaling can be finicky across runtimes;
      // be explicit and try multiple close paths.
      (call as unknown as { emit: (event: string, ...args: unknown[]) => void }).emit("error", err);
      call.destroy(err);
      call.end();
    });
  };

  server.addService(UserServiceService, {
    getUser(
      call: grpc.ServerUnaryCall<GetUserRequest, GetUserResponse>,
      callback: grpc.sendUnaryData<GetUserResponse>,
    ) {
      if (call.request.userId.startsWith("fail-")) {
        return callback(error(grpc.status.INVALID_ARGUMENT, `invalid user_id: ${call.request.userId}`));
      }
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
                country: "EE",
              },
            ],
            preferences: { language: "en", timezone: "Europe/Tallinn" },
          },
          attributes: {
            source: "local-stub",
            requestedIncludeFields: String(call.request.includeFields.length),
          },
        },
        context: call.request.context,
      });
    },

    searchUsers(
      call: grpc.ServerUnaryCall<SearchUsersRequest, SearchUsersResponse>,
      callback: grpc.sendUnaryData<SearchUsersResponse>,
    ) {
      if (call.request.query.startsWith("fail-")) {
        return callback(error(grpc.status.INVALID_ARGUMENT, `invalid query: ${call.request.query}`));
      }
      const users = filterUsers(call.request);
      callback(null, {
        users,
        page: { nextPageToken: "" },
        context: call.request.context,
      });
    },

    searchUsersStream(
      call: grpc.ServerWritableStream<SearchUsersRequest, SearchUsersStreamResponse>,
    ) {
      if (call.request.query.startsWith("fail-")) {
        streamFail(call, error(grpc.status.INVALID_ARGUMENT, `invalid query: ${call.request.query}`));
        return;
      }
      const users = filterUsers(call.request);
      users.forEach((user, idx) => {
        const msg: SearchUsersStreamResponse = {
          user,
          context: call.request.context,
          index: idx,
          isLast: idx === users.length - 1,
        };
        call.write(msg);
      });
      call.end();
    },
  });

  server.addService(PaymentServiceService, {
    authorize(
      call: grpc.ServerUnaryCall<AuthorizePaymentRequest, AuthorizePaymentResponse>,
      callback: grpc.sendUnaryData<AuthorizePaymentResponse>,
    ) {
      if (call.request.paymentId.startsWith("fail-")) {
        return callback(
          error(grpc.status.INVALID_ARGUMENT, `invalid payment_id: ${call.request.paymentId}`),
        );
      }
      callback(null, {
        paymentId: call.request.paymentId,
        status: "AUTHORIZED",
        authCode: "AUTH-123",
        metadata: { source: "local-stub" },
        context: call.request.context,
      });
    },

    capture(
      call: grpc.ServerUnaryCall<CapturePaymentRequest, CapturePaymentResponse>,
      callback: grpc.sendUnaryData<CapturePaymentResponse>,
    ) {
      if (call.request.paymentId.startsWith("fail-")) {
        return callback(
          error(grpc.status.INVALID_ARGUMENT, `invalid payment_id: ${call.request.paymentId}`),
        );
      }
      callback(null, {
        paymentId: call.request.paymentId,
        status: "CAPTURED",
        captureId: "CAP-123",
        metadata: { source: "local-stub" },
        context: call.request.context,
      });
    },

    watchPayment(call: grpc.ServerWritableStream<WatchPaymentRequest, PaymentEvent>) {
      const req: WatchPaymentRequest = call.request;
      if (req.paymentId.startsWith("fail-")) {
        streamFail(call, error(grpc.status.INVALID_ARGUMENT, `invalid payment_id: ${req.paymentId}`));
        return;
      }
      const startAfter = req.afterEventIndex ?? 0;

      const all: PaymentEvent[] = [
        {
          paymentId: req.paymentId,
          statusCode: PaymentStatus.PAYMENT_STATUS_AUTHORIZED,
          message: "authorized",
          metadata: { source: "local-stub" },
          context: req.context,
          eventIndex: 1,
        },
        {
          paymentId: req.paymentId,
          statusCode: PaymentStatus.PAYMENT_STATUS_CAPTURED,
          message: "captured",
          metadata: { source: "local-stub" },
          context: req.context,
          eventIndex: 2,
        },
      ];

      all.filter((e) => e.eventIndex > startAfter).forEach((e) => call.write(e));
      call.end();
    },
  });

  server.addService(ShippingServiceService, {
    createShipment(
      call: grpc.ServerUnaryCall<CreateShipmentRequest, CreateShipmentResponse>,
      callback: grpc.sendUnaryData<CreateShipmentResponse>,
    ) {
      if (call.request.shipmentId.startsWith("fail-")) {
        return callback(
          error(grpc.status.INVALID_ARGUMENT, `invalid shipment_id: ${call.request.shipmentId}`),
        );
      }
      callback(null, {
        shipment: {
          shipmentId: call.request.shipmentId,
          orderId: call.request.orderId,
          carrier: "DHL",
          status: "CREATED",
          items: call.request.items,
          destination: call.request.destination,
          metadata: { source: "local-stub" },
        },
        context: call.request.context,
      });
    },

    trackShipment(
      call: grpc.ServerUnaryCall<TrackShipmentRequest, TrackShipmentResponse>,
      callback: grpc.sendUnaryData<TrackShipmentResponse>,
    ) {
      if (call.request.shipmentId.startsWith("fail-")) {
        return callback(
          error(grpc.status.INVALID_ARGUMENT, `invalid shipment_id: ${call.request.shipmentId}`),
        );
      }
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
            country: "EE",
          },
          metadata: { source: "local-stub" },
        },
        events: [
          {
            eventId: "evt-1",
            timestamp: "2026-01-01T00:00:00Z",
            location: "Tallinn",
            description: "Departed",
            attributes: { source: "local-stub" },
          },
        ],
        context: call.request.context,
      });
    },

    watchShipment(call: grpc.ServerWritableStream<WatchShipmentRequest, TrackingEvent>) {
      const req: WatchShipmentRequest = call.request;
      if (req.shipmentId.startsWith("fail-")) {
        streamFail(call, error(grpc.status.INVALID_ARGUMENT, `invalid shipment_id: ${req.shipmentId}`));
        return;
      }
      const startAfter = req.afterEventIndex ?? 0;
      const all: TrackingEvent[] = [
        {
          eventId: "evt-1",
          timestamp: "2026-01-01T00:00:00Z",
          location: "Tallinn",
          description: "Departed",
          attributes: { source: "local-stub", shipmentId: req.shipmentId, idx: "1" },
        },
        {
          eventId: "evt-2",
          timestamp: "2026-01-02T00:00:00Z",
          location: "Riga",
          description: "In transit",
          attributes: { source: "local-stub", shipmentId: req.shipmentId, idx: "2" },
        },
      ];

      all.slice(startAfter).forEach((e) => call.write(e));
      call.end();
    },
  });

  await new Promise<void>((resolve, reject) => {
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err) => {
      if (err) return reject(err);
      server.start();
      resolve();
    });
  });

  console.info(`[test-server] listening on ${address}`);
  console.info(`[test-server] flags: --host ${DEFAULT_HOST} --port ${DEFAULT_PORT}`);

  const shutdown = async (reason: string) => {
    console.info(`[test-server] shutting down (${reason})`);
    await new Promise<void>((resolve) => server.tryShutdown(() => resolve()));
    process.exitCode = 0;
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
};

await start();

