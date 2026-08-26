# Wowser Phase 1 Foundation Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Wowser client installable, testable, buildable, and developable on Node.js 24 with Vite 8 and incremental TypeScript, without intentionally changing React 0.14, Three.js 0.77, WoW resource semantics, renderer semantics, or network protocol behavior.

**Architecture:** Keep the existing `src/components` and `src/lib` runtime architecture intact. Replace the obsolete Gulp/Babel/Webpack toolchain around it, mechanically normalize unsupported JavaScript syntax, use Vite-native Worker/raw-shader/static-asset handling, and run the legacy Node pipeline directly from source with `tsx`. Add characterization tests before broad build changes and keep proprietary WoW assets out of CI.

**Tech Stack:** Node.js 24 LTS, npm 11, Vite 8, TypeScript 6, Vitest 4.1, `tsx`, Stylus, React 0.14.3, Three.js 0.77.0, Blizzardry 0.5.1, maintained `@napi-ffi/*` FFI packages.

**Spec:** `docs/superpowers/specs/2026-08-26-wowser-phase-1-foundation-design.md`

## Global Constraints

- Development branch is `modernize/phase-1-foundation`, created from baseline commit `5fcd3e607db7551a74caf6d7ffa4dd785a264dc8`.
- Node.js 24 LTS is the Phase 1 development/runtime baseline.
- Vite major version is 8.
- TypeScript uses incremental JavaScript coexistence: `allowJs: true`, `checkJs: false`, `noEmit: true`.
- React stays at `0.14.3` during Phase 1.
- Three.js stays at `0.77.0` during Phase 1.
- Do not redesign ADT, WMO, M2, shaders, WoW authentication, packets, crypto, movement, or world protocol behavior.
- Do not introduce WebGPU, SharedArrayBuffer, WASM parsers, IndexedDB asset caching, or KTX2/Basis in Phase 1.
- Do not reorganize the whole source tree.
- CI must not require proprietary WoW 3.3.5a assets or a live WoW server.
- Clean-checkout dependency verification uses `npm ci`.
- Every task ends with tests/checks and a reviewable commit.

---

## Planned File Structure

### New files

- `.nvmrc` — selects Node 24 for local version managers.
- `tsconfig.json` — incremental JS/TS parsing/typecheck configuration.
- `vitest.config.ts` — asset-free characterization-test configuration.
- `vite.config.ts` — Vite root, public assets, output, and `/pipeline` proxy.
- `tests/characterization/guid.test.js` — freezes current GUID parsing/string behavior.
- `tests/characterization/object-util.test.js` — freezes current reverse-lookup caching behavior.
- `tests/characterization/auth-packet.test.js` — freezes auth packet header/finalization behavior.
- `tests/characterization/blizzardry-api.test.js` — checks pure Blizzardry import paths used by Wowser remain present after dependency migration.
- `scripts/check-legacy-syntax.mjs` — rejects Babel/Webpack-only syntax that Phase 1 removes.
- `src/lib/server/cli.js` — source-mode server entrypoint for `tsx`.
- `src/lib/server/reset.js` — replacement for the old Gulp `reset` task.
- `src/lib/server/paths.js` — pure path helper for the production static build directory.
- `tests/server-paths.test.js` — tests the Node 24 server path behavior without loading MPQ/StormLib.
- `.github/workflows/ci.yml` — asset-free Node 24 CI.

### Existing files intentionally modified

- `package.json`, `package-lock.json` — modern toolchain, scripts, engines, Blizzardry/FFI compatibility.
- `src/index.html` — Vite module entry.
- `src/bootstrapper.jsx` — CSS reset import.
- `src/components/wowser/index.styl` — remove Webpack-only `~` import convention.
- `src/lib/pipeline/worker/thread.js` — Vite-native Worker construction.
- `src/lib/pipeline/adt/chunk/material.js` — Vite raw shader imports.
- `src/lib/pipeline/m2/material/index.js` — Vite raw shader imports.
- `src/lib/pipeline/wmo/material/index.js` — Vite raw shader imports.
- `src/lib/server/index.js` — `process.cwd()` and `dist` static-root compatibility.
- The 20 files listed in Task 2 — mechanical function-bind syntax removal only.
- `README.md` — modern development workflow and integration prerequisites.

