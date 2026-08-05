import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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

  await page.getByRole("button", { name: "01 AI, data & analytics" }).click();
  await expect(page).toHaveURL(/#domain=data-ai$/);
  await expect(page.getByRole("heading", { name: "Data, analytics and AI" })).toBeVisible();

  await page
    .getByRole("button", { name: /Governed agentic workflows and operating systems/ })
    .click();
  await expect(page).toHaveURL(/#area=agentic-systems$/);
  await expect(page.getByRole("button", { name: /Harness engineering/ })).toBeVisible();
  await page.getByRole("button", { name: /Harness engineering/ }).click();
  await expect(page).toHaveURL(/#capability=agentic-systems-harness-engineering$/);
  await expect(page.getByText("Component capability", { exact: true })).toBeVisible();

  const search = page.getByLabel("Search the public capability system");
  await search.fill("MQTT");
  await page
    .getByRole("button", {
      name: "UNS, MQTT and industrial connectivity Industrial anchor",
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

test("keyboard navigation and reduced motion preserve the same interaction", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/capabilities/");
  await expect(page.getByText("Interactive map ready")).toBeVisible();

  const architecture = page.getByRole("button", { name: "03 Architecture spine" });
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
  await page.getByRole("button", { name: "04 Industrial anchor" }).click();
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
  await expect(page.getByRole("heading", { name: "The complete public capability index." })).toBeVisible();
  await expect(page.getByText("Data, analytics and AI", { exact: true })).toBeVisible();
  await expect(page.getByText("Governance, delivery and adoption", { exact: true })).toBeVisible();
  await context.close();
});
