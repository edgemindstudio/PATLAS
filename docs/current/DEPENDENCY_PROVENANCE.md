# PATLAS — Dependency provenance (M001)

Date: 2026-11-24
Release: PATLAS-M001-REL-001

All versions were selected after querying the public npm registry during the
authorized run, not from memory. Compatibility constraints were checked before
installation. Nothing was installed globally and no `sudo` was used.

## Runtime

| Tool | Version | Source |
| --- | --- | --- |
| Node.js | 24.22.3 LTS | Homebrew `node@24` (`/opt/homebrew/opt/node@24/bin`) |
| npm | 11.19.1 | bundled with Node 24 |
| Python | 3.12.10 | system framework Python; isolated `.venv` |
| pip | 26.0.1 | isolated `.venv` |
| Git | 2.54.0 (Apple Git-157) | system |
| OS | macOS 27.2.1, arm64 | Mac Studio |

Activation command used for every Node command:

```bash
export PATH="$(brew --prefix node@24)/bin:$PATH"
```

## Version-selection rationale

- **next 16.4.6** — current stable (`latest` dist-tag); engine requirement
  `>=20.9.0`, satisfied by Node 24.22.3. React 19 is a declared peer.
- **react / react-dom 19.3.1** — current stable; satisfies Next 16 peer range.
- **typescript 6.0.3** — stable 6.x. TypeScript 7.0.2 is the newest major, but
  the Next.js ESLint toolchain (`typescript-eslint`, pulled in by
  `eslint-config-next`) declares a TypeScript peer below 6.1.0. Pinning 6.0.3
  keeps strict typechecking and linting on a mutually supported stable release
  rather than forcing an unsupported upgrade.
- **eslint 9.39.5** — latest 9.x. ESLint 10 satisfies `eslint-config-next` but
  not the legacy plugins (`eslint-plugin-import`, `eslint-plugin-jsx-a11y`,
  `eslint-plugin-react`) bundled with it. 9.39.5 produces an empty
  `npm ls --all` problems list.
- **@types/node 24.19.2** — matches the Node 24 runtime rather than typing
  against a newer Node major.
- **vitest 5.1.1 + vite 8.3.8** — Vitest declares `vite` as a required peer
  (`^6.4.0 || ^7.0.0 || ^8.0.0`); Vite 8.3.8 is the stable match.
- **@playwright/test 1.65.1** — stable; satisfies Next 16's optional
  `@playwright/test ^1.51.1` peer.
- **katex 0.19.1, marked 18.3.0, sanitize-html 2.18.2, ajv 8.20.0** — current
  stable releases used for equation rendering, Markdown, HTML sanitisation and
  JSON Schema validation.
- **@axe-core/playwright 4.14.1** — test-only accessibility scanning.

After the final install, `npm ls --all --json` reported `problems: []`.

## Node.js dependencies (pinned)

| Package | Version | Licence | Role |
| --- | --- | --- | --- |
| next | 16.4.6 | MIT | Application framework (App Router, Node runtime) |
| react | 19.3.1 | MIT | UI runtime |
| react-dom | 19.3.1 | MIT | DOM renderer |
| katex | 0.19.1 | MIT | Mathematical notation |
| marked | 18.3.0 | MIT | Markdown parsing |
| sanitize-html | 2.18.2 | MIT | HTML allow-list sanitisation |
| ajv | 8.20.0 | MIT | JSON Schema validation |
| typescript | 6.0.3 | Apache-2.0 | Strict typechecking |
| eslint | 9.39.5 | MIT | Linting |
| eslint-config-next | 16.4.6 | MIT | Next.js lint rules |
| vitest | 5.1.1 | MIT | Unit, registry and science tests |
| vite | 8.3.8 | MIT | Vitest peer/bundler |
| @playwright/test | 1.65.1 | Apache-2.0 | Production-server browser tests |
| @axe-core/playwright | 4.14.1 | MPL-2.0 | Automated accessibility scans |
| @types/node | 24.19.2 | MIT | Node typings |
| @types/react | 19.3.1 | MIT | React typings |
| @types/react-dom | 19.3.0 | MIT | React DOM typings |
| @types/katex | 0.16.8 | MIT | KaTeX typings |
| @types/sanitize-html | 2.16.2 | MIT | sanitize-html typings |

Licence identifiers were read from each installed package's `package.json`
(`node_modules/<pkg>/package.json`), not guessed.

## Python dependencies (isolated `.venv`)

| Package | Version | Licence | Role |
| --- | --- | --- | --- |
| numpy | 2.5.5 | BSD-3-Clause | Deterministic grids |
| scipy | 1.18.1 | BSD-3-Clause | Independent reference density and normalization |
| matplotlib | 3.11.2 | PSF-based (Matplotlib licence) | Optional exported plot |
| pytest | 9.2.0 | MIT | Python verification |

Installed with:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r python/requirements.txt
.venv/bin/python -m pip check   # No broken requirements found.
```

## Reproducibility artifacts

| Artifact | SHA-256 |
| --- | --- |
| `package-lock.json` | `429e09b471f0b53e0a5fc837a9a53b6ea1076e0e5920d51f0ee7e86f84a3f3ad` |
| `python/requirements.txt` | `c38692b206a47b54e4e8b097ba54f5a2152ed1e5bc922cc66aafdd54948f7fe9` |

Reproduction commands:

```bash
export PATH="$(brew --prefix node@24)/bin:$PATH"
npm ci
npm run setup:python      # creates .venv and installs pinned Python packages
npm run lint && npm run typecheck && npm test && npm run build
npm run test:python
npx playwright install chromium
npm run test:e2e
```

## Browser binary

Chromium headless shell 159.0.8154.6 (Playwright build 1255) was downloaded
into the user Playwright cache. It is a test dependency, not a project or global
installation.

## Network use during the milestone

Network access was used only for package retrieval from the public npm and PyPI
registries and Playwright's browser download. The application itself performs no
external network requests.
