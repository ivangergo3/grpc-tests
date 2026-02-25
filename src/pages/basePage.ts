import type { Locator, Page } from "@playwright/test";

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  protected heading(name: string): Locator {
    return this.page.getByRole("heading", { name });
  }

  async goto(pathname: string): Promise<void> {
    await this.page.goto(pathname);
  }

  async waitForDomContentLoaded(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }
}

