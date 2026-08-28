# Health Visit Packet

Health Visit Packet is a private, browser-only workspace for patients preparing
for an appointment. Add selected results with source/date, medicines, and
questions, then print a compact handoff or download an encrypted backup. It is
not medical advice and it does not retrieve records from portals.

Everything is stored in IndexedDB on the current device by default. There are
no accounts, analytics, remote fonts, or third-party scripts.

## Run and verify

```sh
npm install
npm run dev
npm run lint
npm test
npm run build
```

`npm run build` creates the static deployment in `dist/`, with `index.html` at
its root. Preview it locally with `npm run preview`.

## Deploy

Deployment is performed by the factory from a clean `main` checkout. After the
verification commands above pass, deploy the existing static artifact class:

```sh
/opt/fleet/lib/deploy-static.sh health-visit-packet dist
```

The checked-in `public/staticwebapp.config.json` supplies production security,
MIME, navigation fallback, and immutable hashed-asset caching policy. DNS,
billing registration, and shared API infrastructure are managed outside this
repository.

## Use

Enter visit details, add source-labelled observations, medicines, and questions.
Use **Print or save as PDF** after reviewing the packet. **Download encrypted
bundle** encrypts a portable copy using a passphrase you choose; the passphrase
is never sent anywhere. Plain JSON is available for data ownership and should
only be used where you can keep the file private.

See [Privacy](/privacy/) and [Terms](/terms/). The design rationale and original
illustration provenance are recorded in `.factory/design.md`.
