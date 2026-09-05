# Build a health visit packet — independent verification 3

## Verdict: PASS

**PASS — zero findings and zero untested public claims.**

Verified on 2026-09-05 UTC against the production URL
`https://health-visit-packet.sociobot.in`.

- Implementation candidate reviewed: `72def0701846a146d722ecb0e7f3d948ca5b4bb6`
- Documentation baseline reviewed: `8e920cb717e4f001db6c6938693a388037d971d0`
- Clean checkout: detached at the implementation candidate; clean before
  `npm ci`.
- Product code was not changed during this verification.

## Job, audience, and first action before scrolling

- **Job:** Build one compact, printable or encrypted packet from selected
  health results, medicines, questions, and visit notes.
- **Audience:** Patients preparing for an appointment with records spread over
  portals, labels, and notes.
- **First action:** **Try it with sample data**. Its adjacent text says that a
  filled packet opens and sample changes never touch the visitor’s packet.

Fresh 1440×900 desktop and 390×844 phone contexts showed those elements at
scroll position zero. The live first-screen title is `Health Visit Packet —
build a private visit packet`; the phone document width was exactly 390 px.
Captures: `/work/.evidence/verify-3-desktop.png` and
`/work/.evidence/verify-3-phone.png`.

## Clean build and claim commands

Node 22.23.2, npm 10.9.8, Playwright 1.58.2, axe-core 4.10.3, and Lighthouse
12.8.2 were used. The installed Playwright Chromium executable was supplied to
Lighthouse as its documented browser prerequisite.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 138 packages, 0 vulnerabilities. |
| `npm run lint` | PASS. |
| `npm test` | PASS — 2/2 Vitest and 39/39 Playwright tests. |
| `npm run build` | PASS — typecheck passed and `dist/index.html` exists. |
| Output budgets | PASS — JS 23,864 B (8.26 KB gzip), CSS 14,608 B (4.16 KB gzip), hero WebP 19,518 B. |

Every command declared in `.factory/claims.json` was run separately from the
clean checkout. All 19 commands passed; each command selected exactly one
tagged outcome test.

| Claim IDs with a passing declared command |
| --- |
| `demo-isolation`, `local-packet`, `indexeddb-storage`, `no-tracking`, `offline-reload` |
| `source-date`, `reload-persistence`, `print-pdf`, `json-export`, `encrypted-hides-data` |
| `encrypted-restore`, `passphrase-private`, `reversible-removals`, `plus-price`, `plus-cover-note` |
| `free-core`, `license-handling`, `no-health-server`, `no-portal-advice` |

The registry test also confirms one and only one `@claim:<id>` test for each
entry. A scan of the live landing page, demo, legal pages, and README found no
additional consequential public claim without a registry entry. Untested claim
count: **0**.

## Live product checks

- The `/demo` route has title `Demo — Health Visit Packet`, a persistent
  **Demo — sample data, nothing is saved** banner, Reset demo, and Start for
  real. It immediately showed the realistic Maya Patel packet: two sourced and
  dated results, two medicines, and two clinician questions.
- Changing a real packet marker, changing a demo marker, then choosing Start
  for real proved that the real marker remained while the demo database was
  deleted. The demo used only `demo:health-visit-packet`; the real packet used
  `health-visit-packet`.
- Reset restored Maya Patel. A fresh controlled service-worker context reloaded
  the populated demo offline and showed both the packet and the offline notice.
- Normal, invalid, boundary, and recovery paths are covered by the passing
  clean browser suite: required-field validation; literal rendering of
  HTML-like text; dates from 1900-01-01 to 9999-12-31; source/date retention;
  JSON and encrypted backups; wrong-passphrase and malformed-import recovery;
  print warning; Undo for all three removable entry types; and persisted
  restoration.
- At 200% root text size on a 390 px phone, live width remained 390 px and no
  tested first-screen text was clipped. The first Tab exposed the visible
  3 px skip-link outline; Enter moved focus to `main`. Reduced-motion behavior
  and the full keyboard/dialog checks passed in the clean suite.
- Live axe WCAG 2 A/AA and 2.1 A/AA scans produced zero violations in light and
  dark modes. The designed live 404 returned HTTP 404, title `Page not found —
  Health Visit Packet`, one h1, and zero axe violations. This deliberate 404 is
  expected behavior, not a defect.
