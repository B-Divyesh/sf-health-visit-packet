# Independent product verification

## Result: FAIL

Candidate `7574c673afb0361f99914d308d9690440e6e7f0d` was tested on
2026-08-28 UTC from a fresh detached clone and against
`https://health-visit-packet.sociobot.in`. The live deployment is present and
matches the candidate byte for byte, so the failures below are product and
service defects rather than a stale or missing deployment.

No product code was changed during verification.

## Build and repository gates

Environment: Node 22.23.2, npm 10.9.8, Playwright 1.58.2, axe-core 4.10.3,
Lighthouse 12.8.2.

| Gate | Result | Evidence |
| --- | --- | --- |
| Clean checkout | PASS | Detached checkout at the exact candidate; clean before install. |
| `npm ci` | PASS | 56 packages installed; 0 audit vulnerabilities. |
| `npm test` | PASS | Vitest 2/2 and Playwright 1/1 passed. The repository Playwright case covers source-labelled entry persistence and an offline reload. |
| Type check | PASS | `tsc --noEmit` runs as the first part of `npm run build`. |
| Lint | NOT AVAILABLE | No lint script or lint configuration is present. |
| `npm run build` | PASS | Vite 6.4.3 produced `dist/`; JS 16,572 B (6,142 B gzip), CSS 9,885 B (3,159 B gzip), hero WebP 19,518 B. |
| License/docs | PASS with gaps | MIT `LICENSE`, README, privacy, terms, brief, design, and handoff exist. Paid-sale disclosures and deployment guidance have gaps noted below. |

## Deployment identity

Live HTTP 200 was observed. Candidate build and live SHA-256 hashes are
identical:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `9f4cbde94cf076fddd4cefb5bf80eeedd021321c69f2fd855e278658d9ddb2a9` |
| `assets/index-yD-ONNt8.js` | `a4080829cacc8d374e6bf7890afc5b4dfbc8a83bc13800f88ca50a171740235b` |
| `assets/index-_ttycaxL.css` | `62cbd8d26b1df712f91276edc8689a3349d6be3c98e9415ad0a54145b376a018` |
| `sw.js` | `89fa52618ad9283d88a402da78881502b57d069620dfaaffc5a487eb4b5a952d` |

## End-to-end coverage

The same browser audit was run on the local production build and live site.
The following passed:

- Empty packet states; required-field rejection for an empty observation; a
  complete packet containing visit details, a dated/source-labelled result,
  medicine, and question; 1,000-character text and dates from `1900-01-01` to
  `9999-12-31`; HTML-like input was rendered as text and did not execute.
- IndexedDB persistence across reload; save status; immediate preview updates;
  plain JSON warning/download; AES-GCM encrypted download with no entered
  health plaintext; short-passphrase rejection; visible wrong-passphrase
  recovery; successful encrypted restore; print action invocation.
- Invalid JSON import is announced to assistive technology, but it is invisible
  to sighted users (defect below).
- Keyboard first-tab skip link, visible focus outline, skip-target activation,
  native required-field behavior, and Escape as a modal workaround.
- Desktop and a true 390x844 viewport; responsive preview-before-editor order;
  reduced-motion media behavior; privacy and terms routes; no console errors or
  uncaught page errors.
- No analytics, remote fonts, third-party scripts, or other cross-origin
  requests during normal packet use. Health entries remained in IndexedDB.
  The license return token was stripped from the URL, invalid verification was
  rejected, and the verdict was cached locally.
- Service worker installation/control, versioned cache creation, online reload,
  offline reload with retained IndexedDB data, visible offline state, and an
  offline launch at the manifest `/?v=1` start URL. `registration.update()`
  completed against the current worker with no waiting/installing worker.

The PWA manifest has the required name, short name, standalone display,
versioned start URL, theme/background colors, and valid 192x192 and 512x512
PNG icons marked `any maskable`.

## Accessibility, layout, and performance

- axe WCAG 2 A/AA and 2.1 A/AA: 0 serious/critical findings on desktop light,
  mobile light, privacy, and terms. Dark mode FAILS with one serious
  `color-contrast` rule covering 13 nodes, including primary links, section
  headings, remove actions, the skip link, and Plus copy/actions.
