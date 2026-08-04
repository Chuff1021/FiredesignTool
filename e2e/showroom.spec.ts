import { expect, test } from "@playwright/test";
import path from "node:path";
import sharp from "sharp";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // A clean CI worker verifies all packaged media before first render. Under the
  // full parallel browser matrix this can take longer than a cached showroom
  // launch, so keep the assertion tied to readiness without a brittle 20s cap.
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 60_000 });
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
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-media-status",
    "playing",
    { timeout: 15_000 },
  );
});

test("plays official media behind every approved FPX face", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "showroom-4k", "Covered at desktop scale.");
  const viewport = page.locator(".scene-viewport");
  await page.getByLabel("Fireplace model").selectOption("864-trv-31k-deluxe");
  for (const face of [
    "classic-arch",
    "arched-french-country",
    "metropolitan",
    "rectangle-double-door",
  ]) {
    await page.getByLabel("Face or trim").selectOption(face);
    await expect(page.getByLabel("Face or trim")).toHaveValue(face);
  }
  await expect(viewport).toHaveAttribute("data-media-status", "playing", {
    timeout: 15_000,
  });
  await page.getByLabel("Fireplace model").selectOption("4237-ember-glo-clean-face");
  await expect(viewport).toHaveAttribute("data-media-status", "playing", {
    timeout: 15_000,
  });

  for (const product of ["564-trv-25k-deluxe", "564-tv-35k-deluxe"]) {
    await page.getByLabel("Fireplace model").selectOption(product);
    await expect(viewport).toHaveAttribute("data-media-status", "playing", {
      timeout: 15_000,
    });
    for (const face of [
      "classic-arch",
      "french-country",
      "metropolitan",
      "rectangle-double-door",
    ]) {
      await page.getByLabel("Face or trim").selectOption(face);
      await expect(page.getByLabel("Face or trim")).toHaveValue(face);
    }
    await expect(viewport).toHaveAttribute("data-media-status", "playing", {
      timeout: 15_000,
    });
  }

  for (const product of ["564-trv-25k-clean-face", "564-tv-35k-clean-face"]) {
    await page.getByLabel("Fireplace model").selectOption(product);
    await expect(page.getByLabel("Face or trim")).toHaveValue("clean-face");
    await expect(viewport).toHaveAttribute("data-media-status", "playing", {
      timeout: 15_000,
    });
  }
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

  await page.getByLabel("Fireplace model").selectOption("564-tv-35k-deluxe");
  await page.getByLabel("Face or trim").selectOption("french-country");
  await expect(
    page.getByText(
      "564 35K Designer Face · French Country · Black · Brown Ledge · Onyx Linear 84″",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(/published combustible reference 37½″ from fireplace base · manual p\.42/),
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
  await expect(
    page.locator(".diagnostic-row").filter({ hasText: "Customer project storage" }),
  ).toContainText(/available|Capacity unavailable/);
  await expect(
    page.locator(".diagnostic-row").filter({ hasText: "Storage protection" }),
  ).toContainText(/Persistent|Browser-managed|Unknown/);
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
  await expect(page.getByText("101 / 101 verified")).toBeVisible();
  await expect(page.getByText("Playing · H.264 · muted")).toBeVisible();
  await expect(page.getByText("Ready", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Return to design" }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-media-status",
    "playing",
    { timeout: 15_000 },
  );
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

test("calibrates and persists a customer room concept", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "showroom-4k",
    "Customer project flow is covered at desktop scale.",
  );
  await page.getByRole("button", { name: /Customer room/ }).click();
  await page
    .getByTestId("room-photo-input")
    .setInputFiles(path.join(process.cwd(), "assets-source/centurion-kentucky-ledge.jpg"));
  const canvas = page.getByTestId("room-canvas");
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const click = async (x: number, y: number) => {
    await canvas.click({ position: { x: box.width * x, y: box.height * y } });
  };
  await click(0.12, 0.08);
  await click(0.88, 0.08);
  await click(0.88, 0.92);
  await click(0.12, 0.92);
  await page.getByLabel("Known measurement in inches").fill("144");
  await click(0.12, 0.75);
  await click(0.88, 0.75);
  await expect(page.getByText("Dimensionally scaled")).toBeVisible();
  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF" }).click();
  await expect((await pdfDownload).suggestedFilename()).toMatch(/firedesign\.pdf$/);
  await page
    .getByLabel("Remodel scenario")
    .getByRole("button", { name: "Insert only" })
    .click();
  await expect(page.getByRole("button", { name: "Insert only" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByText(/Fit screening is unavailable for 864 TRV/)).toBeVisible();
  await expect(page.getByText(/not an insert fit recommendation/)).toBeVisible();
  await expect(page.locator(".room-status")).toContainText(
    "Mark the existing fireplace opening",
  );
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeDisabled();
  await page.getByLabel("Existing opening width in inches").fill("40");
  await page.getByLabel("Existing opening height in inches").fill("30");
  await page.getByLabel("Existing opening depth in inches").fill("16.5");
  await page.getByLabel("Existing opening rear width in inches").fill("24");
  await click(0.36, 0.38);
  await click(0.64, 0.38);
  await click(0.64, 0.72);
  await click(0.36, 0.72);
  await expect(page.getByText("Dimensionally scaled")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeEnabled();
  await expect(page.getByText(/40 × 30 in face · 24 in rear · 16.5 in deep/)).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Customer room/ }).click();
  await expect(page.getByTestId("room-canvas")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Dimensionally scaled")).toBeVisible();
  await expect(page.getByLabel("Existing opening width in inches")).toHaveValue("40");
  await expect(page.getByLabel("Existing opening depth in inches")).toHaveValue("16.5");
  await expect(page.getByLabel("Existing opening rear width in inches")).toHaveValue("24");
});

test("preserves a true 4K customer photograph", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "showroom-4k",
    "The 4K image pipeline is covered in both desktop browser engines.",
  );
  const photograph = await sharp({
    create: {
      width: 3840,
      height: 2160,
      channels: 3,
      background: { r: 190, g: 181, b: 169 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
  await page.getByRole("button", { name: /Customer room/ }).click();
  await page.getByTestId("room-photo-input").setInputFiles({
    name: "customer-room-4k.jpg",
    mimeType: "image/jpeg",
    buffer: photograph,
  });
  const canvas = page.getByTestId("room-canvas");
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(() =>
      canvas.evaluate((element) => ({
        width: (element as HTMLCanvasElement).width,
        height: (element as HTMLCanvasElement).height,
      })),
    )
    .toEqual({ width: 3840, height: 2160 });
});

test("adds measured built-ins independently and persists them", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "showroom-4k",
    "Architectural accessory controls are covered in both desktop browser engines.",
  );
  const photograph = await sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 3,
      background: { r: 206, g: 198, b: 184 },
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();
  await page.getByRole("button", { name: /Customer room/ }).click();
  await page.getByTestId("room-photo-input").setInputFiles({
    name: "built-in-room.jpg",
    mimeType: "image/jpeg",
    buffer: photograph,
  });
  const canvas = page.getByTestId("room-canvas");
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const click = async (x: number, y: number) => {
    await canvas.click({ position: { x: box.width * x, y: box.height * y } });
  };
  await click(0.06, 0.05);
  await click(0.94, 0.05);
  await click(0.94, 0.94);
  await click(0.06, 0.94);
  await page.getByLabel("Known measurement in inches").fill("180");
  await click(0.06, 0.75);
  await click(0.94, 0.75);
  await expect(page.getByText("Dimensionally scaled")).toBeVisible();
  await page.getByText("Built-ins & shelves").click();
  await page.getByLabel("Left side").check();
  await page.getByLabel("Left width").fill("42");
  await page.getByLabel("Left accessory finish").selectOption("white-oak");
  await page.getByRole("button", { name: "Match right side to left" }).click();
  await page.getByLabel("Add raised hearth").evaluate((element: HTMLInputElement) => {
    element.click();
  });
  await expect(page.getByLabel("Right side")).toBeChecked();
  await expect(page.getByLabel("Right width")).toHaveValue("42");
  await expect(page.getByLabel("Add raised hearth")).toBeChecked();
  await expect(page.getByLabel("Fireplace elevation")).toHaveValue("12");
  await expect(page.locator(".room-rendering")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Customer room/ }).click();
  await page.getByText("Built-ins & shelves").click();
  await expect(page.getByLabel("Left side")).toBeChecked();
  await expect(page.getByLabel("Right side")).toBeChecked();
  await expect(page.getByLabel("Left accessory finish")).toHaveValue("white-oak");
  await expect(page.getByLabel("Add raised hearth")).toBeChecked();
});

test("calibrates hearth depth and preserves a reversible cleaned room photo", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "showroom-4k",
    "Customer photo editing is covered at desktop scale.",
  );
  const original = await sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 3,
      background: { r: 206, g: 198, b: 184 },
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();
  const cleaned = await sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 3,
      background: { r: 152, g: 169, b: 179 },
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();
  await page.getByRole("button", { name: /Customer room/ }).click();
  await page.getByTestId("room-photo-input").setInputFiles({
    name: "original-room.jpg",
    mimeType: "image/jpeg",
    buffer: original,
  });
  const canvas = page.getByTestId("room-canvas");
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const click = async (x: number, y: number) => {
    await canvas.click({ position: { x: box.width * x, y: box.height * y } });
  };
  await click(0.08, 0.08);
  await click(0.92, 0.08);
  await click(0.92, 0.9);
  await click(0.08, 0.9);
  await page.getByLabel("Known measurement in inches").fill("144");
  await click(0.08, 0.72);
  await click(0.92, 0.72);
  await expect(page.getByText("Dimensionally scaled")).toBeVisible();
  await page.getByLabel("Add raised hearth").evaluate((element: HTMLInputElement) => {
    element.click();
  });
  await page.getByRole("button", { name: "Set hearth perspective" }).click();
  await click(0.5, 0.87);
  await expect(page.getByRole("button", { name: "Adjust hearth perspective" })).toBeVisible();

  await page.getByTestId("room-cleaned-photo-input").setInputFiles({
    name: "cleaned-room.jpg",
    mimeType: "image/jpeg",
    buffer: cleaned,
  });
  await expect(page.getByText("Cleaned background active")).toBeVisible();
  await expect(page.locator(".room-rendering")).toHaveCount(0);
  const cleanedCorner = await canvas.evaluate((element) =>
    Array.from(
      (element as HTMLCanvasElement).getContext("2d")!.getImageData(10, 10, 1, 1).data,
    ).slice(0, 3),
  );
  expect(cleanedCorner[2]).toBeGreaterThan(cleanedCorner[0]!);

  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Customer room/ }).click();
  await expect(page.getByText("Cleaned background active")).toBeVisible();
  await expect(page.getByRole("button", { name: "Adjust hearth perspective" })).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Room cleanup", { exact: true })).toBeVisible();
});

