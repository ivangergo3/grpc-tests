import type * as grpc from "@grpc/grpc-js";

import type { Address, Actor, Money, Pagination, RequestContext } from "@gen/acme/common/v1/common";
import type {
  PaymentEvent,
  PaymentMethod,
  WatchPaymentRequest
} from "@gen/acme/payment/v1/payment_service";
import type { ShipmentItem } from "@gen/acme/shipping/v1/shipping_service";
import type { TrackingEvent, WatchShipmentRequest } from "@gen/acme/shipping/v1/shipping_service";
import type { SearchUsersRequest, SearchUsersResponse } from "@gen/acme/user/v1/user_service";

// === Common service-layer types ===

export type ChannelCredentialsInput =
  | grpc.ChannelCredentials
  | {
      /**
       * true = plaintext connection (no TLS). This maps to grpc.credentials.createInsecure().
       */
      insecure?: boolean;
      /**
       * If provided, used as-is (TLS/mTLS/etc).
       * When set, this wins over `insecure`.
       */
      creds?: grpc.ChannelCredentials;
    }
  | undefined;

// === Common request-builder types ===

export type BaseRequestFields = {
  context?: RequestContext;
  actor?: Actor;
  headers?: Record<string, string>;
};

export type BaseRequestDefaults = Required<BaseRequestFields>;

export type GetUserParams = BaseRequestFields & {
  userId?: string;
  includeFields?: string[];
};

export type SearchUsersParams = BaseRequestFields & {
  query?: string;
  activeOnly?: boolean;
  page?: Pagination;
};

export type AuthorizePaymentParams = BaseRequestFields & {
  paymentId?: string;
  orderId?: string;
  userId?: string;
  amount?: Money;
  method?: PaymentMethod;
};

export type CapturePaymentParams = BaseRequestFields & {
  paymentId?: string;
  amount?: Money;
};

export type WatchPaymentParams = BaseRequestFields & {
  paymentId?: string;
  afterEventIndex?: number;
};

export type CreateShipmentParams = BaseRequestFields & {
  shipmentId?: string;
  orderId?: string;
  items?: ShipmentItem[];
  destination?: Address;
};

export type TrackShipmentParams = BaseRequestFields & {
  shipmentId?: string;
};

export type WatchShipmentParams = BaseRequestFields & {
  shipmentId?: string;
  afterEventIndex?: number;
};

// === Service-specific stream adapter types (for ESLint type-checked rules) ===

export type SearchUsersStreamChunk = {
  user?: SearchUsersResponse["users"][number];
  context?: SearchUsersResponse["context"];
};

export type UserServiceStreamClient = {
  searchUsersStream: (
    request: SearchUsersRequest,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>
  ) => grpc.ClientReadableStream<SearchUsersStreamChunk>;
};

export type PaymentServiceStreamClient = {
  watchPayment: (
    request: WatchPaymentRequest,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>
  ) => grpc.ClientReadableStream<PaymentEvent>;
};

export type WatchPaymentResponse = {
  events: PaymentEvent[];
  context?: RequestContext;
};

export type ShippingServiceStreamClient = {
  watchShipment: (
    request: WatchShipmentRequest,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>
  ) => grpc.ClientReadableStream<TrackingEvent>;
};

export type WatchShipmentResponse = {
  events: TrackingEvent[];
  context?: RequestContext;
};

// === Success verifier types ===

export type SuccessOneOrMany<T> = T | T[];

export type SuccessContextOptions = {
  expectedRequestId?: string;
};

export type StreamSuccess<T> = {
  events: T[];
  eventCount: number;
  lastEvent?: T;
};

export type VerifyStreamSuccessOptions<T> = {
  expectedMinCount?: number;
  expectedCount?: number;
  /**
   * Deep-equality assertion against lastEvent.
   * Useful when you want to validate a final status transition.
   */
  expectedLastEvent?: T;
  /**
   * Deep-equality assertion against the full events array.
   * Prefer verifyEvent/verifyAllEvents if you only care about a subset of fields.
   */
  expectedEvents?: T[];
  /**
   * Custom assertions across the entire stream.
   */
  verifyAllEvents?: (events: T[]) => void;
  /**
   * Custom assertions per event.
   */
  verifyEvent?: (event: T, index: number, events: T[]) => void;
};

export type VerifyGetUserSuccessOptions = {
  expectedRequestId?: string;
  expectedUserId?: string;
  expectedEmail?: string;
  expectedIsActive?: boolean;
  expectedRolesContain?: string;
};

export type VerifySearchUsersSuccessOptions = {
  expectedRequestId?: string;
  expectedMinCount?: number;
  expectedCount?: number;
  expectAllActive?: boolean;
  expectSomeInactive?: boolean;
};

export type VerifySearchUsersStreamSuccessOptions = VerifySearchUsersSuccessOptions;

export type VerifyAuthorizeSuccessOptions = {
  expectedRequestId?: string;
  expectedPaymentId?: string;
  expectedStatus?: string;
  expectAuthCode?: boolean;
  expectedMetadataSource?: string;
};

export type VerifyCaptureSuccessOptions = {
  expectedRequestId?: string;
  expectedPaymentId?: string;
  expectedStatus?: string;
  expectCaptureId?: boolean;
};

export type VerifyWatchPaymentSuccessOptions = VerifyStreamSuccessOptions<PaymentEvent> & {
  expectedRequestId?: string;
};

export type VerifyCreateShipmentSuccessOptions = {
  expectedRequestId?: string;
  expectedShipmentId?: string;
  expectedStatus?: string;
  expectedCountry?: string;
};

export type VerifyTrackShipmentSuccessOptions = {
  expectedRequestId?: string;
  expectedShipmentId?: string;
  expectedStatus?: string;
  expectedEventsMin?: number;
  expectedDestinationLine2?: string;
};

export type VerifyWatchShipmentSuccessOptions = VerifyStreamSuccessOptions<TrackingEvent> & {
  expectedRequestId?: string;
};

// === Failure verifier types ===

export type FailureOptions = {
  expectedCode?: number;
  messageContains?: string;
  detailsContains?: string;
  /**
   * Metadata key/value assertions. Uses grpc Metadata string values.
   * Example: { "x-request-id": "abc" }
   */
  metadataContains?: Record<string, string>;
};

export type FailurePromiseContext<T> = {
  label?: string;
  onUnexpectedSuccess?: (value: T) => void;
};

export type FailureSnapshot = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  metadata?: unknown;
};
