import { verifyFailure, type FailureOptions } from "../baseFailure";

export const verifyPaymentFailure = (err: unknown, options?: FailureOptions): void => {
  verifyFailure(err, options);
};
