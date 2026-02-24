import { describe, expect, it } from "vitest";
import { createLocalServices } from "@utils/fixtures";
import { PaymentStatus } from "@gen/acme/payment/v1/payment_service";
import { status } from "@grpc/grpc-js";
import { verifyFailurePromise } from "@services/base";
import {
  verifyAuthorizeSuccess,
  verifyCaptureSuccess,
  verifyWatchPaymentSuccess
} from "@services/payment";

describe("PaymentService", () => {
  const api = createLocalServices();

  it("Authorize returns AUTHORIZED status", async () => {
    // given
    const params = {
      context: { requestId: "pay-1" },
      paymentId: "p-1"
    };

    // when
    const res = await api.payment.authorizeWithParams(params);

    // then
    verifyAuthorizeSuccess(res, { expectedRequestId: "pay-1", expectedPaymentId: "p-1" });
  });

  it("Capture returns CAPTURED status", async () => {
    // given
    const params = {
      paymentId: "p-1",
      context: { requestId: "pay-2" }
    };

    // when
    const res = await api.payment.captureWithParams(params);

    // then
    verifyCaptureSuccess(res, { expectedRequestId: "pay-2", expectedPaymentId: "p-1" });
  });

  it("Authorize echoes payment id", async () => {
    // given
    const params = {
      paymentId: "p-xyz",
      context: { requestId: "pay-3" }
    };

    // when
    const res = await api.payment.authorizeWithParams(params);

    // then
    verifyAuthorizeSuccess(res, { expectedRequestId: "pay-3", expectedPaymentId: "p-xyz" });
  });

  it("Authorize returns metadata + echoed context", async () => {
    // given
    const params = {
      paymentId: "p-meta",
      context: { requestId: "pay-4" }
    };

    // when
    const res = await api.payment.authorizeWithParams(params);

    // then
    verifyAuthorizeSuccess(res, { expectedRequestId: "pay-4", expectedPaymentId: "p-meta" });
  });

  it("WatchPayment returns a stream aggregated into events[]", async () => {
    // given
    const params = {
      paymentId: "p-stream-1",
      context: { requestId: "pay-stream-1" }
    };

    // when
    const res = await api.payment.watchPaymentWithParams(params);

    // then
    verifyWatchPaymentSuccess(res, {
      expectedRequestId: "pay-stream-1",
      expectedCount: 2,
      verifyAllEvents: (events) => {
        expect(events.map((e) => e.statusCode)).toEqual([
          PaymentStatus.PAYMENT_STATUS_AUTHORIZED,
          PaymentStatus.PAYMENT_STATUS_CAPTURED
        ]);
      }
    });
  });

  it("WatchPayment can resume with afterEventIndex", async () => {
    // given
    const params = {
      paymentId: "p-stream-2",
      afterEventIndex: 1,
      context: { requestId: "pay-stream-2" }
    };

    // when
    const res = await api.payment.watchPaymentWithParams(params);

    // then
    verifyWatchPaymentSuccess(res, {
      expectedRequestId: "pay-stream-2",
      expectedCount: 1,
      verifyAllEvents: (events) => {
        expect(events.map((e) => e.statusCode)).toEqual([PaymentStatus.PAYMENT_STATUS_CAPTURED]);
      }
    });
  });

  it("Authorize returns INVALID_ARGUMENT for fail-* ids", async () => {
    // given
    const params = {
      paymentId: "fail-pay-1",
      context: { requestId: "pay-fail-1" }
    };

    // when/then
    await verifyFailurePromise(api.payment.authorizeWithParams(params), {
      expectedCode: status.INVALID_ARGUMENT,
      messageContains: "invalid payment_id: fail-pay-1"
    }, { label: "payment.authorize" });
  });

  it("WatchPayment returns INVALID_ARGUMENT for fail-* ids", async () => {
    // given
    const params = {
      paymentId: "fail-pay-stream",
      context: { requestId: "pay-fail-2" }
    };

    // when/then
    await verifyFailurePromise(api.payment.watchPaymentWithParams(params), {
      expectedCode: status.INVALID_ARGUMENT,
      messageContains: "invalid payment_id: fail-pay-stream"
    }, { label: "payment.watchPayment" });
  });
});
