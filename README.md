# FireDesignTool

Showroom-grade, dimensionally accurate visualization built from deterministic,
manufacturer-sourced product material.

The current approved catalog contains all 27 current FPX gas models plus the
complete three-model FPX wood-fireplace lineup:

- Fireplace Xtrordinair 564 TRV 25K Deluxe and Clean Face Deluxe (`98500277`,
  `98500278`)
- Fireplace Xtrordinair 564 TV 35K Deluxe and Clean Face Deluxe (`98500297`,
  `98500298`), with four official Designer faces on each Deluxe model
- Fireplace Xtrordinair 864 TRV 31K Clean Face Deluxe (`98500187`)
- Fireplace Xtrordinair 864 TRV 31K Deluxe (`98500186`) with two arched and
  two rectangular official designer faces
- Fireplace Xtrordinair 4237 Ember-Glo Clean Face Deluxe (`98500344`)
- Fireplace Xtrordinair 864 TV 40K Deluxe and Clean Face Deluxe
  (`98500188`, `98500189`), plus the 4237 designer-face/IronWorks variant
- Fireplace Xtrordinair 4415 and 6015 High Output premium linear fireplaces
- ProBuilder traditional: 36 Clean Face MV, GSB, Deluxe, and See-Thru Deluxe,
  plus 42 Clean Face Deluxe
- ProBuilder linear: 42 Deluxe, 54 Deluxe, 72 GSB, and 72 Deluxe
- Gas inserts: 32 DVS Deluxe Ember-Glo, 430 Deluxe Ember-Glo, 430 Mod-Fyre,
  34 DVL Deluxe Ember-Glo, 616 Deluxe Ember-Glo, and 616 Mod-Fyre
- Wood fireplaces: 42 Apex NexGen-Hybrid with Metropolitan, Universal, and
  Timberline faces; 36 Elite NexGen-Hybrid with Classic Arch single/double
  door and Artisan single-door combinations; and 44 Elite NexGen-Hybrid with
  Classic Arch and Artisan double-door combinations
- Model-scoped FireBuilder fireback selectors with 125 exact official
  configurations across the supported gas lineup
- Muted, automatically looping official Travis Industries burn footage for the
  564 variants, 864 TV 40K variants, and 4237 Clean Face, enabled only on the
  exact fireback shown in each video, with complete offline playback
- Centurion Stone's complete published visual library: 122 official color
  swatches across all 39 current pattern lines, with family-first browsing,
  pattern/joint filters, exact verified codes, and no synthesized colorways
- Centurion #860 hearthstones mapped to the closest official accessory-color
  reference for every stone selection and laid out across the exact selected
  stone-field width with centered field cuts
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

The current release includes a separate customer-room workspace around the same
approved catalog. A salesperson can upload a room photograph, mark the intended wall in
perspective, enter its measured width, and project the current fireplace,
stone, mantel, and hearth configuration into the photograph. Insert-only mode
preserves the existing surround; full-remodel mode renders the complete feature
wall. Insert-only projects add a second four-corner calibration for the actual
existing firebox opening plus its measured width and height. The appliance face
is then scaled and perspective-aligned from that opening instead of the overall
wall. Opening depth and rear width are recorded separately for fit screening
and the PDF handoff; they are never inferred from the photograph. The workspace
includes before/after comparison, high-resolution JPEG
export, automatic project recovery after a refresh, and manually traced
foreground restoration. Foreground outlines preserve original room pixels over
the projected design for furniture, fireplace tools, décor, or other objects
that should remain visually in front without generative inpainting.

The local Room Cleanup Studio adds reversible removal masks for clutter that
sits against a painted wall. Each mask reconstructs the surface from neighboring
paint color, room-light falloff, and restrained texture, while the calibrated
wall boundary protects the finished floor and adjoining architecture. Complex
surfaces can clone a nearby operator-selected clean sample or use a same-angle
clean photograph supplied by the operator; none of these workflows uploads
customer photography or calls an AI service.

Full-remodel projects can add measured millwork independently on the left and
right of the stone field. Each side supports a framed bookcase with optional
base cabinets or a floating-shelf layout, plus configurable width, height,
shelf count, gap, and representative warm-white, white-oak, walnut, or charcoal
finish. The renderer preserves the original photographed wall outside the
selected stone field, flags and constrains overlapping layouts, and renders a
raised hearth as separately projected top, nosing, end caps, joints, contact
shadow, and riser surfaces instead of a flat wall texture.

Each customer project stores its own complete fireplace, face, stone, mantel,
hearth, and dimensional configuration. Opening one project cannot inherit the
last design used for another customer. The project library can be downloaded as
a versioned `.firedesign` backup containing the room photographs and all project
data. Restore verifies SHA-256 integrity before one atomic IndexedDB write;
existing project IDs are preserved and an imported collision is saved as a
clearly named copy rather than overwritten.

