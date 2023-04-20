export class NoConsolesError extends Error {
  isNoConsolesError = true;
}

export function isNoConsolesError(error: unknown): error is NoConsolesError {
  return (error as NoConsolesError).isNoConsolesError;
}

export default NoConsolesError;
