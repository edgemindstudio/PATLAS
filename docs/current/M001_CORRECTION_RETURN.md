# PATLAS-M001-COR-001 — Consolidated correction return

Date: 2026-11-24
Correction package: **PATLAS-M001-COR-001**
Authorization reference: **PATLAS-M001-COR-REL-001**
Original implementation release: PATLAS-M001-REL-001
Review publication: PATLAS-M001-PUB-001
Planning baseline: v0.6

**Disposition: CORRECTED — REVIEW PENDING**

> RF-003 (actual native 200% browser zoom) and the screen-reader portion of RF-004
> are **NOT RUN** in the executor environment. They are explicitly blockers for
> independent human verification, not claims of completion. All implementation
> corrections are complete and the automated/executor verification suites pass.

## 1. Authorization and starting identity

| Item | Value |
| --- | --- |
| Founder authorization record | `/Users/poisedre/patlas_execution_evidence/M001/COR-001/FOUNDER_AUTHORIZATION.md` |
| Authorization SHA-256 | `6bfe24a63b17a680ba43a028dd1950f0b146302fa89184eb1d52ecaa21d041fc` |
| Expected SHA-256 | matched exactly |
| Repository | `git@github.com:edgemindstudio/PATLAS.git` |
| Local target | `/Users/poisedre/PATLAS` |
| Branch | `engineering/m001-foundation` |
| Starting commit | `c9f36ff386c9703836eb21d0f9e10966620f1ac0` |
| Local HEAD = remote branch | Yes (`c9f36ff…` both) |
| Protected `main` / `origin/main` | `e7ad3ba499e8bc63d246d38b268251bd6e2b1b77` |
| Starting working tree | Clean (0 changes) |
| GitHub Actions | Disabled (`enabled:false`), 0 workflows, 0 runs |
| GitHub Pages | Not configured (404) |
| Node / npm / Python / Git | 24.22.3 / 11.19.1 / 3.12.10 / 2.54.0 |

Historical planning tree at `9199d49` and `HEAD`:
`90c990a849b42b606caa0bebbc470141fa7b96d0` (identical).

Frozen registry parity (before and after, byte-identical to
`docs/planning/v0.6`):

| File | SHA-256 |
| --- | --- |
| `MODEL_SCOPE_BASELINE.json` | `e8ea11be46cb6c6d5907a19ea4ae2517a4e52413c50bd5bcf5a90067dccb6520` |
| `SOURCE_TREE.txt` | `f0e3e906ad0425fca06c54385544d990223d03d303becd2f202514171844a51a` |
| `TAXONOMY_PROJECTION_CANDIDATE.json` | `344dad29f17d86b3a5a838eaae1c19b0abf78ffa2df06dbe98f98a56b4708c1a` |

## 2. Finding-by-finding resolution

### RF-001 — CI dependency provisioning — RESOLVED

`.github/workflows/ci.yml` previously ran the full Vitest suite in the Node job
(which requires `.venv/bin/python`) and ran Vitest in the Python job without
installing npm dependencies. The workflow is now partitioned without reducing
coverage:

- **Node job:** `npm ci`, lint, typecheck, `npm run test:unit:node`
  (registry, search, content, architecture boundary, contrast), production build.
- **Python job:** Node 24 + `npm ci`, isolated `.venv` with pinned Python
  packages, pytest, then `npm run test:unit:science` (SciPy parity and Python
  export execution).
- **Browser job:** Node 24 + `npm ci`, Chromium, production build, full Playwright
  suite. Python is not required for browser tests.

`package.json` gained `test:unit:node` and `test:unit:science`; the full `npm test`
remains available locally. The workflow is local-only, not pushed or executed.

### RF-002 — Extension fixture count — RESOLVED

`tests/unit/registry/extension.test.ts` now asserts all four extension counts
explicitly: **9 major categories, 33 category nodes, 124 leaf placements,
110 canonical modules**, and production remains **9 / 32 / 123 / 109**.

The erroneous “10 majors” sentence in `M001_IMPLEMENTATION_EVIDENCE.md` was
corrected to “9 majors” and an appended correction note preserves the original
history and points to this return.

### RF-003 — Native browser 200% zoom — NOT RUN (blocked)

Executed attempts:

