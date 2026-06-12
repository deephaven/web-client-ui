// Minimal static dev server for the example ES module plugin.
//
// Serves the built `dist/` directory under `/@deephaven/plugin-example/...`
// and generates a `manifest.json` describing the plugin, mirroring how a real
// plugin server (e.g. deephaven-plugins) exposes plugins. CORS is enabled so
// the host dev server can fetch the plugin entry for ESM/CJS detection.
//
// Point the host at this server by setting in
// packages/code-studio/.env.development.local:
//   VITE_JS_PLUGINS_DEV_PORT=4100
//
// Usage: node serve.js  (defaults to port 4100, override with PORT)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(dirname, 'dist');
const port = Number.parseInt(process.env.PORT ?? '4100', 10);

const PLUGIN_NAME = '@deephaven/plugin-example';
const PLUGIN_VERSION = '1.22.0';

const CONTENT_TYPES = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
};

/** Build the plugin manifest served at /manifest.json. */
function buildManifest() {
  return {
    plugins: [
      {
        name: PLUGIN_NAME,
        version: PLUGIN_VERSION,
        main: 'index.js',
        // `package` enables other ESM plugins to import this one by package name.
        package: PLUGIN_NAME,
      },
    ],
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/manifest.json') {
    const body = JSON.stringify(buildManifest());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
    return;
  }

  // Strip the plugin name prefix so `/@deephaven/plugin-example/index.js`
  // resolves to `dist/index.js`.
  if (pathname.startsWith(`/${PLUGIN_NAME}/`)) {
    pathname = pathname.slice(`/${PLUGIN_NAME}`.length);
  }

  // Prevent path traversal outside dist.
  const filePath = path.normalize(path.join(distDir, pathname));
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
    });
    res.end(data);
  });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Example plugin server running at http://localhost:${port}\n` +
      `  manifest: http://localhost:${port}/manifest.json\n` +
      `  entry:    http://localhost:${port}/${PLUGIN_NAME}/index.js`
  );
});
