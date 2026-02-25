import { test as base, expect } from "@playwright/test";

import { loadDotEnvOnce } from "@utils/env";
import {
  build as apiBuild,
  createLocalServices,
  request as apiRequest,
  type services_fixture,
  verify as apiVerify
} from "@utils/fixturesApi";
// TODO: This needs to be fixed by using the @pages alias.
import { ExampleDomainPage } from "../pages";

loadDotEnvOnce();

// Make framework verifiers (which use global expect) work in Playwright.
const g = globalThis as unknown as { expect?: unknown };
if (typeof g.expect !== "function") g.expect = expect;

export type UiApi = services_fixture;
export type UiLog = services_fixture["log"];

export type Pages = {
  exampleDomain: ExampleDomainPage;
};

export type UiBuild = typeof apiBuild;
export type UiRequest = typeof apiRequest;
export type UiVerify = typeof apiVerify;

export const build: UiBuild = apiBuild;
export const request: UiRequest = apiRequest;
export const req: UiRequest = apiRequest;
export const verify: UiVerify = apiVerify;

export const test = base.extend<{
  api: UiApi;
  pages: Pages;
  log: UiLog;
  build: UiBuild;
  req: UiRequest;
  verify: UiVerify;
}>({
  api: async ({ page }, use) => {
    void page;
    const api = createLocalServices();
    try {
      await use(api);
    } finally {
      api.user.close();
      api.payment.close();
      api.shipping.close();
    }
  },
  log: async ({ api }, use) => {
    await use(api.log);
  },
  build: async ({ page }, use) => {
    void page;
    await use(apiBuild);
  },
  req: async ({ page }, use) => {
    void page;
    await use(apiRequest);
  },
  verify: async ({ page }, use) => {
    void page;
    await use(apiVerify);
  },
  pages: async ({ page }, use) => {
    const pages: Pages = {
      exampleDomain: new ExampleDomainPage(page)
    };
    await use(pages);
  }
});

export { expect };
