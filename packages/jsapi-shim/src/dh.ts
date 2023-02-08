// The Deephaven API script isn't packaged as a module (yet), and is just included in index.html, exported to the global namespace
// This include file is simply a wrapper so that it behaves like a module, and can be mocked easily for unit tests
import type dhType from './dh.types';

const dhModule = await import(
  /* @vite-ignore */
  `${import.meta.env.VITE_CORE_API_URL}/${import.meta.env.VITE_CORE_API_NAME}`
);

const dh = dhModule.default as dhType;

export default dh;
