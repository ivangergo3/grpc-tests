import { verifyFailure, type FailureOptions } from "../baseFailure";

export const verifyInventoryFailure = (err: unknown, options?: FailureOptions): void => {
  verifyFailure(err, options);
};