- At 390 CSS px the document is 401 px wide, producing 11 px horizontal
  overflow. Fifteen visible initial controls/links measured below 44 px in at
  least one dimension; examples include the 19 px-high start link, 41–43
  px-high text/date inputs, 22 px-high file input, and 15 px-high footer links.
  Populated-packet Remove controls are styled to a 27 px minimum height.
- Lighthouse mobile live: performance 97, accessibility 100, best practices
  100, SEO 100; FCP 0.8 s, LCP 1.2 s, TBT 200 ms, CLS 0, Speed Index 0.8 s;
  initial transfer 81 KiB. These meet the requested budgets. Lighthouse used
  the default light treatment and therefore does not contradict the dark-mode
  axe failure.

## Network, response policy, and billing

- HTTP redirects to HTTPS. Live responses include HSTS, `nosniff`,
  `strict-origin-when-cross-origin`, and disabled DNS prefetch.
- Content Security Policy, Permissions Policy, and frame-embedding protection
  (`frame-ancestors` or `X-Frame-Options`) are absent.
- HTML, the service worker, and hashed assets all use
  `Cache-Control: public, must-revalidate, max-age=30`; hashed assets are not
  long-lived/immutable. The manifest is served as `application/octet-stream`
  rather than a manifest/JSON MIME type.
- The license verify endpoint correctly returns a CORS-readable, `no-store`
  `{valid:false, reason:"invalid"}` for an invalid token.
- Rate-limit FAIL: 120 sequential rapid requests to
  `GET https://api.sociobot.in/api/v1/products/health-visit-packet/verify`
  completed in about 7.5 seconds; all 120 returned 200. No 429 and therefore no
  `Retry-After` was observed. Observed threshold: greater than 120 requests.
- Purchase FAIL: the advertised `Buy Plus — $9 once` target,
  `GET https://api.sociobot.in/api/v1/products/health-visit-packet/checkout`,
  returns HTTP 404 with `{"error":"enabled factory product","status":404}`
  instead of redirecting to hosted checkout.
- Sign-in checks are not applicable; the product has no account/sign-in flow.

## Defects by severity

### High

1. **The advertised paid purchase is unavailable.** The production checkout
   URL returns 404, so a user cannot buy Plus. This is reproducible independently
   of the static deployment.
2. **The product-unlock API has no demonstrated rate limiting.** A 120-request
   burst returned 200 throughout, with no 429 or `Retry-After`, violating the
   explicit server-endpoint acceptance requirement.
3. **Dark mode fails minimum contrast.** axe reports a serious contrast issue on
   13 nodes. This violates the non-negotiable accessibility and 4.5:1 contract.

### Medium

1. **Removing a result, medicine, or question is immediate and irreversible.**
   There is no confirmation or Undo; the deletion is persisted shortly after.
2. **Modal close buttons do not close the dialogs.** The tested encrypted-export
   close button leaves the modal open because it is a submit button inside a
   required form whose submit handler prevents the dialog's normal close.
   Escape works as a workaround; the restore and license dialogs use the same
   markup pattern.
3. **Malformed-import feedback is visually hidden.** The error text is placed in
   a 1x1 clipped `.sr-only` live region, leaving sighted users with no visible
   explanation or recovery instruction.
4. **The 390 px layout overflows and touch targets are undersized.** The document
   is 401 px wide, and multiple links/inputs plus Remove controls miss the 44x44
   target requirement.
5. **PWA update/caching behavior is incomplete.** The worker is network-first for
   all requests rather than cache-first for assets, uses a fixed `v1` cache with
   no old-cache cleanup, immediately activates/claims, and the app has no
   update-available notification or refresh action.
6. **Required paid-sale legal copy is absent.** The terms do not identify
   Sociobot/Dodo as merchant of record or explain that refunds are handled there
   and revoke the license.

### Low

1. Hashed assets receive only 30-second revalidating cache headers, contrary to
   the long-lived immutable asset policy.
2. CSP, Permissions Policy, and frame protection are absent; the manifest has a
   generic binary MIME type.
3. The README explains building `dist/` but not an actual deployment procedure.

## Disposition

FAIL. Do not promote this candidate as complete. The checkout, API rate limit,
and dark-mode accessibility failures are release-blocking under the supplied
contract; the destructive-action and mobile/accessibility defects should be
fixed before re-verification as well.
