import type { GetUserResponse, SearchUsersResponse } from "@gen/acme/user/v1/user_service";
import { asResponses, verifySuccessContext, type SuccessOneOrMany } from "../baseSuccess";

export type VerifyGetUserSuccessOptions = {
  expectedRequestId?: string;
  expectedUserId?: string;
  expectedEmail?: string;
  expectedIsActive?: boolean;
  expectedRolesContain?: string;
};

export const verifyGetUserSuccess = (
  res: SuccessOneOrMany<GetUserResponse>,
  options?: VerifyGetUserSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedUserId !== undefined) {
      expect(r.user?.userId).toBe(options.expectedUserId);
    }
    if (options?.expectedEmail !== undefined) {
      expect(r.user?.email).toBe(options.expectedEmail);
    }
    if (options?.expectedIsActive !== undefined) {
      expect(r.user?.isActive).toBe(options.expectedIsActive);
    }
    if (options?.expectedRolesContain !== undefined) {
      expect(r.user?.roles).toContain(options.expectedRolesContain);
    }
  });
};

export type VerifySearchUsersSuccessOptions = {
  expectedRequestId?: string;
  expectedMinCount?: number;
  expectedCount?: number;
  expectAllActive?: boolean;
  expectSomeInactive?: boolean;
};

export const verifySearchUsersSuccess = (
  res: SuccessOneOrMany<SearchUsersResponse>,
  options?: VerifySearchUsersSuccessOptions
): void => {
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: options?.expectedRequestId });
    if (options?.expectedMinCount !== undefined) {
      expect(r.users.length).toBeGreaterThanOrEqual(options.expectedMinCount);
    }
    if (options?.expectedCount !== undefined) {
      expect(r.users.length).toBe(options.expectedCount);
    }
    if (options?.expectAllActive === true && r.users.length > 0) {
      expect(r.users.every((u) => u.isActive)).toBe(true);
    }
    if (options?.expectSomeInactive === true) {
      expect(r.users.some((u) => u.isActive === false)).toBe(true);
    }
  });
};
