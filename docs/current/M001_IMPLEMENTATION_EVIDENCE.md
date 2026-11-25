# PATLAS-M001 — Milestone implementation evidence

Date: 2026-11-24
Release: PATLAS-M001-REL-001
Branch: `engineering/m001-foundation`
Local target: `/Users/poisedre/PATLAS`
Starting commit: `e7ad3ba499e8bc63d246d38b268251bd6e2b1b77`
Disposition: **IMPLEMENTED — REVIEW PENDING**

This note records what was executed. It is not an acceptance decision and does
not modify the approved scope, decisions or authorization.

## 1. Preflight result

| Check | Result |
| --- | --- |
| Working directory | `/Users/poisedre/PATLAS` |
| Branch | `engineering/m001-foundation` |
| Working tree at start | Clean (only pre-existing ignored `.DS_Store` files) |
| Starting commit | `e7ad3ba499e8bc63d246d38b268251bd6e2b1b77` |
| `main` / `origin/main` | Identical to the starting commit |
| Remote | `git@github.com:edgemindstudio/PATLAS.git` (edgemindstudio/PATLAS) |
| Repository contents | 41 tracked documentation files only |
| Planning tree at `9199d49` | Unchanged — tree hash `90c990a849b42b606caa0bebbc470141fa7b96d0` identical |
| Foundation package | `docs/planning/v0.6` present, 34 files |
| Node.js | 24.22.3 (activated from `/opt/homebrew/opt/node@24/bin`) |
| npm | 11.19.1 |
| Python | 3.12.10 |
| Git | 2.54.0 |
| npm registry | Reachable; versions resolved from the live registry |

Frozen scientific scope files, before and after (identical):

| File | SHA-256 |
| --- | --- |
| `MODEL_SCOPE_BASELINE.json` | `e8ea11be46cb6c6d5907a19ea4ae2517a4e52413c50bd5bcf5a90067dccb6520` |
| `SOURCE_TREE.txt` | `f0e3e906ad0425fca06c54385544d990223d03d303becd2f202514171844a51a` |
| `TAXONOMY_PROJECTION_CANDIDATE.json` | `344dad29f17d86b3a5a838eaae1c19b0abf78ffa2df06dbe98f98a56b4708c1a` |

The runtime copies in `registry/baseline/` are byte-identical to the archived
files (verified by byte comparison and hash in
`tests/unit/registry/structure.test.ts`).

## 2. Delivered application

| Area | Implementation |
| --- | --- |
| Framework | Next.js 16.4.6 App Router, Node server runtime, React 19.3.1, strict TypeScript 6.0.3 |
| Styling | CSS modules + approved design tokens (`src/ui/tokens.css`), light/dark themes |
| Registry | File-backed frozen baseline, JSON Schema + semantic validation, deterministic runtime transform |
| Routes | Home, Explorer, 32 category routes, 109 canonical model routes, Foundations, Visual Lab + Gaussian lab, Compare, Learning Paths, Code, `/api/search` |
| Search | `GET /api/search?q=` server handler with ranking, dedupe, branch context, input rejection |
| Science | Framework-independent Gaussian module and Python export generator |
| Content | Sanitised Markdown lesson content, KaTeX equations, references, knowledge check |
| Tests | Vitest, Playwright, pytest; local CI definition |
| Licensing | MIT (`LICENSE`), CC BY 4.0 (`LICENSE-CONTENT.md`), attribution and provenance notes |

Key paths:

```text
src/app/                     routes, layout, API handler, not-found
src/server/registry/         registry schema validation, transform, coverage
src/server/search/           pure search handler
src/server/content/          sanitised Markdown and lesson content
src/science/                 pure Gaussian math and Python export
src/features/                explorer, lesson, laboratory
src/ui/                      shell, tree, search, theme, tokens
registry/baseline/           frozen files (byte-identical)
registry/schema/             JSON Schemas
content/models/              Gaussian lesson source
python/                      isolated SciPy reference and pytest suite
tests/unit/, tests/e2e/      verification suites
tests/fixtures/              invalid-registry and additive-extension fixtures
evidence/                    screenshots, downloaded source, file inventory
```