- `/privacy/`, `/terms/`, `/demo`, `/sitemap.xml`, and `/robots.txt` all return
  200. Privacy and Terms have distinct route titles and the shared accessible
  shell. Crawled internal links returned 200 except the intentional 404 page’s
  own skip-link URL; the checkout target returned its expected 303 hosted
  Dodo checkout redirect.
- `/opt/fleet/lib/verify-url.sh` passed for the landing page, demo, Privacy,
  and Terms: each has a title, `lang=en`, one h1, a main landmark, image alts,
  labelled buttons, and no console/page errors.
- A normal demo request log remained same-origin. Packet content stays in
  IndexedDB; the only possible remote request is disclosed license verification
  to the Sociobot billing API. No analytics, tracker, remote-font, portal, or
  model requests were observed.
- A 121-request invalid-license burst gave 30×200 and 91×429. Every 429 had a
  `Retry-After` header (values observed: 1–4 seconds). There is no product
  backend, account tenant, or server-side packet store, so tenant isolation and
  backend-restart persistence do not apply; IndexedDB persistence was tested.

## Deployment identity, security, and performance

Fresh local `dist/` hashes match live production exactly:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `72997757b8cc4d689d094a90234afed21ee67bb4b4c574f1b55bb7df525171d6` |
| `sw.js` | `ded791330c360d0d3140406955630562b257a6ec9ddec0b16c764e87eaaa64f5` |
| `manifest.webmanifest` | `dd26e0a64b4270eef8bcdc9a30be77e4125875d718a33ddf094091735751a1c5` |
| `assets/index-Bo4QQzYB.js` | `be0e8730bad1b7af8cf3439f673da80014ff847926b91ada5dbd93c13409dfca` |
| `assets/index-BynJlQnQ.css` | `105391bd1f1a5583afea219995b335d6d662a72ffd020beaab508330f9abafb3` |

Production returns HSTS, CSP with `frame-ancestors 'none'`, Permissions-Policy,
`nosniff`, strict referrer policy, and frame denial. Lighthouse mobile scored
100 performance, 100 accessibility, 100 best practices, and 100 SEO; FCP 0.9
s, LCP 0.9 s, TBT 50 ms, CLS 0, and 86 KiB transfer. JSON evidence:
`/work/.evidence/verify-3-lighthouse.json`.

## Earlier finding disposition

| Earlier finding | Current disposition and proof |
| --- | --- |
| Missing isolated demo and offline sample | Fixed — separate `demo:` IndexedDB, banner, reset, clear-on-exit, realistic sample, and live offline reload passed. |
| Missing claim inventory/tests | Fixed — 19 registry entries, exactly one tag each, and all declared commands passed. |
| 200% mobile clipping | Fixed — live 390 px document remained 390 px with zero clipped tested text. |
| Missing audience, action result, and first-screen facts | Fixed — all are present before scroll on fresh desktop and phone. |
| Missing 404, sitemap, metadata, shared shell, and how-to section | Fixed — live routes/titles/404/link crawl and suite passed. |
| README storage overstatement | Fixed — README distinguishes packet IndexedDB from license localStorage. |
| Checkout 404 | Fixed — fresh live checkout returned 303 to hosted checkout. |
| Verification endpoint lacked limits | Fixed — fresh burst observed 91 429 responses with Retry-After. |
| Dark-mode contrast | Fixed — fresh light and dark axe scans have zero violations. |
| Irreversible removals, dialog close trap, hidden import error | Fixed — Undo and recovery/dialog paths pass in the clean suite. |
| Normal phone overflow and undersized targets | Fixed — clean phone test and live 390 px check pass. |
| PWA update/cache weaknesses | Fixed — service-worker update/cache regressions pass; live demo works offline. |
| Paid legal copy, security/cache/MIME headers, deployment docs | Fixed — legal routes, headers, response configuration, and README checks pass. |

## Known limit

No real paid transaction was completed. The product-specific checkout redirect,
local entitlement behavior, and rate limiting are verified, but a payment
issuer can only prove a completed transaction through the separate billing
operation. This is a known verification boundary, not a product finding.
