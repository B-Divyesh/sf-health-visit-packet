# Health Visit Packet handoff

## Delivered

- A browser-only packet builder for visit details, source-labelled results and
  observations, medicines, and clinician questions.
- Live printable packet with an explicit data-minimisation reminder and native
  browser “Print / Save as PDF” flow.
- IndexedDB persistence, plain JSON ownership export, AES-256-GCM encrypted
  bundle download and passphrase restore (PBKDF2, 210,000 iterations).
- Offline PWA shell and service worker; the Playwright check creates a packet,
  reloads once to cache its shell, takes the browser offline, reloads, and
  verifies the saved packet remains visible.
- Optional $9 one-time Plus cover-note unlock using the Sociobot checkout and
  license verification contract. Core data entry, access, accessibility and
  exports remain free.
- Privacy and terms pages, self-hosted/no-remote-font design, generated
  paper-cut illustration, original app icons, and generated-asset provenance.

## Verification

Ran on 2026-08-28:

```sh
npm test
npm run build
```

- Vitest: 2/2 encryption round-trip/wrong-password checks passed.
- Playwright: source-labelled packet creation, IndexedDB persistence, and
  `context.setOffline(true)` reload passed.
- Build output: `dist/index.html` at deploy root; JS 16.57 KB (6.08 KB gzip),
  CSS 9.89 KB (3.14 KB gzip), hero WebP 20 KB. These are comfortably within
  the static performance budgets.
- Mobile visual smoke test at 390×844 completed with the packet preview,
  controls, and export area stacked and usable. Semantic title/lang/main,
  h1, labels, keyboard focus styling, reduced-motion rule, and alt text are
  present in the shipped UI.

## Known gaps / next steps

- Native browser print is intentionally used for PDF generation, so exact PDF
  controls vary by browser/OS.
- First offline use still requires one successful online load to install the
  PWA shell. No clinical advice, OCR, portal scraping, or provider messaging
  is included by design.
- The factory must register the paid product before the checkout link can sell
  the optional Plus unlock in production.
