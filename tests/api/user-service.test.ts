import { test } from "@utils/fixtures";
import { status } from "@grpc/grpc-js";

test.describe("UserService", () => {
  test("responds to GetUser", async ({ api, verify }) => {
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
    verify.user.getUserSuccess(res, { expectedUserId: "123", expectedRequestId: "req-1" });
  });

  test("responds to SearchUsers", async ({ api, verify }) => {
    // given
    const params = {
      query: "jane",
      context: { requestId: "req-1b" }
    };

    // when
    const res = await api.user.searchUsersWithParams(params);

    // then
    verify.user.searchUsersSuccess(res, { expectedRequestId: "req-1b" });
  });

  test("SearchUsers can return inactive users when activeOnly=false", async ({ api, verify }) => {
    // given
    const params = {
      activeOnly: false,
      context: { requestId: "req-1c" }
    };

    // when
    const res = await api.user.searchUsersWithParams(params);

    // then
    verify.user.searchUsersSuccess(res, {
      expectedRequestId: "req-1c",
      expectedCount: 2,
      expectAllActive: false,
      expectSomeInactive: true
    });
  });

  test("SearchUsersStream aggregates users into a SearchUsersResponse", async ({ api, verify }) => {
    // given
    const params = {
      query: "jane",
      context: { requestId: "req-stream-1" }
    };

    // when
    const res = await api.user.searchUsersStreamWithParams(params);

    // then
    verify.user.searchUsersStreamSuccess(res, { expectedRequestId: "req-stream-1" });
  });

  test("GetUser returns INVALID_ARGUMENT for fail-* ids", async ({ api, verify }) => {
    // given
    const params = {
      userId: "fail-user",
      context: { requestId: "req-fail-1" }
    };

    // when/then
    await verify.user.failurePromise(
      api.user.getUserWithParams(params),
      {
        expectedCode: status.INVALID_ARGUMENT,
        messageContains: "invalid user_id"
      },
      { label: "user.getUser" }
    );
  });

  test("SearchUsers returns INVALID_ARGUMENT for fail-* query", async ({ api, verify }) => {
    // given
    const params = {
      query: "fail-query",
      context: { requestId: "req-fail-2" }
    };

    // when/then
    await verify.user.failurePromise(
      api.user.searchUsersWithParams(params),
      {
        expectedCode: status.INVALID_ARGUMENT,
        messageContains: "invalid query"
      },
      { label: "user.searchUsers" }
    );
  });

  test("SearchUsersStream returns INVALID_ARGUMENT for fail-* query", async ({ api, verify }) => {
    // given
    const params = {
      query: "fail-stream",
      context: { requestId: "req-fail-3" }
    };

    // when/then
    await verify.user.failurePromise(
      api.user.searchUsersStreamWithParams(params),
      {
        expectedCode: status.INVALID_ARGUMENT,
        messageContains: "invalid query"
      },
      { label: "user.searchUsersStream" }
    );
  });
});
