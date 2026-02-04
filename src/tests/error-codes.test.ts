import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getErrorCodeInfo, GRPC_ERROR_TABLE, CUSTOM_ERROR_TABLE } from "@utils/grpc/errorCodes";
import { startLocalStandaloneServices } from "@utils/test/fixtures";
import { buildSendEmailRequest } from "@services/notification/notificationRequest";

describe("Error code table and getErrorCodeInfo", () => {
  it("returns OK for code 0", () => {
    const info = getErrorCodeInfo(0);
    expect(info.name).toBe("OK");
    expect(info.description).toContain("Success");
  });

  it("returns DEADLINE_EXCEEDED for code 4", () => {
    const info = getErrorCodeInfo(4);
    expect(info.name).toBe("DEADLINE_EXCEEDED");
    expect(info.description).toContain("Deadline");
  });

  it("returns FAILED_PRECONDITION for code 9", () => {
    const info = getErrorCodeInfo(9);
    expect(info.name).toBe("FAILED_PRECONDITION");
    expect(info.description).toContain("rejected");
  });

  it("returns UNAVAILABLE for code 14", () => {
    const info = getErrorCodeInfo(14);
    expect(info.name).toBe("UNAVAILABLE");
    expect(info.description).toContain("unavailable");
  });

  it("returns UNKNOWN_CODE for unknown numeric code", () => {
    const info = getErrorCodeInfo(999);
    expect(info.name).toBe("UNKNOWN_CODE");
    expect(info.description).toContain("999");
  });

  it("GRPC_ERROR_TABLE contains all standard gRPC codes 0–16", () => {
    for (let code = 0; code <= 16; code++) {
      expect(GRPC_ERROR_TABLE[code]).toBeDefined();
      expect(GRPC_ERROR_TABLE[code].name).toBeTruthy();
      expect(GRPC_ERROR_TABLE[code].description).toBeTruthy();
    }
  });

  it("getErrorCodeInfo returns same name as GRPC_ERROR_TABLE for each standard code", () => {
    for (let code = 0; code <= 16; code++) {
      const fromTable = GRPC_ERROR_TABLE[code];
      const fromFn = getErrorCodeInfo(code);
      expect(fromFn.name).toBe(fromTable.name);
      expect(fromFn.description).toBe(fromTable.description);
    }
  });
});

describe.skip("Error code table with real gRPC error (integration)", () => {
  let stop: () => Promise<void>;
  let api: Awaited<ReturnType<typeof startLocalStandaloneServices>>["api"];

  beforeAll(async () => {
    const started = await startLocalStandaloneServices();
    api = started.api;
    stop = started.stop;
  });

  afterAll(async () => {
    if (stop) await stop();
  });

  it("stub returns DEADLINE_EXCEEDED for messageId force-error-code-4; getErrorCodeInfo gives human-readable name", async () => {
    const req = buildSendEmailRequest({
      messageId: "force-error-code-4",
      to: "u@example.com",
      subject: "x",
      body: "y",
      headers: {},
      context: { requestId: "req-err" },
      actor: { subject: "me", tenant: "t1", roles: ["USER"] }
    });
    const raw = await api.notification.sendEmail(req).catch((e: unknown) => e);
    expect(raw).toBeInstanceOf(Error);
    const err = raw as { code: number; message: string };
    expect(err.code).toBe(4);
    expect(err.message).toMatch(/deadline|DEADLINE_EXCEEDED/i);
    const codeInfo = getErrorCodeInfo(err.code);
    expect(codeInfo.name).toBe("DEADLINE_EXCEEDED");
    expect(codeInfo.description).toContain("Deadline");
  });
});

describe("CUSTOM_ERROR_TABLE (extensibility)", () => {
  it("CUSTOM_ERROR_TABLE is defined and can be extended", () => {
    expect(CUSTOM_ERROR_TABLE).toBeDefined();
    expect(typeof CUSTOM_ERROR_TABLE).toBe("object");
    // When no custom codes are added, getErrorCodeInfo(1001) falls back to UNKNOWN_CODE
    const info = getErrorCodeInfo(1001);
    expect(info.name).toBe("UNKNOWN_CODE");
    expect(info.description).toContain("1001");
  });
});
