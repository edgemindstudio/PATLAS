# PATLAS-M001 — Residual issues and accepted verification exceptions

Date: 2026-11-24
Implementation: 736952de13dfe63e468217e9f3f93cb74950c165
Lead: PATLAS-M001-LAD-001
Founder: PATLAS-M001-FA-001

## Approved exceptions

### PATLAS-M001-EX-001 — Partial native 200% zoom verification

APPROVED for bounded M001 closure only. Four dark-theme screenshots (Home, Explorer, Gaussian lesson and lab) were visually reviewed; Founder reported native Chrome 200% zoom. Numerical zoom indicator, measured window size, complete scrolling/interaction and light-theme native zoom were not independently verified. Executor native zoom NOT RUN remains historical evidence; 640px viewport simulation is not native zoom. Defer comprehensive native zoom verification in both themes and full interaction. RF-003 remains PARTIAL, not PASS.

### PATLAS-M001-EX-002 — Incomplete manual accessibility verification

APPROVED for bounded M001 closure only. Automated axe, keyboard, focus, contrast, reduced motion, modal isolation and lab regression evidence supports the foundation. Manual parameter interaction and reset NOT VERIFIED; VoiceOver NOT RUN. Human accessibility walkthrough remains incomplete. RF-004 remains PARTIAL, not PASS. No certification or universal compliance claim.

Revisit both exceptions before a future public release readiness determination. This is a review checkpoint, not authorization to implement, release or deploy. Preserve original evidence without retroactive changes.

## Residual issues retained

All four are Lead-assessed low priority for the accepted local foundation, not closed and not authorized for implementation by this record.

| ID | Related finding | Issue and proposed later disposition |
|---|---|---|
| RI-001 | RF-006 | Accepted near-grid inputs retain original floating-point value rather than canonical decimal-grid value; tiny display/export differences possible. Later normalize accepted values consistently while preserving approved ranges and step. |
| RI-002 | Evidence management | Parity and contrast tests write timestamped JSON to tracked paths; passing reruns may dirty the tree or overwrite historical evidence. Later isolate run-specific outputs from immutable milestone evidence. |
| RI-003 | RF-012 | Reference returns ordered values without echoing x coordinates. Case/count/parameter/finite checks and inspected deterministic order support current results; explicit per-point identity is not independently asserted. Later consider coordinate echo and matching. |
| RI-004 | RF-007 | Refine scientific wording: subtract mean before dividing for standardization; identical observations imply unbounded likelihood with no attained positive-variance maximum; avoid unsupported claims about a library's internal sampler. Preserve correct equations and partial lesson status. |

Owner for later disposition: Founder with Lead recommendation; implementation executor only after separate bounded authorization. No dates or milestone allocation have been agreed. No changes to approved tolerances, taxonomy or architectural scope.
