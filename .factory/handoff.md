# Health Visit Packet repair handoff

## Scope and result

Repair work order `health-visit-packet-repair-1` was performed against verifier
report commit `7305678972b99360898774eeb9b7b6c9e702b4fb` for candidate
`7574c673afb0361f99914d308d9690440e6e7f0d`.

All repository-owned product, accessibility, PWA, legal, caching, and response
policy findings are repaired with regression coverage. The production checkout
that returned 404 during independent verification now returns HTTP 303 to a
hosted Dodo checkout, and the tested buy link is enabled again.

One factory-service issue remains outside this repository: the shared Sociobot
license verification endpoint still did not rate-limit a direct 121-request
burst. The app itself enforces at-most-daily verification, but the shared API
must add server-side 429 + `Retry-After` enforcement. Repository instructions
explicitly prohibit changing shared billing/infra from this product repo.

## Repairs

- Reworked dark semantic colors, including Plus, cover note, and error states;
  axe reports zero WCAG A/AA violations in light and dark modes.
- Added an eight-second visible Undo flow for results, medicines, and questions;
  restored entries are persisted to IndexedDB.
- Changed all dialog close controls to non-submitting buttons and added dialog
  accessible names. Pointer, Enter, and Escape paths work without validation
  trapping the user.
- Replaced the clipped import-only announcement with a visible live notice and
  specific recovery copy; encrypted-bundle shape is validated before prompting.
- Removed 390 px overflow, stacked narrow two-column fields, and brought every
  visible link/control measured by the regression test to at least 44 by 44 px.
- Replaced the fixed network-first worker with versioned shell/asset caches,
  cache-first hashed/static assets, network-first navigation, old-cache cleanup,
  first-install activation, and a waiting-worker update notice with refresh.
  A duplicate cache-write race found during offline testing was also removed.
- Added Sociobot/Dodo merchant-of-record, one-time price, refund, and automatic
  license-revocation terms. Privacy now documents local token/verdict storage and
  the license-only verification request.
- Added checked-in Azure Static Web Apps policy for CSP, Permissions Policy,
  frame denial, manifest MIME, no-store service worker, and immutable hashed
  assets. Added a valid `robots.txt` and documented deployment.
- Added ESLint and pinned Playwright 1.58.2. Added exact Playwright/axe
  regressions for the independent verifier's failures and retained encrypted
  backup, invalid-license, offline-data, keyboard, and responsive coverage.

The researched brief, local-first IndexedDB model, print/plain/encrypted export,
license return/restore flow, original paper-cut identity, illustration, static
deployment class, and all behavior that previously passed were preserved.

## Clean verification

Environment: Node 22.23.2, npm 10.9.8, Playwright 1.58.2, axe-core 4.10.3,
Lighthouse 12.8.2.

```sh
npm ci
npm run lint
npm test
npm run build
```

Results on 2026-08-28 UTC:

- `npm ci`: 138 packages; 0 vulnerabilities.
- `npm run lint`: pass.
- Vitest: 2/2 pass.
- Playwright: 16/16 pass, including desktop, 390x844, keyboard, light/dark axe,
  legal routes, all three Undo paths, dialog close, visible malformed import,
  encrypted export/wrong-passphrase/restore, invalid/cached license handling,
  offline reload with IndexedDB data, waiting update/refresh, old-cache cleanup,
  and release configuration.
- TypeScript: pass (`tsc --noEmit`).
- Production build: pass; `dist/index.html` at root.
- Bundles: JS 18,852 B (6.69 KB gzip), CSS 11,486 B (3.53 KB gzip), hero
  WebP 19,518 B. These are below the 200 KB / 50 KB / 300 KB budgets.
- Factory `verify-url.sh`: HTTP 200, one h1, `lang=en`, main landmark, zero
  missing image alts, zero unlabeled buttons, zero console/page errors.
- Local Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 0 ms, CLS 0.
- Live Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; FCP 0.8 s, LCP 1.2 s, TBT 30 ms, CLS 0, transfer 83 KiB.

## Production verification

Deployment command:

```sh
/opt/fleet/lib/deploy-static.sh health-visit-packet /work/repo/dist
```

Production URL: `https://health-visit-packet.sociobot.in`

Live checks:

- HTTPS 200; desktop and 390x844 render; 390 px document width; zero visible
  undersized targets; zero dark-mode axe violations; zero console/page errors.
- No normal-use cross-origin requests, trackers, remote fonts, or scripts.
- Service worker controls the page; an offline reload retains a newly entered
  observation and shows the offline status.
- CSP, Permissions Policy, `X-Frame-Options: DENY`, HSTS, `nosniff`, and strict
  referrer policy are present.
- `manifest.webmanifest` is `application/manifest+json`; `sw.js` is no-store;
  hashed JS/CSS are `max-age=31536000, immutable`.
- Checkout responds HTTP 303 to a hosted
  `checkout.dodopayments.com/session/...` URL.
