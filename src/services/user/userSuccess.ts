import type { GetUserResponse, SearchUsersResponse } from "@gen/acme/user/v1/user_service";
import { expect } from "vitest";
import type {
  SuccessOneOrMany,
  VerifyGetUserSuccessOptions,
  VerifySearchUsersStreamSuccessOptions,
  VerifySearchUsersSuccessOptions
} from "@services/types";
import { asResponses, verifySuccessContext } from "@services/base";

export const verifyGetUserSuccess = (
  res: SuccessOneOrMany<GetUserResponse>,
  options?: VerifyGetUserSuccessOptions
): void => {
  const o: VerifyGetUserSuccessOptions = {
    expectedEmail: "user@example.com",
    expectedIsActive: true,
    expectedRolesContain: "USER",
    ...options
  };
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: o.expectedRequestId });
    expect(r.user).toBeDefined();
    if (o.expectedUserId !== undefined) {
      expect(r.user?.userId).toBe(o.expectedUserId);
    }
    if (o.expectedEmail !== undefined) {
      expect(r.user?.email).toBe(o.expectedEmail);
    }
    if (o.expectedIsActive !== undefined) {
      expect(r.user?.isActive).toBe(o.expectedIsActive);
    }
    if (o.expectedRolesContain !== undefined) {
      expect(r.user?.roles).toContain(o.expectedRolesContain);
    }
  });
};

export const verifySearchUsersSuccess = (
  res: SuccessOneOrMany<SearchUsersResponse>,
  options?: VerifySearchUsersSuccessOptions
): void => {
  const o: VerifySearchUsersSuccessOptions = {
    expectedMinCount: 1,
    expectAllActive: true,
    ...options
  };
  asResponses(res).forEach((r) => {
    verifySuccessContext(r.context, { expectedRequestId: o.expectedRequestId });
    if (o.expectedMinCount !== undefined) {
      expect(r.users.length).toBeGreaterThanOrEqual(o.expectedMinCount);
    }
    if (o.expectedCount !== undefined) {
      expect(r.users.length).toBe(o.expectedCount);
    }
    if (o.expectAllActive === true && r.users.length > 0) {
      expect(r.users.every((u) => u.isActive)).toBe(true);
    }
    if (o.expectSomeInactive === true) {
      expect(r.users.some((u) => u.isActive === false)).toBe(true);
    }
  });
};

export const verifySearchUsersStreamSuccess = (
  res: SearchUsersResponse,
  options?: VerifySearchUsersStreamSuccessOptions
): void => {
  verifySearchUsersSuccess(res, options);
};
