# TODO

## Playwright UI tests (extension to Vitest)

- [x] Add Playwright scaffolding (config, fixtures, 1 demo test)
  - [x] `playwright/playwright.config.ts` (TypeScript config)
  - [x] `playwright/fixtures.ts` (init browser `page` + gRPC API clients)
  - [x] `playwright/tests/ui-and-grpc.spec.ts` (open `example.com`, assert, then do 1 unary gRPC call)
  - [x] Add scripts to run separately:
    - [x] `bun run test:api` (Vitest)
    - [x] `bun run test:ui` (Playwright)
    - [x] `bun run test:ui:install` (install Playwright Chromium + headless shell)
- [ ] (Optional) Reuse `src/services/*` service layer directly in Playwright tests (resolve `@services/*` + `@utils/*` path aliases at runtime)

## CI (later)

- [ ] Run Playwright in CI (separate step/job from Vitest)
- [ ] Store Playwright artifacts (screenshots/videos/traces) as workflow artifacts

## Allure (later)

- [ ] Add Allure reporting for Playwright runs
- [ ] Decide on (and implement) an approach to merge Vitest + Playwright Allure results
  - [ ] Option: write both into the same `allure-results/` and generate once
  - [ ] Option: generate separate reports and link them from CI comment

