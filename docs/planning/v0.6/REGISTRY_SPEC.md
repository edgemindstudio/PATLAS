# Registry contract — Phase 1 proposal
Three separate identities: category ID, canonical entry ID, placement ID. IDs are stable ASCII slugs; display labels may change only through recorded migration. Namespace IDs by kind. Preserve the original placement label, order and path. Root is separate. Initial projection is a planning artifact, not runtime schema.

## Proposed records
- Category: id, label, parentId, order, lessonRef, status.
- Entry: id, title, aliases, kind (distribution/model/family/representation/process/method), summary, contentRef, labIds, referenceIds, status, contentVersion. Optional probabilistic traits: conditionality, density access, latent variables, modeling purpose, learning objectives; use unknown/not-applicable rather than forced booleans.
- Placement: id, categoryId, entryId, label, order, origin (baseline or extension).
- Relationship: id, source {kind,id}, target {kind,id}, type (prerequisite, variant-of, related-to, uses-mechanism, represented-by), explanation, referenceIds. Direction: dependent → prerequisite; variant → broader family; related-to symmetric. Membership derived from placements; cross-category links explicit. No cycles in category hierarchy or prerequisite/variant graphs; related edges may cycle. Validate endpoints and duplicate logical edges.
- Foundation concept: id, title, contentRef, labIds, prerequisites, status.
- Lab: id, entryId, objective, parameter definitions with bounds/defaults/units, computeRef, rendererRef, seed policy, execution tier, sourceRef, tests, accessible explanation. Lab result includes typed axes, series, diagnostics and warnings. Parameter changes must update equation, visual and export consistently.
- Reference: id, authors, title, year, DOI/URL, claim mapping; primary papers/textbooks preferred.

## Extension contract
Add an entry and placement plus lesson, labs and references; registry loader generates route, navigation, search and coverage entries. Add a category by metadata, not core UI modifications. New visualization mechanisms may require a new renderer and computation module. Example proposed future entry: Consistency Models, under a new consistency-based category within deep generative modeling, related to diffusion. Not yet baseline or implementation scope.

## Validation
Schema checks + semantic validation (unique IDs, known references, no prohibited cycles, valid ordering, required lesson sections, baseline set equality for original placements, additive extensions). Missing material is planned/blocked, never silently accepted. Use explicit version and migration with compatibility test. Build-time validation fails on malformed records; planned records remain navigable with honest status.
