/**
 * Returns true when the runtime looks like a Web Worker — `self` is defined
 * as the global scope but there's no `document` (workers have `self`, only
 * the browser main thread has `document` on top of that). Node/non-browser
 * runtimes don't expose `self` at all, so this returns false there.
 *
 * Don't read top-level `this` to try to reach the global — in ES modules
 * (what rollup emits) top-level `this` is `undefined`, and under CJS it's
 * `module.exports`. Reference `self` as a global directly and let TS see
 * it via `typeof self`.
 */
export const isMaybeWebWorkerContext = (): boolean => {
  return (
    typeof self !== "undefined" && (self as any).document === undefined
  );
};
