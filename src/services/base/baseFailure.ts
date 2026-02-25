import type { ServiceError } from "@grpc/grpc-js";
import type { FailureOptions, FailurePromiseContext, FailureSnapshot } from "@services/types";

/**
 * Base failure verification: common checks for failed gRPC calls (thrown errors).
 * Use in test context (expect from Vitest is global).
 */

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
  if (options?.detailsContains !== undefined) {
    expect(serviceError.details).toContain(options.detailsContains);
  }
  if (options?.metadataContains !== undefined) {
    const md = serviceError.metadata;
    Object.entries(options.metadataContains).forEach(([k, v]) => {
      const values = md.get(k);
      expect(values.map(String)).toContain(v);
    });
  }
};

const safeErrorSnapshot = (err: unknown): FailureSnapshot => {
  const e = err as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    metadata?: { getMap?: () => unknown };
  };
  return {
    code: e.code,
    message: e.message,
    details: e.details,
    metadata: e.metadata?.getMap?.(),
  };
};

/**
 * Verify a promise rejects with a gRPC ServiceError.
 * - If it resolves: log the value and fail the test.
 * - If it rejects: log the error snapshot and verify expected fields.
 */
export const verifyFailurePromise = async <T>(
  promise: Promise<T>,
  options?: FailureOptions,
  ctx?: FailurePromiseContext<T>
): Promise<void> => {
  try {
    const value = await promise;
    if (ctx?.onUnexpectedSuccess) ctx.onUnexpectedSuccess(value);
    else console.info(`[${ctx?.label ?? "failure"}] unexpectedly resolved`, value);
    throw new Error("expected call to fail");
  } catch (err) {
    console.info(`[${ctx?.label ?? "failure"}] rejected`, safeErrorSnapshot(err));
    verifyFailure(err, options);
  }
};
