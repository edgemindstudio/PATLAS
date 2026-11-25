# M001 executor return

Release reference and exact local path: **PATLAS-M001-REL-001** — `/Users/poisedre/PATLAS` (branch `engineering/m001-foundation`).

Starting/ending git state, remote changes (expected none), commit status: Started at `e7ad3ba499e8bc63d246d38b268251bd6e2b1b77`, clean tree, `main` = `origin/main` = start commit. Ended at the same commit with **0 tracked files modified**, **0 commits**, **0 pushes**, **0 merges**, **0 deployments**; remote unchanged. All implementation files are untracked and listed in `evidence/file-inventory.txt`. `AGENTS.md` was temporarily appended to by `next dev` and restored to HEAD; the final diff contains no tracked modification.

Runtime/dependency versions, lockfiles and setup commands: Node **24.22.3** LTS (`export PATH="$(brew --prefix node@24)/bin:$PATH"`), npm **11.19.1**, Python **3.12.10**, Git **2.54.0**, macOS 27.2.1 arm64. Next **16.4.6**, React **19.3.1**, TypeScript **6.0.3**, ESLint **9.39.5**, Vitest **5.1.1**, Vite **8.3.8**, Playwright **1.65.1**, KaTeX **0.19.1**, marked **18.3.0**, sanitize-html **2.18.2**, AJV **8.20.0**. Python venv: NumPy **2.5.5**, SciPy **1.18.1**, Matplotlib **3.11.2**, pytest **9.2.0**. `package-lock.json` SHA-256 `429e09b471f0b53e0a5fc837a9a53b6ea1076e0e5920d51f0ee7e86f84a3f3ad`; `python/requirements.txt` SHA-256 `c38692b206a47b54e4e8b097ba54f5a2152ed1e5bc922cc66aafdd54948f7fe9`. Setup: `npm install --no-fund --no-audit` (exit 0), `python3 -m venv .venv`, `pip install -r python/requirements.txt`, `npx playwright install chromium` (all exit 0). Full provenance: `docs/current/DEPENDENCY_PROVENANCE.md`.

Frozen file SHA-256 before/after (identical): `MODEL_SCOPE_BASELINE.json` `e8ea11be46cb6c6d5907a19ea4ae2517a4e52413c50bd5bcf5a90067dccb6520`; `SOURCE_TREE.txt` `f0e3e906ad0425fca06c54385544d990223d03d303becd2f202514171844a51a`; `TAXONOMY_PROJECTION_CANDIDATE.json` `344dad29f17d86b3a5a838eaae1c19b0abf78ffa2df06dbe98f98a56b4708c1a`. Registry copies are byte-identical to `docs/planning/v0.6`; the planning tree hash remains `90c990a849b42b606caa0bebbc470141fa7b96d0` (same as commit `9199d49`).

Work package outcomes WP01–WP08 (PASS/FAIL/BLOCKED with evidence):
- **WP01 PASS** — App Router/Node runtime scaffold, strict TS, pinned lockfile, ESLint, CSS modules/tokens, KaTeX, AJV, Vitest, Playwright, isolated Python, local CI, MIT + CC BY 4.0 notices. `npm ls --all` problems `[]`.
- **WP02 PASS** — Frozen import, JSON Schema + semantic validation, deterministic transform, exact traversal parity, digest equivalence, 13 duplicate groups retained, invalid fixtures rejected, additive extension proves automatic navigation/search/coverage.
- **WP03 PASS** — Header, seven destinations, desktop sidebar, mobile drawer with focus trap/restore, light/dark themes with persistence, tokens, focus styles, 320/768/1280 and 200% reflow checks.
- **WP04 PASS** — Data-driven explorer; all 109 model and 32 category routes HTTP 200; meaningful 404; duplicate HMM placements resolve one canonical URL; planned pages are honest; graph explicitly planned.
- **WP05 PASS** — `GET /api/search?q=` with trim/NFKC/lowercase, exact→prefix→substring ranking, categories + canonical entries, dedupe, branch paths, 20 limit, 400 on duplicate/overlong/control input, 200 empty for unknown; real UI with loading/error/empty/keyboard.
- **WP06 PASS** — Pure Gaussian math, parameter rejection, approved ranges/defaults/domain, single snapshot driving plot/equations/statistics/Python, labelled axes, finite-domain disclosure, accessible summaries, keyboard sliders, reset, no fake observations.
- **WP07 PASS (module partial)** — All applicable lesson sections, MLE denominator *n* explained, references, copyable/downloadable Python with SciPy/NumPy/Matplotlib instructions, manual-copy fallback, partial status disclosed.
- **WP08 PASS** — Lint, typecheck, unit/schema/science, Python, parity, production build/server, browser/accessibility, extension fixture, screenshots.

