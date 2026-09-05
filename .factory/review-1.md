# Strict product review 1 — Build a health visit packet

## Verdict: FAIL

Production was reviewed on 2026-09-05 UTC. The implementation candidate is
`80835d083a34486bff2240296c229bef4a02b2f1`; the later documentation commit is
`e4799807c21a22e2999c05b674f4ab7b7f07f126`. The only changes between them are
`.factory/handoff.md` and `.factory/verification-2.md`.

The live files match the implementation candidate, and the packet-building
workflow remains sound. This strict review is nevertheless a **FAIL** with six
findings and 18 untested public claims. The required sample sandbox and claim
contract are absent. The first screen, site structure, mobile text resizing,
and one README storage statement also miss current contracts.

No product code was changed during this review.

## Job, audience, and first action before scrolling

- **Job:** Assemble selected results, medicines, questions, and visit notes into
  one printable or encrypted packet.
- **Audience:** Patients preparing for an appointment from records spread across
  portals, labels, and notes. The live first screen does not say this audience.
- **First action shown:** `Start your packet`, an anchor to the empty editor.
  The required `Try it with sample data` action is absent.

Fresh 1440×900 and 390×844 contexts both showed the headline, explanatory copy,
and `Start your packet` before scrolling. The desktop and phone first-screen
captures are `/work/.evidence/review-desktop-first-screen.png` and
`/work/.evidence/review-phone-first-screen.png`.

## Findings

### High 1 — The required one-click demo sandbox does not exist

There is no `Try it with sample data` action on the first screen, no sample
packet, no persistent `Demo — sample data, nothing is saved` label, no
`Reset demo`, and no `Start for real`. `.factory/demo.md` is absent, and the
README gives no demo URL.

Opening `/demo` returns the normal empty application with the normal page title.
In a fresh context, entering a realistic packet there created IndexedDB database
`health-visit-packet`. Navigating to `/` in the same context showed the same
Maya Patel, HbA1c, Metformin, and question records. This proves that `/demo`
uses real storage rather than a separate `demo:` namespace. The populated output
itself was realistic and complete, but it had no sample label or reset path.
Evidence: `/work/.evidence/review-demo-populated.png`.

Offline behavior also fails at this supposed demo entry point. After the first
online load of `/demo`, adding an `Offline marker`, and going offline, reloading
`/demo` showed the generic offline fallback with no packet editor. The same test
at `/` retained the record and displayed the in-app offline notice. This does
not satisfy the requirement that the sample be available offline.

### High 2 — Public claims have no required inventory or claim tests

`.factory/claims.json` is absent and `rg '@claim'` finds no tagged test. There
are therefore no declared claim commands to run. The ordinary suite tests many
behaviors, and this review manually confirmed several of them, but none has the
required one-to-one public-claim entry and `@claim:<id>` command.

The 18 public claims below are consequently untested under the claims contract:

| # | Public claim, normalized from live copy or README | Manual observation |
| ---: | --- | --- |
| 1 | Packet health data stays in the browser/device unless exported | Supported in the normal-use request log |
| 2 | Packet data is stored in IndexedDB | Supported; the database is `health-visit-packet` |
| 3 | No account, analytics, trackers, remote fonts, or third-party scripts | Supported in source and live requests |
| 4 | The packet remains available offline | Passed at `/`; failed at `/demo` |
| 5 | Values retain their source and date | Passed with populated output |
| 6 | Packet state survives reload | Passed live |
| 7 | The packet can be printed or saved as PDF after a warning | Print invocation and warning passed |
| 8 | The packet exports as plain JSON | Passed live |
| 9 | The encrypted bundle hides entered health text | Passed live |
| 10 | An encrypted bundle can be restored later | Passed live |
| 11 | The passphrase is not sent and cannot be recovered | No passphrase request observed; no declared test |
| 12 | Removed results, medicines, and questions can be restored | Passed live for all three kinds |
| 13 | Plus costs $9 once and checkout is available | Checkout returned 303 to hosted Dodo checkout |
| 14 | Plus adds a printable personal cover note | Covered by the ordinary local suite only |
| 15 | Builder, backup, accessibility, and exports remain free | Inspected, but no declared claim test |
| 16 | License URL removal, token-only verification, and daily caching work | Invalid-token live flow passed |
| 17 | There is no server-side health-data retention | Architecture supports it; no declared claim test |
| 18 | The product does not retrieve portal records or provide medical advice | Inspected, but no declared claim test |

