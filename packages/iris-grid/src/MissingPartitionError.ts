class MissingPartitionError extends Error {
  isMissingPartitionError = true;
}

export function isMissingPartitionError(
  err: unknown
): err is MissingPartitionError {
  return (err as MissingPartitionError)?.isMissingPartitionError === true;
}

export default MissingPartitionError;