### Legacy build/test files removed after replacements pass

- `.babelrc`
- `src/lib/server/.babelrc`
- `gulpfile.babel.js`
- `webpack.config.js`
- `.istanbul.yml`
- `.travis.yml`
- `.eslintrc` (the ESLint 2 configuration is not retained without its obsolete dependency stack)
- `src/spec/.eslintrc`
- `src/spec/sample-spec.js`
- `src/spec/spec-helper.js`

---

### Task 1: Establish the Node 24 dependency and characterization-test baseline

**Files:**
- Create: `.nvmrc`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `tests/characterization/guid.test.js`
- Create: `tests/characterization/object-util.test.js`
- Create: `tests/characterization/auth-packet.test.js`
- Create: `tests/characterization/blizzardry-api.test.js`
- Modify: `package.json`
- Regenerate: `package-lock.json`

**Interfaces:**
- Consumes: existing `GUID`, `ObjectUtil`, `AuthPacket`, `AuthOpcode`, and Blizzardry public module paths.
- Produces: `npm ci` and `npm test` as the first deterministic Phase 1 gates; a package graph that no longer depends on `blizzardry@0.4.x`'s obsolete `ffi@2/ref@1` stack.

- [ ] **Step 1: Add the Node version marker**

Create `.nvmrc` exactly as:

```text
24
```

- [ ] **Step 2: Replace obsolete development dependencies and declare the Node baseline**

Keep existing runtime dependencies unless explicitly shown below. In `package.json`:

1. Change `blizzardry` from `^0.4.0` to `^0.5.1`.
2. Add:

```json
"engines": {
  "node": ">=24 <25",
  "npm": ">=11"
}
```

3. Replace the old Babel/Gulp/Mocha/Webpack/loader development dependency set with:

```json
"devDependencies": {
  "@types/node": "^24.0.0",
  "stylus": "^0.64.0",
  "tsx": "^4.20.0",
  "typescript": "^6.0.0",
  "vite": "^8.0.0",
  "vitest": "^4.1.0"
}
```

4. Add npm overrides so Blizzardry 0.5.1 keeps its existing import names while npm installs maintained Node-24-capable implementations:

```json
"overrides": {
  "blizzardry": {
    "ffi-napi": "npm:@napi-ffi/ffi-napi@4.0.7",
    "ref-napi": "npm:@napi-ffi/ref-napi@3.0.9",
    "ref-array-di": "npm:@napi-ffi/ref-array-di@1.2.2",
    "ref-struct-di": "npm:@napi-ffi/ref-struct-di@1.1.1"
  }
}
```

5. For this task, set test scripts only:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Leave `dev`, `build`, and `typecheck` scripts for the tasks that make them pass.

- [ ] **Step 3: Add the initial TypeScript coexistence config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react",
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": [
    "vitest.config.ts",
    "tests/**/*.js"
  ]
}
```

The `src` tree is intentionally not included until Babel-only syntax is removed in Task 2.

- [ ] **Step 4: Add Vitest configuration**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    restoreMocks: true,
  },
});
```

- [ ] **Step 5: Write GUID characterization tests**

Create `tests/characterization/guid.test.js`:

```js
import { describe, expect, it } from 'vitest';
import ByteBuffer from 'byte-buffer';
import GUID from '../../src/lib/game/guid';

describe('GUID legacy behavior', () => {
  it('reads low then high 32-bit words from a little-endian buffer', () => {
    const buffer = new ByteBuffer(GUID.LENGTH, ByteBuffer.LITTLE_ENDIAN);
    buffer.writeUnsignedInt(0x12345678);
    buffer.writeUnsignedInt(0x9abcdef0);
    buffer.front();

    const guid = new GUID(buffer);

    expect(guid.low).toBe(0x12345678);
    expect(guid.high).toBe(0x9abcdef0);
  });

  it('preserves the current shortened debug string format', () => {
    const buffer = new ByteBuffer(GUID.LENGTH, ByteBuffer.LITTLE_ENDIAN);
    buffer.writeUnsignedInt(0x12345678);
    buffer.writeUnsignedInt(0x9abcdef0);
    buffer.front();

    expect(new GUID(buffer).toString()).toBe('[GUID; Hex: 0xdef05678]');
  });
});
```

