import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function exportedHtml(name) {
  return readFile(new URL(`../out/${name}`, import.meta.url), "utf8");
}

test("exports the production homepage and metadata", async () => {
  const html = await exportedHtml("index.html");

  assert.match(html, /Agila \| AI-central, architecture-led transformation/);
  assert.match(html, /From AI ambition to working systems\./);
  assert.match(html, /AI value depends on the system around it\./);
  assert.match(html, /pre-accredited by Luxinnovation/);
  assert.match(html, /alejandro\.simo@agilaconsult\.com/);
  assert.match(html, /href="#contact"/);
  assert.match(html, /action="\/api\/contact"/);
  assert.match(html, /method="post"/);
  assert.match(html, /id="contact-name"[^>]+autoComplete="name"[^>]+maxLength="100"/);
  assert.match(html, /id="contact-email"[^>]+autoComplete="email"[^>]+maxLength="254"/);
  assert.match(
    html,
    /id="contact-organisation"[^>]+autoComplete="organization"[^>]+maxLength="150"/,
  );
  assert.match(html, /id="contact-message"[^>]+maxLength="4000"/);
  assert.match(html, /id="contact-website"[^>]+tabindex="-1"/);
  assert.match(html, /Please do not include confidential or/);
  assert.match(html, /Read the privacy notice/);
  assert.match(html, /Copy email address/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /outlook\.office\.com/);
  assert.doesNotMatch(html, /alejandro@agilaconsult\.com/);
  assert.match(html, /Assess the current situation/);
  assert.match(html, /Support and improve/);
  assert.match(html, /Capabilities that work as a system/);
  assert.match(html, /agila-capability-system\.webp/);
  assert.match(html, /href="\/capabilities\/"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /Agila Consulting S\.à r\.l\./);
  assert.match(html, /agila-wordmark-black\.svg\?v=20260805/);
  assert.match(html, /agila-wordmark-white\.svg\?v=20260805/);
  assert.doesNotMatch(html, /Transformation architecture|map-pulse|delivery system/i);
  assert.doesNotMatch(html, /Start with the decision|Frame the decision/i);
  assert.doesNotMatch(html, /codex-preview|loading skeleton|placeholder/i);
  assert.doesNotMatch(html, /world-class|revolutionary|cutting-edge/i);
});

test("exports the public interactive capability system", async () => {
  const html = await exportedHtml("capabilities/index.html");

  assert.match(html, /Capabilities that work as a system/);
  assert.match(html, /Interactive capability system/);
  assert.match(html, /All 24 areas/);
  assert.match(html, /Search the capability system/);
  assert.match(html, /AI, data and analytics/);
  assert.match(html, /Business and operating-model transformation/);
  assert.match(html, /Enterprise, solution and integration architecture/);
  assert.match(html, /Industrial operations, IT\/OT and IIoT/);
  assert.match(html, /Digital products and operating systems/);
  assert.match(html, /Governance, delivery and adoption/);
  assert.match(html, /Governed agentic workflows and operating systems/);
  assert.match(html, /Harness engineering/);
  assert.match(html, /UNS, MQTT and industrial connectivity/);
  assert.match(html, /Browse the complete capability list/);
  assert.match(html, /canonical.*\/capabilities\//i);
  assert.doesNotMatch(html, /OpenClaw|FactoVia|RMT Labs|Mayker/);
  assert.doesNotMatch(
    html,
    /evidence_ids|evidence_maturity|publication_class|authority_limit|delivery_modes/,
  );
});

test("public capability data uses only the approved projection", async () => {
  const model = JSON.parse(
    await readFile(
      new URL("../app/capabilities/public-capability-system.json", import.meta.url),
      "utf8",
    ),
  );
  const serialized = JSON.stringify(model);

  assert.deepEqual(model.counts, {
    domains: 6,
    capabilityAreas: 24,
    componentCapabilities: 100,
    curatedBridges: 12,
  });
  assert.doesNotMatch(serialized, /OpenClaw|Codex|Claude|FactoVia|RMT Labs|Mayker/i);
  assert.doesNotMatch(
    serialized,
    /evidence_ids|evidence_maturity|publication_class|authority_limit|delivery_modes/,
  );
});

test("exports the legal and privacy notice", async () => {
  const html = await exportedHtml("legal/index.html");

  assert.match(html, /Legal notice &amp; privacy/);
  assert.match(html, /B295954/);
  assert.match(html, /LU36614487/);
  assert.match(html, /does not use advertising trackers/);
  assert.match(html, /Microsoft Azure/);
  assert.match(html, /Azure Communication Services/);
  assert.match(html, /contact form/);
  assert.match(html, /Pseudonymous abuse-prevention data expires within 24/);
  assert.match(html, /Commission nationale pour la protection des données/);
  assert.match(html, /alejandro\.simo@agilaconsult\.com/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /outlook\.office\.com/);
  assert.doesNotMatch(html, /alejandro@agilaconsult\.com/);
  assert.doesNotMatch(html, /Cloudflare/);
});

test("ships Azure configuration, brand and discovery assets", async () => {
  const [
    configText,
    packageJson,
    apiPackageJson,
    workflow,
    robots,
    sitemap,
    security,
    blackLogo,
    whiteLogo,
  ] =
    await Promise.all([
      readFile(new URL("../out/staticwebapp.config.json", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../api/package.json", import.meta.url), "utf8"),
      readFile(
        new URL("../.github/workflows/verify-deploy.yml", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../out/robots.txt", import.meta.url), "utf8"),
      readFile(new URL("../out/sitemap.xml", import.meta.url), "utf8"),
      readFile(
        new URL("../out/.well-known/security.txt", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../out/agila-wordmark-black.svg", import.meta.url), "utf8"),
      readFile(new URL("../out/agila-wordmark-white.svg", import.meta.url), "utf8"),
    ]);
  const config = JSON.parse(configText);

  assert.equal(config.trailingSlash, "auto");
  assert.match(config.globalHeaders["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(config.globalHeaders["Content-Security-Policy"], /object-src 'none'/);
  assert.doesNotMatch(config.globalHeaders["Content-Security-Policy"], /unsafe-eval/);
  assert.equal(config.platform.apiRuntime, "node:22");
  assert.match(config.globalHeaders["Strict-Transport-Security"], /max-age=31536000/);
  assert.equal(config.globalHeaders["X-Frame-Options"], "DENY");
  assert.doesNotMatch(packageJson, /wrangler|vinext|cloudflare/i);
  assert.match(apiPackageJson, /@azure\/communication-email/);
  assert.match(apiPackageJson, /@azure\/cosmos/);
  assert.match(workflow, /api_location: api/);
  assert.match(workflow, /npm test --prefix api/);
  assert.match(robots, /Allow: \//);
  assert.match(sitemap, /https:\/\/agilaconsult\.com\/legal/);
  assert.match(sitemap, /https:\/\/agilaconsult\.com\/capabilities\//);
  assert.match(security, /Contact: mailto:alejandro\.simo@agilaconsult\.com/);
  assert.doesNotMatch(security, /mailto:alejandro@agilaconsult\.com/);
  assert.match(blackLogo, /AGILA wordmark/);
  assert.match(whiteLogo, /AGILA dark-mode wordmark/);
  await access(new URL("../out/agila-capability-system.webp", import.meta.url));
  await access(new URL("../out/404.html", import.meta.url));
  await assert.rejects(access(new URL("app/_sites-preview", root)));
});
