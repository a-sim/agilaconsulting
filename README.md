# Agila website

Production website for [Agila](https://agilaconsult.com), operated by Agila
Consulting S.à r.l.

The site presents Agila as an AI-central, architecture-led transformation
practice. It is built around the approved 2026 positioning, brand system and
capability ontology, with evidence-safe experience and a deliberately secondary
reference to Luxinnovation's Fit 4 AI programme.

## Architecture

- Next.js App Router with static HTML export
- React and TypeScript
- Azure Static Web Apps with managed HTTPS and static assets
- GitHub Actions verification and Azure deployment
- No database, CMS, analytics, cookies or contact backend in the first release
- Direct email contact to avoid collecting website form data

The public routes are:

- `/` - positioning, capabilities, approach, experience, Fit 4 AI, founder and
  contact
- `/legal` - legal notice and privacy information

## Editing content

Most public copy and repeated content lives in [`app/content.ts`](app/content.ts).
Page structure is in [`app/page.tsx`](app/page.tsx), and the shared visual system
is in [`app/globals.css`](app/globals.css).

Before publishing a new capability, case, metric, client name, partner name or
programme status, follow [`docs/CONTENT_GOVERNANCE.md`](docs/CONTENT_GOVERNANCE.md).
Do not add placeholders, invented results, customer logos or testimonials.

## Local development

Node.js 24 is used in CI.

```bash
npm ci
npm run dev
```

The development server normally opens at `http://localhost:3000`.

## Verification

```bash
npm run lint
npm test
```

`npm test` creates the production build and verifies rendered content,
metadata, legal information, security headers and final brand assets.

## Publishing

Pushing to `main` runs verification and deploys the validated static export to
Azure Static Web Apps when the repository variable
`AZURE_STATIC_WEB_APPS_DEPLOY_ENABLED` is `true` and the following production
environment secret exists:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`

The deployment token is scoped to the Agila Static Web App. The apex and `www`
custom domains are configured once in Azure and are not recreated during
routine deployments.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the Azure Static Web Apps and
Microsoft 365 DNS runbook, and [`docs/OPENCLAW.md`](docs/OPENCLAW.md) for safe
AI-authored updates.

## Repository policy

The repository is public. Never commit credentials, private client material,
proposals, CRM data, contact lists, financial information or source ontology
evidence. Public content must remain traceable to approved, publication-safe
sources.