test("restores and persists a traced foreground object", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "showroom-4k",
    "Foreground compositing is covered in both desktop browser engines.",
  );
  const photograph = await sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 3,
      background: { r: 190, g: 181, b: 169 },
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();
  await page.getByRole("button", { name: /Customer room/ }).click();
  await page.getByTestId("room-photo-input").setInputFiles({
    name: "foreground-room.jpg",
    mimeType: "image/jpeg",
    buffer: photograph,
  });
  const canvas = page.getByTestId("room-canvas");
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  const originalCenter = await canvas.evaluate((element) => {
    const roomCanvas = element as HTMLCanvasElement;
    return Array.from(
      roomCanvas
        .getContext("2d")!
        .getImageData(roomCanvas.width / 2, roomCanvas.height / 2, 1, 1).data,
    );
  });
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const click = async (x: number, y: number) => {
    await canvas.click({ position: { x: box.width * x, y: box.height * y } });
  };
  await click(0.1, 0.1);
  await click(0.9, 0.1);
  await click(0.9, 0.9);
  await click(0.1, 0.9);
  await page.getByLabel("Known measurement in inches").fill("144");
  await click(0.1, 0.75);
  await click(0.9, 0.75);
  await expect(page.getByText("Dimensionally scaled")).toBeVisible();
  await page.getByRole("button", { name: "Trace foreground" }).click();
  await click(0.42, 0.42);
  await click(0.58, 0.42);
  await click(0.58, 0.58);
  await click(0.42, 0.58);
  await page.getByRole("button", { name: "Finish foreground" }).click();
  await expect(page.getByRole("button", { name: "Clear foreground (1)" })).toBeVisible();
  await expect(page.locator(".room-rendering")).toHaveCount(0);
  const restoredCenter = await canvas.evaluate((element) => {
    const roomCanvas = element as HTMLCanvasElement;
    return Array.from(
      roomCanvas
        .getContext("2d")!
        .getImageData(roomCanvas.width / 2, roomCanvas.height / 2, 1, 1).data,
    );
  });
  expect(restoredCenter).toEqual(originalCenter);
  const imageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const exportedImagePath = await (await imageDownload).path();
  expect(exportedImagePath).not.toBeNull();
  if (!exportedImagePath) return;
  const exportedImage = await sharp(exportedImagePath)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const centerOffset =
    (Math.floor(exportedImage.info.height / 2) * exportedImage.info.width +
      Math.floor(exportedImage.info.width / 2)) *
    exportedImage.info.channels;
  const exportedCenter = Array.from(
    exportedImage.data.subarray(centerOffset, centerOffset + 3),
  );
  exportedCenter.forEach((channel, index) => {
    expect(Math.abs(channel - originalCenter[index]!)).toBeLessThanOrEqual(5);
  });
  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Customer room/ }).click();
  await expect(page.getByRole("button", { name: "Clear foreground (1)" })).toBeVisible();
});

