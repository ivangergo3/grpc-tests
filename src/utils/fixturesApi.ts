import { PaymentServiceApi } from "@services/payment/paymentService";
import { ShippingServiceApi } from "@services/shipping/shippingService";
import { UserServiceApi } from "@services/user/userService";
import { logger, type Logger } from "@utils/logger";

import { verifyFailurePromise } from "@services/base/baseFailure";

import {
  buildGetUserRequest,
  buildSearchUsersRequest,
  buildSearchUsersStreamRequest
} from "@services/user/userRequest";
import {
  verifyGetUserSuccess,
  verifySearchUsersStreamSuccess,
  verifySearchUsersSuccess
} from "@services/user/userSuccess";

import {
  buildAuthorizePaymentRequest,
  buildCapturePaymentRequest,
  buildWatchPaymentRequest
} from "@services/payment/paymentRequest";
import {
  verifyAuthorizeSuccess,
  verifyCaptureSuccess,
  verifyWatchPaymentSuccess
} from "@services/payment/paymentSuccess";

import {
  buildCreateShipmentRequest,
  buildTrackShipmentRequest,
  buildWatchShipmentRequest
} from "@services/shipping/shippingRequest";
import {
  verifyCreateShipmentSuccess,
  verifyTrackShipmentSuccess,
  verifyWatchShipmentSuccess
} from "@services/shipping/shippingSuccess";

export type services_fixture = {
  user: UserServiceApi;
  payment: PaymentServiceApi;
  shipping: ShippingServiceApi;
  log: Logger;
};

export const getTestServerAddress = (): string => {
  const v = process.env.TEST_SERVER_BASE_URL?.trim();
  if (!v) throw new Error("Missing required env var: TEST_SERVER_BASE_URL");
  return v;
};

/**
 * Create service clients pointing at the external `test-server` process.
 * The server is expected to be started manually in a separate terminal.
 */
export const createLocalServices = (target: string = getTestServerAddress()): services_fixture => {
  const log = logger.child("local");
  return {
    // Pass `undefined` creds: BaseGrpcService defaults to createInsecure().
    user: new UserServiceApi(target, undefined),
    payment: new PaymentServiceApi(target, undefined),
    shipping: new ShippingServiceApi(target, undefined),
    log
  };
};

/**
 * Default, ready-to-use service clients for tests.
 * (Safe because Vitest runs single-worker in this framework.)
 */
export const api: services_fixture = createLocalServices();
export const log: Logger = api.log;
export const loggerApi: Logger = api.log;

/**
 * Request builders (defaults + overrides).
 */
export const build = {
  user: {
    getUser: buildGetUserRequest,
    searchUsers: buildSearchUsersRequest,
    searchUsersStream: buildSearchUsersStreamRequest
  },
  payment: {
    authorize: buildAuthorizePaymentRequest,
    capture: buildCapturePaymentRequest,
    watchPayment: buildWatchPaymentRequest
  },
  shipping: {
    createShipment: buildCreateShipmentRequest,
    trackShipment: buildTrackShipmentRequest,
    watchShipment: buildWatchShipmentRequest
  }
} as const;

/**
 * Alias for build (naming preference in some tests).
 */
export const request = build;

/**
 * Verifiers (success + failure).
 */
export const verify = {
  user: {
    failurePromise: verifyFailurePromise,
    getUserSuccess: verifyGetUserSuccess,
    searchUsersSuccess: verifySearchUsersSuccess,
    searchUsersStreamSuccess: verifySearchUsersStreamSuccess
  },
  payment: {
    failurePromise: verifyFailurePromise,
    authorizeSuccess: verifyAuthorizeSuccess,
    captureSuccess: verifyCaptureSuccess,
    watchPaymentSuccess: verifyWatchPaymentSuccess
  },
  shipping: {
    failurePromise: verifyFailurePromise,
    createShipmentSuccess: verifyCreateShipmentSuccess,
    trackShipmentSuccess: verifyTrackShipmentSuccess,
    watchShipmentSuccess: verifyWatchShipmentSuccess
  }
} as const;
