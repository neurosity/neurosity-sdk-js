/**
 * Regression: `isMaybeWebWorkerContext()` was reading top-level `this` to get
 * a reference to the global scope. In ES modules (which rollup emits) top-
 * level `this` is `undefined` per spec — rollup even warns about the rewrite
 * on every build. So the helper returned a falsy result unconditionally,
 * regardless of whether the runtime was a worker, a browser main thread, or
 * Node.
 *
 * The only caller (`isWebBluetoothSupported`) happened to short-circuit on
 * `typeof window !== "undefined"` first, so customers weren't visibly bitten
 * — but the helper as a standalone primitive was useless. This test locks in
 * the fix: reference `self` as a global instead of via top-level `this`.
 */

import { isMaybeWebWorkerContext } from "../api/bluetooth/web/isMaybeWebWorkerContext";

describe("isMaybeWebWorkerContext", () => {
  const originalSelf = (globalThis as any).self;

  afterEach(() => {
    if (originalSelf === undefined) {
      delete (globalThis as any).self;
    } else {
      (globalThis as any).self = originalSelf;
    }
  });

  it("returns true when `self` exists without a `document` (worker shape)", () => {
    (globalThis as any).self = { postMessage: () => {} };
    expect(isMaybeWebWorkerContext()).toBe(true);
  });

  it("returns false when `self` has a `document` (browser main thread shape)", () => {
    (globalThis as any).self = { document: {} };
    expect(isMaybeWebWorkerContext()).toBe(false);
  });

  it("returns false when `self` is not defined at all (Node / non-browser)", () => {
    delete (globalThis as any).self;
    expect(isMaybeWebWorkerContext()).toBe(false);
  });
});
