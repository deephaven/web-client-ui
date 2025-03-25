# @deephaven/jsapi-nodejs

Deephaven utils for consuming Jsapi from a server from a nodejs app. The jsapi
can be downloaded as an `ESM` or `CJS` module.

## Install

```bash
npm install --save @deephaven/jsapi-nodejs
```

## Usage

```typescript
import fs from 'node:fs';
import path from 'node:path';

import { loadDhModules } from '@deephaven/jsapi-nodejs';

// Polyfills needed if consuming DH as `ESM` module
globalThis.self = globalThis;
globalThis.window = globalThis;

const tmpDir = path.join(__dirname, 'tmp');

// Download jsapi from a Deephaven server
const dhc = await loadDhModules({
  serverUrl: new URL('http://localhost:10000'),
  storageDir: tmpDir,
  targetModuleType: 'esm', // set to `cjs` to download as a CommonJS module
});
```