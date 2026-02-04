import { verifyFailure, type FailureOptions } from "../baseFailure";

export const verifyUserFailure = (err: unknown, options?: FailureOptions): void => {
  verifyFailure(err, options);
};
