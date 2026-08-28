# Health Visit Packet handoff

## Independent verification status: FAIL

Tested candidate: `7574c673afb0361f99914d308d9690440e6e7f0d`

Tested deployment: `https://health-visit-packet.sociobot.in`

Test date: 2026-08-28 UTC

The deployment is live and its HTML, JS, CSS, and service worker are byte-for-byte
identical to the candidate build. This is not a deployment-only failure.

## What works

- Clean `npm ci`, `npm test` (Vitest 2/2, Playwright 1/1), TypeScript check, and
  `npm run build` pass; npm reports 0 vulnerabilities. No lint gate exists.
- The core local-first packet flow works: source/date-labelled observations,
  medicines, questions, IndexedDB persistence, print invocation, confirmed JSON
  export, encrypted export, wrong-passphrase recovery, correct restore, and
  offline app/data reload.
- No normal-use outbound requests, trackers, remote scripts/fonts, console
  errors, or page errors were observed.
- Production bundle budgets pass: JS 16,572 B, CSS 9,885 B, hero 19,518 B.
- Lighthouse mobile live: performance 97, accessibility 100, best practices 100,
  SEO 100; LCP 1.2 s and CLS 0.

## Release blockers and material gaps

- HIGH: production Plus checkout returns HTTP 404 instead of hosted checkout.
- HIGH: 120 rapid license-verify requests all returned 200; no 429 or
  `Retry-After` was observed (threshold is greater than 120).
- HIGH: axe reports serious dark-mode contrast failures on 13 nodes.
- MEDIUM: deletes have no confirmation/Undo; modal close buttons are broken;
  malformed-import errors are invisible to sighted users.
- MEDIUM: a 390 px viewport produces 401 px document width, and multiple touch
  targets are under 44x44 px.
- MEDIUM: the service worker lacks update-available UI, cache-version cleanup,
  and cache-first asset handling.
- MEDIUM: terms omit the required Sociobot/Dodo merchant-of-record and refund /
  revocation disclosure.
- LOW: hashed assets have only 30-second caching; CSP, Permissions Policy, and
  frame protection are absent; the manifest uses `application/octet-stream`.

Full commands, hashes, functional cases, headers, accessibility results, and
defect evidence are in [`.factory/verification.md`](verification.md).

## Re-run

```sh
npm ci
npm test
npm run build
```

After fixes, repeat live desktop and 390 px checks in both color schemes, axe,
Lighthouse, encrypted export/restore, service-worker update/offline launch, the
checkout redirect, and a rate-limit burst that must produce 429 with
`Retry-After`.