Untested claim count: **18**.

### High 3 — Mobile text resized to 200% is clipped

At a 390×844 viewport with the root text size increased from 16 px to 32 px,
the document became 526 px wide while `body` kept `overflow-x: clip`. Text
rectangles extended beyond the 390 px viewport: the save state ended at 526.27
px, headline lines ended at 407.16 and 432.44 px, and the illustration caption
ended at 422.56 px. The hidden overflow gives the user no horizontal recovery.
Evidence: `/work/.evidence/review-mobile-text-200.png`.

Normal 100% mobile layout still passes at exactly 390 px with no undersized
visible controls. The failure is specifically the required 200% text-resize
path.

### Medium 1 — The first screen misses required plain-language elements

The headline names the job and is understandable. However, its companion copy
does not name patients preparing for an appointment. The primary action does not
say what appears after activation, and the required three short privacy,
offline, and price facts are not together on the first screen. The only initial
facts are two versions of the same device-privacy point.

The mandatory `.factory/copy-audit.md` is also absent. Thus there is no recorded
sentence count, banned-word check, or terminology audit.

### Medium 2 — Required routes, metadata, and shared structure are incomplete

- `/does-not-exist-review-1` returns HTTP 200 and the home application. There is
  no designed 404 route, no 404 response override, and no way to distinguish a
  bad URL from the product.
- `/sitemap.xml` returns 404, and `robots.txt` does not reference a sitemap.
- Pages have no canonical link, Open Graph metadata/image, Twitter card, or
  Apple touch icon declaration.
- `/demo` has the home title instead of `Demo — Health Visit Packet`.
- Privacy and Terms have correct route titles and one `h1`, but omit the common
  header, navigation, skip link, and footer.
- The header has no Demo link. The footer has no `Built by Param Factory` text
  or version/build id. The landing page has no three-step `How it works`
  section.

The explicit 404 returned for the missing sitemap is not itself treated as a
runtime defect. The findings are the missing required sitemap and the absence
of a designed 404 for unknown routes.

### Low 1 — README overstates where all product state is stored

README says, “Everything is stored in IndexedDB on the current device by
default.” Packet data is in IndexedDB, but the Plus token and cached verdict are
stored in localStorage. A fresh invalid-license return confirmed both
`sb_license:health-visit-packet` keys there. The Privacy page gives the accurate
split; README should use the same wording.

## Clean repository verification

The review used a fresh local clone of documentation commit
`e4799807c21a22e2999c05b674f4ab7b7f07f126`. Node was 22.23.2 and npm was
10.9.8.

| Command | Result |
| --- | --- |
| `npm install` | PASS — 138 packages, 0 vulnerabilities |
| `npm ci` | PASS — 138 packages, 0 vulnerabilities |
| `npm run dev` | PASS — HTTP 200 on a clean local start |
| `npm run lint` | PASS |
| `npm test` | PASS — Vitest 2/2 and Playwright 16/16, 18 total |
| `npm run build` | PASS — typecheck passed and `dist/index.html` was produced |
| `npm run preview` | PASS — HTTP 200 |

The build produced 18.85 kB JS (6.69 kB gzip), 11.49 kB CSS (3.53 kB gzip),
and the existing 19.52 kB hero WebP. These remain within the product budgets.

## Candidate and production identity

Freshly built candidate files and live production matched byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `c82bf760d943d174d65d49381d2d30006d46b0cfa2d8e93fb904f117a8b4d3dc` |
| `sw.js` | `d81be19c31be744b6385bc3b895f4eefbceb8020ab5304e840d3396e835ac049` |
| `manifest.webmanifest` | `16c3e1f162edb78e437553be7a7d4fff58a2c7326486f03895850d26ade99365` |
| `assets/index-Bz3ixYli.js` | `70a09f21227d2514aedf0fd1336e0d626306d08a125fa69e658f26defafe385e` |
| `assets/index-Can7CmA2.css` | `3e0abe89040c35e1cb58c34985974847d366503c4c7cebcc402792e2622c6342` |

This confirms that the findings apply to candidate `80835d0` as deployed. The
later report-only commit does not require a different product image.

## Live functional, accessibility, privacy, and recovery evidence

The following passed in fresh production contexts:

