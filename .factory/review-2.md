# Build a health visit packet — strict review 2

## Verdict: PASS

**PASS — zero findings and zero untested public claims.**

Reviewed on 2026-09-05 UTC against
`https://health-visit-packet.sociobot.in`.

- Implementation candidate: `72def0701846a146d722ecb0e7f3d948ca5b4bb6`
- Documentation baseline: `edb36f1c8cc5bc8f06b830fc3ab85bcab0fce447`
- The two later commits change only the handoff and prior verification report;
  they do not change the reviewed artifact.
- Product code was not changed for this review.

## Job, audience, and first action before scrolling

- **Job:** Build one clear packet from selected results, medicines, questions,
  and appointment details for printing or keeping as an encrypted backup.
- **Audience:** Patients preparing for an appointment with records across
  portals, labels, and notes.
- **First action:** **Try it with sample data**. It says a filled packet opens
  and sample changes never touch the visitor’s packet.

Fresh 1440×900 desktop and 390×844 phone contexts both showed this content at
scroll position zero. The live title is `Health Visit Packet — build a private
visit packet`; the phone document width was 390 px. Evidence screenshots are
`/work/.evidence/review-2-desktop.png` and
`/work/.evidence/review-2-phone.png`.

## Clean candidate checks

A detached clean checkout at the implementation candidate was used with Node
22.23.2, npm 10.9.8, Playwright 1.58.2, axe-core 4.10.2, and Lighthouse 12.8.2.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 138 packages, 0 vulnerabilities. |
| `npm run lint` | PASS. |
| `npm test` | PASS — 2/2 Vitest and 39/39 Playwright tests. |
| `npm run build` | PASS — typecheck passed and `dist/index.html` exists. |
| Every declared claim command | PASS — all 19 were run separately; the command transcript has exit 0 and 19 claim headings. |
| Output budgets | PASS — JS 23,864 B (8.26 KB gzip), CSS 14,608 B (4.16 KB gzip). |

The claim registry has 19 unique entries and each has exactly one matching
`@claim:<id>` outcome test. The separately run commands passed for:

`demo-isolation`, `local-packet`, `indexeddb-storage`, `no-tracking`,
`offline-reload`, `source-date`, `reload-persistence`, `print-pdf`,
`json-export`, `encrypted-hides-data`, `encrypted-restore`,
`passphrase-private`, `reversible-removals`, `plus-price`,
`plus-cover-note`, `free-core`, `license-handling`, `no-health-server`, and
`no-portal-advice`.

The rendered landing, demo, legal pages, and README were cross-checked against
that registry. No additional consequential public claim was found. Untested
claim count: **0**.

## Live checks

- `/demo` immediately showed the realistic Maya Patel packet: two sourced and
  dated results, two medicines, and two clinician questions. Its persistent
  label is **Demo — sample data, nothing is saved**.
- Reset demo restored the shipped Maya Patel sample. A real-workspace marker
  remained intact after demo edits and **Start for real**; afterward only
  `health-visit-packet` remained in IndexedDB, not the `demo:` database.
- In a new controlled browser context, an edited demo reloaded offline with
  the edit still visible and the offline notice displayed.
- Normal, invalid, boundary, and recovery paths are covered by the clean
  suite: required fields, literal rendering of HTML-like values, date bounds,
  source/date retention, print warning, plain JSON, encryption and restore,
  wrong-passphrase and malformed-import feedback, Undo for all removal types,
  and persistence.
- The first Tab exposed the designed 3 px skip-link outline; Enter moved focus
  to `main`. The suite also passed dialog-focus, reduced-motion, touch-target,
  390 px, and 200% text-resize checks.
- Fresh live axe WCAG 2 A/AA and 2.1 A/AA scans had zero violations for light
  and dark home pages, Privacy, Terms, and the designed 404. The unknown route
  returned the deliberate HTTP 404, one h1, and title
  `Page not found — Health Visit Packet`; this is expected behavior.
- `/opt/fleet/lib/verify-url.sh` passed for home, demo, Privacy, and Terms:
  all have a title, `lang=en`, one h1, a main landmark, image alts, labelled
  buttons, and no console or page errors.
- The internal-link crawl found no broken same-origin links. Privacy, Terms,
  Demo, sitemap, and robots returned 200. Checkout returned its expected 303
  hosted Dodo redirect.
- A normal demo request log remained same-origin. Packet details remained in
  IndexedDB. There were no analytics, trackers, remote fonts, portal, or model
  requests; the disclosed billing verification is the only possible remote
  product request.

## Deployment and performance

The freshly built candidate exactly matched production by SHA-256 for
`index.html`, `sw.js`, `manifest.webmanifest`, the JS bundle, and the CSS
bundle. Production returned HSTS, CSP with `frame-ancestors 'none'`,
Permissions-Policy, `nosniff`, strict referrer policy, and frame denial.

Fresh Lighthouse mobile results: **100 performance, 100 accessibility, 100
best practices, 100 SEO**; FCP 1.0 s, LCP 1.1 s, TBT 50 ms, CLS 0, and 86 KiB
transfer. JSON evidence is `/work/.evidence/review-2-lighthouse.json`.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Isolated demo and offline sample missing | Fixed; fresh demo label, sample, reset, exit isolation, and offline reload passed. |
| Claim inventory/tests missing | Fixed; 19 one-to-one declared commands passed individually. |
| 200% mobile clipping | Fixed; 390 px/200% regression passed. |
| First screen lacked audience, action result, and facts | Fixed; all verified before scroll on desktop and phone. |
| 404, metadata, sitemap, shared shell, and how-to section missing | Fixed; live routes, titles, shell, link crawl, and 404 passed. |
| README overstated IndexedDB storage | Fixed; current README distinguishes packet IndexedDB from license localStorage. |
| Checkout 404 | Fixed; live checkout returns 303 to hosted checkout. |
| Verification rate limit missing | Fixed in the prior independent live burst; this static product has no application backend. |
| Dark contrast, removal, dialog, import, mobile, PWA, legal, header, and deployment-documentation findings | Fixed; relevant live checks and clean regressions passed. |

## Boundary

No real payment transaction was completed. The product-specific hosted checkout
redirect, local entitlement behavior, and the previously verified rate limit
are covered; issuing a paid token requires the separate billing operation. This
is a verification boundary, not a product finding.
