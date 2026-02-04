import type { ServiceError } from "@grpc/grpc-js";

/**
 * Base failure verification: common checks for failed gRPC calls (thrown errors).
 * Use in test context (expect from Vitest is global).
 */

export type FailureOptions = {
  expectedCode?: number;
  messageContains?: string;
};

/**
 * Asserts an error was thrown; optionally checks gRPC code or message substring.
 * Call from tests: try { await call(); } catch (err) { verifyFailure(err, { expectedCode: 3 }); }
 */
export const verifyFailure = (err: unknown, options?: FailureOptions): void => {
  expect(err).toBeDefined();
  expect(err).toBeInstanceOf(Error);
  const serviceError = err as ServiceError;
  if (options?.expectedCode !== undefined) {
    expect(serviceError.code).toBe(options.expectedCode);
  }
  if (options?.messageContains !== undefined) {
    expect(serviceError.message).toContain(options.messageContains);
  }
};
