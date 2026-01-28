import { type GridRange } from '@deephaven/grid';

/**
 * Error thrown when a commit to the grid fails.
 */
export class GridCommitError extends Error {
  private ranges?: readonly GridRange[];

  private text?: string;

  constructor(
    message: string,
    options?: ErrorOptions & { ranges: readonly GridRange[]; text: string }
  ) {
    super(message, options);
    this.ranges = options?.ranges;
    this.text = options?.text;
    this.name = 'GridCommitError';
    this.cause = options?.cause;
  }

  toString(): string {
    // This gets displayed in the UI, so we want to keep it simple and readable by using just the message and cause
    return `${this.message}${
      this.cause !== undefined ? `: ${this.cause}` : ''
    }`;
  }
}

export default GridCommitError;
