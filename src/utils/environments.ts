import type { grpc_tls_env } from "./grpc/credentials";

export type grpc_endpoint_config = Omit<grpc_tls_env, "target" | "insecure"> & {
  /**
   * host:port (e.g. "my-svc.my-ns.svc.cluster.local:443")
   * If undefined, remote tests for that service should be skipped.
   */
  target?: string;
  /**
   * true = plaintext (local/dev only). For prod, use TLS/mTLS (insecure=false).
   */
  insecure?: boolean;
};

export type test_timeouts_config = {
  /** Default unary deadline applied by BaseGrpcService when not overridden per call. */
  grpcDefaultDeadlineMs: number;
  /** Per-test timeout (Vitest). */
  testTimeoutMs: number;
  /** Hook timeout (beforeAll/afterAll) (Vitest). */
  hookTimeoutMs: number;
  /** Global retries for flaky tests (Vitest `retry`). */
  retry: number;
  /**
   * Whole test-run watchdog. If the process is still running after this, we fail hard.
   * Set 0 to disable.
   */
  runTimeoutMs: number;
};

/**
 * Which systems are "online" for multi-response behavior.
 * System A is always on; B and C are off by default and can be enabled via env vars.
 */
export type systems_config = {
  systemA: boolean;
  systemB: boolean;
  systemC: boolean;
};

export type environment_config = {
  name: string;
  timeouts: test_timeouts_config;
  services: {
    user: grpc_endpoint_config;
    order: grpc_endpoint_config;
    inventory: grpc_endpoint_config;
    payment: grpc_endpoint_config;
    shipping: grpc_endpoint_config;
    notification: grpc_endpoint_config;
    audit: grpc_endpoint_config;
  };
};

export const environments = {
  local: {
    name: "local",
    timeouts: {
      grpcDefaultDeadlineMs: 5_000,
      testTimeoutMs: 30_000,
      hookTimeoutMs: 30_000,
      retry: 0,
      runTimeoutMs: 2 * 60_000
    },
    // Local runs use in-process stub servers; these targets are intentionally unset.
    services: {
      user: { target: undefined, insecure: true },
      order: { target: undefined, insecure: true },
      inventory: { target: undefined, insecure: true },
      payment: { target: undefined, insecure: true },
      shipping: { target: undefined, insecure: true },
      notification: { target: undefined, insecure: true },
      audit: { target: undefined, insecure: true }
    }
  },
  dev: {
    name: "dev",
    timeouts: {
      grpcDefaultDeadlineMs: 10_000,
      testTimeoutMs: 60_000,
      hookTimeoutMs: 60_000,
      retry: 0,
      runTimeoutMs: 5 * 60_000
    },
    // Fill these in for your cluster / deployed services.
    services: {
      user: {
        target: "user.my-namespace.svc.cluster.local:443",
        insecure: false,
        caCertPath: "/path/to/ca.crt",
        clientCertPath: "/path/to/client.crt",
        clientKeyPath: "/path/to/client.key"
      },
      order: {
        target: "order.my-namespace.svc.cluster.local:443",
        insecure: false,
        caCertPath: "/path/to/ca.crt"
      },
      inventory: { target: "inventory.my-namespace.svc.cluster.local:443", insecure: false },
      payment: { target: "payment.my-namespace.svc.cluster.local:443", insecure: false },
      shipping: { target: "shipping.my-namespace.svc.cluster.local:443", insecure: false },
      notification: { target: "notification.my-namespace.svc.cluster.local:443", insecure: false },
      audit: { target: "audit.my-namespace.svc.cluster.local:443", insecure: false }
    }
  }
} as const satisfies Record<string, environment_config>;

export type environment_name = keyof typeof environments;

/**
 * Select the environment via env var:
 * - TEST_ENV=local|dev
 *
 * This keeps CI setup minimal (set ONE env var), while keeping the full config in code.
 */
export const getSelectedEnvironmentName = (): environment_name => {
  const raw = (process.env.TEST_ENV ?? "local").toLowerCase().trim();
  if (raw in environments) return raw as environment_name;
  return "local";
};

export const getEnvironment = (): environment_config => environments[getSelectedEnvironmentName()];

/**
 * System flags for multi-response: which systems are online.
 * - System A: always true.
 * - System B: true if SYSTEM_B_ENABLED is "true" or "1".
 * - System C: true if SYSTEM_C_ENABLED is "true" or "1".
 *
 * Single source of truth for the service layer and request/verification layer.
 */
export const getSystems = (): systems_config => {
  const b = process.env.SYSTEM_B_ENABLED === "true" || process.env.SYSTEM_B_ENABLED === "1";
  const c = process.env.SYSTEM_C_ENABLED === "true" || process.env.SYSTEM_C_ENABLED === "1";
  return {
    systemA: true,
    systemB: b,
    systemC: c
  };
};

/**
 * Expected response count (1–3) for multi-response RPCs based on which systems are on.
 * A only → 1; A+B → 2; A+B+C → 3.
 */
export const getExpectedResponseCount = (): number => {
  const { systemB, systemC } = getSystems();
  return 1 + (systemB ? 1 : 0) + (systemC ? 1 : 0);
};

/**
 * Optional base host:port for gRPC targets (from GRPC_BASE_URL).
 * When set, can be used to build service targets (e.g. `${baseUrl}` or service-specific host).
 * Undefined when not set.
 */
export const getGrpcBaseUrl = (): string | undefined => {
  const v = process.env.GRPC_BASE_URL?.trim();
  return v === "" ? undefined : v;
};
