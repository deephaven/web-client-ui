import React, { useContext } from 'react';

/**
 * Fetch a given context or throw an error if it is null.
 * @param context Context to use
 * @param message Message to throw if context is null
 * @returns Context, or throws
 */
export function useContextOrThrow<T>(
  context: React.Context<T>,
  message = 'No value available in context. Was code wrapped in a provider?'
): NonNullable<T> {
  const value = useContext(context);
  if (value == null) {
    throw new Error(message);
  }
  return value;
}

export default useContextOrThrow;
