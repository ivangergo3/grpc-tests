import { test as base, expect } from "@playwright/test";

import { loadDotEnvOnce } from "@utils/env";
import { installGlobalHandlersOnce, patchConsoleOnce } from "@utils/consoleCapture";
import { logger, type Logger } from "@utils/logger";
import { PaymentServiceApi } from "@services/payment/paymentService";
import { ShippingServiceApi } from "@services/shipping/shippingService";
import { UserServiceApi } from "@services/user/userService";

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

import { ExampleDomainPage } from "@pages";
import { attachArtifactsToAllure, getTestArtifacts, startTestArtifacts } from "@utils/testArtifacts";
import * as allure from "allure-js-commons";

loadDotEnvOnce();
installGlobalHandlersOnce();
patchConsoleOnce();

export type ServicesFixture = {
  user: UserServiceApi;
  payment: PaymentServiceApi;
  shipping: ShippingServiceApi;
  log: Logger;
};

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

export const request = build;
export const req = request;

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

export type Api = ServicesFixture;
export type Log = ServicesFixture["log"];

export type Build = typeof build;
export type Request = typeof request;
export type Verify = typeof verify;

export type ExampleDomain = ExampleDomainPage;

export const test = base.extend<{
  api: Api;
  log: Log;
  build: Build;
  req: Request;
  verify: Verify;
  exampleDomainPage: ExampleDomain;
}>({
  // eslint-disable-next-line no-empty-pattern
  api: async ({}, use) => {
    const target = process.env.TEST_SERVER_BASE_URL?.trim();
    if (!target) throw new Error("Missing required env var: TEST_SERVER_BASE_URL");

    const log = logger.child("local");
    const api: ServicesFixture = {
      user: new UserServiceApi(target, undefined),
      payment: new PaymentServiceApi(target, undefined),
      shipping: new ShippingServiceApi(target, undefined),
      log
    };
    try {
      await use(api);
    } finally {
      api.user.close();
      api.payment.close();
      api.shipping.close();
    }
  },
  log: async ({ api }, use) => {
    await use(api.log);
  },
  // eslint-disable-next-line no-empty-pattern
  build: async ({}, use) => {
    await use(build);
  },
  // eslint-disable-next-line no-empty-pattern
  req: async ({}, use) => {
    await use(request);
  },
  // eslint-disable-next-line no-empty-pattern
  verify: async ({}, use) => {
    await use(verify);
  },
  exampleDomainPage: async ({ page }, use, testInfo) => {
    if (testInfo.project.name === "api") {
      throw new Error("exampleDomainPage is not available in Playwright project=api");
    }
    await use(new ExampleDomainPage(page));
  }
});

const allureAdapter = {
  attachment: (name: string, content: string, type?: string) => {
    void allure.attachment(name, content, type ?? "text/plain");
  }
};

// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, testInfo) => {
  // Include suite nesting for readability when available (API differs by Playwright version).
  const rawTitlePath = (testInfo as unknown as { titlePath?: unknown }).titlePath;
  const parts =
    typeof rawTitlePath === "function"
      ? (rawTitlePath as () => string[])()
      : Array.isArray(rawTitlePath)
        ? (rawTitlePath as string[])
        : undefined;

  const name = (parts?.filter(Boolean).join(" › ") || testInfo.title).trim();
  startTestArtifacts(name, allureAdapter);
});

test.afterEach(() => {
  const ctx = getTestArtifacts();
  if (!ctx) return;
  attachArtifactsToAllure(ctx);
});

export { expect };

