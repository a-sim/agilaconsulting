# Release checklist

## Content and brand

- [ ] Agila is the public masterbrand and the legal name appears only where needed.
- [ ] AI is central; architecture and industrial operating depth remain explicit.
- [ ] Fit 4 AI status has been revalidated if its wording changed.
- [ ] Every case, metric, client, partner and programme claim is publication-safe.
- [ ] No placeholder, invented result, logo wall or unsupported testimonial exists.
- [ ] Supplied wordmarks are unchanged and meet spacing and contrast rules.

## Product quality

- [ ] Heading order, landmarks, labels, keyboard focus and reduced motion remain sound.
- [ ] Email, LinkedIn, Fit 4 AI, legal, sitemap and security links are current.
- [ ] Title, description, canonical, Open Graph and JSON-LD match the public story.
- [ ] Legal company identifiers and privacy statements remain current.
- [ ] No analytics, cookies or form collection was added without approval and a privacy review.
- [ ] Contact fields, privacy hint, direct-email fallback and copy-address control are accessible.

## Verification

- [ ] `npm ci`
- [ ] `npm ci --prefix api`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm test --prefix api`
- [ ] `npm run build`
- [ ] `git diff --check`
- [ ] Pull-request checks pass from a clean branch based on `origin/main`.

## Production

- [ ] Azure Static Web Apps deployment succeeds from protected `main`.
- [ ] Apex returns 200 over HTTPS and `www` redirects permanently.
- [ ] Security headers, `/legal`, robots, sitemap and security contact resolve.
- [ ] `/api/contact` returns controlled 405 to GET and 202 only after ACS accepts a valid POST.
- [ ] One production enquiry arrives in Alejandro's mailbox with the correct Reply-To.
- [ ] Invalid, honeypot, wrong-origin, oversized and throttled requests do not send.
- [ ] ACS engagement tracking is off; Cosmos TTL and 30-day-or-shorter logs are configured.
- [ ] Microsoft 365 mail and domain health are unaffected.
- [ ] Release receipt records the commit, deployment and any follow-up.
