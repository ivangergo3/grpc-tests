import { verifyFailure, type FailureOptions } from "../baseFailure";

export const verifyShippingFailure = (err: unknown, options?: FailureOptions): void => {
  verifyFailure(err, options);
};
