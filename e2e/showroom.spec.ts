import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
});

test("loads the approved showroom composition without customer-facing errors", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { name: "FireDesign" })).toBeVisible();
  await expect(
    page.getByText(
      "864 Clean Face · Clean Face · Kentucky Ledge · Graywash Zachary Smooth 72″",
    ),
  ).toBeVisible();
  await expect(page.getByText("The presentation could not start safely.")).toHaveCount(0);
});

test("adjusts and persists physical dimensions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  const wallWidth = page.getByLabel("Wall width");
  const stoneWidth = page.getByLabel("Stone width");
  await wallWidth.fill("168");
  await stoneWidth.fill("108");
  await expect(page.getByText("Wall 168″")).toBeVisible();
  await expect(page.getByText("Stone 108″")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await expect(wallWidth).toHaveValue("168");
  await expect(stoneWidth).toHaveValue("108");
});

test("switches official fireplaces, faces, stone, and mantel options", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  await page.getByLabel("Fireplace model").selectOption("4237-ember-glo-clean-face");
  await expect(
    page.getByRole("heading", { name: "4237 Ember-Glo Clean Face Deluxe" }),
  ).toBeVisible();
  await expect(page.getByLabel("Mantel height")).toHaveValue("45.75");
  await page.getByLabel("Centurion stone").selectOption("brown-ledge");
  await page.getByLabel("Mantel style").selectOption("linear");
  await page.getByRole("button", { name: "84″" }).click();
  await page.getByLabel("Mantel finish").selectOption("onyx");
  await expect(
    page.getByText("4237 Clean Face · Clean Face · Brown Ledge · Onyx Linear 84″"),
  ).toBeVisible();

  await page.getByLabel("Fireplace model").selectOption("864-trv-31k-deluxe");
  await page.getByLabel("Face or trim").selectOption("metropolitan");
  await expect(
    page.getByText("864 Designer Face · Metropolitan · Black · Brown Ledge · Onyx Linear 84″"),
  ).toBeVisible();
});

test("matches the raised Centurion hearth to the selected stone width", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  await page.getByLabel("Stone width").fill("50");
  await page.getByLabel("Add raised hearth").evaluate((element: HTMLInputElement) => {
    element.click();
  });
  await expect(page.getByLabel("Add raised hearth")).toBeChecked();
  await expect(page.getByLabel("Fireplace elevation")).toHaveValue("12");
  await expect(
    page.getByText("Centurion #860 hearthstones match the 50″ stone field"),
  ).toBeVisible();
  await expect(page.getByText("Kentucky Hearthstone · 50″")).toBeVisible();
  await expect(page.getByText("3 pieces · centered end cuts as needed")).toBeVisible();
});

test("offers larger Pearl non-combustible profiles with unrestricted placement", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  await page.getByLabel("Mantel style").selectOption("tavern");
  await expect(page.getByText("ASTM E136 non-combustible · 8″ high × 8″ deep")).toBeVisible();
  await page.getByLabel("Mantel finish").selectOption("tavern-toasted-rye");
  await page.getByLabel("Mantel height").fill("20");
  await expect(page.getByLabel("Mantel height")).toHaveValue("20");
  await page.getByLabel("Mantel style").selectOption("natural-cut-stone");
  await expect(page.getByRole("button", { name: "84″" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByText(
      "864 Clean Face · Clean Face · Kentucky Ledge · Greystone Natural Cut Stone 84″",
    ),
  ).toBeVisible();
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
  await expect(page.getByText("62 / 62 verified")).toBeVisible();
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
