/**
 * Returns an error message from an object. Guaranteed not to be an empty string.
 * @param error Error object to get the message from.
 * @returns Error message, or undefined if there is no message.
 */
export function getErrorMessage(error: unknown): string | undefined {
  let errorObj = error;
  if (error instanceof CustomEvent) {
    errorObj = error.detail;
  }
  let message = '';
  if (errorObj instanceof Error) {
    message = errorObj.message;
  } else if (errorObj != null) {
    message = `${errorObj}`;
  }

  message = message.trim();
  if (message.length > 0) {
    return message;
  }

  return undefined;
}

export default getErrorMessage;
