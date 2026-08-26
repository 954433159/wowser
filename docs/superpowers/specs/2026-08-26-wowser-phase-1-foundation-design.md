# Wowser Phase 1 Foundation Modernization Design

Date: 2026-08-26
Repository: `954433159/wowser`
Baseline commit: `5fcd3e607db7551a74caf6d7ffa4dd785a264dc8`
Development branch: `modernize/phase-1-foundation`

## 1. Purpose

Phase 1 establishes a modern, reproducible development foundation for Wowser without intentionally changing WoW gameplay behavior, resource formats, rendering semantics, or network protocol behavior.

This phase is compatibility-first. The goal is to make the existing client buildable and testable with a supported Node/Vite/TypeScript toolchain while retaining the legacy React 0.14 and Three.js 0.77 runtime until later phases.

## 2. Non-goals

Phase 1 will not:

- Upgrade React 0.14 to a current React release.
- Upgrade Three.js 0.77 to a current Three.js release.
- Introduce WebGPU.
- Rewrite renderers, shaders, ADT, WMO, or M2 algorithms.
- Rewrite WoW authentication, packet, crypto, movement, or world protocol logic.
- Introduce SharedArrayBuffer, WASM parsers, IndexedDB asset caching, or KTX2/Basis.
- Reorganize the whole source tree into new game/network/renderer/assets directories.
- Attempt to complete missing WoW gameplay systems.

Those changes belong to later phases after the build and test baseline is stable.

## 3. Repository safety and branch policy

The original fork baseline is commit `5fcd3e607db7551a74caf6d7ffa4dd785a264dc8`.

The previous accidental documentation commit on `master` is outside the Phase 1 development branch. Phase 1 work starts from the original baseline commit on `modernize/phase-1-foundation`.

Before Phase 1 is merged, `master` will be restored to the original content using a normal revert-style change rather than force-rewriting public history. No force push is required for Phase 1.

All implementation commits will be made on `modernize/phase-1-foundation`, and review will occur through a pull request before merge.

## 4. Current build model

The legacy project currently uses two partially separate build paths:

1. Webpack 1 builds the browser client from `src/bootstrapper.jsx`, handling JSX, Stylus, GLSL, images, and a `/pipeline` development proxy.
2. Gulp/Babel compiles `src/**/*.js` into generated `lib/` and `spec/` trees and runs old Mocha tests.

The Babel configuration also enables obsolete proposal syntax, including the function-bind operator used as `::this.method`.

Legacy Webpack-specific module conventions include worker-loader imports such as `worker!./`, raw GLSL loaders, URL loaders, and Stylus loaders.

These are the primary migration blockers for Vite.

## 5. Target Phase 1 toolchain

Phase 1 will target:

- Node.js 24 LTS as the recommended development runtime.
- npm using a regenerated lockfile from the Phase 1 dependency graph.
- Vite 8 as the browser development/build tool.
- TypeScript in incremental adoption mode.
- Existing React 0.14 runtime.
- Existing Three.js 0.77 runtime.
- Existing Express/pipeline integration unless a minimal compatibility change is required.

TypeScript will initially be configured with JavaScript coexistence:

- `allowJs: true`
- `checkJs: false`
- `noEmit: true`

Existing `.js` and `.jsx` source files remain valid inputs. TypeScript is introduced first for configuration, new compatibility modules, and gradual migration rather than a whole-repository conversion.

## 6. Migration strategy

### 6.1 Preserve behavior before modernization

The implementation will first create automated characterization tests around pure logic that does not require WoW assets or a live server. Candidate areas include packet framing, crypto primitives, GUID handling, buffer operations, and SRP behavior where deterministic fixtures are practical.

The tests are intended as regression guards, not as an opportunity to redesign legacy behavior.

### 6.2 Replace the browser build system

Webpack 1 and webpack-dev-server will be replaced by Vite.

Vite must preserve these legacy behaviors:

- Browser entry starts from the existing bootstrap/application flow.
- Static HTML is served correctly.
- `/pipeline` requests proxy to the existing local pipeline service.
- Stylus files compile.
- PNG/JPG assets resolve.
- shader files (`.frag`, `.vert`, `.glsl`) can be imported as source text.
- Web Workers can be constructed without worker-loader.

### 6.3 Normalize unsupported JavaScript syntax

Obsolete Babel-only syntax that Vite/esbuild cannot parse directly will be converted to standard JavaScript with equivalent behavior.

For function-bind expressions such as:

`this.method = ::this.method;`

use an explicit standard equivalent:

`this.method = this.method.bind(this);`

The conversion must be mechanical and behavior-preserving. It is not a broader class/lifecycle refactor.

### 6.4 Replace Webpack loader conventions