## 3. Work package outcomes

| WP | Outcome | Evidence |
| --- | --- | --- |
| WP01 Foundation | PASS | Pinned lockfile, lint/typecheck configured and passing, local CI authored, licenses added |
| WP02 Registry | PASS | 9 / 32 / 123 / 109 counts, exact ordered traversal, digest, invalid fixtures rejected, extension integration |
| WP03 Shell | PASS | Responsive header/sidebar/drawer, both themes with persistence, 320/768/1280 and reflow checks |
| WP04 Explorer and routes | PASS | All 109 model and 32 category routes HTTP 200; 7 destinations; meaningful 404; duplicate HMM placements share one URL |
| WP05 Search | PASS | Production HTTP 200/400 evidence; UI loading/empty/error/keyboard paths implemented and tested |
| WP06 Gaussian laboratory | PASS | Verified density math, synchronized plot/equations/statistics/source, reset, labelled axes, finite-domain disclosure |
| WP07 Gaussian lesson | PASS (module remains partial) | All applicable MODEL_MODULE_SPEC sections, references, executable Python export with manual copy fallback |
| WP08 Verification | PASS | Lint, typecheck, 76 unit tests, 5 Python tests, 49 browser tests, production build/server, accessibility scans, screenshots |

## 4. Registry evidence

| Invariant | Observed |
| --- | --- |
| Major categories | 9 |
| Category nodes | 32 |
| Original leaf placements | 123 |
| Provisional canonical modules | 109 |
| Duplicate canonical groups | 13 |
| Redundant duplicate placements | 14 |
| Ordered traversal | `projection.categories` and `projection.placements` deep-equal the traversal derived from the baseline |
| Source digest | Projection `source_sha256` equals the loaded baseline SHA-256 |
| HMM placements | 3 branches: Directed Graphical Models; Discrete Latent Variable Models; Markov Models |
| Signed numeric statuses | Module lifecycle stays `planned`; content overlay marks only `gaussian-normal` as `partial` |

Invalid fixtures rejected with the expected issue codes: digest mismatch,
category cycle, unknown parent, duplicate category, unknown placement module,
missing module, truncated traversal, duplicate placement order, module rename,
extra module. A baseline with inflated declared counts is also rejected.

Additive extension test: one synthetic category/module/placement is appended at
runtime and appears automatically in tree navigation, search (title and alias),
and coverage (10 majors unchanged, 33 categories, 124 placements, 110 modules).
The synthetic ids are asserted absent from production data.

## 5. Search HTTP evidence

Production server (`next start`, port 3100):

| Request | Status | Result |
| --- | --- | --- |
| `?q=Gaussian` | 200 | 9 results; first `gaussian-normal` — `matchedOn: title`, status `partial` |
| `?q=Hidden Markov Models` | 200 | 1 result; HMM via alias; all 3 branch paths returned |
| `?q=Continuous Distributions` | 200 | 1 category result `/categories/continuous-distributions` with branch path |
| `?q=zzzz-no-such-model` | 200 | 0 results |
| `?q=` and no `q` | 200 | 0 results |
| `?q=a&q=b` | 400 | `{"error":"The q parameter must be supplied at most once.","code":"invalid-query"}` |
| 129-character query | 400 | `{"error":"The q parameter must not exceed 128 characters.",...}` |
| `?q=%00` | 400 | `{"error":"The q parameter contains unsupported control characters.",...}` |

The serialized response was checked for `/Users/`, `registry/baseline`,
`.json` and `node_modules`; none appear. The query is never used as a path.

## 6. Gaussian scientific evidence

Density:

