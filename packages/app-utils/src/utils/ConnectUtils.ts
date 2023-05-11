import type { ConnectOptions } from '@deephaven/jsapi-types';

/**
 * Get the base URL of the API
 * @param apiUrl API URL
 * @returns URL for the base of the API
 */
export function getBaseUrl(apiUrl: string): URL {
  return new URL(apiUrl, `${window.location}`);
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
