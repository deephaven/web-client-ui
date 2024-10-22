/**
 * Return true if given error has a code:string prop. Optionally check if the
 * code matches a given value.
 * @param err Error to check
 * @param code Optional code to check
 */
export function hasErrorCode(
  err: unknown,
  code?: string
): err is { code: string } {
  if (
    err != null &&
    typeof err === 'object' &&
    'code' in err &&
    typeof err.code === 'string'
  ) {
    return code == null || err.code === code;
  }

  return false;
}

/**
 * Returns true if the given error is an AggregateError. Optionally checks if
 * a given code matches the error's code.
 * @param err Error to check
 * @param code Optional code to check
 */
export function isAggregateError(
  err: unknown,
  code?: string
): err is { code: string } {
  return hasErrorCode(err, code) && String(err) === 'AggregateError';
}
