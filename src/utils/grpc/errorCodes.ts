/**
 * gRPC and application error code table: code → human-readable name and description.
 * Used in failure reporting (Allure, logs) so "error 4" shows as "DEADLINE_EXCEEDED" and a short description.
 */

export type ErrorCodeInfo = {
  name: string;
  description: string;
};

/**
 * Standard gRPC status codes (0–16) with names and short descriptions.
 * See https://grpc.io/docs/guides/status-codes/
 */
export const GRPC_ERROR_TABLE: Record<number, ErrorCodeInfo> = {
  0: { name: "OK", description: "Success (not an error)" },
  1: { name: "CANCELLED", description: "The operation was cancelled, typically by the caller" },
  2: { name: "UNKNOWN", description: "Unknown error" },
  3: { name: "INVALID_ARGUMENT", description: "Client specified an invalid argument" },
  4: { name: "DEADLINE_EXCEEDED", description: "Deadline expired before the operation could complete" },
  5: { name: "NOT_FOUND", description: "Some requested entity was not found" },
  6: { name: "ALREADY_EXISTS", description: "The entity that a client tried to create already exists" },
  7: { name: "PERMISSION_DENIED", description: "Caller does not have permission to execute the operation" },
  8: { name: "RESOURCE_EXHAUSTED", description: "Some resource has been exhausted (e.g. rate limit)" },
  9: { name: "FAILED_PRECONDITION", description: "Operation was rejected because the system is not in a required state" },
  10: { name: "ABORTED", description: "The operation was aborted" },
  11: { name: "OUT_OF_RANGE", description: "Operation was attempted past the valid range" },
  12: { name: "UNIMPLEMENTED", description: "Operation is not implemented or not supported" },
  13: { name: "INTERNAL", description: "Internal server error" },
  14: { name: "UNAVAILABLE", description: "The service is currently unavailable" },
  15: { name: "DATA_LOSS", description: "Unrecoverable data loss or corruption" },
  16: { name: "UNAUTHENTICATED", description: "The request does not have valid authentication credentials" }
};

/**
 * Application-specific error codes (optional). Add entries for your service’s custom codes.
 * Keys are numeric codes; values are name and description for reports/logs.
 */
export const CUSTOM_ERROR_TABLE: Record<number, ErrorCodeInfo> = {
  // Example: 1001: { name: "INSUFFICIENT_STOCK", description: "Not enough inventory for the requested SKUs" },
};

/**
 * Returns human-readable name and description for a gRPC or application error code.
 * Standard gRPC codes (0–16) use GRPC_ERROR_TABLE; custom codes use CUSTOM_ERROR_TABLE.
 * Unknown codes return a generic entry so reports still show something useful.
 */
export const getErrorCodeInfo = (code: number): ErrorCodeInfo => {
  if (Object.hasOwn(CUSTOM_ERROR_TABLE, code)) return CUSTOM_ERROR_TABLE[code];
  if (Object.hasOwn(GRPC_ERROR_TABLE, code)) return GRPC_ERROR_TABLE[code];
  return {
    name: "UNKNOWN_CODE",
    description: `Unknown gRPC or application code: ${code}`
  };
};
