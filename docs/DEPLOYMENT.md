# Azure Static Web Apps deployment and domain runbook

## Target architecture

- Source of truth: `a-sim/agilaconsulting`
- Production branch: protected `main`
- Runtime: static Next.js export on Azure Static Web Apps
- Canonical domain: `https://agilaconsult.com`
- Alternate domain: `https://www.agilaconsult.com`, redirected by Azure to
  the canonical apex domain
- Mail and identity services: Microsoft 365
- Registrar and authoritative DNS: Microsoft 365, unchanged

The site has no database, API, analytics, cookies or form backend. Static export
removes the need for a continuously running application server.

## Domain state recorded on 30 July 2026

- Registrar: Wild West Domains, LLC, through Microsoft's reseller flow
- Registration expiry: 22 May 2027
- Authoritative DNS: `ns1-4.bdm.microsoftonline.com`
- Microsoft 365 MX, SPF, Autodiscover, device registration/enrolment and Teams
  records are active
- The private CRM uses `crm`, `*.crm` and `_acme-challenge.crm` records
- DNSSEC is not currently signed

No nameserver or registrar change is required for this architecture.

## 1. Create the Azure Static Web App

1. In the Agila Azure tenant, create a **Static Web App**.
2. Use the existing `Azure subscription 1` subscription.
3. Create or reuse a dedicated resource group for the public website.
4. Select the Free hosting plan unless production requirements later justify
   the Standard plan.
5. Use a nearby Azure region for the deployment API and globally distributed
   static content.
6. Configure deployment through the GitHub `production` environment using the
   `AZURE_STATIC_WEB_APPS_API_TOKEN` secret.
7. Set the repository variable `AZURE_STATIC_WEB_APPS_DEPLOY_ENABLED` to `true`
   only after the token is stored.

The GitHub workflow builds the static export, validates it, and uploads the
contents of `out/` to Azure after a successful push to `main`.

## 2. Validate Azure before changing website DNS

Confirm the generated Azure hostname serves:

- `/`
- `/legal`
- `/robots.txt`
- `/sitemap.xml`
- `/.well-known/security.txt`, if present

Check the generated site for correct metadata, security headers, local fonts
and brand assets. Do not add custom-domain records before the generated hostname
passes these checks.

## 3. Add the apex domain without moving DNS

Azure Static Web Apps supports an apex domain through an `A` record when the
DNS host does not support `ALIAS`, `ANAME` or CNAME flattening.

1. In Azure, open the Static Web App's JSON view and copy its
   `stableInboundIP` value.
2. Open **Custom domains**, add `agilaconsult.com`, choose TXT validation and
   generate the validation value.
3. In Microsoft 365 Admin, open **Settings > Domains > agilaconsult.com > DNS
   records > Add record**.
4. Add the Azure validation TXT record exactly as displayed.
5. After Azure validates ownership, add an apex `A` record whose value is the
   `stableInboundIP`.
6. Return to Azure and wait until the domain status is validated and its
   managed certificate is ready.

Do not edit or replace the existing Microsoft MX, SPF, verification, CNAME or
SRV records. Do not edit the CRM records.

## 4. Add `www` and make the apex canonical

1. In Azure Custom domains, add `www.agilaconsult.com`.
2. Create the Azure-provided validation record in Microsoft DNS if requested.
3. Add a Microsoft DNS CNAME for `www` pointing to the generated Azure Static
   Web Apps hostname.
4. Wait for Azure to validate the domain and issue its managed certificate.
5. In Azure Custom domains, select `agilaconsult.com` and choose **Set default**.

Azure then redirects requests for `www` and its generated hostname to the HTTPS
apex domain while preserving the request path.

## 5. Production verification

Verify after the domain is active:

- apex returns HTTP 200 over HTTPS;
- `www` permanently redirects to the matching apex path;
- the Azure-generated hostname redirects to the apex;
- `/legal`, `/robots.txt`, `/sitemap.xml` and the 404 page resolve;
- canonical and Open Graph URLs use `https://agilaconsult.com`;
- CSP, HSTS, Referrer Policy, Permissions Policy, X-Content-Type-Options and
  frame protections are present;
- Microsoft MX, SPF, Autodiscover, device registration and Teams records are
  unchanged;
- `crm.agilaconsult.com`, the CRM wildcard and ACME validation still resolve;
- Microsoft 365 reports the domain as healthy.

## 6. Retire the unused Cloudflare setup

Only after Azure and both custom domains are stable:

1. Disable Cloudflare deployment for the GitHub repository.
2. Remove the pending `agilaconsult.com` zone from Cloudflare if it is no longer
   needed.
3. Keep the old Worker temporarily only as a rollback reference, then delete it
   after the agreed stabilisation period.
4. Close the Microsoft nameserver support request because the delegation change
   is no longer required.

Removing a pending Cloudflare zone or Worker does not change Microsoft DNS.

## Rollback

If an Azure release fails before DNS changes, no rollback is required because
the production domain is unaffected. If a release fails after the domain is
connected, redeploy the last known-good commit through GitHub Actions. If the
Azure service itself is unavailable, remove only the new apex `A`, Azure
validation and `www` records while preserving every Microsoft 365 and CRM
record.
