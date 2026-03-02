/**
 * Custom error base for utilities. Enables `instanceof` checks and preserves cause.
 * @internal
 */
export class UtilsError extends Error {
  override readonly name: string = "UtilsError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an operation is aborted via AbortSignal.
 * @public
 */
export class AbortError extends UtilsError {
  override readonly name = "AbortError";
}

/**
 * Thrown when an operation exceeds its time limit (e.g. withTimeout).
 * @public
 */
export class TimeoutError extends UtilsError {
  override readonly name = "TimeoutError";
}

/**
 * Thrown when retry exhausts all attempts without success.
 * @public
 */
export class RetryExhaustedError extends UtilsError {
  override readonly name = "RetryExhaustedError";

  constructor(
    message: string,
    public readonly attempt: number,
    public readonly lastError: unknown,
    options?: { cause?: unknown }
  ) {
    super(message, { ...options, cause: lastError });
  }
}
