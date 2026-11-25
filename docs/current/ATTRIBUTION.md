# PATLAS — Attribution and third-party material

Date: 2026-11-24
Milestone: PATLAS-M001 (release PATLAS-M001-REL-001)

## Licensing of PATLAS material

| Material | Licence | Location |
| --- | --- | --- |
| Original PATLAS software | MIT | `LICENSE` |
| Original PATLAS educational content | CC BY 4.0 | `LICENSE-CONTENT.md`, `content/` |
| Founder-supplied frozen taxonomy | Preserved project artifact, not relicensed | `registry/baseline/`, `docs/planning/v0.6/` |

Attribution for original educational content:
"PATLAS — Probabilistic Atlas, edgemindstudio, CC BY 4.0".

## Third-party software

Third-party packages are used under their own licences and are not relicensed by
PATLAS. Exact pinned versions, provenance and licence identifiers are recorded
in `docs/current/DEPENDENCY_PROVENANCE.md`.

Notable runtime dependencies:

- **Next.js**, **React**, **KaTeX**, **marked**, **sanitize-html**, **AJV** —
  MIT.
- **TypeScript** — Apache-2.0.
- **Vitest**, **ESLint** toolchain — MIT.
- **Playwright** — Apache-2.0.
- **@axe-core/playwright** — MPL-2.0 (test-only).
- **NumPy**, **SciPy** — BSD-3-Clause; **Matplotlib** — PSF-based licence;
  **pytest** — MIT. Python packages are installed only into the local `.venv`.

No third-party package is bundled, vendored or modified. `package-lock.json`
and `python/requirements.txt` pin the verified versions.

## Fonts and visual assets

No webfont is downloaded or redistributed. The stylesheet requests `Inter` and
`JetBrains Mono` by family name with system fallbacks; if those fonts are
installed locally they render, otherwise the operating-system UI font is used.

- The PATLAS probability-curve mark is original SVG authored for this
  repository.
- KaTeX ships its own fonts under the KaTeX MIT licence as part of the package.
- No third-party image, diagram or figure is reproduced.

## Cited references

The Gaussian lesson cites, but does not reproduce, the following sources:

1. Casella, G.; Berger, R. L. (2002). *Statistical Inference*, 2nd ed.
   Duxbury. <https://archive.org/details/statisticalinfer0000case>
2. Bishop, C. M. (2006). *Pattern Recognition and Machine Learning*. Springer.
   <https://link.springer.com/book/10.1007/978-0-387-31073-2>
3. Murphy, K. P. (2022). *Probabilistic Machine Learning: An Introduction*.
   MIT Press. <https://probml.github.io/pml-book/book1.html>
4. SciPy developers. *scipy.stats.norm* reference documentation.
   <https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.norm.html>
5. NIST/SEMATECH. *e-Handbook of Statistical Methods: Normal Distribution*.
   <https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm>

Claim-to-source mapping is stored with each reference in
`content/models/gaussian-normal.json`.

## Taxonomy provenance

The model tree was supplied by the Founder and is preserved byte-for-byte in
`registry/baseline/` and `docs/planning/v0.6/`. Canonical identities and alias
reconciliation are a candidate projection awaiting scientific review; no
ownership or licence claim is made over the original tree by the MIT or
CC BY 4.0 notices.

## Third-party verification tooling

SciPy is used as an independent numerical reference for verification only. It
is not part of the browser runtime, and no Python code is executed by the
application.
