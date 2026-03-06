import { test, expect } from "@utils/fixtures";
import { PaymentStatus } from "@gen/acme/payment/v1/payment_service";
import { status } from "@grpc/grpc-js";

test.describe("PaymentService", () => {
  test("Authorize returns AUTHORIZED status", async ({ api, verify }) => {
    // given
    const params = {
      context: { requestId: "pay-1" },
      paymentId: "p-1"
    };

    // when
    const res = await api.payment.authorizeWithParams(params);

    // then
    verify.payment.authorizeSuccess(res, { expectedRequestId: "pay-1", expectedPaymentId: "p-1" });
  });

  test("Capture returns CAPTURED status", async ({ api, verify }) => {
    // given
    const params = {
      paymentId: "p-1",
      context: { requestId: "pay-2" }
    };

    // when
    const res = await api.payment.captureWithParams(params);

    // then
    verify.payment.captureSuccess(res, { expectedRequestId: "pay-2", expectedPaymentId: "p-1" });
  });

  test("Authorize echoes payment id", async ({ api, verify }) => {
    // given
    const params = {
      paymentId: "p-xyz",
      context: { requestId: "pay-3" }
    };

    // when
    const res = await api.payment.authorizeWithParams(params);

    // then
    verify.payment.authorizeSuccess(res, {
      expectedRequestId: "pay-3",
      expectedPaymentId: "p-xyz"
    });
  });

  test("Authorize returns metadata + echoed context", async ({ api, verify }) => {
    // given
    const params = {
      paymentId: "p-meta",
      context: { requestId: "pay-4" }
    };

    // when
    const res = await api.payment.authorizeWithParams(params);

    // then
    verify.payment.authorizeSuccess(res, {
      expectedRequestId: "pay-4",
      expectedPaymentId: "p-meta"
    });
  });

  test("WatchPayment returns a stream aggregated into events[]", async ({ api, verify }) => {
    // given
    const params = {
      paymentId: "p-stream-1",
      context: { requestId: "pay-stream-1" }
    };

    // when
    const res = await api.payment.watchPaymentWithParams(params);

    // then
    verify.payment.watchPaymentSuccess(res, {
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

  test("WatchPayment can resume with afterEventIndex", async ({ api, verify }) => {
    // given
    const params = {
      paymentId: "p-stream-2",
      afterEventIndex: 1,
      context: { requestId: "pay-stream-2" }
    };

    // when
    const res = await api.payment.watchPaymentWithParams(params);

    // then
    verify.payment.watchPaymentSuccess(res, {
      expectedRequestId: "pay-stream-2",
      expectedCount: 1,
      verifyAllEvents: (events) => {
        expect(events.map((e) => e.statusCode)).toEqual([PaymentStatus.PAYMENT_STATUS_CAPTURED]);
      }
    });
  });

  test("Authorize returns INVALID_ARGUMENT for fail-* ids", async ({ api, verify }) => {
    // given
    const params = {
      paymentId: "fail-pay-1",
      context: { requestId: "pay-fail-1" }
    };

    // when/then
    await verify.payment.failurePromise(
      api.payment.authorizeWithParams(params),
      {
        expectedCode: status.INVALID_ARGUMENT,
        messageContains: "invalid payment_id: fail-pay-1"
      },
      { label: "payment.authorize" }
    );
  });

  test("WatchPayment returns INVALID_ARGUMENT for fail-* ids", async ({ api, verify }) => {
    // given
    const params = {
      paymentId: "fail-pay-stream",
      context: { requestId: "pay-fail-2" }
    };

    // when/then
    await verify.payment.failurePromise(
      api.payment.watchPaymentWithParams(params),
      {
        expectedCode: status.INVALID_ARGUMENT,
        messageContains: "invalid payment_id: fail-pay-stream"
      },
      { label: "payment.watchPayment" }
    );
  });
});