1. Headed Playwright Chromium at 1280×900; `Meta+=` twice via
   `page.keyboard.press` → `innerWidth`, `devicePixelRatio` and
   `visualViewport.scale` unchanged (1/1/1). Synthetic key events do not trigger
   the browser zoom accelerator.
2. AppleScript/System Events keystroke to `Google Chrome for Testing` →
   error **1002**: `osascript is not allowed to send keystrokes` (macOS
   Accessibility permission unavailable).

The existing 640px-viewport reflow check is **not** presented as native zoom. The
attempt, measured values, blocker and step-by-step Founder/Lead instructions are
recorded in `evidence/correction/native-zoom.json`.

### RF-004 — Targeted manual accessibility verification — PARTIAL

Completed by the executor (details in
`evidence/correction/manual-accessibility.json`):

- 8 axe-core scans (Home, Explorer, lesson, laboratory × light/dark): **0
  WCAG A/AA violations**.
- Visible focus, keyboard tree/search/drawer operation, parameter controls,
  chart/numeric alternatives, reduced motion, and modal focus isolation are
  covered by passing browser tests.
- Text and non-text contrast measured from tokens in both themes:
  text ≥ 4.94:1, non-text ≥ 3.59:1, status colours ≥ 5.91:1. Automated evidence:
  `evidence/correction/contrast.json`; regression test:
  `tests/unit/accessibility/contrast.test.ts`.
- The light `--border-strong` token was corrected from `#94A3B8` (2.56:1) to
  `#64748B` (4.76:1) so form-control boundaries meet the 3:1 non-text target.

**NOT RUN:** actual screen-reader walkthrough (no VoiceOver/NVDA automation
available). Instructions for the Founder/Lead are recorded. No WCAG certification
is claimed.

### RF-005 — Governed scientific thresholds — RESOLVED

`tests/unit/science/scipy-parity.test.ts` now enforces only the approved PDF
tolerance `abs ≤ 1e-10 + 1e-8·abs(reference)`. The former mandatory `1e-12`
absolute/relative assertions were removed; measured errors are emitted to
`evidence/correction/scipy-parity.json` and console output as diagnostics. The
normalization assertion remains `≤ 1e-6`. Python export tolerances were not
changed.

### RF-006 — Laboratory parameter consistency — RESOLVED

- `validateGaussianLabField` now enforces finite values, approved bounds and the
  0.1 step grid with a `1e-9` floating-point tolerance; mathematical
  `validateGaussianParams` remains separate.
- Numeric and slider inputs both use the grid; off-grid numbers are rejected with
  an accessible message giving the nearest allowed values and the applied value.
- Independent per-field error state; changing one valid field does not clear the
  other field's error.
- Invalid drafts retain the last applied snapshot; the applied value is shown
  explicitly while slider, equation, statistics, plot and Python export continue
  to describe that snapshot.
- Added unit tests for grid/boundaries/nearest values and browser tests for
  off-grid input, both boundaries, independent errors, slider/number sync,
  equation/export sync, and reset/error clearing.
- `GAUSSIAN_LAB_BOUNDS`, defaults and display domain are unchanged.

### RF-007 — Gaussian scientific wording — RESOLVED

`content/models/gaussian-normal.json` now states:

- Linear transformation requires **a ≠ 0** for a positive-variance Gaussian;
  **a = 0** yields a constant, not a Gaussian.
- MLE assumes **iid** normal observations and a **nondegenerate sample**; all
  observations identical gives no finite maximum over σ > 0 and the likelihood
  increases toward the zero-variance boundary. The unbiased estimator uses
  **n − 1** and requires **n > 1**.
- Known-variance normal inference uses σ/√n; unknown-variance inference uses
  s/√n with Student's **t, n − 1 df**, and is not merely a small-sample patch.
- The Bayesian conjugate example is qualified as normal likelihood with **known
  observation variance** and a normal prior on the mean; it is not presented as
  the general unknown-variance conjugate model.
- Inverse-CDF sampling and Box–Muller are described as distinct methods.
- Equation captions distinguish location μ, standard deviation σ and variance σ².

All lesson sections, references, knowledge checks and **partial** status remain.

### RF-010 — Duplicate canonical identities — RESOLVED

