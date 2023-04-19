import { ConnectOptions } from '@deephaven/jsapi-types';

/**
 * Get the base URL of the API
 * @param coreApiUrl Configured Core API URL
 * @returns URL for the base of the API
 */
export function getBaseUrl(coreApiUrl: string): URL {
  return new URL(coreApiUrl, `${window.location}`);
}

/**
 * Get the websocket URL for the API
 * @param baseURL URL for the base of the API
 * @returns Websocket URL for the API
 */
export function getWebsocketUrl(baseURL: URL): string {
  return `${baseURL.protocol}//${baseURL.host}`;
}

/**
 * Get the Envoy prefix header value
 * @returns Envoy prefix header value
 */
export function getEnvoyPrefix(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('envoyPrefix');
}

export function getConnectOptions(): ConnectOptions {
  const envoyPrefix = getEnvoyPrefix();
  return envoyPrefix != null
    ? { headers: { 'envoy-prefix': envoyPrefix } }
    : { headers: {} };
}
