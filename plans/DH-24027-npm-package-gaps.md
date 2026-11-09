# DH-24027: @deephaven npm package gaps

Close the API gaps in `@deephaven/jsapi-nodejs` and `@deephaven/jsapi-utils` that CLI/MCP work had to build itself (parent: DH-24026).

ESM import through `pathToFileURL` (DH-24025) is **already done** in `loaderUtils.ts`, and the Windows CI check for it is already in place (`.github/workflows/unit-nodejs.yml` + `node-tests/loaderUtils.test.mjs`). This plan only has to keep that test passing after the storage directory change.

## Contract

### `@deephaven/jsapi-nodejs` — errors (`src/errorUtils.ts`)

- `HttpError` stays as it is (`statusCode`, `message`, `name = 'HttpError'`).
- New `UntrustedUrlError extends Error`:
  - `constructor(url: URL | string)`; public readonly `url: string` (href)
  - `name = 'UntrustedUrlError'`, message `Untrusted URL: "<href>"`
- New `DownloadTimeoutError extends Error`:
  - `constructor(url: URL | string, timeoutMs: number)`; public readonly `url: string`, `timeoutMs: number`
  - `name = 'DownloadTimeoutError'`, message `Download timed out after <timeoutMs>ms: "<href>"`

### `@deephaven/jsapi-nodejs` — `DownloadOptions` (export from `src/serverUtils.ts`)

```ts
export type DownloadLogger = { error: (...args: unknown[]) => void };

export type DownloadOptions = {
  /** Called for the initial URL and every redirect target before it is requested. */
  isTrustedUrl?: (url: URL) => boolean;
  maxRedirects?: number; // default 20
  retries?: number; // default 10
  retryDelayMs?: number; // default 1000
  timeoutMs?: number; // default 5000
  signal?: AbortSignal;
  logger?: DownloadLogger; // default console
};
```

All defaults match today's behavior. `isTrustedUrl` defaults to "trust everything". `maxRedirects` defaults to `20` (the same limit as `fetch`), so a server that redirects (e.g. http→https) works by default instead of failing. This is not a breaking change: today a 3xx response body is written to disk as the module. Callers that want to refuse redirects pass `maxRedirects: 0`.

### `downloadFromURL`

New signature, with the old positional form still accepted:

```ts
export async function downloadFromURL(
  url: URL,
  options?: DownloadOptions
): Promise<string>;
/** @deprecated pass a DownloadOptions object */
export async function downloadFromURL(
  url: URL,
  retries?: number,
  retryDelay?: number,
  logger?: DownloadLogger
): Promise<string>;
```

Telling the forms apart: if the second argument is a `number`, or there are more than 2 arguments, treat it as the legacy positional form (`undefined` positional args fall back to the defaults). Otherwise treat it as `DownloadOptions`.

Behavior, per call:

1. If `signal?.aborted`, reject with `signal.reason` and make no request.
2. Protocols other than `http:` and `https:` reject with the existing `Error('Only http: and https: protocols are supported. Received <protocol>')`. This is not retried.
3. Before requesting **any** URL (the initial one or a redirect target), call `isTrustedUrl(url)`. If it returns `false`, reject with `UntrustedUrlError(url)`. The request is never made, and this is not retried.
4. Make the request with `node:http` / `node:https` `get(url, { timeout: timeoutMs })`. The signal is **not** passed to `get`; abort is handled by destroying the active request (see 8). Do **not** switch to `fetch`: VS Code patches the `http`/`https` agents for proxy and certificate handling.
5. Responses, by status:
   - **2xx:** collect the body as `Buffer` chunks, then `Buffer.concat(chunks).toString('utf8')` and resolve.
   - **301 / 302 / 303 / 307 / 308 with a `Location` header:** call `res.resume()` to drain the body.
     - If redirects followed so far `< maxRedirects`, resolve `new URL(location, currentUrl)` and continue from step 2 with it.
     - Otherwise reject with `HttpError(status, 'Too many redirects (max <maxRedirects>): "<currentUrl>"')`.
   - **Any other status (including 3xx without `Location`):** call `res.resume()`, then reject with `HttpError(status)`. For 404, keep the existing message `File not found: "<url>"`. For anything else use `HTTP <status> <STATUS_CODES[status]>: "<url>"`. HTTP errors are **not** retried.
