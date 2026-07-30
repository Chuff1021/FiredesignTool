# Manufacturer asset sources

Every customer-facing product visual is derived from manufacturer-published
material retrieved on 2026-07-30. No generative image system is used.

## Fireplace Xtrordinair

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

The FireBuilder layers are composited and cropped without resynthesis. The
application does not alter the logs, flame, ember bed, or face design.

## Centurion Stone

- Pattern: Ledgestone `150`
- Kentucky color/product code: `260`, `150-260-15`
- Kentucky swatch:
  `https://www.centurionstone.com/wp-content/uploads/2024/03/Kentucky-Ledge-Swatch-scaled.jpg`
- Brown color/product code: `200`, `150-200-25`
- Brown swatch:
  `https://www.centurionstone.com/wp-content/uploads/2024/03/Brown_Ledge_Swatch.webp`
- Specification:
  `https://www.centurionstone.com/wp-content/uploads/2025/03/centurion_stone_cut_sheets_3_27_25_compressed.pdf`
- Hearth product: #860 Hearthstone, 18 in W × 20 in D × 1.5 in T
- Architectural accents:
  `https://www.centurionstone.com/architectural-accents-and-trim/`
- Kentucky and Brown hearth color swatches:
  `https://www.centurionstone.com/wp-content/uploads/2024/08/Kentucky.webp`
  and
  `https://www.centurionstone.com/wp-content/uploads/2024/08/Brown.webp`

The swatches are edge-cropped and assembled deterministically into a
4096 × 3072 mural representing 192 × 144 real-world inches. Varied crops and
feathered joins reduce visible repetition without generating or inventing
stone. A restrained grayscale relief map is derived from each final mural.
Manufacturer photography cannot replace an in-person sample for color
approval.

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

Every shelf geometry uses its published dimensions and weight. Separate
manufacturer-derived front and top maps prevent studio-background streaks from
being wrapped around the shelf geometry.

Pearl’s own heat-clearance note directs users to follow the fireplace
manufacturer’s combustible-shelf requirements. The configurator therefore
uses each selected FPX manual’s fireplace-base datum and depth table.

## Usage

This repository is an authorized-dealer showroom tool. Manufacturer names,
marks, product imagery, dimensions, and installation requirements remain the
property and responsibility of their respective owners. Verify the current
installation manual, local code, and physical samples before sale or
installation.
