# Health Visit Packet demo

## Entry point

- Live: `https://health-visit-packet.sociobot.in/demo`
- Local production preview: `http://127.0.0.1:4173/demo`

The landing-page **Try it with sample data** link opens this route in one click.
The route title is `Demo — Health Visit Packet`.

## Shipped sample

The sample belongs to fictional patient Maya Patel and includes:

- an upcoming primary-care visit and a reason for the visit;
- an HbA1c result from a lab portal;
- a blood-pressure average from a home cuff log;
- Metformin and Vitamin D3 with dose, schedule, and source; and
- two clinician questions with useful context.

The sample makes no diagnosis or treatment recommendation.

## Isolation and reset

Real packet data uses IndexedDB database `health-visit-packet`. Demo data uses
the separate IndexedDB database `demo:health-visit-packet`. Demo mode never
opens the real database and never reads or writes the localStorage license keys.

The persistent banner reads **Demo — sample data, nothing is saved**. **Reset
demo** replaces the demo database value with the shipped sample. **Start for
real** deletes the demo database and then opens `/`; the real packet remains
unchanged. Header and footer links that leave demo mode clear the demo first.

The service worker precaches `/demo`, so the populated sample and demo database
can be reloaded offline after the first online visit.

## Verification

Run the demo isolation and offline outcome checks with:

```sh
npm run test:claims -- --grep @claim:demo-isolation
npm run test:claims -- --grep @claim:offline-reload
```
