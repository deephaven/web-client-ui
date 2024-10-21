# @deephaven/jsapi-components

Deephaven utils for consuming Jsapi from a server from a nodejs app. It can 
optionally convert the server module format from `ESM` -> `CJS` or `CJS` -> `ESM` 
if the server and consumer don't use the same module format.

## Install

```bash
npm install --save @deephaven/jsapi-nodejs
```

## Usage

```typescript
import fs from 'node:fs';
import path from 'node:path';

import { loadModules } from '@deephaven/jsapi-nodejs';

const tmpDir = path.join(__dirname, 'tmp');

// Download jsapi `ESM` files from DH Community server and export as `CJS` module.
const dhc = await loadModules({
  serverUrl: new URL('http://localhost:10000'),
  serverPaths: ['jsapi/dh-core.js', 'jsapi/dh-internal.js'],
  download: true,
  storageDir: tmpDir,
  sourceModuleType: 'esm',
  targetModuleType: 'cjs',
});
```