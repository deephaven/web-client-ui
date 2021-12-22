// The Deephaven API script isn't packaged as a module (yet), and is just included in index.html, exported to the global namespace
// This include file is simply a wrapper so that it behaves like a module, and can be mocked easily for unit tests.
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#using-global-variables
import type dhType from './dh.types';

declare global {
  // eslint-disable-next-line vars-on-top,no-var
  var dh: dhType;
}

const { dh } = globalThis;

export default dh;
