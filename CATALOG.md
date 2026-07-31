# Catalog Intake Contract

FireDesign uses immutable, runtime-validated catalog releases. Customer-facing
code reads products only through `catalogRepository`; renderers and controls do
not import manufacturer arrays directly.

## Release structure

Each approved snapshot lives in `src/catalog/releases` and declares:

- A unique release ID, semantic date/version, effective timestamp, and
  `approved` status.
- Registered brands and the product kinds licensed from each brand.
- Appliances, visible options, stone products, mantels, finishes, dimensions,
  clearance rules, and local asset provenance.

Published release modules are never edited in place. Corrections or additions
create a new release module and update the single approved-release import after
review. Saved configurations record the release version and migrate through
stable product IDs.

## Appliance requirements

Every appliance must provide:

- Stable lowercase ID, official manufacturer, brand ID, model, SKU, lifecycle
  status, appliance type, fuel, and style.
- Published viewing-area dimensions.
- Every offered visual face/trim with SKU, physical dimensions, media opening,
  official layer, transparent overlay, and exact media mask.
- A manual-sourced mantel rule with datum, manual URL, page, revision, points,
  and reviewer-readable note.
- Approved local video/poster media with codec, duration, log/media set, source
  URL, and source timecode.

IDs describe the product and remain stable when marketing names change. A
retired SKU is removed only in a new release and receives an explicit saved-
state migration when necessary.

## Integrity gate

`catalogReleaseSchema` rejects:

- Duplicate brand, product, SKU, finish, stone, or per-appliance face IDs.
- Products referencing an unregistered brand.
- Missing default faces or mantel finishes.
- One-sided mantel/finish compatibility mappings.
- Duplicate offered mantel widths.
- Invalid IDs, dimensions, URLs, local paths, statuses, or classifications.

The repository indexes records once, validates every lookup, and derives the
complete unique asset list used by readiness checks and the offline cache.

## Intake workflow

1. Capture the current official product index and effective date.
2. Obtain written asset authority plus official manuals, CAD/BIM, imagery, and
   video.
3. Prepare deterministic local assets and record every source URL and retrieval
   date.
4. Enter a draft model in a new release package.
5. Verify dimensions, manual datum, visible options, and compatibility against
   official documentation.
6. Run `npm run assets:manifest`, `npm run verify`, and browser regressions.
7. Review every visual option at 1080p, 1440p, and 4K.
8. Change the approved-release pointer only after technical and visual signoff.
9. Deploy a preview, verify the exact artifact, and retain the previous release
   for rollback.

Models lacking sufficient official imagery, current manuals, or asset rights do
not enter an approved release.

## Current cross-brand intake registry

`src/catalog/intakeRegistry.ts` validates the dated current snapshots for
Fireplace Xtrordinair, Superior Fireplaces, and Majestic as one registry. It
intentionally separates discovery from approval: an indexed product never
appears in the showroom until its manuals, dimensions, options, local visual
assets, and 4K visual review have passed. The registry currently covers 85
fixed-fireplace and insert families: 36 FPX, 30 Superior, and 19 Majestic.

The Superior and Majestic snapshots are the first manufacturer-neutral intake
batch. They focus on installed gas fireplaces and gas inserts from the official
current category indexes; outdoor products, freestanding stoves, and gas-log
sets are outside this batch. The first five non-FPX insert families are
Superior DRI2000 and Majestic Jasper, Ruby, Trilliant, and Ruby Platinum.

`src/catalog/intakeSchema.ts` owns common stages, fuel, appliance, style, and
venting classifications plus two verified-evidence forms: configurator-backed
evidence for Travis FireBuilder and manufacturer-document evidence for other
brands. It rejects brand drift, duplicate snapshots, duplicate product IDs,
cross-brand live mappings, and any attempt to advance a product without the
required evidence or visual master.

Run `npm run catalog:validate` before every preview. The command validates the
approved release and intake mapping, then independently checks every packaged
asset against the release manifest, byte size, and SHA-256 checksum. A live
catalog product missing from the intake snapshot—or an incomplete intake item
mapped into the live catalog—fails validation.

The 564 TRV 25K designer-face and clean-face models are the first FPX batch
to reach `documents-verified`. Their official SKUs, FireBuilder IDs, viewing
area, current installation manuals, mantel-rule page, and visible option SKUs
are recorded. They remain blocked from the live catalog because the public
isolated FireBuilder masters are only 900 px and do not pass the 4K visual gate.
