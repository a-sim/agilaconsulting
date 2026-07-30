# Cloudflare deployment and domain runbook

## Target architecture

- Source of truth: `a-sim/agilaconsulting`
- Production branch: protected `main`
- Runtime: Cloudflare Worker with static assets
- Canonical domain: `https://agilaconsult.com`
- Redirect: `https://www.agilaconsult.com/*` to the matching apex path
- Mail: Microsoft 365 remains the mail provider
- Registrar: remains unchanged unless Alejandro separately chooses to transfer
  it

## Current domain state recorded on 30 July 2026

- Registrar: Wild West Domains, LLC, through a Microsoft/GoDaddy reseller flow
- Registration expiry: 22 May 2027
- Authoritative DNS: `ns1-4.bdm.microsoftonline.com`
- DNSSEC: not currently signed
- Microsoft 365 MX, SPF, Autodiscover, device registration/enrolment and Teams
  service records are active
- No apex or `www` website record currently exists

The registrar, DNS host and Microsoft 365 mail service are separate roles.
Moving authoritative DNS to Cloudflare does not require moving the registration
or email subscription.

## 1. Deploy the Worker before moving DNS

1. In Cloudflare, select the account that already hosts the wedding site.
2. Create a narrowly scoped API token for Worker deployment. Scope it to the
   relevant account and, where available, the `agilaconsult.com` zone.
3. In GitHub, create a `production` environment for the repository.
4. Add these environment secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. Optionally add the repository variable `PRODUCTION_URL` after the custom
   domain is live. The workflow will then perform a post-deploy HTTP check.
6. Add the repository variable `CLOUDFLARE_DEPLOY_ENABLED` with the exact value
   `true` only after both secrets are configured.
7. Merge the validated site into `main` and confirm the Worker deployment on its
   `workers.dev` URL.

The deploy job stays intentionally disabled until the enablement variable is
set. Once enabled, it fails closed when either Cloudflare credential is missing.
OpenClaw never needs either credential.

## 2. Inventory Microsoft DNS before any nameserver change

In Microsoft 365 Admin, open **Settings > Domains > agilaconsult.com > DNS
records** and export or record every authoritative entry. Do not rely only on
Cloudflare's automatic scan because it may miss records.

At minimum reconcile all active records for:

- Exchange Online MX
- SPF and Microsoft verification TXT
- Autodiscover
- Intune/Entra device registration and enrolment
- Teams or Skype SRV records
- DKIM selectors, if enabled
- DMARC, if enabled
- any additional Microsoft or third-party service records shown by the tenant

Keep mail and Microsoft-service records **DNS only** in Cloudflare. Never proxy
MX, TXT or SRV records, and do not enable Cloudflare Email Routing because it
would compete with the Microsoft 365 MX configuration.

## 3. Add the zone to Cloudflare

1. Add `agilaconsult.com` to the Cloudflare account.
2. Let Cloudflare scan the existing zone.
3. Compare the result line by line with the Microsoft 365 Admin inventory.
4. Create every missing record and correct TTLs, priorities and target values.
5. Do not change nameservers until the inventory is complete and independently
   checked.

There is no current DNSSEC DS record to disable. Recheck this immediately before
cutover in case the domain state has changed.

## 4. Change authoritative nameservers

Replace Microsoft's four authoritative nameservers with the two nameservers
assigned by Cloudflare. Because the registration came through a Microsoft
reseller flow, the nameserver control may appear in Microsoft 365 Admin rather
than a normal GoDaddy screen. If it is unavailable, ask Microsoft 365 support to
enable or perform the nameserver change. A registrar transfer is not required.

Wait until Cloudflare reports the zone as active, then verify:

- the two Cloudflare authoritative nameservers;
- Microsoft MX and SPF results;
- Autodiscover;
- device-registration and Teams records;
- Microsoft 365 Admin domain health;
- inbound mail from an external account;
- outbound mail and reply delivery;
- Outlook autodiscovery on an existing and a fresh client.

Do not enable DNSSEC until the zone and email checks are stable.

## 5. Attach the web domains

1. In Cloudflare Workers, add `agilaconsult.com` as a Custom Domain for the
   `agila-website` Worker. Cloudflare creates the proxied web record and edge
   certificate.
2. Create the proxied `www` placeholder record required for redirect handling.
3. Add a Cloudflare Single Redirect from `www.agilaconsult.com/*` to
   `https://agilaconsult.com/$1` with permanent status.
4. Enable **Always Use HTTPS**.
5. Confirm that both HTTP hosts settle on one HTTPS apex URL without loops.

For this Worker-as-origin architecture, Cloudflare terminates the public TLS
connection and manages the certificate. `Full (strict)` matters primarily when
Cloudflare connects to a separate HTTPS origin; keep it enabled as the safe zone
default if other proxied origins are added.

## 6. Stabilise, then harden

After website and Microsoft 365 checks remain healthy:

1. Enable Cloudflare DNSSEC.
2. Add the supplied DS record at the registrar if Cloudflare does not automate
   the step.
3. Recheck DNSSEC validation and Microsoft 365 domain health.
4. Review whether DKIM and DMARC are enabled. Treat mail hardening as a separate
   controlled change; do not improvise records during the nameserver cutover.
5. Confirm HSTS behaviour on the apex and `www` before considering preload.
6. Disable the obsolete GitHub Pages deployment at
   `a-sim.github.io/agilaconsulting` or redirect it after Cloudflare production
   is confirmed.

## 7. Production verification

Verify after every material release:

- apex returns HTTP 200 over HTTPS;
- `www` permanently redirects to the same apex path;
- canonical and Open Graph URLs use the apex;
- `/legal`, `/robots.txt`, `/sitemap.xml` and
  `/.well-known/security.txt` resolve;
- no development or placeholder metadata is present;
- security headers are present;
- email and Microsoft 365 domain health remain unchanged.

## Rollback

If the Worker release fails, Cloudflare can roll back to the previous Worker
version without changing DNS. If the nameserver cutover disrupts Microsoft 365
and the missing record cannot be corrected promptly, restore the previous
Microsoft nameservers recorded before cutover. Never guess at replacement mail
records during an incident.
