import { test } from "@utils/fixtures";

test("opens example.com and calls GetUser", async ({ api, exampleDomainPage, log, verify }) => {
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
  await exampleDomainPage.goto("/");
  const res = await api.user.getUserWithParams(params);

  // then
  await exampleDomainPage.expectLoaded();
  verify.user.getUserSuccess(res, { expectedRequestId: requestId });
});