Scope counts and exact traversal validation; extension fixture outcome: **9 major / 32 category / 123 placements / 109 canonical modules**. Projection categories and placements deep-equal the baseline-derived ordered traversal; source digest matches; duplicate groups 13 with 14 redundant placements; HMM has 3 branches. Additive test extension yields 9/33/124/110 and appears in tree, search and coverage; synthetic ids absent from production.

Search HTTP requests, response status and representative results: `?q=Gaussian` → 200, 9 results, first `gaussian-normal` (`matchedOn: title`, `partial`); `?q=Hidden Markov Models` → 200, 1 result via alias with 3 branch paths; `?q=Continuous Distributions` → 200 category result; `?q=zzzz-no-such-model` and empty → 200 with 0 results; `?q=a&q=b`, 129 chars, `q=%00` → 400 `invalid-query`. Responses expose no internal paths or filenames.

Gaussian math parity (grid, max errors, thresholds, Python export tests): SciPy parity over 318 values, max absolute error **5.55e-17**, max relative **2.70e-16** (threshold `1e-10 + 1e-8·|ref|`); SciPy quadrature normalization over μ ± 10σ max error **1.11e-16** (≤ 1e-6); TypeScript Simpson integral ≤ 1e-6; symmetry/non-negativity/peak/variance/invalid-parameter tests pass. Exported Python at default and boundary snapshots matches TypeScript to ≤ 1e-12 across 601/301 points; downloaded artifact matches at **1.11e-16** and executes with exit 0 including `--plot`.

Test commands, exit codes, counts and skipped/blocked tests:
- `npx eslint .` → **0**
- `npx tsc --noEmit` → **0**
- `npx vitest run` → **0**; 8 files, **76 passed**, 0 failed, 0 skipped
- `.venv/bin/python -m pytest python/tests -q` → **0**; **5 passed**
- `NEXT_TELEMETRY_DISABLED=1 npx next build` → **0**
- `npx playwright test` → **0**; **49 passed**, 0 failed, 0 skipped
- `npm ls --all --json` → **0**, `problems: []`; `pip check` → **0**
- No blocked checks. No assertions were weakened.

Production build/start and browser route evidence: build prerendered 32 category pages and 109 canonical model pages plus the static shell; `/api/search` is dynamic (Node runtime). `next start` served the production build on port 3100 for all Playwright tests. All seven destinations, all baseline IDs and the Gaussian lab returned 200; unknown ids returned 404 with recovery links. No browser console errors or page errors in tested flows.

Screenshots (desktop/mobile, both themes), keyboard/contrast/zoom/reduced-motion checks: 12 full-page screenshots in `evidence/screenshots/` (home, explorer, Gaussian lesson × desktop/mobile × light/dark). Axe scans on Home, Explorer, lesson and lab in both themes: **8 scans, 0 violations**. Manual-targeted checks: visible focus ring, keyboard sliders/tree/search/drawer, Escape focus restoration, reduced-motion media emulation, no horizontal overflow at 320/768/1280, and 640 px reflow (200% equivalent). Not reported as WCAG certification.

Changed/untracked files, diff summary and evidence paths: no tracked modifications; all application, test, registry, content, CI and documentation files are new/untracked. Summary: `src/` 41 files, `tests/` 26 files, `registry/` 5, `python/` 4, `content/` 2, `evidence/` (download + inventory; screenshots are git-ignored), plus root configs, licenses, `.github/workflows/ci.yml` and `.gitignore`. Full inventory: `evidence/file-inventory.txt`. Detailed evidence: `docs/current/M001_IMPLEMENTATION_EVIDENCE.md`; attribution: `docs/current/ATTRIBUTION.md`.

Scientific content sections implemented/missing; planned features and limitations: all MODEL_MODULE_SPEC sections present; missing sections **none**; module status remains **partial**. Sampling/fitting/inference are explanatory only; one laboratory is authorised. Relationship graph, Foundations, Compare and Learning Paths are planned destinations. No browser Python execution or arbitrary runner. Finite display window is not used as normalization proof. Accessibility evidence is automated plus targeted checks, not certification. Remote CI was not executed; no deployment.

Deviations, assumptions, defects, risks and requested decisions: No scientific or scope deviation. TypeScript 6.0.3 and ESLint 9.39.5 were pinned instead of newer majors because the Next.js lint toolchain declares incompatible peer ranges for TypeScript ≥ 6.1 and legacy ESLint 10 plugins; this avoids forced upgrades. Malformed search input is defined as duplicate `q`, control characters, or >128 characters. No blocking decision is requested; independent scientific/educational review, provisional-mapping review and Founder acceptance remain outstanding.

Final status: **IMPLEMENTED — REVIEW PENDING**.

No claim of acceptance; no secrets or unrelated changes in evidence.
