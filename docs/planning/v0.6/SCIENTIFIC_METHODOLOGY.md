# Scientific and educational methodology

> v0.1 | 2026-11-24 | Phase 0 review candidate. No implementation authorization.

- Distinguish distribution, model family, representation, inference algorithm, training objective and architecture. Do not treat overlapping categories as exclusive.
- Preserve original tree placements; annotate scientific corrections and cross-links. Dirichlet is multivariate; deep belief networks combine directed and undirected structure; factor graphs are representations; GANs induce implicit distributions; not every energy-based model defines a normalized distribution. Review all canonical aliases before freezing registry.
- Teach intuition before formalism. Specify random variables, support, parameters, constraints, assumptions, notation and units. Distinguish density from probability mass and likelihood from posterior.
- Separate model definition, fitting, inference and sampling; explain when a stage does not apply. Label simplified demos, empirical approximations, pretrained results and real training explicitly.
- Every numerical experiment uses documented seeds where stochastic, validated parameter ranges, reference values and tolerances appropriate to the algorithm. Show uncertainty where relevant; never imply a random illustration proves a theorem.
- Compare models under shared data and evaluation conditions, with limitations. Use primary papers, textbooks or authoritative documentation; record citations and source licenses. Never invent results or references.
- Review math and code together; changes to equations require checking computation, labels, and explanations.
