# Manufacturer asset sources

Every customer-facing product visual is derived from manufacturer-published
material retrieved or reverified through 2026-08-05. No generative image system is used.

## Fireplace Xtrordinair

### 564 TRV 25K and 564 TV 35K

- Appliance SKUs: Designer `98500277` / Clean Face `98500278` for 25K;
  Designer `98500297` / Clean Face `98500298` for 35K
- Published viewing area for all four models: 29-3/8 in W × 16-3/8 in H
- Official 1800 px FireBuilder face layers: Classic Arch `95400402`, French
  Country `95400408`, Metropolitan `95400411`, and Rectangle Double Door
  `95400467`
- Official 1800 px Clean Face trim: `95900370`
- 25K lossless Oak/handmade-brick master:
  `https://www.travisindustries.com/download/Dragon/56425K_LogSets/Oak/564SSCF_OakLogs_HandMadeBrick_S_ON_638.tif`
- 35K lossless Oak/handmade-brick master:
  `https://www.travisindustries.com/download/Dragon/564_35K_Images/Oak/564_35K_Oak_Handmade_S_674.tif`
- Installation manuals: `100-01564` page 47, `100-01565` page 42,
  `100-01551` page 42, and `100-01552` page 37; all revision 2024-04-02
- Mantel datum: fireplace base. A 6-inch projection requires 37 inches and an
  8-inch projection requires 37-1/2 inches above the base.

The exact transparent openings are extracted from each official face or trim
layer. The lossless product photography supplies a sharp 1880 × 1048 Oak
fallback inside the calibrated glass area; no product pixels are generated.

### 864 TRV 31K Clean Face Deluxe

- Appliance SKU: `98500187`
- Official FireBuilder layer:
  `https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500187_94500721.png`
- Published viewing area: 34-1/4 in W × 22-1/4 in H
- Product page:
  `https://www.fireplacex.com/product/864-trv-31k-clean-face-deluxe/`
- Installation manual:
  `https://www.travisindustries.com/docs/100-01483.pdf`
- Mantel rule: revision 2023-04-12, page 43; 8-inch depth requires
  44-3/4 inches from fireplace base to mantel bottom

### 864 TRV 31K Deluxe

- Appliance SKU: `98500186`
- Official base layer:
  `https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500186_94500721.png`
- Official face layers:
  - Classic Arch, `99300497`
  - Arched French Country, `95800616`
  - Metropolitan, `95800623`
  - Rectangle Double Door, `95800743`
- FireBuilder face path:
  `https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/{FACE_SKU}.png`
- Product page: `https://www.fireplacex.com/product/864-trv-31k/`
- Installation manual:
  `https://www.travisindustries.com/docs/100-01482.pdf`
- Mantel rule: revision 2023-04-12, page 46; 8-inch depth requires
  8 inches above the fireplace face, equal to 44-3/4 inches above its base

### 4237 Ember-Glo Clean Face Deluxe

- Appliance SKU: `98500344`
- Official FireBuilder layer:
  `https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500344_96100884_94500982.png`
- Published viewing area: 39-7/8 in W × 34-7/8 in H
- Product page:
  `https://www.fireplacex.com/product/4237-ember-glo-deluxe/`
- Installation manual:
  `https://www.travisindustries.com/docs/100-01561.pdf`
- Mantel rule: revision 2026-06-09, page 35; 8-inch depth requires
  57 inches from fireplace base to mantel bottom

The FireBuilder layers are composited and cropped without resynthesis. Their
official face and trim pixels are isolated above the published glass opening.

### Complete current FPX gas catalog

Release `2026.08.04-2` adds locally packaged, exact official product
composites for the remaining current gas scope:

- 864 TV 40K Deluxe and Clean Face Deluxe, with Classic Arch, French Country,
  Metropolitan, Rectangle Double Door, and clean-face configurations
- 4237 Ember-Glo Deluxe with IronWorks Double Door
- 4415 and 6015 High Output Deluxe
- ProBuilder 36 MV, GSB, Deluxe, and See-Thru; ProBuilder 42 traditional
  Deluxe; and ProBuilder 42, 54, and 72 linear models
- 32 DVS, 430, 430 Mod-Fyre, 34 DVL, 616, and 616 Mod-Fyre inserts, each with
  its exact Metropolitan face and one-piece-panel reference configuration

The source files are the corresponding live Travis FireBuilder layered-image
composites. `scripts/prepare-assets.mjs` removes only transparent canvas and
exports lossless local PNGs; it does not redraw, generate, recolor, or replace
the appliance, logs, media, face, trim, or surround. The catalog records the
source URL on every face asset, and the release checksum manifest prevents a
different or incomplete visual from being deployed under the same version.

