# FireDesignTool

Showroom-grade, dimensionally accurate visualization for a single approved
fireplace composition:

- Fireplace Xtrordinair 864 TRV 31K Clean Face Deluxe (`98500187`)
- Centurion Stone Kentucky Ledge (`150-260`)
- Pearl Mantels Linear non-combustible 60-inch shelf (`NCL-60Pearl`)

This release deliberately uses deterministic, manufacturer-sourced visuals.
It does not generate or substitute product imagery.

## Run locally

Requirements: Node.js 22 or newer and a WebGL-capable Chromium, Edge, or
Safari browser.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The production app installs a service worker
after the first verified load and caches the exact release for offline use.

## Quality commands

```bash
npm run assets:manifest
npm run verify
npm run test:e2e
npm run audit:production
```

`npm run assets:manifest` must leave the worktree clean. Any changed checksum
means the approved visual release changed and requires a fresh review.

## Architecture

- `src/domain` contains validated catalog data, physical constraints, and
  inch-based calculations.
- `src/lib` owns asset readiness, integrity verification, and persistence.
- `src/store` is the validated local configuration boundary.
- `src/components/FeatureWallCanvas.tsx` implements the stable dimensional
  scene. One Three.js unit equals one physical inch.
- `src/components/FireDesignApp.tsx` owns startup gating, offline readiness,
  fullscreen mode, diagnostics, and recovery.
- `assets-source` preserves the exact official inputs.
- `scripts/prepare-assets.mjs` performs deterministic asset processing.

The WebGL surface is dynamically imported and kept behind
`FeatureWallCanvas`, so a projector route can reuse it without rewriting the
version 1 renderer.

## Product and safety notes

The interface enforces at least 8 inches between the top of the appliance
face and the bottom of the 8-inch-deep shelf. Product dimensions remain
reference-only; installation must follow the current official manual and
applicable code.

The original FireBuilder layer is retained as a calibrated product source.
Its usable isolated crop is 520×390 pixels. That source is acceptable for
functional and scale verification, but **the release remains preview-only
for 4K customer presentation until an approved higher-resolution isolated
product master or convertible manufacturer CAD/BIM file is supplied**.
The software does not disguise that limitation with generative enhancement.

See [ASSET_SOURCES.md](./ASSET_SOURCES.md) for provenance and
[RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) for promotion gates.
