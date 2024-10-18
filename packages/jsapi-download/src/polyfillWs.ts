import ws from 'ws';

export function polyfillWs(): void {
  if (globalThis.WebSocket == null) {
    // Newer versions of NodeJS should eventually have first-class support for
    // WebSocket, but for older versions as late as v20, we need to polyfill it.
    globalThis.WebSocket = ws as unknown as (typeof globalThis)['WebSocket'];
  }
}

export default polyfillWs;
