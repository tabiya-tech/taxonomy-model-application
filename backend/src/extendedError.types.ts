export interface ExtendedError extends Error {
  cause?: ExtendedError;
}