```text
f(x) = exp(-0.5 * ((x - mu) / sigma)^2) / (sigma * sqrt(2*pi))
E[X] = mu, Var(X) = sigma^2
```

Independent SciPy comparison over 6 parameter combinations (including
`mu = -3, sigma = 0.5` and `mu = 3, sigma = 2.5`), 41-point grids plus centre,
±1e-8 centre points, ±sigma, ±2sigma, ±10sigma and ±12:

| Metric | Observed | Required |
| --- | --- | --- |
| Values compared | 318 | ≥ 300 |
| Max absolute error | `5.55e-17` | ≤ `1e-10 + 1e-8·abs(ref)` |
| Max relative error | `2.70e-16` | — |
| Max SciPy quadrature normalization error over mu ± 10σ | `1.11e-16` | ≤ `1e-6` |
| Simpson integral error (TS, mu ± 10σ) | ≤ `1e-6` asserted | ≤ `1e-6` |

Also asserted: symmetry, non-negativity (with documented double-precision
underflow in extreme tails), peak at `mu` with height `1/(σ√(2π))`, mean,
variance, and rejection of NaN/Infinity/σ ≤ 0 and out-of-range laboratory
parameters.

## 7. Python export evidence

The exporter is a pure TypeScript function; the browser only builds a string
and downloads/copies it. Generated source is executed in `.venv` at default,
lower-boundary, upper-boundary and asymmetric-domain snapshots. All 601 (or
301) curve points were compared with the TypeScript implementation.

| Snapshot | Points | Max absolute parity |
| --- | --- | --- |
| default (μ=0, σ=1) | 601 | ≤ `1e-12` (asserted) |
| lower boundary (μ=-3, σ=0.5) | 601 | ≤ `1e-12` (asserted) |
| upper boundary (μ=3, σ=2.5) | 601 | ≤ `1e-12` (asserted) |
| asymmetric domain | 301 | ≤ `1e-12` (asserted) |
| downloaded artifact (μ=1.2, σ=0.8) | 601 | `1.11e-16` measured |

The downloaded file `evidence/downloads/patlas_gaussian_snapshot.py` was also
executed directly (`--json`) and exited 0. A Matplotlib PNG is produced by
`--plot PATH` and was verified to be a valid PNG.

## 8. Verification commands and results

| Command | Exit | Result |
| --- | --- | --- |
| `npx eslint .` | 0 | No errors or warnings |
| `npx tsc --noEmit` | 0 | Strict typecheck clean |
| `npx vitest run` | 0 | 8 files, 76 passed, 0 failed, 0 skipped |
| `.venv/bin/python -m pytest python/tests -q` | 0 | 5 passed |
| `NEXT_TELEMETRY_DISABLED=1 npx next build` | 0 | 32 category pages, 109 model pages, static shell + dynamic API |
| `npx playwright test` | 0 | 49 passed, 0 failed, 0 skipped |
| `npm ls --all --json` | 0 | `problems: []` |
| `.venv/bin/python -m pip check` | 0 | No broken requirements |
| Downloaded Python source `--json` | 0 | Snapshot reproduced |

Browser suite coverage: baseline route resolution, 404s, duplicate HMM paths,
search HTTP contract, search UI keyboard flow, laboratory synchronization,
invalid parameters, reset, download, clipboard and manual-copy fallback,
theme persistence and system preference, 320/768/1280 overflow checks, 200%
reflow simulation, mobile drawer focus behaviour, screenshots, and console
error collection.

## 9. Accessibility evidence

Automated axe-core scans (WCAG 2.0/2.1 A–AA and 2.2 AA tags) on Home, Explorer,
Gaussian lesson and Gaussian laboratory, in **both themes**: 8 scans, 0
violations reported.

Additional checks performed:

- Visible focus ring on the search input (`outline-width` non-zero).
- Keyboard slider operation, tree disclosure buttons, search arrow/Enter/Escape,
  and drawer Escape with focus restoration.
