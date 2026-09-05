# Health Visit Packet

Build a compact packet for one health visit. It is for patients preparing from
results, medicine labels, portal notes, and questions kept in several places.

The free builder keeps sources and dates beside selected values. It prints the
visible packet, exports plain JSON, and creates an encrypted backup that can be
restored later. It does not retrieve portal records or provide medical advice.

Try the isolated sample at
[`/demo`](https://health-visit-packet.sociobot.in/demo). It contains a realistic
visit, two results, two medicines, and two questions. Demo changes use the
separate `demo:health-visit-packet` IndexedDB database. **Reset demo** restores
the sample. **Start for real** deletes that demo database before opening the
real workspace.

## Storage and privacy

Packet data uses the `health-visit-packet` IndexedDB database on the current
device. A Plus license token and its cached result use namespaced localStorage.
The site needs no account and loads no analytics, trackers, remote fonts, or
third-party scripts. Packet use works offline after the first visit.

See [Privacy](/privacy/) and [Terms](/terms/).

## Run and verify

Use Node 22 and npm 10 from a clean checkout:

```sh
npm ci
npm run lint
npm test
npm run build
```

`npm test` runs unit and Playwright browser checks. Every public product claim
is listed in `.factory/claims.json`; run them together with:

```sh
npm run test:claims
```

`npm run build` creates `dist/` with `index.html` at its root. Preview the
production artifact with `npm run preview`.

## Deploy

The factory deploys a clean `main` checkout with:

```sh
/opt/fleet/lib/deploy-static.sh health-visit-packet dist
```

`public/staticwebapp.config.json` defines the `/demo` rewrite, designed 404,
security headers, MIME types, and cache policy. DNS, billing registration, and
the shared billing API are managed outside this repository.

## Plus

Plus costs $9 once and adds a personal cover note to the printable packet. The
builder, accessibility features, safety steps, backups, and exports stay free.
Checkout and license verification use the Sociobot billing API.

The visual rationale and original image provenance are in
`.factory/design.md`. This project is licensed under the MIT License.
