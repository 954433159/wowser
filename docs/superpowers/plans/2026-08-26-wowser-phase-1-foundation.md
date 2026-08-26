# Wowser Phase 1 Foundation Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Wowser client installable, testable, buildable, and developable on Node.js 24 with Vite 8 and incremental TypeScript, without intentionally changing React 0.14, Three.js 0.77, WoW resource semantics, renderer semantics, or network protocol behavior.

**Architecture:** Keep `src/components` and `src/lib` structurally intact. Replace the obsolete Gulp/Babel/Webpack toolchain around the legacy runtime, freeze key current behaviors with characterization tests, mechanically normalize only syntax that modern parsers cannot read, use Vite-native Worker/raw-shader/static-asset handling, and run the Node pipeline server from source with `tsx`. Proprietary WoW assets and a live WoW server remain external integration requirements rather than CI requirements.

**Tech Stack:** Node.js 24 LTS, npm 11, Vite 8, TypeScript 6, Vitest 4.1, `tsx`, Stylus, React 0.14.3, Three.js 0.77.0, Blizzardry 0.5.1, maintained `@napi-ffi/*` FFI packages.

**Spec:** `docs/superpowers/specs/2026-08-26-wowser-phase-1-foundation-design.md`

## Global Constraints

- Work only on `modernize/phase-1-foundation`, which starts from baseline `5fcd3e607db7551a74caf6d7ffa4dd785a264dc8`.
- Node.js baseline: major 24. npm baseline: major 11 or newer.
- Vite major: 8.
- TypeScript migration mode: `allowJs: true`, `checkJs: false`, `noEmit: true`.
- Keep `react` and `react-dom` at `0.14.3` in Phase 1.
- Keep `three` at `0.77.0` in Phase 1.
- No WebGPU, WebGL2 renderer rewrite, SharedArrayBuffer, WASM parser migration, IndexedDB cache, or KTX2/Basis work in Phase 1.
- No intentional ADT/WMO/M2 algorithm changes, shader-content changes, packet/crypto/protocol behavior changes, or gameplay feature work.
- CI must run without proprietary WoW data, StormLib availability, or a live WoW server.
- Clean-checkout dependency acceptance uses `npm ci`.
- Do not force-push or rewrite `master` history.

---

## Planned file responsibilities

### New files

- `.nvmrc` — local Node-major selector.
- `tsconfig.json` — incremental JS/TS parse gate.
- `vitest.config.ts` — asset-free characterization-test configuration.
- `vite.config.ts` — browser build, public assets, output directory, and `/pipeline` dev proxy.
- `scripts/check-legacy-syntax.mjs` — static guard against removed Babel/Webpack-only syntax.
- `tests/characterization/guid.test.js` — current GUID behavior.
- `tests/characterization/object-util.test.js` — current reverse lookup behavior.
- `tests/characterization/auth-packet.test.js` — current auth-packet framing behavior.
- `tests/characterization/blizzardry-api.test.js` — pure Blizzardry module compatibility surface.
- `src/lib/server/paths.js` — pure production-static-root helper.
- `src/lib/server/cli.js` — source-mode server entrypoint.
- `src/lib/server/reset.js` — source-mode configuration reset command.
- `tests/server-paths.test.js` — asset-free server path tests.
- `.github/workflows/ci.yml` — Node 24 CI.

### Existing files with intentional Phase 1 edits

- `package.json`, `package-lock.json`
- `src/index.html`
- `src/bootstrapper.jsx`
- `src/components/wowser/index.styl`
- `src/lib/pipeline/worker/thread.js`
- `src/lib/pipeline/adt/chunk/material.js`
- `src/lib/pipeline/m2/material/index.js`
- `src/lib/pipeline/wmo/material/index.js`
- `src/lib/server/index.js`
- files containing Babel function-bind syntax listed in Task 2
- `README.md`

### Legacy files removed only after replacements pass

