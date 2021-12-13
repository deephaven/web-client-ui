export class AssertionError extends Error {
  isAssertionFailed = true;
}

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError(
      `Expected 'val' to be defined, but received ${val}`
    );
  }
}

export default { AssertionError, assertIsDefined };
