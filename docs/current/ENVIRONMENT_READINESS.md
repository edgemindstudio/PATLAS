# PATLAS — Development Environment Readiness

Date: 2026-11-24

## Verified primary development environment

- Machine: Mac Studio
- Architecture: arm64
- Hardware model: Mac15,14
- CPU cores: 28
- Memory: 256 GiB
- Available storage at inspection: 2.9 TiB
- Operating system: macOS 27.2.1
- Shell: Homebrew Bash

## Verified tools

- Node.js: 24.22.3 LTS
- npm: 11.19.1
- Python: 3.12.10
- pip: 26.0.1
- Git: 2.54.0
- GitHub CLI: 2.83.1
- OpenCode: 2.4.1
- Homebrew: 7.0.16
- Xcode: installed

## Runtime activation

Activate the selected Node.js runtime before
PATLAS development:

    export PATH="$(brew --prefix node@24)/bin:$PATH"

Node.js 23 remains installed for other projects.

Homebrew upgraded shared dependencies during the
Node.js 24 installation. Subsequent basic tool
health and computation checks passed.

## Verification results

- Node computation: PASS
- Python computation: PASS
- GitHub CLI authentication: PASS
- GitHub SSH authentication: PASS
- Authenticated account: edgemindstudio
- Existing SSH key: reused

## Planning archive

Filename: PATLAS_M001_Review_v0.6.zip

SHA-256:
b933425adf5fe506bd96079c8a81c7940318fa71ff2044382e3fdbf434c35d84

- Archive integrity: PASS
- SHA-256 verification: PASS
- Imported planning files: 34

## Repository

- Local initialization: PASS
- Local branch: main
- Documentation import: PASS
- Initial commit: PASS — 9199d49a4fc84a8272712a28737c53c6bd2bd93f
- Remote repository creation: PASS — edgemindstudio/PATLAS
- Current repository visibility: PUBLIC
- Remote synchronization: PASS — local and remote baseline identical
- ChatGPT GitHub repository access: PASS — direct read access verified

## Limitations

Next.js dependencies have not been installed.
Application, scientific and accessibility tests
have not been executed.

M001_APPLICATION_IMPLEMENTATION_AUTHORIZED=YES
M001_RELEASE_REFERENCE=PATLAS-M001-REL-001
