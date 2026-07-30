# Showroom Release Checklist

Every item must pass for the exact Vercel preview artifact before it may be
promoted to production. Record the hardware, browser version, tester, date,
application version, asset version, preview URL, and deployment ID.

## Automated gate

- [ ] `npm ci` completes from a clean clone.
- [ ] `npm run assets:manifest` produces no diff.
- [ ] `npm run verify` passes.
- [ ] `npm run audit:production` reports no high or critical production issue.
- [ ] Playwright passes in desktop Chromium and WebKit.
- [ ] Approved 1080p, 1440p, and 4K screenshots have no layout shift, blur,
      stretch, missing asset, or obvious material repetition.
- [ ] Startup reaches presentation-ready within 10 seconds after caching.
- [ ] Control feedback appears within 100 milliseconds.
- [ ] Diagnostics reports 20 verified assets and an offline-ready cache.
- [ ] Production bundle, memory, texture dimensions, and sustained frame rate
      are recorded.

## Physical showroom gate

- [ ] A tape-measured screen reference is within 1% for all three fireplace
      viewing areas and both 60- and 84-inch mantels.
- [ ] Kentucky and Brown Ledge color and relief match physical showroom samples
      under showroom lighting.
- [ ] All five Pearl finishes and both shelf lengths match physical samples.
- [ ] Every FPX model and face remains sharp at the maximum supported 4K size.
- [ ] Cold launch, browser restart, computer restart, internet loss, internet
      restoration, and offline reload all pass.
- [ ] WebGL context recovery is tested on the production computer.
- [ ] Eight-hour soak completes with no uncaught error, progressive memory
      increase, frame-rate degradation, or rendering failure.
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
