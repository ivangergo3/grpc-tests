import fs from "node:fs";
import * as grpc from "@grpc/grpc-js";

export type grpc_tls_env = {
  target: string;
  insecure: boolean;
  caCertPath?: string;
  clientCertPath?: string;
  clientKeyPath?: string;
};

export const readGrpcEnv = (): grpc_tls_env => {
  const target = process.env.GRPC_TARGET;
  if (!target) {
    throw new Error("GRPC_TARGET is required (example: my-svc.my-ns.svc.cluster.local:443)");
  }

  return {
    target,
    insecure: (process.env.GRPC_INSECURE ?? "").toLowerCase() === "true",
    caCertPath: process.env.GRPC_CA_CERT_PATH,
    clientCertPath: process.env.GRPC_CLIENT_CERT_PATH,
    clientKeyPath: process.env.GRPC_CLIENT_KEY_PATH
  };
};

export const readGrpcEnvWithPrefix = (prefix: string): grpc_tls_env => {
  const get = (name: string): string | undefined => process.env[`${prefix}_${name}`];

  const target = get("GRPC_TARGET");
  if (!target) {
    throw new Error(
      `${prefix}_GRPC_TARGET is required (example: my-svc.my-ns.svc.cluster.local:443)`
    );
  }

  return {
    target,
    insecure: (get("GRPC_INSECURE") ?? "").toLowerCase() === "true",
    caCertPath: get("GRPC_CA_CERT_PATH"),
    clientCertPath: get("GRPC_CLIENT_CERT_PATH"),
    clientKeyPath: get("GRPC_CLIENT_KEY_PATH")
  };
};

export const createChannelCredentialsFromEnv = (env: grpc_tls_env): grpc.ChannelCredentials => {
  if (env.insecure) return grpc.credentials.createInsecure();

  if (!env.caCertPath) {
    throw new Error("GRPC_CA_CERT_PATH is required unless GRPC_INSECURE=true");
  }

  const rootCert = fs.readFileSync(env.caCertPath);

  const hasMtls =
    Boolean(env.clientCertPath) &&
    Boolean(env.clientKeyPath) &&
    fs.existsSync(env.clientCertPath!) &&
    fs.existsSync(env.clientKeyPath!);

  if (!hasMtls) {
    // TLS (server-auth only)
    return grpc.credentials.createSsl(rootCert);
  }

  // mTLS (server-auth + client-auth)
  const clientCert = fs.readFileSync(env.clientCertPath!);
  const clientKey = fs.readFileSync(env.clientKeyPath!);
  return grpc.credentials.createSsl(rootCert, clientKey, clientCert);
};
