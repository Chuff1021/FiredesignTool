# FireDesignTool

Showroom-grade, dimensionally accurate visualization built from deterministic,
manufacturer-sourced product material.

The current approved catalog contains:

- Fireplace Xtrordinair 864 TRV 31K Clean Face Deluxe (`98500187`)
- Fireplace Xtrordinair 864 TRV 31K Deluxe (`98500186`) with two arched and
  two rectangular official designer faces
- Fireplace Xtrordinair 4237 Ember-Glo Clean Face Deluxe (`98500344`)
- Muted, automatically looping official Travis Industries burn footage: Classic
  Oak for both 864 variants and Birch for the 4237, with matching local posters
  and offline fallback
- Centurion Stone Kentucky Ledge (`150-260-15`) and Brown Ledge (`150-200-25`)
- Centurion #860 hearthstones in matching Kentucky and Brown colors, laid out
  across the exact selected stone-field width with centered field cuts
- Pearl Mantels Zachary Smooth shelves in Whitewash and Graywash and Zachary
  Wood Look in Little River, each in 48-, 60-, 72-, and 84-inch lengths
- Pearl Mantels Linear non-combustible shelves in the official 60- and 84-inch
  sizes and Pearl, Graphite, Mocha, Onyx, and Saddle finishes
- Pearl Mantels Tavern Timbered Beam non-combustible shelves in 60- and
  72-inch lengths and Fieldstone, River Rock, Toasted Rye, and Wheat finishes
- Pearl Mantels Natural Cut Stone non-combustible shelves in 60-, 72-, and
  84-inch lengths and Mist, Dusk, Arctic Blast, and Greystone finishes

The tool does not generate, invent, or substitute product imagery.

## Customer Room Designer

Version 0.7 includes a separate customer-room workspace around the same approved
catalog. A salesperson can upload a room photograph, mark the intended wall in
perspective, enter its measured width, and project the current fireplace,
stone, mantel, and hearth configuration into the photograph. Insert-only mode
preserves the existing surround; full-remodel mode renders the complete feature
wall. The workspace includes before/after comparison, high-resolution JPEG
export, and automatic project recovery after a refresh.

Room photographs are resized to a maximum 2560-pixel edge and stored locally in
the browser's IndexedDB. They are not uploaded or sent to an external service in
this release. Use **Close project** to delete the active customer photograph
from local project storage.

The complete measured wall width and a four-corner wall plane are required
before the result is labeled dimensionally scaled. This remains a conceptual
sales visualization, not an installation or fit approval.

## Run locally

Requirements: Node.js 22 or newer and a WebGL-capable Chromium, Edge, or
Safari browser.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The production app installs a service worker
after the first verified load and caches the exact release for offline use.

## Quality commands

```bash
npm run assets:manifest
npm run catalog:validate
npm run verify
npm run test:e2e
npm run audit:production
```

`npm run assets:manifest` must leave the worktree clean. Any changed checksum
means the approved visual release changed and requires a fresh review.

## Architecture

- `src/catalog/releases` contains immutable approved catalog snapshots. Adding
  a manufacturer or product no longer requires extending a TypeScript enum.
- `src/domain/catalogRepository.ts` validates release integrity and is the only
  product lookup boundary used by configuration, renderers, controls, and
  exports.
- `src/domain` contains product schemas, product-specific mantel rules,
  physical constraints, and inch-based calculations.
- `src/lib` owns asset readiness, integrity verification, state migration, and
  persistence, including local customer-project recovery.
- `src/store` is the validated local configuration boundary.
- `src/components/FeatureWallCanvas.tsx` implements the stable dimensional
  scene. One Three.js unit equals one physical inch.
- `src/components/FireboxMedia.tsx` owns first-frame-safe video playback,
  visibility pause/resume, one-shot recovery, and approved-poster fallback.
- `src/components/FireDesignApp.tsx` owns startup gating, offline readiness,
  fullscreen mode, diagnostics, and recovery.
- `src/components/CustomerRoomViewport.tsx` owns room-photo intake, guided
  calibration, before/after presentation, and export.
- `src/lib/roomRenderer.ts` produces the deterministic, perspective-projected
  room composite without sending product pixels through a generative service.
- `assets-source` preserves the exact official inputs.
- `scripts/prepare-assets.mjs` performs deterministic cropping, compositing,
  texture preparation, and relief-map generation.

The WebGL surface is dynamically imported and kept behind
`FeatureWallCanvas`, so a projector route can reuse it without rewriting the
version 1 renderer.

## Product and safety notes

Wall width and centered stone-field width are independent. The stone field has
a 50-inch minimum and is not automatically widened to the mantel. An optional
raised hearth follows the fireplace elevation and always matches the selected
stone width exactly. Full 18-inch Centurion #860 caps are centered, with equal
field-cut end caps where the selected width is not an exact multiple.

Mantel placement is measured from the fireplace base, matching the datum in
the selected Travis Industries installation manual:

- Both 864 variants: an 8-inch-deep shelf requires a 44-3/4-inch minimum
  height and a 9-inch-deep shelf requires a 45-3/4-inch minimum above the
  fireplace base.
- 4237: an 8-inch-deep shelf requires a 57-inch minimum height above the
  fireplace base.

The tool displays the fireplace manual’s published combustible-mantel
reference, but it does not constrain placement of the cataloged ASTM E136
non-combustible Pearl shelves. This showroom override is for visualization
only. Confirm the current fireplace manual, the shelf instructions, the
complete wall assembly, and local code before installation. It is a sales aid,
not an installation approval.

The isolated official product layers remain below the required resolution for
a final 4K release. The largest processed layers are 624×468, 660×570, and
600×518 pixels. They are suitable for configurator and scale validation, but
**this release remains preview-only for 4K customer presentation until
approved higher-resolution isolated product masters or usable manufacturer
CAD/BIM files are supplied**. The software does not disguise that limitation
with generative enhancement.

See [ASSET_SOURCES.md](./ASSET_SOURCES.md) for provenance and
[CATALOG.md](./CATALOG.md) for the intake contract, and
[RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) for promotion gates.