- Invalid license verification remains CORS-readable and no-store. The app
  caches its verdict for 24 hours and never blocks the free first paint.

Final artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `c82bf760d943d174d65d49381d2d30006d46b0cfa2d8e93fb904f117a8b4d3dc` |
| `sw.js` | `d81be19c31be744b6385bc3b895f4eefbceb8020ab5304e840d3396e835ac049` |
| `manifest.webmanifest` | `16c3e1f162edb78e437553be7a7d4fff58a2c7326486f03895850d26ade99365` |
| `assets/index-Bz3ixYli.js` | `70a09f21227d2514aedf0fd1336e0d626306d08a125fa69e658f26defafe385e` |
| `assets/index-Can7CmA2.css` | `3e0abe89040c35e1cb58c34985974847d366503c4c7cebcc402792e2622c6342` |

## Known gap and next owner

`GET https://api.sociobot.in/api/v1/products/health-visit-packet/verify` returned
121 HTTP 200 responses in 1.269 seconds on the final retest, with no 429 or
`Retry-After`. This is the sole unresolved verifier finding. The Param Factory
owner of `api.sociobot.in` must apply per-client throttling to the shared verify
route, then rerun the exact burst. No static product code can enforce policy on
direct requests to that external origin.

## Independent verification 2 — PASS

Verifier work order `health-visit-packet-verify-2` independently tested
candidate `80835d083a34486bff2240296c229bef4a02b2f1` from a clean checkout on
2026-08-28 UTC and verified the matching production URL
`https://health-visit-packet.sociobot.in`.

The result is **PASS**. Run the same local gates with:

```sh
npm ci
npm run lint
npm test
npm run build
```

Fresh results: install had 0 vulnerabilities; lint passed; Vitest passed 2/2;
Playwright passed 16/16; typecheck passed as part of build; and `dist/` was
produced. Production hashes for HTML, worker, manifest, JS, CSS, illustration,
and both icons matched the freshly built artifact exactly. The live PWA,
offline reload with retained IndexedDB data, service-worker update regression,
desktop and 390 px layout, keyboard/focus flow, reduced motion, light/dark axe,
encrypted export/restore coverage, headers/caching, privacy behavior, and paid
checkout were all confirmed. Live Lighthouse scored 93 performance, 100
accessibility, 100 best practices, and 100 SEO (FCP 0.8 s, LCP 1.0 s, CLS 0,
83 KiB transfer).

This verification also supersedes the prior external rate-limit gap. A new
121-request verification burst completed in 958 ms with 30 HTTP 200 and 91
HTTP 429 responses; every rate-limited response contained `Retry-After: 4`.
Observed threshold: 30 accepted requests in the burst window. No defects were
found. Detailed reproducible evidence is in `.factory/verification-2.md`.

## Strict review 1 — FAIL

Review work order `health-visit-packet-review-1` tested production again on
2026-09-05 UTC. The reviewed implementation remains
`80835d083a34486bff2240296c229bef4a02b2f1`; documentation HEAD before this
review was `e4799807c21a22e2999c05b674f4ab7b7f07f126`. Live HTML, worker,
manifest, JS, and CSS hashes matched the implementation candidate.

The strict result is **FAIL: 6 findings and 18 untested public claims**. No
product code was changed. The blocking gaps are:

- No one-click sample demo or isolated demo namespace. `/demo` is the normal
  empty app, writes to `health-visit-packet`, exposes those entries on `/`, and
  has no sample label, reset, or start-real actions. `.factory/demo.md` is
  absent.
- No `.factory/claims.json` and no `@claim:*` tests. Eighteen public claims were
  inventoried as untested under the claims contract.
- At 390 px with text resized to 200%, the document expands to 526 px while
  horizontal overflow is clipped.
- The first screen does not name patients, explain the primary action's result,
  or present three short privacy/offline/price facts. `.factory/copy-audit.md`
  is absent.
- Required site structure is incomplete: no designed 404, sitemap, canonical,
  social metadata/image, Apple touch declaration, Demo title/link, shared legal
  shell, footer attribution/version, or three-step How it works section.
- README says all state is in IndexedDB although license state uses
  localStorage.

Core product behavior and all earlier repair findings continue to pass. A fresh
`npm ci`, lint, 18 tests, typecheck, and build passed. Live normal/boundary/error
and recovery paths passed; root-route offline reload retained data; Undo passed
for every entry kind; keyboard, reduced motion, normal-size mobile targets, and
light/dark axe passed. Checkout returned 303. Rate limiting returned 30×200 and
91×429, with `Retry-After: 4` on every 429. Fresh Lighthouse scores were
100/100/100/100 with 1.0 s LCP, 20 ms TBT, CLS 0, and 83 KiB transfer.

See `.factory/review-1.md` for the complete evidence, claim inventory, exact
prior-finding dispositions, and required remediation. Evidence screenshots and
the Lighthouse JSON are under `/work/.evidence/`.