The second test intentionally freezes the existing last-four-hex-digits-per-word behavior; do not “fix” it in Phase 1.

- [ ] **Step 6: Write ObjectUtil characterization tests**

Create `tests/characterization/object-util.test.js`:

```js
import { describe, expect, it } from 'vitest';
import ObjectUtil from '../../src/lib/utils/object-util';

describe('ObjectUtil.keyByValue legacy behavior', () => {
  it('builds and reuses a lookup table on the source object', () => {
    const values = { FIRST: 1, SECOND: 2 };

    expect(ObjectUtil.keyByValue(values, 2)).toBe('SECOND');
    expect(values.lookup).toEqual({ 1: 'FIRST', 2: 'SECOND' });
    expect(ObjectUtil.keyByValue(values, 1)).toBe('FIRST');
  });
});
```

- [ ] **Step 7: Write AuthPacket characterization tests**

Create `tests/characterization/auth-packet.test.js`:

```js
import { describe, expect, it } from 'vitest';
import AuthOpcode from '../../src/lib/auth/opcode';
import AuthPacket from '../../src/lib/auth/packet';

describe('AuthPacket legacy behavior', () => {
  it('reserves one header byte and writes the opcode on finalize', () => {
    const packet = new AuthPacket(AuthOpcode.LOGON_PROOF, 4);

    expect(packet.headerSize).toBe(1);
    expect(packet.index).toBe(1);
    expect(packet.opcodeName).toBe('LOGON_PROOF');

    packet.writeByte(0xaa);
    packet.finalize();

    expect(new Uint8Array(packet.buffer)[0]).toBe(AuthOpcode.LOGON_PROOF);
  });
});
```

- [ ] **Step 8: Add a Blizzardry API smoke test without loading MPQ/StormLib**

Create `tests/characterization/blizzardry-api.test.js`:

```js
import { describe, expect, it } from 'vitest';
import * as DBC from 'blizzardry/lib/dbc/entities';
import { DecodeStream } from 'blizzardry/lib/restructure';

describe('Blizzardry compatibility surface', () => {
  it('retains the pure module paths used by Wowser', () => {
    expect(DBC.Map).toBeDefined();
    expect(DecodeStream).toBeTypeOf('function');
  });
});
```

Do not import `blizzardry/lib/mpq` in CI tests because loading StormLib is an external integration concern.

- [ ] **Step 9: Regenerate the lockfile and verify a clean install**

Run:

```bash
rm -rf node_modules package-lock.json
npm install
rm -rf node_modules
npm ci
```

Expected: both install commands exit 0 on Node 24.

Then inspect the resolved dependency graph:

```bash
npm ls blizzardry @napi-ffi/ffi-napi @napi-ffi/ref-napi @napi-ffi/ref-array-di @napi-ffi/ref-struct-di --all
```

Expected: `blizzardry@0.5.1` is present and its FFI/ref dependency names resolve to the `@napi-ffi/*` aliases; legacy `ffi@2`/`ref@1` from Blizzardry 0.4 are absent.

- [ ] **Step 10: Run the characterization suite**

Run:

```bash
npm test
```

Expected: all four characterization files pass without WoW assets or a live server.

- [ ] **Step 11: Commit**

```bash
git add .nvmrc package.json package-lock.json tsconfig.json vitest.config.ts tests/characterization
git commit -m "test: establish node 24 characterization baseline"
```

---

### Task 2: Remove Babel-only function-bind syntax mechanically

**Files:**
- Create: `scripts/check-legacy-syntax.mjs`
- Modify exactly these baseline-matched files:
  - `src/lib/game/handler.js`
  - `src/lib/realms/handler.js`
  - `src/lib/game/chat/handler.js`
  - `src/lib/game/world/handler.js`
  - `src/components/game/index.jsx`
  - `src/components/auth/index.jsx`
  - `src/components/wowser/index.jsx`
  - `src/lib/pipeline/worker/pool.js`
  - `src/components/realms/index.jsx`
  - `src/lib/server/pipeline/index.js`
  - `src/components/game/controls.jsx`
  - `src/lib/pipeline/worker/thread.js`
  - `src/components/game/chat/index.jsx`
  - `src/lib/characters/handler.js`
  - `src/components/characters/index.jsx`
  - `src/lib/game/world/content-queue.js`
  - `src/lib/game/world/doodad-manager.js`
  - `src/lib/game/world/wmo-manager/index.js`
  - `src/lib/pipeline/wmo/group/index.js`
  - `src/lib/game/world/wmo-manager/wmo-handler.js`
