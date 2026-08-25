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

| Option              | Default                         | Applied via                                               |
| ------------------- | ------------------------------- | --------------------------------------------------------- |
| `initialWindowSize` | unset (Node 64KB)               | `http2.connect` `settings.initialWindowSize` (per stream) |
| `sessionWindowSize` | `initialWindowSize`, else unset | `session.setLocalWindowSize()` (per connection)           |

Neither is set by default, so an unconfigured factory behaves exactly like a
bare `http2.connect(origin)`. Sizing is left to the consumer because the right
value depends on the deployment: a larger window costs buffer memory and weakens
backpressure, and the useful size is the bandwidth-delay product of the link
(`bandwidth x RTT`) — enough data in flight to keep the pipe full while waiting
for credit to return.

Setting `initialWindowSize` alone is enough:

```typescript
// e.g. sized for a high bandwidth-delay-product link
const transportFactory = NodeHttp2gRPCTransport.createFactory({
  initialWindowSize: 4 * 1024 * 1024,
});
```

Every DATA frame debits both the stream window and the connection window, so a
stream's usable throughput is the lesser of the two. `sessionWindowSize`
therefore defaults to `initialWindowSize`; a value _below_ it is rejected, since
the stream window could never be reached. Raise it above
`initialWindowSize` when several heavy streams share one session, since that
budget is shared across all of them.

The reverse is not derived. A large connection window over a small stream window
is a valid way to share a session between many streams, so `initialWindowSize` is
left at Node's default unless you set it.

`sessionOptions` is merged into the `http2.connect` options, which allows any
`http2.SecureClientSessionOptions` (TLS material, `maxSessionMemory`, etc.) to
be passed through. An explicit `initialWindowSize` takes precedence over
`sessionOptions.settings.initialWindowSize`.

A factory applies one config to every origin it connects to. When origins need
different settings — different TLS material, say — create a factory per config.
Factories never share sessions, so each keeps its own.

### Logging

`createFactory` throws on a `sessionWindowSize` below `initialWindowSize` rather
than silently limiting throughput. The check runs at factory creation, before any
connection is attempted.

Each session lifecycle event is logged through
`NodeHttp2gRPCTransport.onLogMessage`, with a `NodeHttp2SessionInfo` object as the
second argument — `debug` for `connect` / `localSettings` / `remoteSettings` /
`close`, `error` for `error`. It carries the negotiated window sizes, so it is
also the hook to use to record them elsewhere.

```typescript
NodeHttp2gRPCTransport.onLogMessage((level, message, info) => {
  console.log(level, message, info);
});
```

Note that HTTP/2 settings are applied asynchronously, so `localInitialWindowSize`
still reports Node's default on `connect`. Read it from `localSettings` onward to
see the value `initialWindowSize` actually negotiated.
