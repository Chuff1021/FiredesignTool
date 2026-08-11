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

The repository indexes records once, validates every lookup, and derives both
the shared scene assets and an exact pack for each fireplace. Startup verifies
only the selected design; the complete unique asset list remains available for
an operator-initiated full offline installation.

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
assets, and 4K visual review have passed. The registry currently covers 90
fixed-fireplace and insert families: 41 FPX, 30 Superior, and 19 Majestic.

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

Run `npm run catalog:audit-sources` before accepting refreshed manufacturer
evidence. It checks every approved or document-verified official page, manual,
image, and configurator endpoint for HTTP success and the expected payload
type; an HTML error page returned with status 200 still fails. Add `-- --all`
for the periodic full audit of source-indexed product pages. The network audit
is intentionally separate from deterministic offline builds. GitHub Actions
runs the full audit weekly, whenever catalog-source code changes on `main`, and
for catalog-related pull requests. Each run retains a JSON evidence report for
90 days. A failed network audit blocks catalog promotion, but it does not make
the installed showroom application or its Vercel build depend on a manufacturer
website being available.

Release `2026.08.11-2` contains all 27 models and factory variants in FPX's
current marketed gas-fireplace and gas-insert collections plus all three
current wood fireplaces as checked on 2026-08-11: ten premium traditional fireplaces, two premium linear fireplaces,
five traditional ProBuilder fireplaces, four linear ProBuilder fireplaces, and
six gas inserts, plus the 42 Apex, 36 Elite, and 44 Elite NexGen-Hybrid wood
fireplaces. Current marketing status and current factory availability are
stored separately, so the 430 Mod-Fyre can be labeled limited stock and the 616
Mod-Fyre factory sold out without silently removing either current marketed
model. ProBuilder 24, 564 TV High Output, and 3615 High Output remain in the
legacy intake list. The 4415 See-Thru is explicitly classified as discontinued
per dealer confirmation on 2026-08-11. None appear as current products.

Every live appliance has a stable model ID, official SKU where published,
manufacturer visual, published viewing area, and manual-referenced mantel
curve. The four 564 variants retain their local official burn loops; the 25K
loop has a model-specific media registration that corrects the source camera's
left-heavy framing without moving or scaling the face, glass opening, or
physical appliance. Newly added models use exact static Travis/FireBuilder
composites until a model-specific burn loop and transparent opening receive a
separate visual approval.

The same release adds 125 exact, locally packaged FireBuilder fireback
configurations. The selector is scoped to each appliance: the 564 and 864
families expose eight current choices, the 4237 Clean Face exposes five, and
the ProBuilder, premium linear, and insert models expose only their current
FireBuilder options. The 4237 IronWorks variant and wood fireplaces retain a
single verified factory interior because FireBuilder does not publish an
alternate fireback set for those exact products. A burn loop is enabled only
when its photographed fireback matches the selected option; every other choice
uses the exact official static configuration instead of compositing flames over
an interior that was not filmed.

The wood records preserve each current FireBuilder face/door combination and
manual-specific requirements rather than applying one generic wood rule. The
42 Apex requires a non-combustible mantel at least 47-3/8 inches from the
fireplace base and a 44-inch minimum hearth. The 36 and 44 Elite manuals give
non-combustible mantels no minimum height, while their combustible reference is
23 inches above the faceplate; both Elite models require a 60-inch hearth.
Wood hearths are locked on in the designer and use each manual's forward
extension, R-value, and maximum raised-height data.

The 32 DVS, 430, 34 DVL, and 616 Ember-Glo inserts retain their
manual-published masonry-opening profiles, glass areas, surround projections,
facing requirements, hearth relationships, base-referenced mantel curves, and
current FireBuilder option SKUs. The 32 DVS and 34 DVL keep separate
standard-face and arched-face depth requirements for both trimmed and
untrimmed installations. Insert-fit screening remains conservative and never
reports a fit while a required opening measurement is missing.

The insert-fit screening domain compares the four measured masonry-opening
dimensions against each exact manufacturer variant. It reports per-dimension
margins and deficits, rules out a profile as soon as any known dimension is too
small, and never reports a fit while a required field measurement is missing.
This is conservative sales screening only; final fit, venting, clearances, and
installation remain subject to onsite verification.

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