- `.babelrc`
- `src/lib/server/.babelrc`
- `gulpfile.babel.js`
- `webpack.config.js`
- `.istanbul.yml`
- `.travis.yml`
- `.eslintrc`
- `src/spec/.eslintrc`
- `src/spec/sample-spec.js`
- `src/spec/spec-helper.js`

---

### Task 1: Establish a Node 24 install and characterization-test baseline

**Files:**
- Create: `.nvmrc`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `tests/characterization/guid.test.js`
- Create: `tests/characterization/object-util.test.js`
- Create: `tests/characterization/auth-packet.test.js`
- Create: `tests/characterization/blizzardry-api.test.js`
- Modify: `package.json`
- Regenerate: `package-lock.json`

**Interfaces:**
- Consumes: existing `GUID`, `ObjectUtil`, `AuthPacket`, `AuthOpcode`, plus pure Blizzardry DBC/restructure module paths.
- Produces: a Node-24-installable package graph, `npm test`, and a first regression baseline that does not need WoW assets.

- [ ] **Step 1: Write the Node marker**

Create `.nvmrc`:

```text
24
```

- [ ] **Step 2: Replace the dependency/tooling floor without leaving a broken `pretest` hook**

In `package.json`:

1. Change:

```json
"blizzardry": "^0.4.0"
```

to:

```json
"blizzardry": "^0.5.1"
```

2. Preserve legacy runtime dependencies unless installation proves one is an actual blocker. In particular, do not upgrade React or Three.js.

3. Replace the old build/test `devDependencies` with:

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

4. Add:

```json
"engines": {
  "node": ">=24 <25",
  "npm": ">=11"
}
```

5. Add npm overrides so Blizzardry 0.5.1 retains its existing import names while resolving maintained Node-24-capable FFI implementations:

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

6. Replace the entire legacy `scripts` object for this intermediate task with only commands that already have valid implementations:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "proxy": "websockify"
}
```

This intentionally removes the old `pretest: gulp rebuild` hook immediately. `dev`, `build`, `typecheck`, `start`, `serve`, `serve-dev`, and `reset` are added only in later tasks when their replacements exist.

- [ ] **Step 3: Create the initial TypeScript coexistence configuration**

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

Do not include `src` yet; its Babel-only syntax is removed in Task 2.

- [ ] **Step 4: Create Vitest configuration**

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

- [ ] **Step 5: Add the GUID characterization tests**

Create `tests/characterization/guid.test.js`:

```js
import { describe, expect, it } from 'vitest';
import ByteBuffer from 'byte-buffer';
import GUID from '../../src/lib/game/guid';

describe('GUID legacy behavior', () => {
  it('reads low then high 32-bit words', () => {
    const buffer = new ByteBuffer(GUID.LENGTH, ByteBuffer.LITTLE_ENDIAN);
    buffer.writeUnsignedInt(0x12345678);
    buffer.writeUnsignedInt(0x9abcdef0);
    buffer.front();

    const guid = new GUID(buffer);
    expect(guid.low).toBe(0x12345678);
    expect(guid.high).toBe(0x9abcdef0);
  });

  it('preserves the current shortened debug string', () => {
    const buffer = new ByteBuffer(GUID.LENGTH, ByteBuffer.LITTLE_ENDIAN);
    buffer.writeUnsignedInt(0x12345678);
    buffer.writeUnsignedInt(0x9abcdef0);
    buffer.front();

    expect(new GUID(buffer).toString()).toBe('[GUID; Hex: 0xdef05678]');
  });
});
```

The shortened string is intentionally frozen as current behavior; Phase 1 must not “correct” it.

- [ ] **Step 6: Add the ObjectUtil characterization test**

Create `tests/characterization/object-util.test.js`:

```js
import { describe, expect, it } from 'vitest';
import ObjectUtil from '../../src/lib/utils/object-util';

