# Health Visit Packet repair 2 handoff

## Result

Repair work order `health-visit-packet-repair-2` is complete. The strict review’s
six findings are fixed, the 18 previously untested public claims now have
outcome checks, and the new demo-isolation promise has its own nineteenth claim
check.

- Live URL: `https://health-visit-packet.sociobot.in`
- Implementation SHA deployed: `72def0701846a146d722ecb0e7f3d948ca5b4bb6`
- Documentation SHA: the report-only commit containing this handoff; it follows
  the implementation SHA and does not change the deployed artifact.
- Successful Azure Static Web Apps deployment ID:
  `c0449213-0bea-49b4-a1af-ee5a68249c03`
- Deployed artifact class: static PWA; no backend or shared database is used.

## What changed

### Isolated one-click demo

- Added **Try it with sample data** to the first screen and a direct `/demo`
  entry point with title `Demo — Health Visit Packet`.
- Added a realistic Maya Patel packet with a visit reason, two sourced and
  dated results, two medicines, and two clinician questions.
- Demo data uses IndexedDB database `demo:health-visit-packet`. Real data remains
  in `health-visit-packet`. Demo mode does not read license localStorage.
- Added the persistent **Demo — sample data, nothing is saved** banner with
  **Reset demo** and **Start for real**. Starting for real deletes the demo
  database before reopening the untouched real packet.
- Added `/demo` to the service-worker shell. A cache `Vary` mismatch found by
  repeated offline runs was fixed with an `ignoreVary` cache lookup. Six
  consecutive isolated offline repeats passed after the repair.
- Documented the sample, namespace, reset, exit, and offline behavior in
  `.factory/demo.md`.

### Claims and plain words

- Added `.factory/claims.json` with 19 one-to-one `@claim:<id>` browser tests.
  These cover the strict review’s 18 claims plus demo isolation.
- Tests exercise storage separation, browser requests, offline reload, source
  retention, persistence, print, JSON, encryption, restore, passphrase privacy,
  Undo, price/checkout, Plus output, free features, license handling, and
  product limits. They assert outcomes rather than source strings.
- Replaced the first-screen copy with a job headline, named patient audience,
  sample action and result, real-data action, and three privacy/offline/price
  facts.
- Added `.factory/copy-audit.md`. No sentence exceeds 22 words, the average is
  below 14 words, and no banned marketing term appears.
- Added the verb-first, 84-character catalog description and copied it to
  `/work/.evidence/catalog-description.txt`.

### Text resize, structure, and metadata

- Removed clipped body overflow, made grids and headers shrink safely, and
  added narrow-layout rules for long text. At a 390 px viewport with root text
  resized from 16 px to 32 px, the live document remains 390 px wide and the
  audited first-screen text has no clipped rectangle.
- Added a three-step **How it works** section and the standard landing-page
  order. Header navigation now includes Demo; the footer includes Privacy,
  Terms, Param Factory attribution, and version 1.1.0.
- Rebuilt Privacy and Terms with the shared header, navigation, skip link,
  footer, focus treatment, responsive layout, and route metadata.
- Added a designed `404.html` and an Azure 404 response override. An unknown
  production URL returns HTTP 404 while showing the product-styled recovery
  page.
- Added `sitemap.xml`, its `robots.txt` reference, canonical links, route
  descriptions, Open Graph/Twitter fields, an Apple touch icon, and a 1200×630
  social image derived from the existing original illustration.
- Removed inline styles so the live CSP no longer needs `style-src
  'unsafe-inline'`.

### Documentation and paid offer

- README now distinguishes packet IndexedDB storage from license localStorage,
  documents `/demo`, clean verification, deployment, and the free/Plus split.
- The $9 one-time Plus cover-note deliverable remains intact. Public billing
  metadata is at `/work/.evidence/billing-offer.json`.
- No AI feature was added. Record retrieval, interpretation, and diagnosis are
  explicit non-goals; an inference request would weaken the local-first job
  rather than complete it.

## Current and earlier finding disposition

| Finding | Disposition |
| --- | --- |
| Missing isolated demo | Fixed; separate database, sample, persistent label, reset, clear-on-exit, and offline route are tested live. |
| Missing claims registry/tests | Fixed; 19 registered claims each have exactly one tagged outcome test. |
| 200% mobile text clipping | Fixed; live 390 px document width is 390 px with no clipped audited text. |
| First screen missed audience/action result/facts | Fixed; all appear before scrolling on the tested phone and desktop. |
| Missing 404/sitemap/metadata/shared shell/how-to section | Fixed and checked on the HTTPS origin. |
| README overstated IndexedDB use | Fixed; packet and license storage are described separately. |
| Checkout returned 404 | Remains fixed; live checkout returns 303 to hosted Dodo checkout. |
| Verification rate limiting | Remains fixed; 30 requests returned 200 and 91 returned 429 with `Retry-After: 4`. |
| Dark-mode contrast | Remains fixed; live light and dark axe scans report zero violations. |
| Irreversible removals | Remains fixed; result, medicine, and question Undo paths pass. |
| Dialog close validation trap | Remains fixed; pointer, Enter, and Escape paths pass. |
| Hidden malformed-import error | Remains fixed; visible recovery instructions pass. |
| Normal 390 px overflow/small targets | Remains fixed; width is 390 px and visible controls are at least 44×44 px. |
| PWA update/cache weaknesses | Remains fixed; waiting update, refresh, version cleanup, and offline sample reload pass. |
| Paid legal copy | Remains fixed; price, merchant of record, refund, and revocation are stated. |
| Headers/cache/MIME/deployment docs | Remain fixed and verified live. |

