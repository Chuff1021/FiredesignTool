# Showroom Operations

## Daily opening

1. Start the showroom computer and open the installed FireDesign app.
2. Wait for the “Dimensionally calibrated” status.
3. Press `Shift+D`.
4. Confirm renderer status is **Showroom ready**, 77 assets are verified,
   the official burn video is **Playing**, and offline cache is **Ready**.
5. Confirm **Customer project storage** is not critical. If **Storage
   protection** is browser-managed, the daily external backup is mandatory.
6. Confirm the displayed application and asset versions match the current
   release record.
7. Close diagnostics and enter presentation mode before the first session.
8. At the end of each showroom day, open **Customer projects**, choose **Back
   up projects**, and copy the dated `.firedesign` file to the approved secure
   business backup location. The file contains customer room photographs and
   must be handled as customer data.

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
- If FireDesign reports that browser storage is low or full, do not retry the
  same photograph repeatedly. Create a complete project backup, confirm the
  downloaded file is retained, then remove older customer projects until
  diagnostics shows a safe remaining capacity.
- If the browser profile or showroom computer is replaced, open **Customer
  projects**, choose **Restore backup**, and select the most recent trusted
  `.firedesign` file. FireDesign verifies its checksum and validates every
  project before writing anything. Existing projects are never overwritten;
  matching records are restored as named copies.
- Do not edit `.firedesign` files or accept them from an untrusted source. Keep
  the last three dated daily backups until the normal business backup policy
  has retained them.
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

## Catalog source monitoring

GitHub Actions audits every indexed and verified official manufacturer source
each Monday and whenever catalog-source code changes on `main`. It can also be
started manually before a release. This network check is deliberately separate
from the Vercel build and the installed PWA, so a manufacturer outage cannot
interrupt a customer session or prevent rollback to a packaged release.

When the **Catalog source audit** fails:

1. Open its retained `catalog-source-audit-<run id>` JSON artifact and identify
   the exact URL, expected content type, owner, status, and final URL.
2. Confirm the failure from a second network before changing catalog evidence.
3. Replace a source only with the current official manufacturer equivalent and
   rerun `npm run catalog:validate` plus the complete source audit.
4. Do not promote affected catalog or visual changes until a clean audit is
   recorded. The currently packaged production release remains in service.
