import { createContext } from 'react';
import Cookies from 'js-cookie';
import Log from '@deephaven/log';

export const REFRESH_TOKEN_KEY = 'io.deephaven.web.client.auth.refreshToken';

export type RefreshToken = { bytes: string; expiry: number };

export const RefreshTokenContext = createContext<RefreshToken | null>(null);

const log = Log.module('RefreshTokenUtils');

/**
 * Read the refresh token from our cookie store
 * @returns RefreshToken if it exists, null otherwise
 */
export function readRefreshToken(): RefreshToken | null {
  const cookieToken = Cookies.get(REFRESH_TOKEN_KEY);
  try {
    if (cookieToken != null) {
      return JSON.parse(cookieToken);
    }
  } catch (e) {
    log.error('Error parsing refresh token', cookieToken, e);
  }
  return null;
}

/**
 * Store the provided refresh token as a cookie
 * @param token The refresh token to store
 */
export function storeRefreshToken(token: RefreshToken | null): void {
  if (token == null) {
    Cookies.remove(REFRESH_TOKEN_KEY);
    return;
  }

  const cookieToken = JSON.stringify({
    bytes: token.bytes,
    expiry: token.expiry,
  });
  const expires = new Date(token.expiry);

  Cookies.set(REFRESH_TOKEN_KEY, cookieToken, {
    secure: true,
    sameSite: 'strict',
    expires,
  });
}
