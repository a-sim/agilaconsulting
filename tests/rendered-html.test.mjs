import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(path, "https://agilaconsult.com"), {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the production homepage and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(
    response.headers.get("content-security-policy") ?? "",
    /frame-ancestors 'none'/,
  );
  assert.match(
    response.headers.get("strict-transport-security") ?? "",
    /max-age=31536000/,
  );

  const html = await response.text();
  assert.match(html, /Agila \| AI-central, architecture-led transformation/);
  assert.match(html, /From AI ambition to working systems\./);
  assert.match(html, /AI value depends on the system around it\./);
  assert.match(html, /pre-accredited by Luxinnovation/);
  assert.match(html, /alejandro\.simo@agilaconsult\.com/);
  assert.match(html, /mailto:alejandro\.simo%40agilaconsult\.com|mailto:alejandro\.simo@agilaconsult\.com/);
  assert.match(html, /Assess the current situation/);
  assert.match(html, /Support and improve/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /Agila Consulting S\.à r\.l\./);
  assert.doesNotMatch(html, /Transformation architecture|map-pulse|delivery system/i);
  assert.doesNotMatch(html, /Start with the decision|Frame the decision/i);
  assert.doesNotMatch(html, /codex-preview|loading skeleton|placeholder/i);
  assert.doesNotMatch(html, /world-class|revolutionary|cutting-edge/i);
});

test("server-renders the legal and privacy notice", async () => {
  const response = await render("/legal");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Legal notice &amp; privacy/);
  assert.match(html, /B295954/);
  assert.match(html, /LU36614487/);
  assert.match(html, /does not use advertising trackers/);
  assert.match(html, /Commission nationale pour la protection des données/);
});

test("ships final brand and discovery assets without the starter preview", async () => {
  const [packageJson, robots, sitemap, blackLogo, whiteLogo] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../public/robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
    readFile(new URL("../public/agila-wordmark-black.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/agila-wordmark-white.svg", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(robots, /Allow: \//);
  assert.match(sitemap, /https:\/\/agilaconsult\.com\/legal/);
  assert.match(blackLogo, /AGILA wordmark/);
  assert.match(whiteLogo, /AGILA dark-mode wordmark/);
  await assert.rejects(access(new URL("app/_sites-preview", root)));
});