The canonical current-lineup record lives in `src/catalog/fpxGasLineup.ts` and
is checked against FPX's premium traditional, premium linear, ProBuilder
traditional, ProBuilder linear, gas-insert, and professional-specification
pages. It keeps current marketed products separate from supported legacy
models and retains FireBuilder's limited-stock/factory-sold-out qualifiers.

### Complete current FPX wood fireplace catalog

Release `2026.08.11-2` retains the three current wood fireplaces published on the
official FPX wood collection page:

- 42 Apex NexGen-Hybrid, appliance `98500115`, with Timberline `95500451`,
  Metropolitan `95500452`, and Universal `95500453` faces
- 36 Elite NexGen-Hybrid, appliance `98500109`, with Classic Arch face
  `98500556`, Artisan face `98500559`, black single door `98500458`, black
  double door `98500456`, and Artisan single door `98500459`
- 44 Elite NexGen-Hybrid, appliance `98500114`, with Classic Arch face
  `98500575`, Artisan face `98500590`, black double doors `98500471`, and
  Artisan double doors `98500472`

The local PNGs are lossless deterministic composites of those exact live
FireBuilder layers. No logs, fire, facework, or doors are redrawn. Current
installation manuals are `100-01577` (42 Apex), `100-01584` (36 Elite), and
`100-01582` (44 Elite). The approved static assets remain source-limited to the
official 960-pixel configurator canvas, which is recorded as blocked at the 4K
visual-master gate even though the exact products are available for showroom
configuration.

### Official burn footage

- 564 25K source: official Travis
  `F_564TRV25K_MissionFootage.mp4`; stable segment 00:16–00:26 is perspective-corrected
  from the installed glass plane and calibrated to 29-3/8 × 16-3/8 inches
- 564 35K source: official Travis `564TV35KCF_BurningFootage.mp4`; segment
  00:08–00:20 is cropped strictly to the installed glass plane and calibrated
  to 29-3/8 × 16-3/8 inches
- 864 source: Travis Industries’ official `FireplaceX® 864 40K Clean Face Gas
Fireplace` video, `https://vimeo.com/468202425`
- 864 approved segment: 00:08–00:20, Classic Oak with the official brick
  fireback; cropped strictly inside the physical glass opening, calibrated to
  the published 34-1/4 × 22-1/4 inch glass ratio, and exported at 1920 × 1248
- 4237 source: Travis Industries’ official `The NEW 4237 Deluxe Gas Fireplace
ft. Ember-Glo™`, `https://vimeo.com/639273752`
- 4237 approved segment: 02:23–02:29, Classic Oak with the official brick
  fireback; cropped strictly inside the complete physical glass opening and
  calibrated to the published 39-7/8 × 34-7/8 inch ratio. No pixels are stretched
  or extended above the source frame; the result is exported at 1600 × 1400.

### Official FireBuilder firebacks

Release `2026.08.11-3` packages 125 model-specific configurations resolved from
the live Travis FireBuilder accessory endpoint (`FB_LinkTypeID = 2`). Each
local PNG is the exact appliance + fireback + approved default log/media
combination returned by FireBuilder's 900-pixel layered-image route. The sync
step registers every option in a model to one shared source frame, then the app
projects it only inside the published glass opening under the exact face mask.
This preserves manufacturer pixels without independently scaling or shifting
the fireplace shell, log set, fireback, or face.
`scripts/sync-fpx-firebacks.mts` is the reproducible intake path; the release
manifest records every nested asset checksum for startup and offline-cache
verification.

The 864 Vimeo source is explicitly titled “FireplaceX® 864 40K Clean Face Gas
Fireplace,” so its loop is mapped only to the 864 TV 40K variants and their
Common Brick selection. The 864 TRV 31K variants remain exact static
FireBuilder configurations until model-correct footage is approved. The 4237
loop is paired with Handmade Brick and the 564 loops with Handmade Brick. The
application never presents a filmed fireback as though it were a different
selected interior.

All loops contain only manufacturer-recorded frames. Each uses a minimal
real-frame dissolve between end/start frames, H.264 video without audio,
and a poster extracted from that exact output. There is no generation, frame
interpolation, flame reconstruction, color replacement, or synthetic effect.
The 864 designer faces use the complete official transparent face layers. Their
media masks and offsets are extracted deterministically from the enclosed glass
openings in those exact layers, so the video cannot crop or overwrite the face.

## Centurion Stone

- Current visual scope: 122 manufacturer-published color swatches across all 39
  pattern pages in `https://www.centurionstone.com/our-products/`
- Current technical source: Centurion's 58-page complete cut-sheet package,
  `https://www.centurionstone.com/wp-content/uploads/2026/07/compressed-Centurion-stone-all-cut-sheets-pdf-7-24-26.pdf`
- Each visual record retains its exact official pattern-page and swatch URL;
  `scripts/sync-centurion-stones.mts` is the reproducible intake path
