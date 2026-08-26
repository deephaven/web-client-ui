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
  globalThis.__dirname = import.meta.dirname;
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
  transportFactory: NodeHttp2gRPCTransport.createFactory(),
});

await client.login({
  type: dhc.CoreClient.LOGIN_TYPE_ANONYMOUS,
});

const cn = await client.getAsIdeConnection();
```

## NodeHttp2gRPCTransport

`NodeHttp2gRPCTransport.createFactory(config?)` returns a
`GrpcTransportFactory` backed by `node:http2`. Each factory owns its own http2
sessions, memoized by origin, so reusing a factory shares a session and creating
a second factory does not.

The static `NodeHttp2gRPCTransport.factory` is deprecated in favor of
`createFactory()`. It behaves identically to `createFactory()` with no config.

### Flow control windows

Unlike browsers, Node never grows its HTTP/2 receive windows past the 64KB
protocol default. A sender may only have one window of data in flight before it
has to wait for the receiver to acknowledge it, and recovering that credit costs
one round trip, so a single stream is capped at roughly `window / RTT` (RTT being
the round-trip time to the server). At 80ms RTT that is about 819KB/s, no matter
how much bandwidth is available.

| Option                                      | Default                                     | Applied via                                     |
| ------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| `sessionOptions.settings.initialWindowSize` | unset (Node 64KB)                           | `http2.connect` (per stream)                    |
| `sessionLocalWindowSize`                    | `sessionOptions.settings.initialWindowSize` | `session.setLocalWindowSize()` (per connection) |

Neither is set by default, so an unconfigured factory behaves exactly like a
bare `http2.connect(origin)`. Sizing is left to the consumer because the right
value depends on the deployment: a larger window costs buffer memory and weakens
backpressure, and the useful size is the bandwidth-delay product of the link
(`bandwidth x RTT`) — enough data in flight to keep the pipe full while waiting
for credit to return.

The per-stream window is not a discrete config property, since `sessionOptions`
is passed through to `http2.connect` and already carries it. Setting it alone is
enough:

```typescript
// e.g. sized for a high bandwidth-delay-product link
const transportFactory = NodeHttp2gRPCTransport.createFactory({
  sessionOptions: { settings: { initialWindowSize: 4 * 1024 * 1024 } },
});
```

Every DATA frame debits both the stream window and the connection window, so a
stream's usable throughput is the lesser of the two. `sessionLocalWindowSize`
therefore defaults to `settings.initialWindowSize`; a value _below_ it is
rejected, since the stream window could never be reached. Raise it above
`settings.initialWindowSize` when several heavy streams share one session, since
that budget is shared across all of them.

`sessionLocalWindowSize` is a discrete property because, per RFC 9113 6.9.2, the
connection window cannot be changed via SETTINGS — it is applied with
`session.setLocalWindowSize()` once the session connects, not through
`http2.connect`.

The reverse is not derived. A large connection window over a small stream window
is a valid way to share a session between many streams, so the stream window is
left at Node's default unless you set it.

`sessionOptions` is passed through to `http2.connect`, which allows any
`http2.SecureClientSessionOptions` (TLS material, `maxSessionMemory`, etc.).

A factory applies one config to every origin it connects to. When origins need
different settings — different TLS material, say — create a factory per config.
Factories never share sessions, so each keeps its own.

### Logging

`createFactory` validates `sessionLocalWindowSize` at factory creation, before
any connection is attempted. It throws when the value is below
`sessionOptions.settings.initialWindowSize`, and when it is not an integer in
`0 … 2 ** 31 - 1` — the range `session.setLocalWindowSize()` accepts. Both would
otherwise limit throughput silently, the second by leaving the session at Node's
default window.

Each session lifecycle event is logged through
`NodeHttp2gRPCTransport.onLogMessage` as a lone `NodeHttp2SessionInfo` object,
whose `event` names the event — at `error` level for `error`, `debug` otherwise.
It carries the negotiated window sizes, so it is also the hook to use to record
them elsewhere.

Every event reports `origin` and `event`, plus only the values that event
updated:

| Event            | Also reports                                            |
| ---------------- | ------------------------------------------------------- |
| `connect`        | `effectiveLocalWindowSize` (the connection window)      |
| `localSettings`  | `localInitialWindowSize` (our per-stream window)        |
| `remoteSettings` | `remoteInitialWindowSize`, `remoteMaxConcurrentStreams` |
| `error`          | `error` — a failed window change wraps its cause here   |
| `close`          | nothing — a destroyed session reports no state          |

```typescript
NodeHttp2gRPCTransport.onLogMessage((level, info) => {
  console.log(level, info);
});
```

HTTP/2 settings are applied asynchronously, which is why the windows are split
across events rather than reported on each one: on `connect` our own settings are
not yet in effect and the peer has not sent its own, so Node would report its
default for one and an assumption of its own for the other.
