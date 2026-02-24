import { describe, it } from "vitest";
import { createLocalServices } from "@utils/fixtures";
import { status } from "@grpc/grpc-js";
import { verifyFailurePromise } from "@services/base";
import {
  verifyGetUserSuccess,
  verifySearchUsersStreamSuccess,
  verifySearchUsersSuccess,
} from "@services/user";

describe("UserService", () => {
  const api = createLocalServices();

  it("responds to GetUser", async () => {
    // given
    const params = {
      userId: "123",
      includeFields: ["profile", "roles"],
      headers: { "x-correlation-id": "corr-1" },
      context: { requestId: "req-1" }
    };

    // when
    const res = await api.user.getUserWithParams(params);

    // then
    verifyGetUserSuccess(res, { expectedUserId: "123", expectedRequestId: "req-1" });
  });

  it("responds to SearchUsers", async () => {
    // given
    const params = {
      query: "jane",
      context: { requestId: "req-1b" }
    };

    // when
    const res = await api.user.searchUsersWithParams(params);

    // then
    verifySearchUsersSuccess(res, { expectedRequestId: "req-1b" });
  });

  it("SearchUsers can return inactive users when activeOnly=false", async () => {
    // given
    const params = {
      activeOnly: false,
      context: { requestId: "req-1c" }
    };

    // when
    const res = await api.user.searchUsersWithParams(params);

    // then
    verifySearchUsersSuccess(res, {
      expectedRequestId: "req-1c",
      expectedCount: 2,
      expectAllActive: false,
      expectSomeInactive: true
    });
  });

  it("SearchUsersStream aggregates users into a SearchUsersResponse", async () => {
    // given
    const params = {
      query: "jane",
      context: { requestId: "req-stream-1" }
    };

    // when
    const res = await api.user.searchUsersStreamWithParams(params);

    // then
    verifySearchUsersStreamSuccess(res, { expectedRequestId: "req-stream-1" });
  });

  it("GetUser returns INVALID_ARGUMENT for fail-* ids", async () => {
    // given
    const params = {
      userId: "fail-user",
      context: { requestId: "req-fail-1" }
    };

    // when/then
    await verifyFailurePromise(api.user.getUserWithParams(params), {
      expectedCode: status.INVALID_ARGUMENT,
      messageContains: "invalid user_id"
    }, { label: "user.getUser" });
  });

  it("SearchUsers returns INVALID_ARGUMENT for fail-* query", async () => {
    // given
    const params = {
      query: "fail-query",
      context: { requestId: "req-fail-2" }
    };

    // when/then
    await verifyFailurePromise(api.user.searchUsersWithParams(params), {
      expectedCode: status.INVALID_ARGUMENT,
      messageContains: "invalid query"
    }, { label: "user.searchUsers" });
  });

  it("SearchUsersStream returns INVALID_ARGUMENT for fail-* query", async () => {
    // given
    const params = {
      query: "fail-stream",
      context: { requestId: "req-fail-3" }
    };

    // when/then
    await verifyFailurePromise(api.user.searchUsersStreamWithParams(params), {
      expectedCode: status.INVALID_ARGUMENT,
      messageContains: "invalid query"
    }, { label: "user.searchUsersStream" });
  });
});
