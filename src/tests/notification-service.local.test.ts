import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startLocalStandaloneServices } from "@utils/test/fixtures";

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
    const res = await api.notification.sendEmail(
      {
        messageId: "m-1",
        to: "user@example.com",
        subject: "Hello",
        body: "World",
        attachments: [],
        headers: {},
        context: { requestId: "n-1" },
        actor: { subject: "me", tenant: "t1", roles: ["USER"] }
      },
      { deadlineMs: 2_000 }
    );
    expect(res.status).toBe("SENT");
    expect(res.messageId).toBe("m-1");
  });

  it("SendSms returns SENT", async () => {
    const res = await api.notification.sendSms({
      messageId: "m-2",
      to: "+372000000",
      text: "Hi",
      headers: {},
      context: { requestId: "n-2" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    });
    expect(res.status).toBe("SENT");
    expect(res.messageId).toBe("m-2");
  });

  it("SendEmail echoes messageId", async () => {
    const res = await api.notification.sendEmail({
      messageId: "m-xyz",
      to: "user@example.com",
      subject: "S",
      body: "B",
      attachments: [],
      headers: {},
      context: { requestId: "n-3" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    });
    expect(res.messageId).toBe("m-xyz");
  });

  it("SendEmail echoes request context", async () => {
    const res = await api.notification.sendEmail({
      messageId: "m-ctx",
      to: "user@example.com",
      subject: "S",
      body: "B",
      attachments: [],
      headers: {},
      context: { requestId: "n-4" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    });
    expect(res.context?.requestId).toBe("n-4");
  });
});
