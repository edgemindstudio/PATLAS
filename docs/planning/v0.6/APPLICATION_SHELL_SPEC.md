# Application shell specification — confirmed navigation and layout direction; detailed routes proposed
Next.js App Router, TypeScript, approved full-stack architecture. Public shell header (PATLAS, navigation, search, theme), responsive sidebar, main landmark, breadcrumb and footer (license, attribution, repository when available). Server-rendered registry/content pages; client components for interactions. No database, remote runner, tracking or accounts required in first slice.

| Route | Purpose |
|---|---|
| / | Landing and introductory exploration |
| /explorer | Tree/graph; selection, filter and branch context |
| /categories/[id] | Category teaching page |
| /models/[id] | Canonical model or concept page |
| /foundations and /foundations/[id] | Prerequisite library and lesson |
| /labs and /labs/[id] | Experiment discovery and workspace |
| /compare | Comparable model exploration |
| /paths | Learning paths |
| /code | Example catalog |
| /api/search?q= | Bounded read-only server search |

Unknown IDs: meaningful 404 with recovery. Planned entries: real route and honest status, no fake lessons. Loading, empty, error and invalid parameter states designed explicitly. Deep links, keyboard focus, theme persistence without accounts, responsive layout. Proposed routes can be refined via decision log. Avoid unnecessary service abstractions. Shell first slice includes home, explorer, one canonical model page and actual server search; other destinations may be clearly marked planned until implemented.