6. On socket timeout (the request's `'timeout'` event): call `req.destroy()`, log `logger.error('Failed download of url:', url)`, and reject with `DownloadTimeoutError(url, timeoutMs)`. **Not** retried (matches today).
7. On request `'error'` (network failure), if the signal is not aborted:
   - With retries remaining, log `logger.error('Retrying url:', url)`. After `retryDelayMs`, retry from the **original** URL with `retries - 1` and the redirect count reset.
   - Otherwise log the existing "Hit retry limit" messages and reject with the error.
8. Abort:
   - **During a request:** call `req.destroy()` on the active request and reject with `signal.reason`. Do not retry.
   - **During a retry delay:** `clearTimeout` the pending retry, remove the abort listener, and reject with `signal.reason`.
   - Remove the abort listener once the call settles.

`hasStatusCode` and `SERVER_STATUS_CHECK_TIMEOUT` are unchanged.

### Storage directory names

- New `urlToStorageDirName(url: string | URL): string` returns `encodeURIComponent(new URL(url).origin)`.
  - Example: `http://localhost:10000/foo` → `http%3A%2F%2Flocalhost%3A10000`.
  - The result is valid on Windows (no `:` / `/` / `\`).
  - `origin` drops default ports, so `https://h:443` and `https://h` share a directory.
- `urlToDirectoryName` stays exported, unchanged, with a `@deprecated Use urlToStorageDirName` JSDoc tag.
- `loadModules` uses `urlToStorageDirName` for `serverStorageDir`.
  - **Behavior change:** `download: false` callers that pre-populated `<storageDir>/<host_port>` must re-download or move the files. Note this in the README and the PR description, as a `feat` and not a `BREAKING CHANGE`. Old directories are left in place and not migrated.

### `loadModules` / `loadDhModules` (`src/loaderUtils.ts`)

- Add an optional `downloadOptions?: DownloadOptions` field to `LoadModuleOptions`.
- `loadModules` passes it to every `downloadFromURL(url, downloadOptions)` call.
- `loadDhModules` accepts `downloadOptions` in its `Pick<...>` and passes it to `loadModules`.
- The existing 404 → `''` handling for `jsapi/dh-internal.js` stays. Every other error, including `UntrustedUrlError`, `DownloadTimeoutError` and abort reasons, reaches `errorTransform` and is rethrown by `loadDhModules`.
- If `signal` is aborted after the downloads settle but before the write, nothing is written: if `signal?.aborted`, throw `signal.reason` before `writeFileSync`. (`throwIfAborted` isn't used because `engines.node` is `>=16`.)

### `@deephaven/jsapi-utils` — `src/AuthUtils.ts`

```ts
export const AUTH_HANDLER_TYPE_ANONYMOUS =
  'io.deephaven.auth.AnonymousAuthenticationHandler';
export const AUTH_HANDLER_TYPE_PSK =
  'io.deephaven.authentication.psk.PskAuthenticationHandler';

/** Split the `AuthHandlers` config value on `,`, trim each entry, drop empties. */
export function getAuthHandlers(
  authConfigValues: Map<string, string>
): string[];

/** `new Map(await client.getAuthConfigValues())` then `getAuthHandlers`. */
export async function fetchAuthHandlers(
  client: dh.CoreClient
): Promise<string[]>;
```

- `getAuthHandlers` keeps the existing `app-utils` signature (a `Map`, reading key `AuthHandlers`, returning `[]` when absent), so the `app-utils` re-export doesn't break anything.
- `getAuthConfigValues()` is typed loosely: cast it to `[string, string][]` as `AuthBootstrap.tsx` does.
- Export with `export * from './AuthUtils';` in `jsapi-utils/src/index.ts`.
- Re-exports:
  - `auth-plugins/src/AuthHandlerTypes.ts` becomes `export { AUTH_HANDLER_TYPE_ANONYMOUS, AUTH_HANDLER_TYPE_PSK } from '@deephaven/jsapi-utils';`
  - `app-utils/src/plugins/PluginUtils.ts`: delete the local `getAuthHandlers` and replace it with `import { getAuthHandlers } from '@deephaven/jsapi-utils'` plus `export { getAuthHandlers }` (still used by `getAuthPluginComponent`). Both packages already depend on `@deephaven/jsapi-utils`.

## Gotchas

- **Jest env:** `jest.config.base.cjs` uses `jsdom`, and the shared `jest.setup.ts` needs `window`, so `@jest-environment node` can't be used. jsdom's `AbortController` works because the signal is only listened to, never handed to `http.get` (Node rejects non-Node `AbortSignal`s).
- **Double settlement:** `req.destroy()` emits `'error'` after you have already rejected. Guard every resolve/reject/retry path with a single `settled` flag so a timeout or abort never also schedules a retry.
- **Local test servers:** bind to `127.0.0.1` on port `0` and read the port from `server.address()`. Use `server.closeAllConnections()` in `afterEach` so hung sockets (timeout tests) don't keep Jest open.
- **"Socket closed" assertion:** on the server side, record each request's `req.socket` and assert that `'close'` fires after the client's timeout rejection.
- **Fast retry tests:** pass `retryDelayMs: 10`. For an unreachable target, use a port from a server you opened and then closed (`ECONNREFUSED`).
- `node-tests/` runs against `dist`, so `npm run build` the package (or `npx lerna run build --scope=@deephaven/jsapi-nodejs`) before `test:node`.

## Checklist

- [x] `errorUtils.ts`: add `UntrustedUrlError`, `DownloadTimeoutError` (file-level `eslint-disable max-classes-per-file`, as in `ShortcutRegistry.ts`)
- [x] `serverUtils.ts`: add `DownloadLogger`, `DownloadOptions`; rewrite `downloadFromURL` per contract (options + legacy positional overload)
- [x] `serverUtils.ts`: reject every non-2xx with `HttpError`
- [x] `serverUtils.ts`: follow redirects up to `maxRedirects` (default 20), checking `isTrustedUrl` before every request
- [x] `serverUtils.ts`: timeout rejects `DownloadTimeoutError` and destroys the request
- [x] `serverUtils.ts`: `AbortSignal` support covering in-flight requests and pending retries
- [x] `serverUtils.ts`: add `urlToStorageDirName`; deprecate `urlToDirectoryName`
- [x] `loaderUtils.ts`: `downloadOptions` on `LoadModuleOptions` / `loadDhModules`; switch to `urlToStorageDirName`; abort check before writing
- [x] `src/serverUtils.test.ts` (Jest) covering the Validation cases below
- [x] `node-tests/loaderUtils.test.mjs`: switch to `urlToStorageDirName`; add a `download: true` ESM test against a local `http` server
- [x] `jsapi-nodejs/README.md`: document `DownloadOptions`, the error classes, and the storage directory change
- [x] `jsapi-utils/src/AuthUtils.ts` + `AuthUtils.test.ts`; export it from `index.ts`
- [x] `auth-plugins/src/AuthHandlerTypes.ts` re-exports the constants from `@deephaven/jsapi-utils`
- [x] `app-utils/src/plugins/PluginUtils.ts` re-exports `getAuthHandlers` from `@deephaven/jsapi-utils`

## Validation

`serverUtils.test.ts` cases (each against a local `node:http` server):

- [x] A 500 rejects with `HttpError` (`statusCode === 500`) and does not resolve with the body; a 401 does the same
- [x] A 404 rejects with `HttpError` with message `File not found: "<url>"`
- [x] 302 → 200 with `maxRedirects: 1` resolves the final body
- [x] A 302 chain longer than `maxRedirects` rejects with `HttpError` (3xx status). With `maxRedirects: 0`, a 302 rejects. With the default, a 302 → 200 is followed
- [x] A redirect to a target that fails `isTrustedUrl`:
  - rejects with `UntrustedUrlError`
  - the server handling the target records **zero** requests
- [x] An untrusted initial URL rejects with `UntrustedUrlError` and makes no request
- [x] A server that never responds, with `timeoutMs: 50`:
  - rejects with `DownloadTimeoutError`
  - the server-side socket emits `'close'`
  - only 1 request is made (no retry)
- [x] Aborting mid-request rejects with `signal.reason`, and the server socket closes
- [x] Aborting during a retry delay:
  - setup: `ECONNREFUSED`, `retries: 5`, `retryDelayMs: 1000`, abort at ~20ms
  - rejects within 200ms
  - no further connection attempts
- [x] An already-aborted signal rejects without a request
- [x] `retries: 2, retryDelayMs: 10` against `ECONNREFUSED` rejects within 500ms after 3 attempts
- [x] A custom `logger.error` receives the retry messages, and `console.error` is not called
- [x] The legacy positional `downloadFromURL(url, 0, 10, logger)` still works
- [x] `urlToStorageDirName('http://h:1')` !== `urlToStorageDirName('https://h:1')`
- [x] `urlToStorageDirName('http://a_b:1')` !== `urlToStorageDirName('http://a.b:1')`
- [x] The result contains no `:`, `/` or `\`

`AuthUtils.test.ts` cases:

- [x] `getAuthHandlers(new Map([['AuthHandlers', ' a , b,,']]))` → `['a', 'b']`
- [x] Missing key → `[]`
- [x] `fetchAuthHandlers` with a mock client (`TestUtils.createMockProxy<dh.CoreClient>`) resolving `[['AuthHandlers', 'x,y']]` → `['x', 'y']`

Commands:

- [x] `npm run test:unit -- packages/jsapi-nodejs packages/jsapi-utils packages/auth-plugins packages/app-utils` passes
- [x] `npx lerna run build --scope=@deephaven/jsapi-nodejs && npm run test:node --workspace=@deephaven/jsapi-nodejs` passes, including the new `download: true` ESM test
- [ ] `unit-nodejs.yml` passes on `windows-latest` in PR CI
- [x] `npm run types` passes
- [x] `npm run test:lint -- --changedSince origin/main` passes

## Relevant Files

- `packages/jsapi-nodejs/src/errorUtils.ts`
- `packages/jsapi-nodejs/src/serverUtils.ts`
- `packages/jsapi-nodejs/src/serverUtils.test.ts` (new)
- `packages/jsapi-nodejs/src/loaderUtils.ts`
- `packages/jsapi-nodejs/node-tests/loaderUtils.test.mjs`
- `packages/jsapi-nodejs/README.md`
- `packages/jsapi-utils/src/AuthUtils.ts` (new)
- `packages/jsapi-utils/src/AuthUtils.test.ts` (new)
- `packages/jsapi-utils/src/index.ts`
- `packages/auth-plugins/src/AuthHandlerTypes.ts`
- `packages/app-utils/src/plugins/PluginUtils.ts`
