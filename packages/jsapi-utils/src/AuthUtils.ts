import type { dh } from '@deephaven/jsapi-types';

export const AUTH_HANDLER_TYPE_ANONYMOUS =
  'io.deephaven.auth.AnonymousAuthenticationHandler';

export const AUTH_HANDLER_TYPE_PSK =
  'io.deephaven.authentication.psk.PskAuthenticationHandler';

/**
 * Get the auth handler types configured on the server.
 * @param authConfigValues Auth config values from the server
 * @returns Handler types from the `AuthHandlers` value, with empty entries
 * removed
 */
export function getAuthHandlers(
  authConfigValues: Map<string, string>
): string[] {
  // The server sends the raw property string, and itself accepts commas or
  // spaces as separators.
  return (authConfigValues.get('AuthHandlers') ?? '')
    .split(/[\s,]+/)
    .filter(handler => handler !== '');
}

/**
 * Fetch the auth handler types configured on the server.
 * @param client Client to fetch the auth config values from
 * @returns Promise that resolves to the configured auth handler types
 */
export async function fetchAuthHandlers(
  client: dh.CoreClient
): Promise<string[]> {
  const authConfigValues = (await client.getAuthConfigValues()) as [
    string,
    string,
  ][];
  return getAuthHandlers(new Map(authConfigValues));
}
