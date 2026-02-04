import { expect } from "vitest";

/**
 * Base success verification: common checks for successful gRPC responses.
 * Verifiers accept either a single response or an array (streaming/aggregated).
 */
export type SuccessContextOptions = {
  expectedRequestId?: string;
};

/**
 * Options for asserting exact response count (3.4). Pass expectedCount from
 * getExpectedResponseCountForRpc(rpc) when verifying multi-response RPCs.
 */
export type ExpectedCountOptions = {
  expectedCount?: number;
};

/**
 * Normalizes one or many responses to an array so the same verifier works for
 * single (unary), streaming (N items), or aggregated (one object with N logical responses).
 */
export const asResponses = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

export type SuccessOneOrMany<T> = T | T[];

/**
 * Asserts we got exactly N responses (3.4). Call before per-response checks when
 * expectedCount is set (e.g. from getExpectedResponseCountForRpc(rpc)).
 */
export const verifyResponseCount = (responses: unknown[], expectedCount: number): void => {
  expect(responses.length).toBe(expectedCount);
};

/**
 * Asserts response has context; optionally checks requestId.
 */
export const verifySuccessContext = (
  context: { requestId?: string } | undefined,
  options?: SuccessContextOptions
): void => {
  expect(context).toBeDefined();
  if (options?.expectedRequestId !== undefined) {
    expect(context?.requestId).toBe(options.expectedRequestId);
  }
};