- Empty required result fields were rejected. Dates `1900-01-01` and
  `9999-12-31` were retained. HTML-like input rendered as literal text and did
  not execute.
- A realistic populated packet showed visit details, a source/date-labelled
  HbA1c result, Metformin, and a clinician question. Plain JSON contained all
  three results; encrypted JSON used format
  `health-visit-packet.encrypted.v1` and contained none of the HTML-like marker.
- A short encryption passphrase was rejected. Wrong-passphrase restore showed
  `Could not open this bundle. Check the passphrase and file.` Correct restore
  succeeded. Malformed JSON produced visible recovery instructions.
- Result, medicine, and question removal each offered Undo. Restored entries
  survived reload. Print invoked only after the visible review/minimization
  warning.
- Root-route online and offline reload retained IndexedDB packet data and showed
  the offline status. The service worker was active; `registration.update()`
  completed cleanly. The local suite passed the synthetic waiting-worker,
  refresh, and old-cache cleanup regression.
- At normal size, desktop and 390×844 had no horizontal overflow. Every visible
  phone link, button, input, textarea, and summary was at least 44×44 CSS px.
- Keyboard testing passed: first Tab exposed a 44 px skip link with a 3 px
  outline, Enter focused `main`, the encrypted-backup dialog focused its named
  close button, and Escape closed it. Reduced-motion media removed all observed
  animation and transition durations.
- Live axe WCAG 2.0/2.1 A/AA reported zero violations on the main, Privacy, and
  Terms pages in both light and dark modes. Factory `verify-url.sh` also passed
  with one `h1`, `lang=en`, a main landmark, image alt text, labelled buttons,
  and no console or page errors.
- Normal packet use contacted only the product origin. Packet data was in
  IndexedDB, not localStorage or sessionStorage. An invalid license was removed
  from the URL, rejected, and cached without exposing the token in the report.
- HTTP redirects to HTTPS. Production sends HSTS, CSP with
  `frame-ancestors 'none'`, Permissions-Policy, `nosniff`, strict referrer
  policy, and `X-Frame-Options: DENY`. Hashed assets are immutable for one year,
  `sw.js` is no-store, and the manifest MIME type is correct.
- Checkout returned HTTP 303 to hosted Dodo checkout. A 121-request concurrent
  invalid-license burst completed in 876 ms: 30 responses were 200 and 91 were
  429; all 91 rate-limited responses included `Retry-After: 4`.
- Fresh Lighthouse 12.8.2 mobile scores were 100 performance, 100
  accessibility, 100 best practices, and 100 SEO. FCP was 0.8 s, LCP 1.0 s,
  TBT 20 ms, CLS 0, and transfer 83 KiB.

No account backend exists, so tenant isolation, backend restart persistence,
and sign-in checks are not applicable. The static origin, IndexedDB persistence,
checkout, license verification, and rate-limit behaviors were checked instead.

The brief explicitly excludes OCR, record scraping, and clinical
interpretation. An AI feature would conflict with the local-first scope and is
not an obvious missed feature. No missed-AI-leverage finding is raised.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Checkout returned 404 | FIXED — live 303 to hosted checkout |
| Verification endpoint lacked rate limiting | FIXED — 30×200, 91×429, all 429 with `Retry-After: 4` |
| Dark-mode contrast | FIXED — zero live axe violations |
| Irreversible removals | FIXED — all three Undo paths passed and persisted |
| Modal close buttons trapped validation | FIXED — pointer, keyboard, and Escape paths passed |
| Malformed import feedback was hidden | FIXED — visible recovery text passed |
| 390 px overflow and small touch targets | FIXED at 100% — 390 px width and no undersized controls; separate 200% text finding above |
| PWA update/caching flow incomplete | FIXED — regression suite, live registration, cache policy, and old-cache cleanup passed |
| Paid-sale legal copy absent | FIXED — price, merchant of record, refund, and revocation text present |
| Weak caching/security/MIME headers | FIXED — live headers and caching passed |
| README lacked deployment procedure | FIXED — factory deployment command is documented |

## Final disposition

**FAIL — 6 findings, including 3 high, 2 medium, and 1 low; 18 untested
claims.** A PASS requires the demo to be isolated and complete, every public
claim to have one declared tagged test, the text-resize and first-screen issues
to be fixed, and the required site routes/metadata/docs to be present.
