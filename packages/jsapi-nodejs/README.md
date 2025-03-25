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

// Needed for esm modules
if (typeof globalThis.__dirname === 'undefined') {
  globalThis.__dirname = import.meta.dirname
}

const tmpDir = path.join(__dirname, 'tmp');

// Download jsapi from a Deephaven server
const dhc = await loadDhModules({
  serverUrl: new URL('http://localhost:10000'),
  storageDir: tmpDir,
  targetModuleType: 'esm', // set to `cjs` to download as a CommonJS module
});

const client = new dhc.CoreClient(serverUrl.href, {
  // Enable http2 transport (this is optional but recommended)
  transportFactory: NodeHttp2gRPCTransport.factory,
})

await client.login({
  type: dhc.CoreClient.LOGIN_TYPE_ANONYMOUS,
})

const cn = await client.getAsIdeConnection()
```