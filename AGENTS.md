# Agila website agent instructions

This public repository contains the production website for Agila. Treat every
committed file and GitHub discussion as potentially public.

## Start and scope

1. Start every task with `git status --short --branch`.
2. Fetch `origin` and branch from current `origin/main`; never work from a stale
   detached checkout.
3. Use a short-lived `codex/<topic>` or `openclaw/<topic>` branch.
4. Preserve unrelated work. Never force-push, rewrite shared history or bypass
   checks.
5. Routine content changes belong in `app/content.ts`. Structural, dependency,
   workflow, security, legal, domain or deployment changes require explicit
   human review.

## Public-content guardrails

- Lead with Agila as the public brand. Use Agila Consulting S.à r.l. only in
  legal or formal identification zones.
- Preserve the position: AI-central, architecture-led transformation.
- Keep AI central, architecture as the professional spine, and industrial
  IT/OT and operational data as the differentiating anchor.
- Describe Fit 4 AI as a secondary route to market. The current approved status
  is pre-accredited; revalidate before any material wording change.
- Do not add client names, logos, testimonials, detailed architectures, outcome
  metrics, partner-capacity claims or named case studies without recorded
  publication approval.
- Do not imply a large staffed firm, autonomous business operation, guaranteed
  funding, regulated advice, legal partnership or a client production outcome
  not supported by approved evidence.
- Never add placeholders, lorem ipsum, fake forms, invented statistics or stock
  logo walls.
- Use British English and restrained, specific, evidence-led language.

The controlling public-claim rules are in `docs/CONTENT_GOVERNANCE.md`.

## Brand and UX

- Use only the supplied AGILA SVG wordmarks. Do not retype, recolour, stretch,
  crop, outline or add a symbol, square, monogram, tagline or `Consulting` to
  the artwork.
- Keep the interface monochrome with neutral greys, generous space, editorial
  typography and purposeful motion.
- Preserve semantic landmarks, heading order, keyboard access, visible focus,
  contrast and reduced-motion behaviour.
- Do not add tracking, cookies, external font requests or a contact backend
  without explicit approval and a privacy review.

## Required checks

Run all of these before opening a pull request:

```bash
npm ci
npm run lint
npm test
git diff --check
```

Review the rendered-content test whenever public claims, metadata, legal text or
security headers change. Stage only the intended scope and keep the worktree
clean after an accepted release.

## Deployment authority

- Agents may push branches and open pull requests.
- Routine content fixes may be auto-merged only when Alejandro has established
  that standing policy and all required checks pass.
- New claims, cases, pages, features, dependencies, workflows, security rules,
  legal text, domains or deployment configuration require human approval.
- The Azure Static Web Apps deployment token belongs only in the GitHub
  `production` environment; never expose it to OpenClaw or commit it.
- Production deployment occurs from protected `main` after CI. Do not deploy an
  unreviewed branch directly.
