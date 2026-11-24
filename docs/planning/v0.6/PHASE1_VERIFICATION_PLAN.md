# Verification and implementation gates — proposed
Phase 1 planning checks executed: baseline JSON parsed; 9 root branches, 32 category nodes, 123 leaf placements, 109 canonical IDs; unique category and placement IDs; exact set equality of module references; duplicate audit. No software tests or scientific numerical validation executed.

## Later bounded compatibility spikes (not authorized)
1. Next.js production build/start, server-side registry services and read-only search endpoint, direct reload, metadata/indexing, hydration, mobile, input bounds, server-only imports and asset paths; document deploy constraints. No static-export-only configuration.
2. Reference labs: Bernoulli, Gaussian, GMM, HMM, diffusion toy. Validate analytic values and invariants, independent Python parity, deterministic seeds, boundary inputs and numerical tolerances. No claim toy equals full training.
3. Accessibility: keyboard tree navigation, screen reader graph alternatives, labeled controls, contrast, reduced motion, mobile layouts; WCAG 2.2 AA target subject to review.
4. Playground: isolation threat tests, termination, output bounds, offline/error fallback, supported Python packages. If unsafe, ship editable/exportable code without in-browser execution pending resolution.
5. Extension: introduce one test-only fixture entry and category, verify auto navigation/search/coverage and no baseline change; remove fixture from production.

## Release evidence
Each module needs scientific review, test results, source export, accessibility checks, references and honest coverage state. Compare current registry with frozen source placements in CI; no automatic acceptance based on file existence. Numerical tests cover analytic references, normalization and sampling properties where applicable; stochastic tolerances specified before testing. Browser smoke and mobile tests; manual learning review. License/dependency inventory prior to release.

Round 2 architecture directions confirmed. Phase 1 planning readiness is conditional on review of reconciled design; scientific identity review and runtime spikes remain tracked gates. Next phase and any execution require separate explicit authorization. No coding, dependency installs, repo init, commits or deployment by this package.
