import { afterAll, beforeAll, describe, it } from "vitest";

import { startLocalStandaloneServices } from "@utils/test/fixtures";
import { verifySendEmailSuccess, verifySendSmsSuccess } from "@services/notification/notificationSuccess";

describe("NotificationService (local)", () => {
  let stop: () => Promise<void>;
  let api: Awaited<ReturnType<typeof startLocalStandaloneServices>>["api"];

  beforeAll(async () => {
    const started = await startLocalStandaloneServices();
    api = started.api;
    stop = started.stop;
  });

  afterAll(async () => {
    await stop();
  });

  it("SendEmail returns SENT", async () => {
    const params = {
      messageId: "m-1",
      to: "user@example.com",
      subject: "Hello",
      body: "World",
      attachments: [],
      headers: {},
      context: { requestId: "n-1" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    };
    const res = await api.notification.sendEmailWithParams(params, { deadlineMs: 2_000 });
    verifySendEmailSuccess(res, { expectedRequestId: "n-1", expectedStatus: "SENT", expectedMessageId: "m-1" });
  });

  it("SendSms returns SENT", async () => {
    const params = {
      messageId: "m-2",
      to: "+372000000",
      text: "Hi",
      headers: {},
      context: { requestId: "n-2" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    };
    const res = await api.notification.sendSmsWithParams(params);
    verifySendSmsSuccess(res, { expectedRequestId: "n-2", expectedStatus: "SENT", expectedMessageId: "m-2" });
  });

  it("SendEmail echoes messageId", async () => {
    const params = {
      messageId: "m-xyz",
      to: "user@example.com",
      subject: "S",
      body: "B",
      attachments: [],
      headers: {},
      context: { requestId: "n-3" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    };
    const res = await api.notification.sendEmailWithParams(params);
    verifySendEmailSuccess(res, { expectedRequestId: "n-3", expectedMessageId: "m-xyz" });
  });

  it("SendEmail echoes request context", async () => {
    const params = {
      messageId: "m-ctx",
      to: "user@example.com",
      subject: "S",
      body: "B",
      attachments: [],
      headers: {},
      context: { requestId: "n-4" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    };
    const res = await api.notification.sendEmailWithParams(params);
    verifySendEmailSuccess(res, { expectedRequestId: "n-4", expectedMessageId: "m-ctx" });
  });

  it("SendEmailStream: send + verify in one step (params + verifier, no conditionals)", async () => {
    const params = {
      messageId: "m-stream",
      to: "user@example.com",
      subject: "Stream",
      body: "Body",
      attachments: [],
      headers: {},
      context: { requestId: "n-stream" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    };
    await api.notification.sendEmailStreamSendAndVerify(
      params,
      { deadlineMs: 2_000 },
      { expectedRequestId: "n-stream", expectedStatus: "SENT", expectedMessageId: "m-stream" }
    );
    // Verifier asserted exact N (from env) and per-response checks (6.1 / 6.2)
  });

  it("SendEmailStream: send then verify with expectedCount from env (6.2 / 6.3)", async () => {
    const params = {
      messageId: "m-n",
      to: "user@example.com",
      subject: "N",
      body: "B",
      attachments: [],
      headers: {},
      context: { requestId: "req-n" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    };
    const { getExpectedResponseCountForRpc } = await import("@services/baseRequest");
    const responses = await api.notification.sendEmailStreamWithParams(params, { deadlineMs: 2_000 });
    verifySendEmailSuccess(responses, {
      expectedCount: getExpectedResponseCountForRpc("NotificationService.SendEmailStream"),
      expectedRequestId: "req-n",
      expectedStatus: "SENT",
      expectedMessageId: "m-n"
    });
    // N = 1 (default), 2 with SYSTEM_B_ENABLED=1, 3 with SYSTEM_B_ENABLED=1 SYSTEM_C_ENABLED=1
  });
});
