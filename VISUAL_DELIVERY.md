# Visual delivery preflight

Every manufacturer or authorized-dealer visual delivery enters FireDesign as a
self-contained folder. Nothing is copied into the approved catalog before the
folder passes automated preflight and the separate manual visual, dimensional,
licensing, and physical-sample reviews.

## Package layout

```text
delivery-folder/
  manifest.json
  permissions/
    offline-showroom-use.pdf
  raster/
    registered-product-layer.png
  cad/
    customer-visible-geometry.step
```

Start from [`examples/visual-delivery.manifest.json`](./examples/visual-delivery.manifest.json)
and replace every example value. File paths must remain relative to the delivery
folder. Symlinks and `..` paths cannot escape the package.

Each delivery records:

- Delivery identity, timestamp, supplier, rights holder, written approval
  reference, evidence file, and evidence checksum.
- Explicit permission for local/offline packaging and customer concept exports.
- Brand, product, current model, SKU/option identity, and source reference for
  every file.
- A lowercase SHA-256 checksum for each exact delivered byte stream.
- Raster role, common registration group, minimum native dimensions, declared
  sRGB handling, ICC requirement, alpha requirement, and pixel bounds for the
  physical firebox opening.
- CAD/BIM format, native units, front direction, product origin, installation
  datum, visible object list, and material/texture inclusion.

## Automated preflight

Run from the repository root:

```bash
npm run assets:preflight-package -- /absolute/path/to/delivery/manifest.json \
  --report=/absolute/path/to/delivery/preflight-report.json
```

The command verifies:

- Runtime manifest validity and unique IDs/files.
- Written-usage authority fields plus the contained, non-empty, checksummed PDF,
  EML, MSG, or TXT evidence file.
- File and symlink containment inside the delivery.
- Non-empty regular files and exact SHA-256 checksums.
- Lossless PNG/TIFF input, at least 2400×1800 native pixels, decoded sRGB,
  required ICC/alpha, credible background transparency, and at least 95%
  transparency throughout the calibrated glass opening.
- Identical canvas dimensions and calibrated opening bounds for every applicable
  raster in the same registration group.
- CAD/BIM file extension, declared format, native units, orientation, origin,
  datum, customer-visible object inventory, and material/texture declarations.

The JSON report is immutable release evidence. A nonzero exit code or
`automatedPreflightPassed: false` keeps the entire package out of the catalog.

## Required manual approval

`automatedPreflightPassed: true` is not product approval. It only proves that
the package is internally measurable and intact. Promotion still requires:

1. Confirming the exact current model, appliance, face, trim, surround,
   fireback, log/media set, and option SKUs with the supplier.
2. Comparing published dimensions and registration against the current manual.
3. Inspecting sharpness and edges at native 100% scale and in the 1080p, 1440p,
   and 4K reference scenes.
4. Comparing color/material appearance with showroom samples where applicable.
5. Confirming CAD contains only the required customer-visible geometry and that
   converted glTF preserves units, origins, names, materials, and openings.
6. Recording the reviewer, hardware, browser, date, preflight report checksum,
   and written permission reference in the release record.

Only after both automated and manual gates pass may deterministic preparation
copy approved outputs into `assets-source` and the versioned catalog release.
