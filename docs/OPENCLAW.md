# OpenClaw website integration

## Purpose

MyOpenClaw should behave as another constrained contributor to this repository.
It should prepare changes, push a branch and open a pull request. GitHub performs
verification and holds the only production deployment credentials.

This is the useful wedding-site pattern without its stale detached-submodule
risk or access to unrelated private business memory.

## Recommended lane

Create a dedicated `agila-web` agent or skill with:

- a current, dedicated checkout of `a-sim/agilaconsulting`;
- only approved public positioning, brand and content-governance context;
- no CRM, contact, client, financial, proposal, ontology-evidence or general
  OneDrive access;
- a repo-scoped GitHub App, or an expiring fine-grained token with only Contents
  and Pull Requests write plus Actions read;
- no Administration, Secrets, Environments, Workflows or production-hosting
  permission;
- branch names in the form `openclaw/<short-topic>`;
- a deterministic receipt recording request, files, tests, commit, PR and final
  result.

Do not reuse the wedding agent's mixed-purpose checkout. Every run should fetch
`origin`, verify a clean state and branch from current `origin/main`.

## Routine content path

The narrow routine path may change:

- spelling, punctuation and factual corrections in `app/content.ts`;
- an already-approved contact or link correction;
- metadata wording that exactly mirrors approved home-page copy;
- replacement of an already-approved public image with recorded rights.

The agent must run:

```bash
git status --short --branch
git fetch origin
npm ci
npm run lint
npm test
npm run build
git diff --check
```

It then pushes the short-lived branch and opens a pull request containing the
content-change receipt defined in `docs/CONTENT_GOVERNANCE.md`.

Routine changes may be configured for auto-merge only after Alejandro creates
an explicit standing policy and the repository can enforce the path boundary.

## Human-approval path

OpenClaw must stop at a pull request when a change affects any of these:

- positioning, capability scope or target audience;
- Fit 4 AI, Luxinnovation, L-DIH or another programme status;
- a client, partner, case, metric, testimonial or outcome;
- founder biography, title or legal company information;
- new page, section, feature, dependency or interactive behaviour;
- layout, CSS, accessibility, security or privacy;
- workflow, deployment, domain, DNS, secrets or repository policy.

GitHub `CODEOWNERS` and branch rules should require Alejandro's review for these
paths. AI-generated approval is not a substitute for human approval.

## Suggested task contract

1. Parse the request and classify it as routine content or human approval.
2. Confirm repository freshness and a clean worktree.
3. Read `AGENTS.md` and the content-governance file.
4. Make the smallest complete change.
5. Run required checks and capture their result.
6. Re-read the rendered copy for claim and link correctness.
7. Push `openclaw/<topic>` and open a pull request.
8. Monitor CI and repair only failures within the original scope.
9. Merge only if the standing policy and required approvals permit it.
10. Confirm the production release through GitHub and the live URL, then close
    the receipt and remove the branch.

## Failure rules

- Never force-push or bypass required checks.
- Never deploy outside the protected GitHub production workflow.
- Never print or request a production secret.
- Never broaden a typo request into a redesign.
- Never infer publication permission from a private source or public company
  name.
- Stop when a source, permission, programme status or legal fact is ambiguous.
