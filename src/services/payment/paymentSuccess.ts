import type {
  AuthorizePaymentResponse,
  CapturePaymentResponse
} from "@gen/acme/payment/v1/payment_service";
import { asResponses, verifySuccessContext, type SuccessOneOrMany } from "../baseSuccess";

export type VerifyAuthorizeSuccessOptions = {
  expectedRequestId?: string;
  expectedPaymentId?: string;
  expectedStatus?: string;
  expectAuthCode?: boolean;
  expectedMetadataSource?: string;
};

export const verifyAuthorizeSuccess = (
  res: SuccessOneOrMany<AuthorizePaymentResponse>,
  options?: VerifyAuthorizeSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedStatus !== undefined) {
      expect(r.status).toBe(options.expectedStatus);
    }
    if (options?.expectedPaymentId !== undefined) {
      expect(r.paymentId).toBe(options.expectedPaymentId);
    }
    if (options?.expectAuthCode === true) {
      expect(r.authCode).toBeTruthy();
    }
    if (options?.expectedMetadataSource !== undefined) {
      expect(r.metadata?.source).toBe(options.expectedMetadataSource);
    }
  });
};

export type VerifyCaptureSuccessOptions = {
  expectedRequestId?: string;
  expectedPaymentId?: string;
  expectedStatus?: string;
  expectCaptureId?: boolean;
};

export const verifyCaptureSuccess = (
  res: SuccessOneOrMany<CapturePaymentResponse>,
  options?: VerifyCaptureSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedStatus !== undefined) {
      expect(r.status).toBe(options.expectedStatus);
    }
    if (options?.expectedPaymentId !== undefined) {
      expect(r.paymentId).toBe(options.expectedPaymentId);
    }
    if (options?.expectCaptureId === true) {
      expect(r.captureId).toBeTruthy();
    }
  });
};