- Modify: `tsconfig.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: the same method references currently created with Babel's function-bind proposal.
- Produces: standard JavaScript `Function.prototype.bind` expressions with equivalent receiver binding; a source tree TypeScript can parse.

- [ ] **Step 1: Add a failing source-syntax guard**

Create `scripts/check-legacy-syntax.mjs`:

```js
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const roots = ['src'];
const extensions = new Set(['.js', '.jsx']);
const violations = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!extensions.has(extname(path))) continue;

    const source = await readFile(path, 'utf8');
    source.split(/\r?\n/).forEach((line, index) => {
      if (line.includes('::')) {
        violations.push(`${path}:${index + 1}: Babel function-bind syntax`);
      }
    });
  }
}

for (const root of roots) await walk(root);

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
```

Add to `package.json`:

```json
"check:legacy": "node scripts/check-legacy-syntax.mjs"
```

- [ ] **Step 2: Run the guard to prove it fails on the legacy source**

Run:

```bash
npm run check:legacy
```

Expected: non-zero exit with violations in the 20 files listed above.

- [ ] **Step 3: Perform only the mechanical syntax conversion**

For every `::this.method` expression in the listed files, replace it with:

```js
this.method.bind(this)
```

Examples:

```js
this.animate = ::this.animate;
```

becomes:

```js
this.animate = this.animate.bind(this);
```

and:

```js
this.on('data:receive', ::this.dataReceived);
```

becomes:

```js
this.on('data:receive', this.dataReceived.bind(this));
```

Do not convert classes to arrows, do not rename methods, and do not alter event names or registration order.

- [ ] **Step 4: Expand TypeScript parsing to the source tree**

Change the `include` list in `tsconfig.json` to:

```json
"include": [
  "src/**/*.js",
  "src/**/*.jsx",
  "vite.config.ts",
  "vitest.config.ts",
  "tests/**/*.js"
]
```

Add to `package.json`:

```json
"typecheck": "tsc -p tsconfig.json"
```

- [ ] **Step 5: Verify standard syntax and existing tests**

Run:

```bash
npm run check:legacy
npm test
npm run typecheck
```

Expected: all three commands exit 0. With `checkJs: false`, TypeScript is being used here as a parser/configuration gate, not as a full legacy-JS semantic cleanup project.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json scripts/check-legacy-syntax.mjs src/components src/lib
git commit -m "refactor: normalize legacy babel function-bind syntax"
```

---

### Task 3: Replace Webpack with a Vite-compatible browser build

**Files:**
- Create: `vite.config.ts`
- Modify: `package.json`
- Modify: `src/index.html`
- Modify: `src/bootstrapper.jsx`
- Modify: `src/components/wowser/index.styl`
- Modify: `src/lib/pipeline/worker/thread.js`
- Modify: `src/lib/pipeline/adt/chunk/material.js`
- Modify: `src/lib/pipeline/m2/material/index.js`
- Modify: `src/lib/pipeline/wmo/material/index.js`
- Modify: `scripts/check-legacy-syntax.mjs`
- Delete after successful build: `webpack.config.js`

**Interfaces:**
- Consumes: existing browser entry `src/bootstrapper.jsx`, `/pipeline` HTTP contract, existing shader source files, and the existing Worker protocol `[loader, ...args]` -> `[success, ...result]`.
- Produces: `npm run dev`, `npm run build`, and `npm run preview`; `dist/` as the production browser output; no change to Worker message semantics or shader contents.

- [ ] **Step 1: Add the Vite configuration**

Create `vite.config.ts`:

