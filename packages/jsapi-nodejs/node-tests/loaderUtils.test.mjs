// Runs with `node --test` against the built `dist` output rather than Jest.
// Jest transpiles `import()` to `require()`, so it can't exercise Node's real
// ESM loader, which is what rejects absolute Windows paths.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

import { loadDhModules, loadModules } from '../dist/loaderUtils.js';
import { urlToDirectoryName } from '../dist/serverUtils.js';

const serverUrl = new URL('http://localhost:10000/');

let tmpDir;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsapi-nodejs-'));
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loadModules imports an esm module from an absolute storage path', async () => {
  const serverStorageDir = path.join(tmpDir, urlToDirectoryName(serverUrl));
  fs.mkdirSync(serverStorageDir, { recursive: true });
  fs.writeFileSync(
    path.join(serverStorageDir, 'dh-core.js'),
    'export default 42;'
  );

  const result = await loadModules({
    serverUrl,
    serverPaths: ['jsapi/dh-core.js'],
    storageDir: tmpDir,
    download: false,
    targetModuleType: 'esm',
  });

  assert.equal(result.default, 42);
});

test('loadModules downloads and imports an esm module', async () => {
  const server = http.createServer((req, res) => {
    res.end('export default 43;');
  });
  await new Promise(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const { port } = server.address();
    const result = await loadModules({
      serverUrl: new URL(`http://127.0.0.1:${port}/`),
      serverPaths: ['jsapi/dh-core.js'],
      storageDir: tmpDir,
      download: true,
      targetModuleType: 'esm',
    });

    assert.equal(result.default, 43);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => {
      server.close(resolve);
    });
  }
});

async function withServer(handler, callback) {
  const server = http.createServer(handler);
  await new Promise(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const { port } = server.address();
    return await callback(new URL(`http://127.0.0.1:${port}/`));
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => {
      server.close(resolve);
    });
  }
}

test('loadDhModules treats a non-404 error for dh-internal.js as missing', async () => {
  await withServer(
    (req, res) => {
      if (req.url === '/jsapi/dh-internal.js') {
        res.statusCode = 403;
        res.end('forbidden');
        return;
      }
      res.end('export default 44;');
    },
    async serverUrl => {
      const dh = await loadDhModules({
        serverUrl,
        storageDir: tmpDir,
        targetModuleType: 'esm',
      });

      assert.equal(dh, 44);
    }
  );
});

test('loadModules skips errorTransform once aborted', async () => {
  const controller = new AbortController();
  let errorTransformCalls = 0;

  await withServer(
    (req, res) => {
      controller.abort(new Error('stop'));
      res.end('export default 45;');
    },
    serverUrl =>
      assert.rejects(
        loadModules({
          serverUrl,
          serverPaths: ['jsapi/dh-core.js'],
          storageDir: tmpDir,
          download: true,
          targetModuleType: 'esm',
          downloadOptions: { signal: controller.signal },
          errorTransform: () => {
            errorTransformCalls += 1;
            return '';
          },
        }),
        { message: 'stop' }
      )
  );

  assert.equal(errorTransformCalls, 0);
});
