import { verifyFailure, type FailureOptions } from "../baseFailure";

export const verifyNotificationFailure = (err: unknown, options?: FailureOptions): void => {
  verifyFailure(err, options);
};
