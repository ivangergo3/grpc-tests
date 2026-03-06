import type {
  StreamSuccess,
  SuccessContextOptions,
  VerifyStreamSuccessOptions
} from "@services/types";
import { expect } from "@playwright/test";

/**
 * Normalizes one or many responses to an array so the same verifier works for
 * single (unary), streaming (N items), or aggregated (one object with N logical responses).
 */
export const asResponses = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

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

export const verifyStreamSuccess = <T>(
  value: StreamSuccess<T>,
  options?: VerifyStreamSuccessOptions<T>
): void => {
  expect(Array.isArray(value.events)).toBe(true);
  expect(value.eventCount).toBe(value.events.length);

  if (value.events.length === 0) {
    expect(value.lastEvent).toBeUndefined();
  } else {
    // Cast to avoid Playwright's Locator-specialized expect overload in generic code.
    expect(value.lastEvent as unknown).toEqual(value.events[value.events.length - 1]);
  }

  if (options?.expectedLastEvent !== undefined) {
    expect(value.lastEvent as unknown).toEqual(options.expectedLastEvent);
  }
  if (options?.expectedEvents !== undefined) {
    expect(value.events).toEqual(options.expectedEvents);
  }
  if (options?.verifyAllEvents !== undefined) {
    options.verifyAllEvents(value.events);
  }
  if (options?.verifyEvent !== undefined) {
    value.events.forEach((e, idx) => options.verifyEvent?.(e, idx, value.events));
  }

  if (options?.expectedMinCount !== undefined) {
    expect(value.events.length).toBeGreaterThanOrEqual(options.expectedMinCount);
  }
  if (options?.expectedCount !== undefined) {
    expect(value.events.length).toBe(options.expectedCount);
  }
};