`validateRegistrySource` now scans both `baseline.modules` and
`projection.modules` for duplicate IDs **before** building lookup Maps and emits
`duplicate-baseline-module` / `duplicate-projection-module`. Negative tests cover
both source arrays. Existing category, placement, endpoint, cycle, digest, count
and traversal checks are unchanged; frozen files were not edited.

### RF-013 — Mixed sibling ordering — RESOLVED

`TreeNodeDto` now exposes an ordered `entries` array mixing subcategories and
direct leaf placements; `buildTreeDto` sorts them by their shared sibling
`order`, `TreeNav` renders `entries`, and `filterTree` retains the relative order
of surviving entries. Tests assert:

- the frozen PGM branch order (Directed, Undirected, Factor Graph),
- all 123 placements appear exactly once in baseline order,
- a synthetic leaf-before-subcategory parent preserves module-then-category
  order, and
- filtering preserves retained sibling order.

**Production distinction:** the frozen PGM branch already lists its direct leaf
after its two subcategories, so the previous concatenation did not visibly
misorder production. The defect was contract-level and is now fixed generally;
no production ordering mismatch was observed. Placements, identities, labels and
provisional mappings are unchanged.

### RF-008 — Taxonomy keyboard interaction — RESOLVED

Tree key handling moved from the whole component wrapper to the taxonomy
`<nav>` and is gated to `[data-tree-focusable]` elements, ignoring inputs,
textareas, selects and contenteditable targets. Browser tests verify that
Home/End/arrow keys inside the filter keep focus and text-editing behaviour, while
tree ArrowRight/ArrowDown still expand and move focus.

### RF-009 — Search accessibility state — RESOLVED

- The listbox element is always present while the combobox exists, so
  `aria-controls` never references a missing element in closed, loading, result,
  empty or error states.
- `aria-expanded` reflects the panel state; `aria-busy` reflects loading.
- `aria-activedescendant` is derived from the current results and panel state, so
  stale option references cannot survive result changes, emptiness or closing.
- Result options are non-link `role="option"` elements with click handling,
  avoiding nested interactive semantics; keyboard Enter, mouse click, Escape and
  retry remain functional against the real API.
- Browser tests cover closed/expanded states, existing controlled element, valid
  active option, empty, loading, error, result-change cleanup, keyboard and mouse
  selection.

### RF-011 — Mobile drawer — RESOLVED

The background (header, sidebar/main frame, footer) is wrapped in an `inert`
container while the modal drawer is open, so it cannot receive pointer or keyboard
focus. Focus trapping now also recaptures focus if it escapes the dialog; Tab and
Shift+Tab wrap in both directions; Escape and the Close button dismiss and restore
focus to Browse; overlay click dismisses; drawer navigation closes on route
change. Tests cover forward/reverse wrapping, background inertness, programmatic
focus resistance, navigation and ordinary close.

### RF-012 — Scientific reference completeness and evidence — RESOLVED

The SciPy reference test now asserts exact reference-case count (6), exact
per-case value count (53), exact comparison count (318), requested μ/σ and x
correspondence, and finite non-negative values. It emits machine-readable
measurements to `evidence/correction/scipy-parity.json` and
`scipy-normalization.json` plus console output. Measurements below are from this
run, not reused prior numbers.

## 3. Scientific measurements (this execution)

| Metric | Measured | Approved threshold |
| --- | --- | --- |
| Reference cases | 6 | 6 |
| Values per case | 53 | 53 |
| Comparisons | 318 | 318 |
| Max absolute PDF error | `5.551115123125783e-17` | `1e-10 + 1e-8·abs(ref)` per value |
| Max relative PDF error | `2.7042483965393745e-16` | diagnostic |
| Max SciPy normalization error (μ ± 10σ) | `1.1102230246251565e-16` | ≤ `1e-6` |
| TypeScript Simpson normalization | ≤ `1e-6` (asserted) | ≤ `1e-6` |
| Python export parity | ≤ `1e-12` (asserted, unchanged) | separate export check |
| Downloaded artifact execution | exit 0; 601 points | — |

## 4. Verification commands and results

`evidence/correction/verification.log` contains the captured run. Summary:

