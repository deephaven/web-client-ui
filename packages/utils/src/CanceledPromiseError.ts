class CanceledPromiseError extends Error {
  isCanceled = true;
}

export default CanceledPromiseError;
