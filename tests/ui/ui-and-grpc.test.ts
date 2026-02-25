import { test } from "@utils/fixturesUi";

test("opens example.com and calls GetUser", async ({ api, pages, log, verify }) => {
  // given
  const requestId = `ui-${Date.now()}`;
  const params = {
    userId: "user-1",
    context: { requestId },
    includeFields: [],
    headers: {}
  };

  // when
  log.info("ui test calling GetUser", { requestId });
  await pages.exampleDomain.goto("/");
  const res = await api.user.getUserWithParams(params);

  // then
  await pages.exampleDomain.expectLoaded();
  verify.user.getUserSuccess(res, { expectedRequestId: requestId });
});