```ts
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const srcRoot = fileURLToPath(new URL('./src/', import.meta.url));
const publicRoot = fileURLToPath(new URL('./public/', import.meta.url));
const distRoot = fileURLToPath(new URL('./dist/', import.meta.url));

export default defineConfig({
  root: srcRoot,
  publicDir: publicRoot,
  build: {
    outDir: distRoot,
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/pipeline': {
        target: 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
});
```

- [ ] **Step 2: Wire the existing HTML shell to the existing bootstrapper**

In `src/index.html`, add this immediately before `</body>`:

```html
<script type="module" src="/bootstrapper.jsx"></script>
```

Do not change the `<app></app>` mount element.

- [ ] **Step 3: Move normalize.css out of the Webpack-specific Stylus import path**

At the top of `src/bootstrapper.jsx`, add:

```js
import 'normalize.css';
```

Remove this line from `src/components/wowser/index.styl`:

```stylus
@import '~normalize.css'
```

Keep all project Stylus imports and rules unchanged.

- [ ] **Step 4: Convert the Worker loader import to Vite-native Worker construction**

In `src/lib/pipeline/worker/thread.js`, remove:

```js
import Worker from 'worker!./';
```

Keep the Task 2 method binding, and replace worker construction with the Vite-recognized static form:

```js
this.worker = new Worker(new URL('./index.js', import.meta.url), { type: 'module' });
```

Do not change `postMessage`, message event handling, task resolution, or task rejection behavior.

- [ ] **Step 5: Convert the three material modules to Vite raw shader imports**

In each of:

- `src/lib/pipeline/adt/chunk/material.js`
- `src/lib/pipeline/m2/material/index.js`
- `src/lib/pipeline/wmo/material/index.js`

change:

```js
import vertexShader from './shader.vert';
import fragmentShader from './shader.frag';
```

to:

```js
import vertexShader from './shader.vert?raw';
import fragmentShader from './shader.frag?raw';
```

Do not edit any `.vert` or `.frag` file in Phase 1.

- [ ] **Step 6: Extend the legacy-source guard for Webpack-only conventions**

Extend `scripts/check-legacy-syntax.mjs` so it scans `.js`, `.jsx`, and `.styl`, and reports all of these strings:

```js
const forbidden = [
  ['::', 'Babel function-bind syntax'],
  ['worker!', 'webpack worker-loader inline prefix'],
  ['~normalize.css', 'webpack tilde package import'],
];
```

Use the same line-by-line violation format already established in Task 2.

- [ ] **Step 7: Add Vite scripts**

Add to `package.json`:

```json
"dev": "vite --config vite.config.ts",
"build": "vite build --config vite.config.ts",
"preview": "vite preview --config vite.config.ts"
```

Remove the legacy `web-dev` and `web-release` scripts.

- [ ] **Step 8: Prove the browser build works before deleting Webpack config**

Run:

```bash
npm run check:legacy
npm test
npm run typecheck
npm run build
```

Expected:

- all commands exit 0;
- `dist/index.html` exists;
- `dist/favicon.png` exists;
- `dist/assets/` contains the browser bundle and Worker bundle/assets;
- build output has no unresolved `worker!` or shader loader errors.

- [ ] **Step 9: Verify the Vite development server startup**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Verify with a second shell:

```bash
curl --fail http://127.0.0.1:5173/
curl --head http://127.0.0.1:5173/favicon.png
```

Expected: HTML returns 200 and favicon is served. Stop the Vite process after verification.

The `/pipeline` proxy itself is integration-tested when the local pipeline service is available; its target/configuration is statically defined in `vite.config.ts` and does not require proprietary data for CI.

- [ ] **Step 10: Remove the obsolete Webpack config and commit**

```bash
rm webpack.config.js
git add package.json vite.config.ts src scripts/check-legacy-syntax.mjs webpack.config.js
git commit -m "build: migrate browser bundling to vite"
```

---

### Task 4: Run the legacy Node pipeline server directly from source