- Hearth product: #860 Hearthstone, 18 in W × 20 in D × 1.5 in T
- Architectural accents:
  `https://www.centurionstone.com/architectural-accents-and-trim/`
- Hearth/accent swatches are official Centurion accessory-color images from the
  architectural accents page; each stone maps to the nearest published
  accessory reference without recoloring the source

The swatches are assembled deterministically into 2048 × 1536 wall atlases
covering the tool's complete 192 × 144 inch stone-field range. Each pattern's
official photograph is first calibrated by comparing its visible pieces with
that pattern's published minimum and maximum dimensions; the calibrated source
width ranges from 36 to 96 inches rather than assigning every pattern one
scale. Edge-matched texture quilting then fills the larger field with
overlapping sections of that same official photograph. Minimum-error seam cuts
remove hard joins without mirroring, recoloring, generating, or inventing
stone. Fixed-course Foundation Stone uses a course-preserving repeat of the
official swatch so its published 22.75 × 6.75 inch units are never cut by the
irregular-stone seam algorithm. A restrained grayscale relief map is derived
from each final atlas, and a separate 360 × 240 official-swatch thumbnail keeps
the catalog responsive.
Kentucky and Brown Ledge use this same calibrated pipeline; the earlier legacy
4096-pixel masters were retired because their physical coverage metadata made
the pieces render oversized. Manufacturer photography cannot replace an
in-person sample for color approval.

## Pearl Mantels

### Zachary

- Zachary Smooth sizes: 48, 60, 72, and 84 in
- Published section: 5 in H × 9 in D
- Smooth finishes: Whitewash and Graywash
- Zachary Wood Look sizes: 48, 60, 72, and 84 in
- Published section: 5 in H × 7.87 in D
- Wood Look finish: Little River
- Current catalog:
  `https://pearlmantels.com/images/PearlBro.pdf`
- Official product pages:
  `https://www.pearlmantels.com/zacharysmoothwhitewash.html`,
  `https://pearlmantels.com/zacharysmoothgraywash.html`, and
  `https://pearlmantels.com/zacharywoodlooklitriv.html`

### Linear

- Product: Linear non-combustible mantel shelf, ASTM E136
- Official sizes: 60 in and 84 in
- Published section: 4 in H × 8 in D
- Published weights: 87 lb and 132 lb
- Official finishes: Pearl, Graphite, Mocha, Onyx, Saddle
- Collection page: `https://www.pearlmantels.com/linearcollection.html`
- Product/specification page: `https://www.pearlmantels.com/linearpearl.html`
- Finish photography:
  `https://www.pearlmantels.com/images/products/linear/{FINISH_ASSET}.jpg`

### Tavern Timbered Beam

- Product: Tavern Timbered Beam non-combustible mantel shelf, ASTM E136
- Official sizes: 60 in and 72 in
- Published section: 8 in H × 8 in D
- Published weights: 129 lb and 157 lb
- Official finishes: Fieldstone, River Rock, Toasted Rye, Wheat
- Product pages:
  `https://www.pearlmantels.com/tavernfieldstone.html`,
  `https://www.pearlmantels.com/tavernriverrock.html`,
  `https://www.pearlmantels.com/taverntoastedrye.html`, and
  `https://www.pearlmantels.com/tavernwheat.html`

### Natural Cut Stone

- Product: Natural Cut Stone non-combustible mantel shelf, ASTM E136
- Official sizes: 60 in, 72 in, and 84 in
- Published 60- and 72-inch section: 5 in H × 9 in D
- Published 84-inch section: 5.25 in H × 9.5 in D
- Published weights: 100 lb, 115 lb, and 130 lb
- Official finishes: Mist, Dusk, Arctic Blast, Greystone
- Product pages:
  `https://www.pearlmantels.com/cutstonemist.html`,
  `https://www.pearlmantels.com/cutstonedusk.html`,
  `https://www.pearlmantels.com/cutstonearcticblast.html`, and
  `https://www.pearlmantels.com/cutstonegreystone.html`

Every shelf geometry uses its published dimensions and weight. Separate
manufacturer-derived front and top maps prevent studio-background streaks from
being wrapped around the shelf geometry.

Pearl’s own heat-clearance note directs users to follow the fireplace
manufacturer’s requirements. The configurator reports each selected FPX
manual’s fireplace-base datum and combustible depth-table reference but, by
showroom policy, does not enforce a minimum for its ASTM E136 non-combustible
Pearl shelves. Installation still requires review of the current appliance
manual, mantel instructions, wall assembly, and local code.

## Usage

This repository is an authorized-dealer showroom tool. Manufacturer names,
marks, product imagery, dimensions, and installation requirements remain the
property and responsibility of their respective owners. Verify the current
installation manual, local code, and physical samples before sale or
installation.
