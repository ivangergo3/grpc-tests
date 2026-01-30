import type { Logger } from "../logger";

declare global {
  // Global test logger provided by src/utils/test/vitest.setup.ts
  // Use `var` for global declarations so runtime assignment works.
  var log: Logger;

  // Guard flag so we don't register process handlers multiple times (watch mode, etc).
  var __vitestGlobalHandlersInstalled: boolean | undefined;
}

export {};
