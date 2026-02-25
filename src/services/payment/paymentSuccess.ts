import type {
  AuthorizePaymentResponse,
  CapturePaymentResponse
} from "@gen/acme/payment/v1/payment_service";
import type {
  SuccessOneOrMany,
  VerifyAuthorizeSuccessOptions,
  VerifyCaptureSuccessOptions,
  VerifyWatchPaymentSuccessOptions,
  WatchPaymentResponse
} from "@services/types";
import { asResponses, verifySuccessContext } from "@services/base";

export const verifyAuthorizeSuccess = (
  res: SuccessOneOrMany<AuthorizePaymentResponse>,
  options?: VerifyAuthorizeSuccessOptions
): void => {
  const o: VerifyAuthorizeSuccessOptions = {
    expectedStatus: "AUTHORIZED",
    expectAuthCode: true,
    expectedMetadataSource: "local-stub",
    ...options
  };
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: o.expectedRequestId });
    if (o.expectedStatus !== undefined) {
      expect(r.status).toBe(o.expectedStatus);
    }
    if (o.expectedPaymentId !== undefined) {
      expect(r.paymentId).toBe(o.expectedPaymentId);
    }
    if (o.expectAuthCode === true) {
      expect(r.authCode).toBeTruthy();
    }
    if (o.expectedMetadataSource !== undefined) {
      expect(r.metadata.source).toBe(o.expectedMetadataSource);
    }
  });
};

export const verifyCaptureSuccess = (
  res: SuccessOneOrMany<CapturePaymentResponse>,
  options?: VerifyCaptureSuccessOptions
): void => {
  const o: VerifyCaptureSuccessOptions = {
    expectedStatus: "CAPTURED",
    expectCaptureId: true,
    ...options
  };
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: o.expectedRequestId });
    if (o.expectedStatus !== undefined) {
      expect(r.status).toBe(o.expectedStatus);
    }
    if (o.expectedPaymentId !== undefined) {
      expect(r.paymentId).toBe(o.expectedPaymentId);
    }
    if (o.expectCaptureId === true) {
      expect(r.captureId).toBeTruthy();
    }
  });
};

export const verifyWatchPaymentSuccess = (
  res: WatchPaymentResponse,
  options?: VerifyWatchPaymentSuccessOptions
): void => {
  const o: VerifyWatchPaymentSuccessOptions = { expectedMinCount: 1, ...options };
  verifySuccessContext(res.context, { expectedRequestId: o.expectedRequestId });

  if (o.expectedMinCount !== undefined) {
    expect(res.events.length).toBeGreaterThanOrEqual(o.expectedMinCount);
  }
  if (o.expectedCount !== undefined) {
    expect(res.events.length).toBe(o.expectedCount);
  }

  if (o.expectedLastEvent !== undefined) {
    const last = res.events.length > 0 ? res.events[res.events.length - 1] : undefined;
    expect(last).toEqual(o.expectedLastEvent);
  }
  if (o.expectedEvents !== undefined) {
    expect(res.events).toEqual(o.expectedEvents);
  }
  if (o.verifyAllEvents !== undefined) {
    o.verifyAllEvents(res.events);
  }
  if (o.verifyEvent !== undefined) {
    res.events.forEach((e, idx) => o.verifyEvent?.(e, idx, res.events));
  }
};
