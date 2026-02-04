import { verifyFailure, type FailureOptions } from "../baseFailure";

export const verifyOrderFailure = (err: unknown, options?: FailureOptions): void => {
  verifyFailure(err, options);
};