- Reduced-motion emulation: scroll behaviour becomes `auto` and animation
  durations collapse to ≤ 0.001 s.
- Landmarks (`banner`, `main`, `contentinfo`, primary navigation) and one `h1`.
- No horizontal overflow at 320/768/1280 CSS px, or at a 640 px viewport used
  as the CSS-pixel equivalent of 200% zoom.
- Light/dark contrast covered by the automated scans; not a manual certification.

This is not a claim of complete WCAG 2.2 AA certification. A manual
screen-reader and expert contrast review remains for independent review.

## 10. Screenshots and artifacts

Screenshots (12, full page): `evidence/screenshots/`

```text
home-desktop-light.png       home-desktop-dark.png
home-mobile-light.png        home-mobile-dark.png
explorer-desktop-light.png   explorer-desktop-dark.png
explorer-mobile-light.png    explorer-mobile-dark.png
gaussian-desktop-light.png   gaussian-desktop-dark.png
gaussian-mobile-light.png    gaussian-mobile-dark.png
```

Other artifacts:

- `evidence/downloads/patlas_gaussian_snapshot.py` — downloaded from the
  production laboratory at μ=1.2, σ=0.8.
- `evidence/file-inventory.txt` — complete untracked/modified inventory from
  `git status --porcelain -uall`.

## 11. Content completeness and limitations

All MODEL_MODULE_SPEC sections are present for the Gaussian lesson:
definition, motivation, visual intuition, structure, symbols/equations,
derivation, interactive experiment, fitting/inference/sampling, runnable code,
applications, assumptions/limitations, related models, knowledge check and
references.

Disclosed limitations:

- The module is **partial**, not accepted. Scientific and educational review
  remains pending.
- Sampling, MLE fitting and Bayesian inference are explained in text only; M001
  authorises one interactive laboratory.
- The relationship graph, Foundations library, Compare and Learning Paths are
  honest planned destinations, not implementations.
- Python is never executed in the browser and no arbitrary code runner exists.
- The finite display window is not used as a normalization proof; normalization
  is verified over μ ± 10σ with independent quadrature.
- Accessibility evidence is automated plus targeted keyboard/focus/zoom checks,
  not a certification.
- 200% zoom is simulated by CSS-pixel reflow, not the browser's native zoom UI.
- Remote CI was not executed and no commit, push, merge or deployment occurred.

## 12. Repository state and change inventory

- Tracked files modified: **0**.
- Commits created: **0**.
- Pushes/merges/deployments: **0**.
- Untracked implementation files at return: recorded in
  `evidence/file-inventory.txt` (95 entries, including the four new
  `docs/current` evidence notes; the 12 screenshots are git-ignored but present).
- `docs/planning/v0.6` tree hash unchanged from `9199d49`.
- `AGENTS.md` was temporarily appended to by `next dev` (Next 16 agent-rules
  block); it was restored to HEAD before return, and the final diff shows no
  tracked modification.

## 13. Deviations, assumptions and requested decisions

1. **No deviations from scientific scope.** Only the Gaussian vertical slice is
   implemented.
2. **Version selection:** TypeScript 6.0.3 and ESLint 9.39.5 were chosen over
   the newest majors because the Next.js lint toolchain does not declare support
   for TypeScript ≥ 6.1 / ESLint 10. This avoids forced, unsupported upgrades.
3. **Test-only Python reference:** SciPy parity and normalization checks run in
   the isolated `.venv`; no Python execution path exists in the application.
4. **Search malformed input definition:** duplicate `q`, control characters and
   >128 characters are rejected with 400. Unknown queries return 200 empty, as
   required.
5. **Reporting limitation:** this return cannot claim WCAG certification or
   scientific acceptance. Both require independent review.
6. No blocking decision is requested. Review of provisional canonical mapping
   and acceptance of the Gaussian module remain separate Lead/Founder decisions.
