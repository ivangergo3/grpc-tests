import { verifyFailure, type FailureOptions } from "../baseFailure";

export const verifyAuditFailure = (err: unknown, options?: FailureOptions): void => {
  verifyFailure(err, options);
};