| Command | Exit | Result |
| --- | --- | --- |
| `npx eslint .` | 0 | Clean |
| `npx tsc --noEmit` | 0 | Clean |
| `npm test` | 0 | 10 files, **94 passed**, 0 failed, 0 skipped |
| `npm run test:unit:node` | 0 | 7 files, 71 passed |
| `npm run test:unit:science` | 0 | 3 files, 23 passed |
| `.venv/bin/python -m pytest python/tests -q` | 0 | 5 passed |
| `NEXT_TELEMETRY_DISABLED=1 npx next build` | 0 | 32 category + 109 model pages |
| `npx playwright test` | 0 | **58 passed**, 0 failed, 0 skipped |
| `npm ls --all --json` | 0 | `problems: []` |
| `pip check` | 0 | No broken requirements |
| CI workflow YAML parse (Ruby Psych) | 0 | 3 jobs, 7/7/6 steps |
| Downloaded Python source `--json` | 0 | Snapshot reproduced |

Comparison with the original executor return (not claimed unchanged):
unit **76 → 94**, browser **49 → 58**, Python **5 → 5**. Added regression tests
cover duplicate module IDs, mixed ordering/filter order, extension counts,
off-grid/boundary/independent-error laboratory states, contrast, and all requested
combobox/drawer/tree accessibility states.

Browser coverage still includes all 109 model and 32 category routes, 404s,
duplicate HMM placement context, production HTTP search contract, production
build/server, theme persistence, screenshots and console-error checks.

## 5. Changed and new files

Modified (25):

```text
.github/workflows/ci.yml
content/models/gaussian-normal.json
docs/current/M001_IMPLEMENTATION_EVIDENCE.md
package.json
playwright.config.ts
src/features/lab/GaussianLab.module.css
src/features/lab/GaussianLab.tsx
src/science/gaussian.ts
src/server/registry/build.ts
src/server/registry/validate.ts
src/ui/components/AppShell.module.css
src/ui/components/AppShell.tsx
src/ui/components/SearchBox.module.css
src/ui/components/SearchBox.tsx
src/ui/components/TreeNav.tsx
src/ui/tokens.css
src/ui/tree-filter.ts
tests/e2e/lab.spec.ts
tests/e2e/responsive.spec.ts
tests/e2e/search.spec.ts
tests/unit/content/content.test.ts
tests/unit/registry/extension.test.ts
tests/unit/registry/structure.test.ts
tests/unit/science/gaussian.test.ts
tests/unit/science/scipy-parity.test.ts
```

New (9):

```text
docs/current/M001_CORRECTION_RETURN.md
tests/unit/accessibility/contrast.test.ts
tests/unit/registry/ordering.test.ts
evidence/correction/contrast.json
evidence/correction/manual-accessibility.json
evidence/correction/native-zoom.json
evidence/correction/scipy-normalization.json
evidence/correction/scipy-parity.json
evidence/correction/verification.log
```

Screenshots under `evidence/screenshots/` were regenerated by the browser suite
(git-ignored). Generated dependencies (`.venv`, `node_modules`, `.next`), test
reports and machine artifacts were not staged or added to the evidence inventory.

## 6. Remaining defects and limitations

1. **RF-003 native zoom — NOT RUN.** Blocked by unavailable macOS Accessibility
   permission for synthetic browser shortcuts. Instructions provided; must not be
   treated as passed.
2. **RF-004 screen reader — NOT RUN.** No automated VoiceOver/NVDA session was
   possible. Automated axe scans and targeted keyboard/contrast/modal checks did
   pass; this is not WCAG certification.
3. Manual human review of the corrected lesson wording and accessibility remains
   for the Lead/Founder.
4. No other known defects. The relationship graph, Foundations, Compare, Learning
   Paths and all non-Gaussian lessons remain planned and out of scope.

## 7. Integrity and restrictions

- Frozen registry files unchanged and byte-identical; historical planning tree
  hash unchanged from `9199d49`.
- No Founder authorization or decision record was modified.
- No dependencies upgraded or added; `package-lock.json` unchanged.
- No commit, push, merge, deployment or remote CI execution performed.
- No milestone acceptance or M002 work performed.

Final Git state: HEAD `c9f36ff386c9703836eb21d0f9e10966620f1ac0`, 25 tracked
files modified, 9 new files, 0 commits, 0 pushes, remote untouched. Working tree
contains only the correction changes above and evidence artifacts.

**Final status: CORRECTED — REVIEW PENDING** (RF-003 and screen-reader RF-004
verification items explicitly outstanding for human review).
