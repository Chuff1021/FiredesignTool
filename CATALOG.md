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

Manufacturer-document evidence stores the clearance rule itself, not only a
manual URL and page number. Mantel profiles identify the physical measurement
datum, material classification, projection, and minimum clearance in inches.
Optional side-wall and hearth records capture their own datums, minimum gaps,
thickness, and elevation/extension pairs. Validation rejects duplicate material
profiles, unsorted projection points, and any curve whose required clearance
decreases as projection increases.

Visual-master evidence is similarly measurable. Every verified family declares
its minimum pixel dimensions, isolation requirement, transparent firebox-opening
requirement, and each current official candidate's exact dimensions and source
type. Validation rejects a claimed approval unless at least one recorded
candidate meets every requirement, and it rejects stale maximum-resolution
claims that do not match the candidate records.

Run `npm run catalog:validate` before every preview. The command validates the
approved release and intake mapping, then independently checks every packaged
asset against the release manifest, byte size, and SHA-256 checksum. A live
catalog product missing from the intake snapshot—or an incomplete intake item
mapped into the live catalog—fails validation.

The 564 TRV 25K designer-face and clean-face models were the first FPX batch
to reach `documents-verified`. Their official SKUs, FireBuilder IDs, viewing
area, current installation manuals, mantel-rule page, and visible option SKUs
are recorded. The 616 Deluxe Ember-Glo is the first FPX insert to reach the
same gate. Its two manual-published masonry-opening profiles, glass area,
surround projection, fireplace-interior clearances, facing requirements,
hearth relationship, base-referenced mantel curve, and current FireBuilder
option SKUs are structured for the room designer. These products remain
blocked from the live catalog because their public isolated FireBuilder masters
are only 900-960 px and do not pass the 4K visual gate.

Superior DRI2000 is the first non-FPX family at `documents-verified`. Its
current English installation manual is P/N 900787-04, revision H, October 2024.
The intake records both DRI2027 and DRI2032TEN identifiers, minimum front/rear
opening width, height, depth, the required 3-inch front-width depth, combustible
mantel and hearth-rule page, and every manual-listed full facade and four-sided
surround. The only public manufacturer photographs are 1136x852 lifestyle
images rather than isolated product masters, so the family remains blocked at
the high-resolution asset gate.

Majestic Ruby Platinum is also `documents-verified` for its 30- and 35-inch
variants. Its current manual data records viewing areas, minimum masonry
openings, official fronts and surrounds, the combustible and non-combustible
mantel profiles measured from the top of the surround opening, and the hearth
gaps measured from the appliance base. Its public isolated product imagery
tops out at 2000 px and remains blocked from the 4K approved catalog.
