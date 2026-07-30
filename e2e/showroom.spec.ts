import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
});

test("loads the approved showroom composition without customer-facing errors", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { name: "FireDesign" })).toBeVisible();
  await expect(page.getByText("864 TRV · Kentucky Ledge · Pearl Linear 60″")).toBeVisible();
  await expect(page.getByText("The presentation could not start safely.")).toHaveCount(0);
});

test("adjusts and persists physical dimensions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  const wallWidth = page.getByLabel("Wall width");
  await wallWidth.fill("168");
  await expect(page.getByText("Wall 168″")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await expect(wallWidth).toHaveValue("168");
});

test("switches view, opens diagnostics, and resets safely", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  await page.getByRole("button", { name: "Perspective" }).click();
  await expect(page.getByRole("button", { name: "Perspective" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("Shift+D");
  await expect(page.getByRole("heading", { name: "System diagnostics" })).toBeVisible();
  await page.getByRole("button", { name: "Return to design" }).click();
  await page.getByRole("button", { name: "Reset design" }).click();
  await expect(page.getByLabel("Wall width")).toHaveValue("144");
});

test("enters a clean presentation surface and returns to controls", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  await page.getByRole("button", { name: /Present design/ }).click();
  await expect(page.getByRole("button", { name: "Exit presentation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "FireDesign" })).toHaveCount(0);
  await page.getByRole("button", { name: "Exit presentation" }).click();
  await expect(page.getByRole("heading", { name: "FireDesign" })).toBeVisible();
});

test("preloads the complete release and reloads offline", async ({
  browserName,
  context,
  page,
}, testInfo) => {
  test.skip(
    browserName !== "chromium" || testInfo.project.name !== "desktop-chromium",
    "Offline cache gate is verified once in desktop Chromium.",
  );
  await page.keyboard.press("Shift+D");
  await expect(page.getByText("5 / 5 verified")).toBeVisible();
  await expect(page.getByText("Ready", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Return to design" }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await context.setOffline(false);
});

test("shows a polished startup recovery state when an approved asset is unavailable", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  });
  await page.route("**/assets/manifest.json", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "The presentation could not start safely.",
    }),
  ).toBeVisible();
  await page.unroute("**/assets/manifest.json");
  await page.getByRole("button", { name: "Run checks again" }).click();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
});
