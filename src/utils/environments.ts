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
