# Independent product verification 2

## Result: PASS

Candidate `80835d083a34486bff2240296c229bef4a02b2f1` was independently
verified on 2026-08-28 UTC from a clean checkout at `/work/repo` and against
`https://health-visit-packet.sociobot.in`.

No product code was changed during this verification. This report supersedes
the earlier failing report in `.factory/verification.md`: its repository
findings are fixed, and the formerly unresolved shared verification-endpoint
rate limit now responds correctly.

## Local quality gates

Environment: Node 22.23.2, npm 10.9.8, Playwright 1.58.2, axe-core 4.10.3,
Lighthouse 12.8.2.

| Check | Result | Fresh evidence |
| --- | --- | --- |
| Candidate / clean tree | PASS | `HEAD` was the requested SHA and `git status --short --branch` was clean before installation. |
| Install | PASS | `npm ci` installed 138 packages with 0 audit vulnerabilities. |
| Lint | PASS | `npm run lint` exited 0. |
| Unit and integration tests | PASS | `npm test`: Vitest 2/2 and Playwright 16/16 passed. |
| Type check / exact production build | PASS | `npm run build` ran `tsc --noEmit` and Vite 6.4.3 produced `dist/`. |
| Asset budgets | PASS | Initial JS: 18,854 B / 6,730 B gzip; CSS: 11,492 B / 3,549 B gzip; hero WebP: 19,518 B. All are within 200 KB JS, 50 KB CSS, and 300 KB hero budgets. |
| Live Lighthouse mobile | PASS | Performance 93, accessibility 100, best practices 100, SEO 100; FCP 0.8 s, LCP 1.0 s, TBT 320 ms, CLS 0, transfer 83 KiB. |

## Deployment identity and response policy

The live deployment is the candidate build. SHA-256 hashes matched for the
following local `dist/` and production artifacts:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `c82bf760d943d174d65d49381d2d30006d46b0cfa2d8e93fb904f117a8b4d3dc` |
| `sw.js` | `d81be19c31be744b6385bc3b895f4eefbceb8020ab5304e840d3396e835ac049` |
| `manifest.webmanifest` | `16c3e1f162edb78e437553be7a7d4fff58a2c7326486f03895850d26ade99365` |
| `assets/index-Bz3ixYli.js` | `70a09f21227d2514aedf0fd1336e0d626306d08a125fa69e658f26defafe385e` |
| `assets/index-Can7CmA2.css` | `3e0abe89040c35e1cb58c34985974847d366503c4c7cebcc402792e2622c6342` |
| `packet-diorama.webp` | `d2bdcb4004fe868c486c62b637d212fd341dcc52ebb2d0f40e092a86bef96c5e` |
| `icon-192.png` | `744f10ec6085bd7b96274b64c3a672d9a5adf552c764d9bac4a3c44d92f2166d` |
| `icon-512.png` | `7cbcaaf2541c77d688fd17632b6f6ea58050e82dc5eff54e167de1f5edcb3f50` |

Production redirects HTTP to HTTPS and serves 200 over HTTPS. Headers include
HSTS, `nosniff`, `strict-origin-when-cross-origin`, CSP with
`frame-ancestors 'none'`, Permissions-Policy, and `X-Frame-Options: DENY`.
Hashed JS/CSS use `public, max-age=31536000, immutable`; the worker uses
`no-cache, no-store, must-revalidate`; and the manifest is served as
`application/manifest+json` with a one-hour cache policy.

## End-to-end and browser checks

Independent Chromium checks on production exercised a representative packet:

- Entered visit details plus a source-labelled, dated observation, a medicine,
  and a clinician question. The live preview updated with the entered values.
  Boundary dates `1900-01-01` and `9999-12-31` were retained.
- Confirmed HTML-like input is rendered as literal text (no added image or
  script execution). Repository tests additionally cover required-field
  validation, malformed encrypted import recovery, wrong-passphrase recovery,
  all three reversible removals, and persisted restoration.
- Downloaded an AES-GCM encrypted bundle. Its JSON format was
  `health-visit-packet.encrypted.v1` and it contained none of the entered
  observation text. The print/PDF path gives the required visible review and
  data-minimization prompt before printing.
- Confirmed IndexedDB persistence after reload and after an offline reload.
  The offline state is visible and the entered packet remains readable.
  Storage inspection found only IndexedDB database `health-visit-packet`, no
  packet data in local/session storage, and versioned shell/asset caches.
- Confirmed a valid PWA manifest: standalone display, `/?v=2` start URL,
  matching colors, and 192/512 maskable icons. The full test suite independently
  exercises waiting-worker update notice, explicit refresh activation, and old
  cache cleanup.
- Desktop and 390x844 mobile both rendered without horizontal overflow. At
  390 px `scrollWidth` was 390; every visible link, button, input, textarea,
  and summary measured at least 44x44 px; the preview correctly precedes the
  editor on mobile.
- Keyboard-only verification found the first Tab focuses the visible 44 px
  skip link with a 3 px focus outline; Enter transfers focus to `main`; the
  encrypted-backup dialog initially focuses its close control and Escape
  closes it. Reduced-motion styles report 0 s animation and transition
  durations.
- axe WCAG 2.0/2.1 A/AA produced zero violations (thus zero serious/critical)
  for the main product in light and dark modes. The test suite also passed axe
  for privacy and terms in both modes.
- No console errors or page errors occurred. A production request log during
  ordinary packet entry and export contained no cross-origin requests, remote
  fonts, trackers, analytics, or third-party scripts. Source inspection and
  storage inspection confirm health entries are local-first; the only possible
  remote request is the disclosed, license-token-only Sociobot verification.

## Billing and rate limiting

- The $9 one-time Plus checkout returned HTTP 303 to a
  `checkout.dodopayments.com/session/...` hosted checkout. Terms identify
  Sociobot/Dodo as merchant of record, refund handling, and license revocation.
- Invalid license verification returned the documented `200` JSON verdict,
  `Cache-Control: no-store`, and (with the production Origin header) the
  correct `Access-Control-Allow-Origin` value. The application strips returned
  license tokens from the visible URL, checks at most daily, and does not block
  the free first paint.
- Rate limiting PASS: a fresh concurrent burst of 121 requests to
  `GET https://api.sociobot.in/api/v1/products/health-visit-packet/verify`
  with an invalid verification token completed in 958 ms: 30 returned 200 and
  91 returned 429. Every observed 429 supplied `Retry-After: 4`. The observed
  acceptance threshold was 30 successful requests per burst window.
- No account or sign-in route exists, so the Microsoft Entra tenant check is
  not applicable.

## Defects by severity

None found. The Lighthouse run reported 320 ms total blocking time while
still scoring 93 performance and meeting the stated LCP, transfer, and bundle
budgets; it is recorded as a measurement, not a release-blocking defect.

## Disposition

PASS. The production URL matches the requested candidate and satisfies the
researched browser-only, local-first visit-packet job to be done, including
PWA/offline, privacy, accessibility, paid-unlock, and response-policy checks.
