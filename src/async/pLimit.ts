/**
 * Concurrency limiter: run at most `concurrency` promises at a time.
 * Queues additional calls and runs them when a slot frees up.
 *
 * @param concurrency - Maximum number of concurrent executions (>= 1)
 * @returns A function that accepts an async function and its arguments, returning a Promise
 *
 * @example
 * ```ts
 * import { pLimit } from 'reliable-node-utils';
 *
 * const limit = pLimit(2);
 * const out = await Promise.all([
 *   limit(() => fetch('/a')),
 *   limit(() => fetch('/b')),
 *   limit(() => fetch('/c')), // waits until one of the first two finishes
 * ]);
 * ```
 *
 * @example
 * ```js
 * const { pLimit } = require('reliable-node-utils');
 * const limit = pLimit(5);
 * const results = await Promise.all(urls.map(url => limit(() => fetch(url))));
 * ```
 */
export function pLimit(
  concurrency: number
): <T, A extends unknown[]>(fn: (...args: A) => Promise<T>, ...args: A) => Promise<T> {
  if (
    typeof concurrency !== "number" ||
    concurrency < 1 ||
    !Number.isFinite(concurrency)
  ) {
    throw new TypeError("pLimit: concurrency must be a finite number >= 1");
  }
  let active = 0;
  const queue: Array<() => void> = [];

  const run = async <T, A extends unknown[]>(
    fn: (...args: A) => Promise<T>,
    ...args: A
  ): Promise<T> => {
    const wait = (): Promise<void> =>
      new Promise((resolve) => {
        queue.push(resolve);
      });
    const next = (): void => {
      active--;
      const resolve = queue.shift();
      if (resolve) resolve();
    };
    if (active >= concurrency) {
      await wait();
    }
    active++;
    try {
      return await fn(...args);
    } finally {
      next();
    }
  };
  return run;
}
