import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  // Customer-room scenarios exercise image preparation, WebGL startup, and a
  // full reload. Keep the total budget above the individual readiness timeout
  // so parallel WebKit workers do not fail after the UI is already usable.
  timeout: 120_000,
  fullyParallel: false,
  // Each project verifies and decodes the complete showroom release. Running
  // browser engines concurrently creates artificial memory/decoder pressure
  // that does not exist in the single-display showroom deployment.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "desktop-webkit",
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "showroom-4k",
      use: { ...devices["Desktop Chrome"], viewport: { width: 3840, height: 2160 } },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
