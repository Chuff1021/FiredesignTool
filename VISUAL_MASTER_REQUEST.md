# FireDesign visual master request

FireDesign is an authorized-dealer showroom visualization tool. We need current,
manufacturer-approved visual masters for accurate full-size 4K presentation.
Files are used as deterministic product imagery; they are not used to train or
generate imagery.

## Required approval

Please include written confirmation that the supplied files may be packaged in
an offline-capable dealer showroom configurator and displayed in exported
customer concept images. Manufacturer ownership, trademarks, and product
attribution remain intact.

## Preferred front-elevation package

Provide one lossless, straight-on front elevation for every appliance and each
visible face, front, or trim option:

- Current production model and option only, identified by model and SKU.
- PNG, TIFF, PSD, or layered PSB; no JPEG for the isolated production master.
- At least 2400 px wide and 1800 px high after the product is isolated.
- Native source pixels only. Do not upscale, sharpen with generative tools, or
  use AI-created fill.
- Embedded or explicitly identified sRGB color profile.
- Transparent background outside the product.
- Transparent physical glass/firebox opening so approved burn footage can be
  composited behind the exact face.
- No room, wall, stone, mantel, floor, cast shadow, perspective distortion,
  watermark, dimension arrows, labels, or clipped product edges.
- Separate aligned layers for appliance, face/front, trim, surround/panel,
  fireback, log/media set, screen, and any lighting overlay when available.
- A dimensioned reference identifying the published glass opening and overall
  visible exterior width and height.

If the appliance body is common across options, one registered base image plus
separate transparent option overlays is preferred. Every overlay must use the
same canvas size, origin, scale, and color profile.

## CAD/BIM alternative

Manufacturer CAD/BIM is acceptable when it contains the customer-visible
geometry needed to render the actual product:

- Revit/RFA, DWG/DXF, STEP, IGES, FBX, OBJ, or glTF/GLB.
- Native units declared, preferably inches.
- Front face, trim, surround, glass opening, screen, firebox, log/media, and
  visible fireback supplied as named objects or layers.
- Materials and texture references included and licensed for showroom use.
- Product origin, front direction, and installation datum identified.
- No confidential fabrication geometry is required; customer-visible geometry
  is sufficient.

## Initial FPX request

1. 864 TRV 31K Clean Face Deluxe, SKU `98500187`.
2. 864 TRV 31K Deluxe, SKU `98500186`, plus:
   - Classic Arch `99300497`
   - Arched French Country `95800616`
   - Metropolitan `95800623`
   - Rectangle Double Door `95800743`
3. 4237 Ember-Glo Clean Face Deluxe, SKU `98500344`.
4. 616 Deluxe Ember-Glo insert, SKU `98400120`, including its current faces,
   one-piece panels, firebacks, and Oak/Birch/Driftwood media.

Please also restore or replace the BIM and CAD downloads currently linked from
the official FPX Specs and Drawings page. The published 864 and 4237 download
URLs presently return HTTP 404.

## Next manufacturer requests

- Superior DRI2000: isolated DRI2027 and DRI2032TEN appliances, all listed
  facades, and all four-sided surrounds.
- Majestic Ruby Platinum 30 and 35: Clean Screen and Contemporary Arched fronts,
  every current surround size, Cottage Red/Reflective Black Glass/Tavern Brown
  interiors, and Oak/Birch media.

## Acceptance checks

FireDesign records the exact source URL or delivery reference, pixel dimensions,
alpha/transparency characteristics, checksum, retrieval date, model/SKU, and
written authority. A file is accepted only when it passes automated catalog
validation and visual review at 1080p, 1440p, and 4K. Color is also compared
against a physical showroom sample where applicable.

Raster deliveries can be preflighted with:

```bash
npm run assets:inspect-master -- /path/to/master.png \
  --min-width 2400 --min-height 1800 --opening left,top,width,height --require-icc
```

The report checks the real decoded dimensions, lossless format, sRGB data,
alpha channel, ICC profile, and at least 95% transparency across the declared
physical glass opening. Passing preflight does not replace visual or dimensional
approval.

Insufficient, perspective, composited-room, visibly upscaled, or unidentified
files remain in the intake queue and are never exposed to customers.
