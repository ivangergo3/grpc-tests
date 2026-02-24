import type { BaseRequestDefaults, BaseRequestFields } from "@services/types";

/**
 * Default base request fields so tests don't repeat context/actor/headers.
 * Override any field when building a request (e.g. requestId, subject, tenant, roles).
 */
export const defaultBaseRequestFields = (
  overrides?: Partial<BaseRequestFields>
): BaseRequestFields => ({
  context: { requestId: "req-1" },
  actor: { subject: "me", tenant: "t1", roles: ["USER"] },
  headers: {},
  ...overrides
});

/**
 * Build base fields with defaults applied and headers always present.
 */
export const buildBaseRequestFields = (
  overrides?: Partial<BaseRequestFields>
): BaseRequestDefaults => {
  const base = defaultBaseRequestFields(overrides);
  return {
    context: base.context ?? { requestId: "req-1" },
    actor: base.actor ?? { subject: "me", tenant: "t1", roles: ["USER"] },
    headers: base.headers ?? {}
  };
};

/**
 * Shallow merge helper for request builders.
 */
export const withDefaults = <T extends Record<string, unknown>>(
  defaults: T,
  overrides?: Partial<T>
): T => ({
  ...defaults,
  ...(overrides ?? {})
});
