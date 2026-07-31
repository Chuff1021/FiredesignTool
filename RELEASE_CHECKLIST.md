# Showroom Release Checklist

Every item must pass for the exact Vercel preview artifact before it may be
promoted to production. Record the hardware, browser version, tester, date,
application version, asset version, preview URL, and deployment ID.

## Automated gate

- [ ] `npm ci` completes from a clean clone.
- [ ] `npm run assets:manifest` produces no diff.
- [ ] Every new raster or CAD/BIM delivery has a retained batch-preflight JSON
      report with exact checksums and written offline/customer-export authority;
      automated passage is followed by recorded manual identity, dimensional,
      4K, licensing, and physical-sample review.
- [ ] `npm run verify` passes.
- [ ] `npm run audit:production` reports no high or critical production issue.
- [ ] Playwright passes in desktop Chromium and WebKit.
- [ ] Approved 1080p, 1440p, and 4K screenshots have no layout shift, blur,
      stretch, missing asset, or obvious material repetition.
- [ ] Startup reaches presentation-ready within 10 seconds after caching.
- [ ] Control feedback appears within 100 milliseconds.
- [ ] Diagnostics reports 77 verified assets, playing official burn media, and
      an offline-ready cache.
- [ ] The approved catalog release parses through `catalogReleaseSchema`, has
      unique brand/product/SKU/option IDs, and contains no broken compatibility
      or default-option references.
- [ ] `npm run catalog:validate` maps every live product to the dated intake
      snapshot and verifies every packaged asset byte-for-byte.
- [ ] The latest GitHub **Catalog source audit** checks all indexed and verified
      official sources with zero failures. Record its run URL, completion time,
      JSON evidence artifact, and any accepted redirects in the release record.
- [ ] The intake registry has exactly one current snapshot per brand, contains
      no brand drift or duplicate family IDs, and prevents every source-indexed
      Superior or Majestic product from mapping into the live catalog.
- [ ] Insert evidence records each model's minimum front/rear opening width,
      height, depth, any required full-width depth, current manual revision,
      evidence pages, and compatible facade/surround identifiers.
- [ ] Saved configuration migration attaches the current catalog release and
      safely restores defaults for a retired or unknown product ID.
- [ ] Both 864 variants, all four designer faces, and the 4237 play their mapped
      muted loop with no black first frame, stretch, face overlap, or loop flash.
- [ ] Cached MP4 range requests return `206` and both loops replay offline in
      Chromium and WebKit after browser restart.
- [ ] Production bundle, memory, texture dimensions, and sustained frame rate
      are recorded.
- [ ] Customer Room Designer accepts JPEG/PNG/HEIC input, rejects undersized or
      oversized files, removes source metadata during local preparation, and
      preserves eligible photographs up to the 4096-pixel/12-megapixel ceiling.
- [ ] Four-corner wall calibration and measured wall width survive refresh and
      produce a perspective-aligned design within 2% of the marked plane.
- [ ] Full-remodel and insert-only modes preserve the expected portions of the
      customer photograph.
- [ ] Insert-only mode requires four ordered existing-opening corners plus its
      measured width and height, scales the appliance face from that opening,
      and prevents export until the opening is complete.
- [ ] Insert opening depth and rear width persist and appear in the PDF handoff;
      missing field measurements remain unknown and are never inferred from the
      photograph.
- [ ] Insert-fit screening is bound to the selected approved insert and reports
      each exact manufacturer variant independently. A built-in fireplace visual
      produces no fit claim, and the same conservative result appears in the PDF.
- [ ] Version 1 through version 4 customer-room records migrate to the current
      schema with their original photo, calibration, name, comparison, traced
      foreground objects, and the best available last-known design intact.
- [ ] Before/after comparison and high-resolution JPEG export contain no
      calibration markers, loading state, or UI chrome; projected design layers
      are generated at a destination-aware density for the exported photograph.
- [ ] Traced foreground polygons restore only original room pixels, remain
      aligned in preview/comparison/export, survive refresh, and reject crossed
      or degenerate outlines.
- [ ] Multiple named customer projects can be created, reopened, renamed, and
      selectively deleted; each reopens with its own exact product/material
      configuration, and Back and Replace Photo preserve the intended record.
- [ ] A complete `.firedesign` library backup downloads with all photographs,
      validates its SHA-256 integrity, restores atomically in Chromium and
      WebKit, rejects damaged files without partial writes, and saves ID
      collisions as named copies without overwriting existing customer work.
- [ ] The library identifies never-backed-up, current, and subsequently changed
      project sets; successful backup status survives a browser restart.
- [ ] Storage quota is checked before new photographs and library restores,
      maintains the documented safety reserve, translates native quota errors
      into operator guidance, and never partially writes a rejected project.
- [ ] Diagnostics reports remaining customer-project capacity and whether the
      browser grants persistent or browser-managed origin storage.
- [ ] A confirmed deletion removes only the selected project from IndexedDB and
      leaves every other customer project recoverable.

## Physical showroom gate

- [ ] A tape-measured screen reference is within 1% for all three fireplace
      viewing areas, every offered mantel length, and the selected stone/hearth
      width.
- [ ] Kentucky and Brown Ledge color and relief match physical showroom samples
      under showroom lighting.
- [ ] All 16 Pearl finishes across all five shelf families and every compatible
      length match physical samples.
- [ ] The Kentucky and Brown #860 hearth caps match physical samples and remain
      aligned to the selected fireplace elevation; any end cuts are equal.
- [ ] Every FPX model and face remains sharp at the maximum supported 4K size.
- [ ] Cold launch, browser restart, computer restart, internet loss, internet
      restoration, and offline reload all pass.
- [ ] WebGL context recovery is tested on the production computer.
- [ ] Eight-hour soak completes with no uncaught error, progressive memory
      increase, video stall, frame-rate degradation, or rendering failure.
- [ ] Multiple customer-session rehearsals complete using only production
      hardware.

## Promotion and rollback

1. Freeze catalog, asset manifest, lockfile, and commit SHA.
2. Test the Vercel preview deployment in place.
3. Promote that exact preview artifact; do not trigger a rebuild.
4. Confirm `X-Robots-Tag: noindex, nofollow, noarchive`.
5. Record the previous known-good deployment URL and deployment ID.
6. If a release check fails, immediately promote the recorded known-good
   deployment and capture diagnostics before further changes.

## Current blocking gate

The approved isolated FPX FireBuilder product layers remain between 600 and
660 pixels wide after calibrated cropping. They must be replaced by
dealer/manufacturer high-resolution isolated photography or usable official
CAD/BIM output before this release can be approved for 4K production
presentation.