**Files:**
- Create: `src/lib/server/cli.js`
- Create: `src/lib/server/reset.js`
- Create: `src/lib/server/paths.js`
- Create: `tests/server-paths.test.js`
- Modify: `src/lib/server/index.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `ServerConfig.verify()`, `Cluster.start()`, existing Express `Pipeline`, and the Vite `dist/` output.
- Produces: source-mode `npm start`, `npm run serve-dev`, and `npm run reset` without requiring Gulp-generated `lib/server/*` files.

- [ ] **Step 1: Write a failing pure path test**

Create `tests/server-paths.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { staticRoot } from '../src/lib/server/paths';

describe('server paths', () => {
  it('serves the Vite production build from <root>/dist', () => {
    expect(staticRoot('/tmp/wowser')).toBe(join('/tmp/wowser', 'dist'));
  });

  it('defaults to process.cwd()', () => {
    expect(staticRoot()).toBe(join(process.cwd(), 'dist'));
  });
});
```

Run:

```bash
npm test -- tests/server-paths.test.js
```

Expected: FAIL because `src/lib/server/paths.js` does not exist yet.

- [ ] **Step 2: Implement the minimal path helper**

Create `src/lib/server/paths.js`:

```js
import { join } from 'node:path';

export function staticRoot(root = process.cwd()) {
  return join(root, 'dist');
}
```

Run the focused test again; expected PASS.

- [ ] **Step 3: Fix the server root default and serve Vite output**

In `src/lib/server/index.js`:

```js
import { staticRoot } from './paths';
```

Change the constructor signature from:

```js
constructor(port, root = process.pwd) {
```

to:

```js
constructor(port, root = process.cwd()) {
```

Change:

```js
this.app.use(express.static('./public'));
```

to:

```js
this.app.use(express.static(staticRoot(this.root)));
```

Do not alter `/pipeline` routing.

- [ ] **Step 4: Add the source-mode server entrypoint**

Create `src/lib/server/cli.js`:

```js
import Cluster from './cluster';
import ServerConfig from './config';

ServerConfig.verify().then(() => {
  const cluster = new Cluster();
  cluster.start();
});
```

- [ ] **Step 5: Replace the Gulp reset task**

Create `src/lib/server/reset.js`:

```js
import ServerConfig from './config';

ServerConfig.db.clear();
process.stdout.write(`\n> Settings deleted from ${ServerConfig.db.path}\n\n`);
```

- [ ] **Step 6: Replace server/reset scripts**

Set these scripts in `package.json`:

```json
"start": "tsx src/lib/server/cli.js",
"serve": "npm run start",
"serve-dev": "tsx watch src/lib/server/cli.js",
"reset": "tsx src/lib/server/reset.js"
```

Keep the existing `proxy` script for websockify.

- [ ] **Step 7: Verify asset-free server support pieces**

Run:

```bash
npm test -- tests/server-paths.test.js
```

Then test reset with an isolated configuration directory so no real developer settings are destroyed:

```bash
TMP_CONFIG="$(mktemp -d)"
XDG_CONFIG_HOME="$TMP_CONFIG" npm run reset
rm -rf "$TMP_CONFIG"
```

Expected: command exits 0 and prints a settings path under the temporary config directory.

Do **not** require `npm start` in CI because importing/using the MPQ pipeline requires external StormLib and real WoW client data. With that integration environment available, run `npm start` manually and verify `/pipeline/...` separately.

- [ ] **Step 8: Run the browser/test gates and commit**

```bash
npm test
npm run typecheck
npm run build
git add package.json src/lib/server tests/server-paths.test.js
git commit -m "build: run pipeline server directly from source"
```

---

### Task 5: Remove obsolete Babel/Gulp/test infrastructure and enforce the Phase 1 source boundary

**Files:**
- Modify: `scripts/check-legacy-syntax.mjs`
- Modify: `package.json`
- Delete: `.babelrc`
- Delete: `src/lib/server/.babelrc`
- Delete: `gulpfile.babel.js`
- Delete: `.istanbul.yml`
- Delete: `.travis.yml`
- Delete: `.eslintrc`
- Delete: `src/spec/.eslintrc`
- Delete: `src/spec/sample-spec.js`
- Delete: `src/spec/spec-helper.js`

**Interfaces:**
- Consumes: Tasks 1-4 replacements for testing, browser building, syntax transforms, server startup, and reset.
- Produces: no active build/test/runtime command depends on Babel 6, Gulp, Webpack, Mocha, Istanbul, Travis CI, or webpack loader prefixes.

- [ ] **Step 1: Extend the static guard to fail on references to removed build conventions**

Keep the Task 3 forbidden strings, and also reject source/build configuration references to these exact obsolete inline conventions:

```js
const forbidden = [
  ['::', 'Babel function-bind syntax'],
  ['worker!', 'webpack worker-loader inline prefix'],
  ['~normalize.css', 'webpack tilde package import'],
];
```

The checker should continue scanning `src` only; deleted root config files are verified by file absence in the next step.

- [ ] **Step 2: Delete replaced legacy files**

Run:

```bash
rm .babelrc
rm src/lib/server/.babelrc
rm gulpfile.babel.js
rm .istanbul.yml
rm .travis.yml
rm .eslintrc
rm -rf src/spec
```

`webpack.config.js` was already removed after the successful Vite build in Task 3.

- [ ] **Step 3: Confirm package scripts no longer name obsolete tools**

Run:

```bash
node -e "const p=require('./package.json'); console.log(p.scripts)"
```

Expected active scripts are based on Vitest, TypeScript, Vite, `tsx`, websockify, and the legacy application runtime only. There must be no `gulp`, `webpack`, `mocha`, or `istanbul` command.

- [ ] **Step 4: Run all local Phase 1 gates**

```bash
npm ci
npm run check:legacy
npm test
npm run typecheck
npm run build
```

Expected: all exit 0 from a clean dependency install.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "build: remove obsolete babel gulp and webpack infrastructure"
```

---

### Task 6: Add asset-free GitHub Actions verification

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: final Phase 1 commands `npm ci`, `npm run check:legacy`, `npm test`, `npm run typecheck`, and `npm run build`.
- Produces: reproducible Linux CI that does not import MPQ/StormLib or require WoW data.

- [ ] **Step 1: Add the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches:
      - master
      - modernize/**
  pull_request:

jobs:
  phase-1:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Use Node 24
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm

      - name: Install
        run: npm ci

      - name: Reject legacy build syntax
        run: npm run check:legacy

      - name: Test
        run: npm test

      - name: TypeScript parse/typecheck gate
        run: npm run typecheck

      - name: Build browser client
        run: npm run build
```

- [ ] **Step 2: Run the same workflow commands locally before pushing**

```bash
rm -rf node_modules dist
npm ci
npm run check:legacy
npm test
npm run typecheck
npm run build
```

Expected: all exit 0.

- [ ] **Step 3: Commit and inspect CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: verify phase 1 on node 24"
```

Push the branch and inspect the GitHub Actions job. If the install job fails, diagnose the exact package before changing dependency policy; do not downgrade Node or silently skip native build scripts just to make CI green.

---

### Task 7: Document the workflow, perform final verification, clean `master`, and open the Phase 1 PR

**Files:**
- Modify: `README.md`
- Verify: `docs/superpowers/specs/2026-08-26-wowser-phase-1-foundation-design.md`
- Verify: `docs/superpowers/plans/2026-08-26-wowser-phase-1-foundation.md`
- `master` cleanup operation: remove the accidental top-level `MODERNIZATION_PLAN.md` with a normal commit, not a force reset.

**Interfaces:**
- Consumes: every Phase 1 command and constraint.
- Produces: user-facing setup instructions and a reviewable PR from `modernize/phase-1-foundation` to a clean `master`.

- [ ] **Step 1: Update README development prerequisites and commands**

Document these facts without rewriting the project history/status sections:

```text
Required for the modernized development workflow:
- Node.js 24 LTS
- npm 11+

Install:
  npm ci

Browser development:
  npm run dev

Tests:
  npm test

TypeScript/source parse gate:
  npm run typecheck

Production browser build:
  npm run build

Pipeline server:
  npm start

The pipeline server still requires the external StormLib runtime and a legally obtained WoW 3.3.5a client data directory. CI and browser-build verification do not require those proprietary assets.
```

Also state that Phase 1 intentionally retains React 0.14 and Three.js 0.77; those are later-phase migrations.

- [ ] **Step 2: Run final clean-checkout-equivalent verification**

```bash
rm -rf node_modules dist
npm ci
npm run check:legacy
npm test
npm run typecheck
npm run build
```

Expected: all commands exit 0.

Start the Vite server and verify the application shell:

```bash
npm run dev -- --host 127.0.0.1
```

From another shell:

```bash
curl --fail http://127.0.0.1:5173/
curl --head http://127.0.0.1:5173/favicon.png
```

Stop the server after verification.

- [ ] **Step 3: Verify Phase 1 scope did not drift**

Run:

```bash
git diff 5fcd3e607db7551a74caf6d7ffa4dd785a264dc8...HEAD -- package.json src/lib/pipeline src/lib/game src/lib/auth src/lib/net
```

Confirm:

- React remains `0.14.3`.
- React DOM remains `0.14.3`.
- Three.js remains `0.77.0`.
- `.vert` and `.frag` shader contents are unchanged.
- ADT/M2/WMO algorithms are unchanged except import syntax needed by Vite.
- Protocol/crypto changes are limited to `::this.method` -> `this.method.bind(this)` syntax normalization.
- No WebGPU/WASM/SAB/IndexedDB/KTX2 work is present.

- [ ] **Step 4: Commit README changes**

```bash
git add README.md
git commit -m "docs: document modern development workflow"
```

- [ ] **Step 5: Restore `master` content without rewriting history**

On `master`, verify that the only fork-local accidental file is `MODERNIZATION_PLAN.md`, then remove it with a normal commit:

```bash
git checkout master
git pull --ff-only
git diff 5fcd3e607db7551a74caf6d7ffa4dd785a264dc8..master --stat
rm MODERNIZATION_PLAN.md
git add MODERNIZATION_PLAN.md
git commit -m "revert: remove accidental modernization plan"
git push
```

Expected: `master` content again matches the original fork baseline before the Phase 1 PR, while the public commit history remains intact.

Return to `modernize/phase-1-foundation` afterward.

- [ ] **Step 6: Open a pull request, do not merge automatically**

Open a PR:

```text
base: master
head: modernize/phase-1-foundation
title: build: modernize phase 1 development foundation
```

PR body must summarize:

- Node 24 / npm 11 baseline.
- Blizzardry 0.5.1 plus maintained Node-24-compatible FFI dependency aliases.
- Vitest characterization baseline.
- mechanical removal of Babel function-bind syntax.
- Vite migration including Stylus, shaders, assets, Worker, and `/pipeline` proxy.
- source-mode server runner with `tsx`.
- GitHub Actions verification.
- explicit non-goals: React/Three/WebGL2/WebGPU/gameplay/protocol feature upgrades.

Wait for CI and review before merge.

---

## Final Acceptance Checklist

- [ ] `master` accidental `MODERNIZATION_PLAN.md` content has been removed by a normal commit, not force history rewriting.
- [ ] `modernize/phase-1-foundation` retains React `0.14.3` and Three.js `0.77.0`.
- [ ] Node 24 and npm 11 requirements are documented/enforced.
- [ ] `npm ci` succeeds from a clean checkout.
- [ ] `npm run check:legacy` succeeds.
- [ ] `npm test` succeeds without proprietary assets.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run build` succeeds with Vite 8 and outputs `dist/`.
- [ ] `npm run dev` serves the Wowser application shell.
- [ ] `/pipeline` development proxy remains configured for `http://localhost:3000`.
- [ ] Stylus and static image assets resolve through Vite.
- [ ] ADT, M2, and WMO shaders are imported as raw strings without editing shader source.
- [ ] Worker creation uses Vite's `new Worker(new URL(..., import.meta.url), { type: 'module' })` pattern.
- [ ] no `::` function-bind syntax remains in `src`.
- [ ] no `worker!` loader prefix remains in `src`.
- [ ] no `~normalize.css` Webpack import remains.
- [ ] old Babel/Gulp/Webpack/Mocha/Istanbul/Travis build/test infrastructure is removed after replacements pass.
- [ ] CI runs install, static legacy check, tests, TypeScript gate, and Vite build on Node 24 without WoW data.
- [ ] production pipeline/server behavior requiring StormLib and real WoW data is documented as an external integration acceptance step.
- [ ] PR is opened for review and is not auto-merged.