describe('ObjectUtil.keyByValue legacy behavior', () => {
  it('caches the reverse lookup on the source object', () => {
    const values = { FIRST: 1, SECOND: 2 };

    expect(ObjectUtil.keyByValue(values, 2)).toBe('SECOND');
    expect(values.lookup).toEqual({ 1: 'FIRST', 2: 'SECOND' });
    expect(ObjectUtil.keyByValue(values, 1)).toBe('FIRST');
  });
});
```

- [ ] **Step 7: Add the AuthPacket characterization test**

Create `tests/characterization/auth-packet.test.js`:

```js
import { describe, expect, it } from 'vitest';
import AuthOpcode from '../../src/lib/auth/opcode';
import AuthPacket from '../../src/lib/auth/packet';

describe('AuthPacket legacy behavior', () => {
  it('reserves one header byte and writes the opcode during finalize', () => {
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

- [ ] **Step 8: Add a pure Blizzardry API compatibility test**

Create `tests/characterization/blizzardry-api.test.js`:

```js
import { describe, expect, it } from 'vitest';
import * as DBC from 'blizzardry/lib/dbc/entities';
import { DecodeStream } from 'blizzardry/lib/restructure';

describe('Blizzardry compatibility surface', () => {
  it('keeps the pure module paths used by Wowser', () => {
    expect(DBC.Map).toBeDefined();
    expect(DecodeStream).toBeTypeOf('function');
  });
});
```

Do not import `blizzardry/lib/mpq` in asset-free tests; that path loads native StormLib integration.

- [ ] **Step 9: Regenerate and validate the lockfile**

Run on Node 24:

```bash
rm -rf node_modules package-lock.json
npm install
rm -rf node_modules
npm ci
npm ls blizzardry @napi-ffi/ffi-napi @napi-ffi/ref-napi @napi-ffi/ref-array-di @napi-ffi/ref-struct-di --all
```

Expected: install commands exit 0, Blizzardry resolves to 0.5.1, scoped FFI aliases are present, and the old Blizzardry 0.4 `ffi@2/ref@1` stack is absent.

If this exact alias mechanism is rejected by npm, stop Task 1 and report the exact `npm` error; do not downgrade Node, disable lifecycle scripts, or silently remove the pipeline dependency.

- [ ] **Step 10: Run the new baseline tests**

```bash
npm test
```

Expected: all four characterization test files pass without WoW data.

- [ ] **Step 11: Commit Task 1**

```bash
git add .nvmrc package.json package-lock.json tsconfig.json vitest.config.ts tests/characterization
git commit -m "test: establish node 24 characterization baseline"
```

---

### Task 2: Normalize Babel-only source syntax, mechanically and test-first

**Files:**
- Create: `scripts/check-legacy-syntax.mjs`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify only files reported by the guard for Babel function-bind/export-extension syntax.

**Known function-bind files at baseline:**

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

**Interfaces:**
- Produces standard JavaScript source Vite/TypeScript can parse, while preserving receiver binding and exports.

- [ ] **Step 1: Write a static guard that initially fails**

Create `scripts/check-legacy-syntax.mjs`:

```js
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const extensions = new Set(['.js', '.jsx', '.styl']);
const violations = [];
const literalRules = [
  ['::', 'Babel function-bind syntax'],
  ['worker!', 'webpack worker-loader inline prefix'],
  ['~normalize.css', 'webpack tilde package import'],
];
const exportExtension = /^\s*export\s+(?:default\s+)?[A-Za-z_$][\w$]*\s+from\s+['"]/;

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
      for (const [needle, label] of literalRules) {
        if (line.includes(needle)) violations.push(`${path}:${index + 1}: ${label}`);
      }
      if (exportExtension.test(line)) {
        violations.push(`${path}:${index + 1}: Babel export-extension syntax`);
      }
    });
  }
}

await walk('src');

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
```

Add:

```json
"check:legacy": "node scripts/check-legacy-syntax.mjs"
```

to `package.json`.

- [ ] **Step 2: Prove the guard sees the old syntax**

```bash
npm run check:legacy
```

Expected: non-zero exit; at minimum the known `::` files are reported.

- [ ] **Step 3: Replace only function-bind expressions**

Mechanical rule:

```js
this.method = ::this.method;
```

becomes:

```js
this.method = this.method.bind(this);
```

and:

```js
emitter.on('event', ::this.handler);
```

becomes:

```js
emitter.on('event', this.handler.bind(this));
```

Do not convert classes to arrow-property methods, do not rename handlers, and do not alter event registration order.

- [ ] **Step 4: Normalize any export-extension syntax reported by the guard**

For a line shaped like:

```js
export Foo from './foo';
```

replace with standard JavaScript:

```js
export { default as Foo } from './foo';
```

For a line shaped like:

```js
export default Foo from './foo';
```

replace it with an explicit import plus export that preserves the original module interface:

```js
import Foo from './foo';
export default Foo;
```

Only touch files actually reported by the guard.

- [ ] **Step 5: Expand the TypeScript parse gate to the source tree**

Change `tsconfig.json` `include` to:

```json
[
  "src/**/*.js",
  "src/**/*.jsx",
  "vite.config.ts",
  "vitest.config.ts",
  "tests/**/*.js"
]
```

Add:

```json
"typecheck": "tsc -p tsconfig.json"
```

to `package.json`.

- [ ] **Step 6: Verify Task 2**

```bash
npm run check:legacy
npm test
npm run typecheck
```

Expected: all exit 0. `checkJs: false` means this is deliberately a parse/configuration gate, not a full semantic typing campaign.

- [ ] **Step 7: Commit Task 2**

```bash
git add package.json tsconfig.json scripts/check-legacy-syntax.mjs src
git commit -m "refactor: normalize legacy babel-only syntax"
```

---

### Task 3: Replace Webpack 1 with Vite 8 while preserving the browser entry contract

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
- Delete after passing build: `webpack.config.js`

**Interfaces:**
- Existing mount element remains `<app></app>`.
- Existing `/pipeline/...` browser contract remains unchanged.
- Existing Worker message contract remains unchanged.
- Existing shader text remains byte-for-byte unchanged.

- [ ] **Step 1: Create Vite configuration**

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

- [ ] **Step 2: Make `src/index.html` explicitly load the existing bootstrapper**

Add before `</body>`:

```html
<script type="module" src="/bootstrapper.jsx"></script>
```

Keep `<app></app>` and all existing page metadata.

- [ ] **Step 3: Remove the Webpack-only Stylus package-import convention**

At the top of `src/bootstrapper.jsx` add:

```js
import 'normalize.css';
```

Remove only this line from `src/components/wowser/index.styl`:

```stylus
@import '~normalize.css'
```

- [ ] **Step 4: Convert the single worker-loader entry**

In `src/lib/pipeline/worker/thread.js`, delete:

```js
import Worker from 'worker!./';
```

and instantiate the Worker as:

```js
this.worker = new Worker(new URL('./index.js', import.meta.url), { type: 'module' });
```

Do not change `postMessage`, resolution/rejection, task ownership, or message payload shapes.

- [ ] **Step 5: Convert the three shader import sites to Vite raw imports**

In:

- `src/lib/pipeline/adt/chunk/material.js`
- `src/lib/pipeline/m2/material/index.js`
- `src/lib/pipeline/wmo/material/index.js`

use:

```js
import vertexShader from './shader.vert?raw';
import fragmentShader from './shader.frag?raw';
```

instead of bare `.vert/.frag` imports. Do not edit shader files.

- [ ] **Step 6: Add Vite scripts**

Add to `package.json`:

```json
"dev": "vite --config vite.config.ts",
"build": "vite build --config vite.config.ts",
"preview": "vite preview --config vite.config.ts"
```

- [ ] **Step 7: Run static/test/typecheck/build gates**

```bash
npm run check:legacy
npm test
npm run typecheck
npm run build
```

Expected: all commands exit 0; `dist/index.html`, `dist/favicon.png`, the main browser bundle, and a Worker bundle/assets are emitted with no unresolved loader prefixes or shader imports.

- [ ] **Step 8: Verify the development shell**

Shell A:

```bash
npm run dev -- --host 127.0.0.1
```

Shell B:

```bash
curl --fail http://127.0.0.1:5173/
curl --head --fail http://127.0.0.1:5173/favicon.png
```

Expected: both HTTP checks succeed. Stop the Vite process afterward.

- [ ] **Step 9: Remove Webpack config only after Vite passes, then commit**

```bash
rm webpack.config.js
git add package.json vite.config.ts src webpack.config.js
git commit -m "build: migrate browser bundling to vite"
```

---

### Task 4: Replace the Gulp-generated Node server path with source-mode `tsx`

**Files:**
- Create: `src/lib/server/paths.js`
- Create: `tests/server-paths.test.js`
- Create: `src/lib/server/cli.js`
- Create: `src/lib/server/reset.js`
- Modify: `src/lib/server/index.js`
- Modify: `package.json`

**Interfaces:**
- Existing Express `/pipeline` router remains unchanged.
- Production static browser files come from `<project-root>/dist`.
- MPQ/StormLib loading remains an external integration path.

- [ ] **Step 1: Write a failing pure server-path test**

Create `tests/server-paths.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { staticRoot } from '../src/lib/server/paths';

describe('server paths', () => {
  it('maps an explicit project root to its dist directory', () => {
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

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the minimal helper**

Create `src/lib/server/paths.js`:

```js
import { join } from 'node:path';

export function staticRoot(root = process.cwd()) {
  return join(root, 'dist');
}
```

Run the focused test again. Expected: PASS.

- [ ] **Step 3: Correct the legacy `process.pwd` default and serve Vite output**

In `src/lib/server/index.js`, import:

```js
import { staticRoot } from './paths';
```

Change:

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

Do not change the `/pipeline` middleware line.

- [ ] **Step 4: Add a source-mode CLI entry**

Create `src/lib/server/cli.js`:

```js
import Cluster from './cluster';
import ServerConfig from './config';

ServerConfig.verify().then(() => {
  const cluster = new Cluster();
  cluster.start();
});
```

- [ ] **Step 5: Replace the old Gulp reset task**

Create `src/lib/server/reset.js`:

```js
import ServerConfig from './config';

ServerConfig.db.clear();
process.stdout.write(`\n> Settings deleted from ${ServerConfig.db.path}\n\n`);
```

- [ ] **Step 6: Add server scripts only now that implementations exist**

Add to `package.json`:

```json
"start": "tsx src/lib/server/cli.js",
"serve": "npm run start",
"serve-dev": "tsx watch src/lib/server/cli.js",
"reset": "tsx src/lib/server/reset.js"
```

Keep `proxy` unchanged.

- [ ] **Step 7: Verify asset-free pieces**

```bash
npm test -- tests/server-paths.test.js
npm test
npm run typecheck
npm run build
```

Expected: all pass.

Test reset without touching the developer's real configuration:

```bash
TMP_CONFIG="$(mktemp -d)"
XDG_CONFIG_HOME="$TMP_CONFIG" npm run reset
rm -rf "$TMP_CONFIG"
```

Expected: exit 0 and a config path under the temporary directory.

Do not make `npm start` a CI gate: importing/using the MPQ path requires native StormLib plus a configured WoW client data directory. That integration is verified manually when such an environment is available.

- [ ] **Step 8: Commit Task 4**

```bash
git add package.json src/lib/server tests/server-paths.test.js
git commit -m "build: run pipeline server directly from source"
```

---

### Task 5: Remove replaced Babel/Gulp/Mocha/Istanbul/Travis infrastructure

**Files:**
- Delete: `.babelrc`
- Delete: `src/lib/server/.babelrc`
- Delete: `gulpfile.babel.js`
- Delete: `.istanbul.yml`
- Delete: `.travis.yml`
- Delete: `.eslintrc`
- Delete: `src/spec/`

**Interfaces:**
- Consumes: Tasks 1-4 replacements.
- Produces: no active install/test/build/start command that depends on Babel 6, Gulp, Webpack, Mocha, Istanbul, or legacy Travis configuration.

- [ ] **Step 1: Delete only infrastructure whose replacement has already passed**

```bash
rm .babelrc
rm src/lib/server/.babelrc
rm gulpfile.babel.js
rm .istanbul.yml
rm .travis.yml
rm .eslintrc
rm -rf src/spec
```

`webpack.config.js` was already removed in Task 3 after a successful Vite build.

- [ ] **Step 2: Assert package scripts do not reference removed tools**

```bash
node -e "const s=require('./package.json').scripts; const bad=Object.entries(s).filter(([,v])=>/gulp|webpack|mocha|istanbul/.test(v)); if(bad.length){console.error(bad);process.exit(1)}"
```

Expected: exit 0.

- [ ] **Step 3: Run a clean dependency and full local gate**

```bash
rm -rf node_modules dist
npm ci
npm run check:legacy
npm test
npm run typecheck
npm run build
```

Expected: all exit 0.

- [ ] **Step 4: Commit Task 5**

```bash
git add -A
git commit -m "build: remove obsolete legacy build infrastructure"
```

---

### Task 6: Add asset-free GitHub Actions verification

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces CI for install, static syntax gate, tests, TypeScript parse gate, and browser production build.

- [ ] **Step 1: Add the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches:
      - master
      - 'modernize/**'
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

      - name: Reject legacy syntax
        run: npm run check:legacy

      - name: Test
        run: npm test

      - name: TypeScript parse gate
        run: npm run typecheck

      - name: Build browser client
        run: npm run build
```

- [ ] **Step 2: Mirror CI locally**

```bash
rm -rf node_modules dist
npm ci
npm run check:legacy
npm test
npm run typecheck
npm run build
```

Expected: all exit 0.

- [ ] **Step 3: Commit and push for CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: verify phase 1 on node 24"
git push -u origin modernize/phase-1-foundation
```

Inspect the resulting workflow. If install fails, capture the exact package/build error before altering dependency policy. Do not solve CI by downgrading Node or adding `--ignore-scripts`.

---

### Task 7: Document, perform final scope verification, clean the accidental master file, and open a PR

**Files:**
- Modify: `README.md`
- Verify: design and plan documents.
- Master-only cleanup: remove accidental `MODERNIZATION_PLAN.md` with a normal commit.

**Interfaces:**
- Produces the user-facing Phase 1 workflow and a reviewable PR; does not merge the PR.

- [ ] **Step 1: Document the modern workflow**

Add a development section to `README.md` that states:

```text
Node.js 24 LTS and npm 11+ are required for the Phase 1 modernized workflow.

Install: npm ci
Browser dev: npm run dev
Tests: npm test
TypeScript/source parse gate: npm run typecheck
Production browser build: npm run build
Pipeline server: npm start

The pipeline server still requires native StormLib and a legally obtained WoW 3.3.5a client data directory. CI and browser-build verification do not require proprietary WoW assets.

Phase 1 intentionally retains React 0.14.3 and Three.js 0.77.0; renderer/runtime upgrades are later phases.
```

Do not rewrite unrelated project-status/history sections.

- [ ] **Step 2: Run final clean verification**

```bash
rm -rf node_modules dist
npm ci
npm run check:legacy
npm test
npm run typecheck
npm run build
```

Expected: all exit 0.

Then:

```bash
npm run dev -- --host 127.0.0.1
```

from another shell:

```bash
curl --fail http://127.0.0.1:5173/
curl --head --fail http://127.0.0.1:5173/favicon.png
```

Expected: both requests succeed; stop Vite after verification.

- [ ] **Step 3: Verify the Phase 1 diff has not drifted into later phases**

Run:

```bash
git diff 5fcd3e607db7551a74caf6d7ffa4dd785a264dc8...HEAD -- package.json src/lib/pipeline src/lib/game src/lib/auth src/lib/net
```

Confirm all of the following:

- `react` and `react-dom` are still `0.14.3`.
- `three` is still `0.77.0`.
- `.vert` and `.frag` contents are unchanged.
- ADT/M2/WMO runtime edits are limited to Vite import/Worker compatibility and mechanical syntax normalization.
- protocol/crypto edits are limited to equivalent syntax normalization.
- no WebGPU, WebGL2 renderer rewrite, WASM, SAB, IndexedDB, or KTX2 code is present.

- [ ] **Step 4: Commit README**

```bash
git add README.md
git commit -m "docs: document modern development workflow"
```

- [ ] **Step 5: Restore `master` content without rewriting history**

Switch to `master`, verify the only fork-local accidental content difference from baseline is `MODERNIZATION_PLAN.md`, then remove it in a normal commit:

```bash
git checkout master
git pull --ff-only
git diff 5fcd3e607db7551a74caf6d7ffa4dd785a264dc8..master --stat
rm MODERNIZATION_PLAN.md
git add MODERNIZATION_PLAN.md
git commit -m "revert: remove accidental modernization plan"
git push
```

Expected: `master` file content returns to the original fork baseline while public commit history remains intact. Return to `modernize/phase-1-foundation` afterward.

- [ ] **Step 6: Open the Phase 1 PR and do not auto-merge**

Use:

```text
base: master
head: modernize/phase-1-foundation
title: build: modernize phase 1 development foundation
```

PR summary must include:

- Node 24/npm 11 baseline.
- Blizzardry 0.5.1 and maintained Node-24 FFI dependency aliases.
- Vitest characterization tests.
- mechanical removal of obsolete Babel-only syntax.
- Vite browser migration: Stylus, image assets, raw shaders, Worker, `/pipeline` proxy.
- `tsx` source-mode server commands.
- GitHub Actions checks.
- explicit non-goals: React/Three renderer upgrades and gameplay/protocol feature expansion.

Wait for CI/review; do not merge automatically.

---

## Final acceptance checklist

- [ ] `npm ci` succeeds on Node 24 from a clean checkout.
- [ ] `npm run check:legacy` succeeds.
- [ ] `npm test` succeeds without WoW assets.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run build` succeeds with Vite 8 and emits `dist/`.
- [ ] `npm run dev` serves the application shell and favicon.
- [ ] Vite has a `/pipeline` proxy to `http://localhost:3000`.
- [ ] Stylus and legacy image assets resolve without Webpack loaders.
- [ ] ADT/M2/WMO shaders are loaded with `?raw`; shader source is unchanged.
- [ ] Worker construction uses `new Worker(new URL('./index.js', import.meta.url), { type: 'module' })` and preserves the old message contract.
- [ ] no `::` function-bind syntax remains under `src`.
- [ ] no Babel export-extension syntax reported by the guard remains.
- [ ] no `worker!` inline loader prefix remains.
- [ ] no `~normalize.css` import remains.
- [ ] old Babel/Gulp/Webpack/Mocha/Istanbul/Travis infrastructure is absent after replacements pass.
- [ ] React/ReactDOM remain 0.14.3 and Three.js remains 0.77.0.
- [ ] CI runs install, syntax guard, tests, TypeScript gate, and Vite build on Node 24 without proprietary assets.
- [ ] pipeline/StormLib/WoW-data integration requirements are explicitly documented.
- [ ] accidental `MODERNIZATION_PLAN.md` on `master` is removed by a normal commit, not force history rewriting.
- [ ] PR is opened for review and not auto-merged.
