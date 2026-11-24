# PATLAS architecture — v0.3 design approved; v0.5 continuity update
Confirmed constraints: Next.js + TypeScript; full-stack from the beginning; all AD-001–010 and PD-001–008. No implementation authorization. Founder approved the v0.3 package. Runtime verification and implementation authorization remain pending.

## Application boundaries
One modular Next.js application using App Router, with server and client components and Node-compatible server runtime. Public pages may be pre-rendered where appropriate, with server functionality retained; do not configure a static-export-only deployment. Server-side registry/content loading, validation, lesson rendering, metadata and read-only search service. Proposed first server endpoint GET /api/search?q=... returns bounded validated registry results from versioned data, with length limits and no arbitrary file access. Server components call shared server services directly rather than issuing internal HTTP requests. Client components own interactive tree, graph, lab controls, plots and code editing. Serialize only public typed data across server/client boundary. Shared pure numerical functions have no framework dependencies. Use a small server smoke test to demonstrate genuine full-stack behavior. No database, mandatory authentication, microservices, remote code execution or write APIs proposed initially; these are separate decisions, not prohibitions on future evolution. No hosting selected.

## Proposed supporting stack
CSS modules and design tokens; semantic tree and SVG-first graphics; D3/React Flow or Canvas selectively after demonstrated need; KaTeX; sanitized Markdown and structured JSON with registered lab IDs, no executable authored content; JSON Schema and semantic validation; Python/NumPy/SciPy/scikit-learn reference examples and downloadable PyTorch examples. Vitest, pytest, Playwright, GitHub CI. Exact versions, package manager, editor and graph library remain to be verified. Pin lockfiles and Python environments after compatibility testing.

## Runtime and security
Registry → validated index → server services → public lesson DTO → client lab controller → pure computation → typed renderer result; parameter snapshot drives equations and exported source. Optional Python execution isolated from app privileges: dedicated restricted origin or opaque sandbox, restrictive CSP, worker termination, validated messages, fixed packages/assets, output bounds, no secrets or arbitrary network. Worker alone is not a sandbox; browser memory limits cannot be guaranteed. Keep arbitrary code execution disabled until independently verified. Download fallback always available. No remote execution endpoint. Validate server inputs, escape content, avoid exposing internal paths, test malformed requests and server-only imports. Do not introduce tracking or mandatory accounts.

## Proposed route and repository layout
```
patlas/  # proposed local directory
  src/app/                 # Next.js App Router; page layouts and route handlers
    models/[id]/           # canonical lesson route
    categories/[id]/       # category lessons
    foundations/[id]/      # prerequisite lessons
    explorer/              # tree and graph
    api/search/route.ts    # read-only server search
  src/server/              # registry, content, search services (server-only)
  src/features/            # explorer, lessons, labs, playground
  src/science/             # framework-independent numerical functions
  src/ui/                  # accessible reusable components and design tokens
  registry/                # schemas, frozen baseline, entries, placements, relations
  content/                 # foundations, categories, models, paths
  examples/                # Python scripts, notebooks and web examples
  tests/                   # taxonomy, science, parity, server, browser
  scripts/                 # validation, coverage
  docs/                    # decisions, governance, architecture, handoffs
  AGENTS.md
  README.md
```
Build validates all registry references and baseline placements. Route IDs are stable. Planned pages distinguish unavailable content from completed modules. Search indexes aliases and canonical entries while retaining branch context. CI tests server route, production build/start, deep links, metadata, hydration, responsive layout and numeric reference parity. MIT for original code, CC BY 4.0 for original educational content; third-party licenses and attribution tracked separately. Repository and CI not created. Documentation only; no runtime compatibility claims.
