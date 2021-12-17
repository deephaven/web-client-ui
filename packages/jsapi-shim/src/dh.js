// The Deephaven API script isn't packaged as a module (yet), and is just included in index.html, exported to the global namespace
// This include file is simply a wrapper so that it behaves like a module, and can be mocked easily for unit tests.
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#using-global-variables

/* eslint-disable no-console */
// eslint-disable-next-line import/no-mutable-exports
let dh;
try {
  dh = window.dh;
  if (!dh) {
    console.error('dh API not defined on the window');
  }
} catch {
  console.error('window is not defined');
}

export default dh;
