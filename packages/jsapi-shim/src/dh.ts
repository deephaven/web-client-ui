// The Deephaven API script isn't packaged as a module (yet), and is just included in index.html, exported to the global namespace
// This include file is simply a wrapper so that it behaves like a module, and can be mocked easily for unit tests
import type { dh as DhType } from '@deephaven/jsapi-types';

declare global {
  // eslint-disable-next-line vars-on-top,no-var
  var dh: DhType;
}

const { dh } = globalThis;

export default dh;