test("keeps multiple named customer projects and returns without deleting", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "showroom-4k",
    "Customer project library is covered at desktop scale.",
  );
  const photo = path.join(process.cwd(), "assets-source/centurion-kentucky-ledge.jpg");
  await page.getByRole("button", { name: /Customer room/ }).click();
  await page.getByTestId("room-photo-input").setInputFiles(photo);
  await expect(page.getByTestId("room-canvas")).toBeVisible({ timeout: 15_000 });
  const firstName = page.getByLabel("Project name");
  await firstName.fill("Smith living room");
  await firstName.blur();
  await page.getByLabel("Centurion stone").selectOption("brown-ledge");
  await expect(page.getByLabel("Centurion stone")).toHaveValue("brown-ledge");
  await page.getByRole("button", { name: "Back to projects" }).click();
  await expect(page.getByRole("button", { name: "Open Smith living room" })).toBeVisible();
  await expect(page.getByText("Project backup recommended")).toBeVisible();

  await page.getByRole("button", { name: "New customer project" }).click();
  await page.getByTestId("room-photo-input").setInputFiles(photo);
  await expect(page.getByTestId("room-canvas")).toBeVisible({ timeout: 15_000 });
  const secondName = page.getByLabel("Project name");
  await secondName.fill("Jones fireplace");
  await secondName.blur();
  await page.getByLabel("Centurion stone").selectOption("kentucky-ledge");
  await expect(page.getByLabel("Centurion stone")).toHaveValue("kentucky-ledge");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.getByText("2 projects")).toBeVisible();

  await page.getByRole("button", { name: "Delete Jones fireplace" }).click();
  await page.getByRole("button", { name: "Confirm delete Jones fireplace" }).click();
  await expect(page.getByText("1 project")).toBeVisible();
  await page.getByRole("button", { name: "Open Smith living room" }).click();
  await expect(page.getByTestId("room-canvas")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel("Project name")).toHaveValue("Smith living room");
  await expect(page.getByLabel("Centurion stone")).toHaveValue("brown-ledge");
  await page.getByTestId("room-photo-input").setInputFiles(photo);
  await expect(page.getByLabel("Project name")).toHaveValue("Smith living room");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.getByText("1 project")).toBeVisible();

  const backupDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Back up projects" }).click();
  const backupPath = await (await backupDownload).path();
  expect(backupPath).not.toBeNull();
  if (!backupPath) return;
  await expect(page.getByText(/Backed up 1 project/)).toBeVisible();
  await expect(page.getByText("Project backup is current")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("scene-canvas")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Customer room/ }).click();
  await expect(page.getByText("Project backup is current")).toBeVisible();
  await page.getByTestId("room-backup-input").setInputFiles(backupPath);
  await expect(page.getByText(/Restored 1 project/)).toBeVisible();
  await expect(page.getByText(/existing project was preserved/)).toBeVisible();
  await expect(page.getByText("2 projects")).toBeVisible();
  await expect(page.getByText("Projects changed since the last backup")).toBeVisible();
  await page.getByRole("button", { name: "Open Smith living room (restored)" }).click();
  await expect(page.getByLabel("Project name")).toHaveValue("Smith living room (restored)");
  await expect(page.getByLabel("Centurion stone")).toHaveValue("brown-ledge");
});