## Verification

Environment: Node 22.23.2, npm 10.9.8, Playwright 1.58.2, axe-core
4.10.3, Lighthouse 12.8.2.

An independent clean clone at the exact implementation SHA was used:

```sh
npm ci
for claim_id in $(jq -r '.[].id' .factory/claims.json); do
  npm run test:claims -- --grep "@claim:${claim_id}" || exit 1
done
npm run lint
npm test
npm run build
```

Results:

- `npm ci`: 138 packages installed; 0 vulnerabilities.
- All 19 declared claim commands passed individually from the clean clone.
- `npm run lint`: pass.
- `npm test`: 2/2 Vitest and 39/39 Playwright checks passed.
- `npm run build`: typecheck passed and `dist/index.html` was produced.
- Initial JS: 23,864 B / 8.26 KB gzip. CSS: 14,608 B / 4.16 KB
  gzip. Hero WebP: 19,518 B. All are below the product budgets.
- Local Lighthouse: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; FCP 0.9 s, LCP 1.3 s, TBT 0 ms, CLS 0, 33 KiB transfer.
- Live Lighthouse: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; FCP 0.8 s, LCP 1.0 s, TBT 20 ms, CLS 0, 33 KiB transfer.
- Factory live verifier: HTTPS 200, one `h1`, `lang=en`, main landmark, zero
  missing image alts, zero unlabeled buttons, and zero console/page errors.

## Live cold checks

- Fresh 1440×900 and 390×844 contexts showed the job, patient audience, and
  **Try it with sample data** before scrolling. The phone action measured
  350×48 px. Screenshots are under `/work/.evidence/live-desktop.png`,
  `/work/.evidence/live-phone.png`, and `/work/.evidence/live-demoPhone.png`.
- A fresh phone demo showed the sample banner and sourced records. Reset
  restored Maya Patel. Starting for real removed the demo database and restored
  an unchanged real-data marker.
- A fresh demo context retained an edited reason after an offline reload and
  showed the offline status.
- Live light and dark axe scans returned zero violations. Keyboard Tab exposed
  the skip link, Enter focused `main`, reduced motion reported 0 s animation
  and transition durations, and all visible phone targets were at least 44 px.
- Privacy and Terms return 200 with distinct titles and the shared shell.
  `/does-not-exist-repair-2` returns 404 with the designed page, one `h1`, and
  zero axe violations. `sitemap.xml` returns 200.
- Normal demo use issued no cross-origin requests. The implementation and live
  hashes match for HTML, service worker, manifest, JS, and CSS.
- HTTPS headers include CSP, frame denial, Permissions Policy, HSTS, strict
  referrer policy, and `nosniff`. Hashed assets are immutable for one year;
  `sw.js` is no-store; the manifest MIME type is correct.
- Checkout returns 303 to `checkout.dodopayments.com`. A concurrent 121-request
  invalid-license burst completed in 878 ms: 30×200 and 91×429; every 429 had
  `Retry-After: 4`.

Artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `72997757b8cc4d689d094a90234afed21ee67bb4b4c574f1b55bb7df525171d6` |
| `sw.js` | `ded791330c360d0d3140406955630562b257a6ec9ddec0b16c764e87eaaa64f5` |
| `manifest.webmanifest` | `dd26e0a64b4270eef8bcdc9a30be77e4125875d718a33ddf094091735751a1c5` |
| `assets/index-Bo4QQzYB.js` | `be0e8730bad1b7af8cf3439f673da80014ff847926b91ada5dbd93c13409dfca` |
| `assets/index-BynJlQnQ.css` | `105391bd1f1a5583afea219995b335d6d662a72ffd020beaab508330f9abafb3` |

The first deployment attempt stopped before upload because Azure treats
`/demo` and `/demo/` as duplicate route declarations. Commit `72def07` removes
the duplicate and adds a normalized-route regression. The next deployment
completed successfully; production hashes match that candidate.

## Known limits and next steps

- No real payment was completed during repair. The live checkout redirect and
  local entitlement behavior passed, but a redirect alone does not prove a
  paid token was issued. The separate billing operator owns an end-to-end paid
  purchase check.
- The product intentionally does not retrieve portals, interpret results, give
  medical advice, sync data, or provide emergency guidance.
- There is no product backend, account, tenant, or server-side packet store, so
  tenant-isolation and backend-restart checks do not apply.
