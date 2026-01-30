import { describe, expect, it } from "vitest";
import { createRemoteServicesFromEnv } from "@utils/fixtures";
import { getEnvironment } from "@utils/environments";

const hasTarget = Boolean(getEnvironment().services.user.target);

describe.skipIf(!hasTarget)("UserService (remote cluster)", () => {
  it("can connect and call GetUser (example)", async () => {
    const { user } = createRemoteServicesFromEnv();

    // In real life, assert something stable (e.g. a known test user, or a health-ish API).
    // This example just shows the wiring.
    const res = await user.getUser({
      userId: "123",
      context: { requestId: "remote-1" },
      includeFields: [],
      headers: {}
    });

    expect(res).toBeDefined();
  });
});
