import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("keeps the capability system inside the homepage capability section", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#capabilities");
  const headerLogo = page.locator("header").getByRole("img", { name: "AGILA" });
  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveAttribute(
    "src",
    "/agila-wordmark-black.svg?v=20260805",
  );
  expect(
    await headerLogo.evaluate((image: HTMLImageElement) =>
      Boolean(image.complete && image.naturalWidth > 0),
    ),
  ).toBe(true);

  const footerLogo = page.locator("footer").getByRole("img", { name: "AGILA" });
  await footerLogo.scrollIntoViewIfNeeded();
  await expect(footerLogo).toBeVisible();
  await expect(footerLogo).toHaveAttribute(
    "src",
    "/agila-wordmark-white.svg?v=20260805",
  );
  await expect
    .poll(() =>
      footerLogo.evaluate((image: HTMLImageElement) =>
        Boolean(image.complete && image.naturalWidth > 0),
      ),
    )
    .toBe(true);

  await expect(
    section.getByRole("heading", { name: "Capabilities that work as a system." }),
  ).toBeVisible();
  await expect(section.locator("article")).toHaveCount(6);

  const visual = section.getByRole("img", {
    name: /Agila at the centre of a connected system/,
  });
  await expect(visual).toBeVisible();
  const [sectionBox, visualBox] = await Promise.all([
    section.boundingBox(),
    visual.boundingBox(),
  ]);
  expect(sectionBox).not.toBeNull();
  expect(visualBox).not.toBeNull();
  const sectionCentre = sectionBox!.x + sectionBox!.width / 2;
  const visualCentre = visualBox!.x + visualBox!.width / 2;
  expect(Math.abs(sectionCentre - visualCentre)).toBeLessThanOrEqual(2);

  const capabilitiesLink = page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Capabilities" });
  await expect(capabilitiesLink).toHaveAttribute("href", "/capabilities/");
  await expect(
    section.getByRole("link", { name: /Explore the capability system/ }),
  ).toHaveAttribute("href", "/capabilities/");
});

test("explores domains, areas, components and search without browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/capabilities/");
  await expect(page.getByRole("heading", { name: "Capabilities that work as a system." })).toBeVisible();
  await expect(page.getByText("Interactive map ready")).toBeVisible();

  await page.getByRole("button", { name: "01 AI, data and analytics" }).click();
  await expect(page).toHaveURL(/#domain=data-ai$/);
  await expect(page.getByRole("heading", { name: "AI, data and analytics" })).toBeVisible();

  await page
    .getByRole("button", { name: /Governed agentic workflows and operating systems/ })
    .click();
  await expect(page).toHaveURL(/#area=agentic-systems$/);
  await expect(page.getByRole("button", { name: /Harness engineering/ })).toBeVisible();
  await page.getByRole("button", { name: /Harness engineering/ }).click();
  await expect(page).toHaveURL(/#capability=agentic-systems-harness-engineering$/);
  await expect(page.getByText("Component capability", { exact: true })).toBeVisible();

  const search = page.getByLabel("Search the capability system");
  await search.fill("MQTT");
  await page
    .getByRole("button", {
      name: "UNS, MQTT and industrial connectivity Industrial operations, IT/OT and IIoT",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/#area=industrial-connectivity$/);
  await expect(
    page.getByRole("heading", { name: "UNS, MQTT and industrial connectivity" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "All 24 areas" }).click();
  await expect(page).toHaveURL(/#all-capability-areas$/);
  expect(errors).toEqual([]);
});

test("renders the interactive map without a separate graph runtime", async ({
  page,
}) => {
  const graphRuntimeRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().toLowerCase().includes("cytoscape")) {
      graphRuntimeRequests.push(request.url());
    }
  });
  await page.goto("/capabilities/");

  await expect(page.getByText("Interactive map ready")).toBeVisible();
  const canvas = page.locator('canvas[data-renderer="native-canvas"]');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect
    .poll(() =>
      canvas.evaluate((element: HTMLCanvasElement) => {
        const context = element.getContext("2d");
        if (!context || element.width === 0 || element.height === 0) return false;
        const pixels = context.getImageData(
          0,
          0,
          element.width,
          element.height,
        ).data;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] > 0) return true;
        }
        return false;
      }),
    )
    .toBe(true);
  expect(graphRuntimeRequests).toEqual([]);

  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  const initialScale = Math.max(
    0.2,
    Math.min((canvasBox!.width - 150) / 390, (canvasBox!.height - 150) / 450),
  );
  await canvas.click({
    position: {
      x: canvasBox!.width / 2,
      y: canvasBox!.height / 2 - 225 * initialScale,
    },
  });
  await expect(page).toHaveURL(/#domain=data-ai$/);
  await expect(
    page.getByRole("heading", { name: "AI, data and analytics" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Browse the complete capability list." }),
  ).toBeVisible();
});

test("keyboard navigation and reduced motion preserve the same interaction", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/capabilities/");
  await expect(page.getByText("Interactive map ready")).toBeVisible();

  const architecture = page.getByRole("button", {
    name: "03 Enterprise, solution and integration architecture",
  });
  await architecture.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#domain=architecture$/);
  await expect(
    page.getByRole("heading", {
      name: "Enterprise, solution and integration architecture",
    }),
  ).toBeVisible();
});

test("mobile layout avoids page overflow and keeps touch exploration usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/capabilities/");
  await expect(page.getByText("Interactive map ready")).toBeVisible();
  await page
    .getByRole("button", { name: "04 Industrial operations, IT/OT and IIoT" })
    .click();
  await expect(page.getByRole("heading", { name: /Industrial operations/ })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  const firstIndex = page.locator("#capability-index details").first();
  await firstIndex.scrollIntoViewIfNeeded();
  await firstIndex.locator("summary").click();
  await expect(firstIndex.getByText("Decision-first opportunity discovery")).toBeVisible();
});

test("the page has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/capabilities/");
  await expect(page.getByText("Interactive map ready")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(blocking).toEqual([]);
});

test("the complete capability index remains available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/capabilities/");
  await expect(
    page.getByRole("heading", { name: "Browse the complete capability list." }),
  ).toBeVisible();
  await expect(page.getByText("AI, data and analytics", { exact: true })).toBeVisible();
  await expect(page.getByText("Governance, delivery and adoption", { exact: true })).toBeVisible();
  await expect(page.locator('img[src="/agila-capability-system.webp"]')).toBeVisible();
  await context.close();
});
