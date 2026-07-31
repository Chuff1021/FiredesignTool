# Security

FireDesignTool stores feature-wall configuration in local browser storage. The
Customer Room Designer stores its active, resized room photograph and project
calibration in local IndexedDB so the project can recover after a refresh. It
has no database, account, analytics, tracking, external runtime API, or
server-side customer-photo processing in this release.

Customer photos stay on the current browser device. Operators should use
**Close project** after a customer session to delete the active local project,
and should not use the current local-only release on a shared or untrusted
computer. GPS and other source EXIF metadata are removed when the browser
re-encodes the photograph.

Production product visuals are same-origin packaged assets and are checked
against a versioned SHA-256 manifest before the scene starts.

Report a suspected vulnerability privately to the repository owner. Do not
include customer information in a vulnerability report.
