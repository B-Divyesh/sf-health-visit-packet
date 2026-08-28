# Health Visit Packet — visual thesis

## Direction: paper-cut diorama

This is a calm work surface for a high-stakes, short appointment—not a clinical
dashboard. The page is a small tabletop diorama: layered paper sheets, a
medicine bottle silhouette, lab slips, and a tucked question card. It makes the
product's job visible: turn scattered fragments into one portable handoff.
Depth is created with offset paper edges, a limited warm shadow, and clipped
color planes rather than generic cards or gradients.

## Tokens

- Background `#F6F0E6` (warm oat paper); surface `#FFFDF8`; ink `#24343A`;
  muted `#526068`.
- Evergreen `#176B5B` is the primary action; its ink-on-light companion is
  `#DCEFE8`. Clay `#B94E36` marks cautions and removal; marigold `#D89A22`
  marks source notes. All body text is dark ink on pale paper (at least 4.5:1).
- Dark treatment: `#172426` canvas, `#233638` surfaces, `#F7F2E7` ink, and
  lighter `#8FE1CC` sage for text/icons. Filled actions retain `#176B5B` with
  white type. Separating text accent from action fill keeps every role at AA
  contrast rather than mechanically reusing the light palette.
- Typography: `Georgia, 'Times New Roman', serif` for human, readable packet
  titles; `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  for compact editing controls. This needs no remote font or extra payload.
- Space follows a 4/8px rhythm: 8, 12, 16, 24, 32, 48, 64. Rounded corners are
  modest (8–18px); sheets are not pill-shaped.

## Interaction and motion

The packet preview is a literal sheet. New entries appear as a layer settling
onto it (180ms opacity/translate); save feedback is textual and immediate.
Removal feedback appears as a low, anchored paper-slip notice with an eight
second Undo action; service-worker updates use the same anchored grammar with
an explicit refresh action.
On reduced motion, every state change is instant. Keyboard focus is a clear
evergreen outline. The phone layout keeps the packet preview above the editor
and stacks all controls, rather than hiding the job.

## Original image plan and provenance

One original, non-diagnostic decorative hero image shows a paper-cut appointment
packet on a desk: no people, medical claims, text, brands, logos, or watermark.
It is generated with the factory image model, inspected for artifacts, converted
to WebP, and used only as an explanatory visual (the usable application starts
immediately below it). Generated imagery is disclosed in the footer.

Prompt sheet: *editorial paper-cut diorama of a blank patient visit packet,
small unbranded amber medicine bottle, three blank lab slips, question card and
pencil arranged on a warm oat paper tabletop; stacked cut-paper layers, forest
green, seafoam, clay red and muted marigold palette, soft raking studio light,
orthographic product photography, fine paper fiber; no text, no watermark, no
logos, no people, no realistic medical imagery, no gradients.*

Asset provenance: factory-image Azure AI Foundry generation, 2026-08-28; this
prompt and its generated output are original to Health Visit Packet.
