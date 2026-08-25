import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("presents the Fit 4 AI opportunity journey and working routes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/fit4ai/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Is AI worth it?" }),
  ).toBeVisible();
  await expect(
    page.getByText("A single assessment can examine multiple candidate use cases"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "From an opportunity landscape to clear recommendations.",
    }),
  ).toBeVisible();

  const primaryCta = page
    .getByRole("link", { name: /Explore your AI opportunity landscape/ })
    .first();
  await expect(primaryCta).toHaveAttribute("href", "/#contact");

  const officialLink = page
    .getByRole("link", { name: /Official Fit 4 AI programme/ })
    .first();
  await expect(officialLink).toHaveAttribute(
    "href",
    "https://luxinnovation.lu/assess-and-accelerate/fit4ai",
  );
  await expect(officialLink).toHaveAttribute("target", "_blank");

  expect(errors).toEqual([]);
});

test("keeps the Fit 4 AI page accessible and contained on mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/fit4ai/");

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
    scrollBehaviour: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.scrollBehaviour).toBe("auto");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(blocking).toEqual([]);
});
