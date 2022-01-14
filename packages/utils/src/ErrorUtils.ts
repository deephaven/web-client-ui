/* eslint-disable import/prefer-default-export */
/**
 * Converts a value to an Error if it is not an Error
 * The value is stringified to the Error message
 * Returns the value as is if it is already an Error
 *
 * Used for the TS 4.4 change which sets caught values to unknown by default
 * It is legal to throw any value in JS, not just Error
 * @param e Possible error or any other thrown value
 * @returns An Error with the param as a message if it is not an Error
 */
export function asError(e: unknown): Error {
  if (e instanceof Error) {
    return e;
  }
  return new Error(`${e}`);
}
