import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startLocalStandaloneServices } from "@utils/test/fixtures";

describe("UserService (local example server)", () => {
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

  it("responds to GetUser", async () => {
    const res = await api.user.getUser({
      userId: "123",
      context: { requestId: "req-1" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      includeFields: ["profile", "roles"],
      headers: { "x-correlation-id": "corr-1" }
    });

    expect(res.user?.userId).toBe("123");
    expect(res.user?.email).toBe("user@example.com");
    expect(res.user?.isActive).toBe(true);
    expect(res.user?.roles).toContain("USER");
  });

  it("responds to SearchUsers", async () => {
    const res = await api.user.searchUsers({
      query: "jane",
      activeOnly: true,
      page: { pageSize: 10, pageToken: "" },
      context: { requestId: "req-1b" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });

    expect(res.users.length).toBeGreaterThan(0);
    expect(res.users[0].isActive).toBe(true);
  });

  it("SearchUsers can return inactive users when activeOnly=false", async () => {
    const res = await api.user.searchUsers({
      query: "",
      activeOnly: false,
      page: { pageSize: 10, pageToken: "" },
      context: { requestId: "req-1c" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] },
      headers: {}
    });

    expect(res.users.length).toBe(2);
    expect(res.users.some((u) => u.isActive === false)).toBe(true);
  });
});