The library reports whether its last complete backup still matches every saved
project. Browser quota is checked before any new photograph or restored library
is written, with a reserved safety margin; insufficient capacity rejects the
new write without changing existing customer work. Operator diagnostics reports
remaining project capacity and whether the browser considers origin storage
persistent or browser-managed.

Measured insert-fit screening is tied to the selected approved catalog product,
not merely to insert-only photo mode. A built-in fireplace visual therefore
states that no insert-fit result is available. Once an insert passes the visual
asset gate and enters the approved catalog, the room workspace compares all of
its exact manufacturer variants, reports passing, failing, and incomplete
profiles separately, and carries the conservative result into the PDF handoff.
No profile can pass while one of its required opening measurements is unknown.

Room photographs preserve up to a 4096-pixel edge and 12 megapixels and are
stored locally in the browser's IndexedDB. Perspective-projected wall and insert
layers use a single GPU homography at a destination-aware pixel density instead
of a visible Canvas triangle mesh or a fixed low-resolution working size. Editor
guides live in a separate SVG layer and can never enter a presentation or
export. Photographs are not uploaded or sent to an external service in this
release. Named projects appear newest-first in the local project library.
Returning to the library never deletes work, replacing a photograph preserves
the project identity, and deletion requires a second explicit confirmation.

The complete measured wall width and a four-corner wall plane are required
before a full remodel is labeled dimensionally scaled. Insert-only projects
also require a measured four-corner existing opening. Version 1 through version
7 customer room records migrate automatically to the new schema without losing
their photo or available configuration. Missing depth and rear-width
measurements remain explicitly unknown. This remains a conceptual sales
visualization, not an installation or fit approval.

## Run locally

Requirements: Node.js 22 or newer and a WebGL-capable Chromium, Edge, or
Safari browser.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The production app installs a service worker
after the first verified load and caches the shared scene plus the selected
fireplace pack for offline use. Operator diagnostics can verify and install the
complete approved catalog on a dedicated showroom computer.

## Quality commands

```bash
npm run assets:manifest
npm run assets:preflight-package -- /path/to/delivery/manifest.json
npm run catalog:validate
npm run verify
npm run test:e2e
npm run audit:production
```

`npm run assets:manifest` must leave the worktree clean. Any changed checksum
means the approved visual release changed and requires a fresh review.

Manufacturer/dealer visual deliveries must first use the package contract in
[VISUAL_DELIVERY.md](./VISUAL_DELIVERY.md). A passing automated report is intake
evidence only; it never replaces manual identity, licensing, dimensional, 4K,
or physical-sample approval.

## Architecture

- `src/catalog/releases` contains immutable approved catalog snapshots. Adding
  a manufacturer or product no longer requires extending a TypeScript enum.
- `src/catalog/intakeSchema.ts` and `src/catalog/intakeRegistry.ts` hold the
  manufacturer-neutral pre-release gates. The current queue indexes 90 FPX,
  Superior, and Majestic fireplace/insert families while exposing all 27
  current marketed FPX gas models and all three current FPX wood fireplaces.
  FPX inserts, Superior DRI2000, and Majestic Ruby Platinum have verified
  model-specific opening, clearance, facade, surround, and manual evidence.
  Ruby Platinum remains hidden until an approved isolated high-resolution
  visual master is available. Its mantel rules are explicitly referenced
  to the top of the surround opening, matching its current manual.
- `src/domain/catalogRepository.ts` validates release integrity, partitions
  shared assets from exact fireplace, stone, and mantel-finish design packs, and is the only product
  lookup boundary used by configuration, renderers, controls, and exports.
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
- `scripts/sync-centurion-stones.mts` audits the 39 official pattern pages and
  reproducibly prepares the local wall, relief, thumbnail, and hearth assets.

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

- All four 564 variants: a 6-inch-deep shelf requires a 37-inch minimum and an
  8-inch-deep shelf requires a 37-1/2-inch minimum above the fireplace base.
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

The 564 release combines official transparent 1800-pixel face layers with
lossless 4603- and 4870-pixel Travis firebox photography. Older 864 and 4237
face composites retain their recorded lower-resolution source limitation and
remain subject to the 4K manual review gate. The software does not disguise
source limitations with generative enhancement.

See [ASSET_SOURCES.md](./ASSET_SOURCES.md) for provenance and
[CATALOG.md](./CATALOG.md) for the intake contract, and
[VISUAL_MASTER_REQUEST.md](./VISUAL_MASTER_REQUEST.md) for the manufacturer
delivery specification. See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) for
promotion gates.
