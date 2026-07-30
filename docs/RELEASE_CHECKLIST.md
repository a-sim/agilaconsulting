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
- [ ] No analytics, cookies or form collection was added without approval.

## Verification

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run deploy:cloudflare:dry-run`
- [ ] `git diff --check`
- [ ] Pull-request checks pass from a clean branch based on `origin/main`.

## Production

- [ ] Worker deployment succeeds from protected `main`.
- [ ] Apex returns 200 over HTTPS and `www` redirects permanently.
- [ ] Security headers, `/legal`, robots, sitemap and security contact resolve.
- [ ] Microsoft 365 mail and domain health are unaffected.
- [ ] Release receipt records the commit, deployment and any follow-up.
