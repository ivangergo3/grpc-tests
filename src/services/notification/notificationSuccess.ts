import type { SendEmailResponse, SendSmsResponse } from "@gen/acme/notification/v1/notification_service";
import { expect } from "vitest";
import { asResponses, verifyResponseCount, verifySuccessContext, type SuccessOneOrMany } from "../baseSuccess";

export type VerifySendEmailSuccessOptions = {
  expectedRequestId?: string;
  expectedMessageId?: string;
  expectedStatus?: string;
  /** From getExpectedResponseCountForRpc(rpc) for multi-response (SendEmailStream); asserts exactly N responses (3.4). */
  expectedCount?: number;
};

export const verifySendEmailSuccess = (
  res: SuccessOneOrMany<SendEmailResponse>,
  options?: VerifySendEmailSuccessOptions
): void => {
  const arr = asResponses(res);
  if (options?.expectedCount !== undefined) {
    verifyResponseCount(arr, options.expectedCount);
  }
  arr.forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedStatus !== undefined) {
      expect(r.status).toBe(options.expectedStatus);
    }
    if (options?.expectedMessageId !== undefined) {
      expect(r.messageId).toBe(options.expectedMessageId);
    }
  });
};

export type VerifySendSmsSuccessOptions = {
  expectedRequestId?: string;
  expectedMessageId?: string;
  expectedStatus?: string;
};

export const verifySendSmsSuccess = (
  res: SuccessOneOrMany<SendSmsResponse>,
  options?: VerifySendSmsSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedStatus !== undefined) {
      expect(r.status).toBe(options.expectedStatus);
    }
    if (options?.expectedMessageId !== undefined) {
      expect(r.messageId).toBe(options.expectedMessageId);
    }
  });
};