Webpack-specific loader imports will be converted to Vite-native equivalents.

Examples:

- `worker!./` -> Vite-supported Worker module construction.
- raw shader loading -> Vite raw-string imports or a narrowly scoped compatibility plugin.
- URL loader behavior -> Vite asset URLs.
- Stylus loader chain -> Vite CSS preprocessor support.

The preferred implementation is the smallest compatibility layer that preserves the existing module interfaces.

### 6.5 Keep server and pipeline boundaries stable

The existing resource pipeline contract (`/pipeline/...`) remains unchanged from the browser's perspective.

Phase 1 must not redesign MPQ extraction, BLP conversion, Blizzardry parsing, or websockify networking.

If a development-server path adjustment is necessary, it must remain transparent to existing client code where practical.

## 7. Dependency policy

Dependencies will be classified into three groups:

### Retained runtime dependencies

Legacy runtime libraries required by current client behavior remain pinned or minimally adjusted where installation compatibility permits. React and Three.js are explicitly retained at their legacy versions during Phase 1.

### Replaced build dependencies

Webpack 1, webpack-dev-server 1, loader packages, Gulp build orchestration, and Babel build-only packages will be removed when their functionality has a verified Vite/TypeScript replacement.

### Deferred runtime upgrades

Runtime dependency upgrades that can alter rendering, React behavior, network semantics, or binary parsing are deferred to later phases.

## 8. Tests and verification

Phase 1 verification is split into three levels.

### Level A: deterministic automated tests

Must run without WoW assets or a live server and cover the retained pure-logic baseline where practical.

Required command:

`npm test`

### Level B: production build verification

Required command:

`npm run build`

The Vite production build must complete successfully and emit a browser bundle without unresolved legacy loader syntax.

### Level C: development startup verification

Required command:

`npm run dev`

The development server must start successfully, serve the Wowser application shell, and expose the expected `/pipeline` proxy configuration.

Actual rendering of a complete WoW world depends on external WoW 3.3.5a assets/pipeline services and is therefore an integration acceptance step when that environment is available, not a prerequisite for every CI run.

## 9. Error handling and diagnostics

Migration compatibility failures should fail loudly during development/build rather than silently degrading.

Examples:

- Unsupported shader import -> build error identifying the path.
- Worker construction failure -> explicit runtime error with worker module path.
- Missing pipeline service -> request/network error remains visible rather than being replaced by mock data.
- Unsupported old syntax -> build/typecheck failure until mechanically normalized.

Phase 1 must not introduce fallback content that masks missing WoW resources.

## 10. CI baseline

If GitHub Actions is absent, Phase 1 will add a minimal workflow using the selected Node.js runtime to run:

1. dependency installation,
2. tests,
3. production build.

CI must not require proprietary WoW asset files.

## 11. Commit structure

Implementation should be split into reviewable commits, approximately:

1. `test: establish legacy logic characterization baseline`
2. `build: add node and typescript foundation`
3. `build: migrate browser bundling to vite`
4. `refactor: normalize legacy babel-only syntax`
5. `build: migrate workers shaders styles and assets`
6. `ci: add phase 1 verification`
7. `docs: document modern development workflow`

Exact commit boundaries may change if tests expose a safer dependency order, but unrelated gameplay or renderer refactors must not be mixed into Phase 1.

## 12. Acceptance criteria

Phase 1 is complete when all of the following are true on `modernize/phase-1-foundation`:

- A supported Node.js version is documented and enforced through project metadata where practical.
- `npm install` or the selected deterministic install command succeeds from a clean checkout.
- `npm test` succeeds without proprietary WoW assets.
- `npm run build` succeeds using Vite.
- `npm run dev` starts the modern development server.
- `/pipeline` development proxy behavior is preserved.
- Legacy Stylus, shader imports, static image assets, and Worker creation have working Vite-compatible paths.
- Unsupported Babel-only function-bind syntax is removed from browser/runtime source.
- Existing React 0.14 and Three.js 0.77 behavior is intentionally retained.
- WoW binary formats, gameplay logic, renderer semantics, packet semantics, and external pipeline interfaces are not intentionally changed.
- CI verifies tests and production build without requiring WoW assets.
- The Phase 1 branch is reviewable through a pull request before merge.

## 13. Follow-on phases

After Phase 1 is stable:

- Phase 2: Three.js modernization and explicit WebGL2 renderer migration.
- Phase 3: dedicated protocol worker and asset-worker architecture.
- Phase 4: IndexedDB asset cache and KTX2/Basis texture pipeline.
- Phase 5: profile-driven WASM parser migration and optional SharedArrayBuffer data paths.
- Later: WebGPU and missing WoW world/gameplay protocol systems.
