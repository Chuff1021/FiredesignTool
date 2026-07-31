# Showroom Operations

## Daily opening

1. Start the showroom computer and open the installed FireDesign app.
2. Wait for the “Dimensionally calibrated” status.
3. Press `Shift+D`.
4. Confirm renderer status is **Showroom ready**, 77 assets are verified,
   the official burn video is **Playing**, and offline cache is **Ready**.
5. Confirm the displayed application and asset versions match the current
   release record.
6. Close diagnostics and enter presentation mode before the first session.

## Recovery

- If the browser closes, reopen the installed app. The last validated design
  is restored locally.
- If the network is unavailable, continue normally after the release has been
  cached once.
- If the scene pauses, use **Restart display**. Saved dimensions are retained.
- If burn footage cannot resume after one automatic retry, the matching approved
  video poster remains visible. Reload after the customer session and confirm
  **Official burn video: Playing** in diagnostics.
- If diagnostics shows renderer recovery for more than 10 seconds, reload the
  application.
- If reloading does not restore the renderer, close the browser, restart the
  computer, and reopen the last known-good installed release.
- If saved dimensions appear invalid, use **Reset design**. The application
  also rejects corrupt saved data automatically.
- For an insert concept, measure the masonry opening width and height onsite,
  then mark its four corners in order. **Dimensionally scaled** must appear
  before export. This calibration does not approve appliance fit.

Technical errors stay in the diagnostics surface. Do not troubleshoot while a
customer is watching; return to the last known-good release.

## Supported showroom baseline

- Current stable Microsoft Edge/Chrome on Windows or Safari on macOS.
- WebGL 2-capable dedicated or modern integrated GPU.
- Hardware acceleration enabled.
- Native 1080p, 1440p, or 4K landscape display.
- Browser zoom at 100%.

The operator diagnostics reports the detected GPU and measured frame rate.
Sustained performance below 30 FPS is not releaseable on that computer.
