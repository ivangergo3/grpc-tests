import type { Page } from "@playwright/test";

import { BasePage } from "./basePage";

export class ExampleDomainPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectLoaded(): Promise<void> {
    await this.waitForDomContentLoaded();
    await this.heading("Example Domain").waitFor();
  }
}
