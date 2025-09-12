/**
 * Determines if the current runtime environment is Node.js (or Node.js-like)
 * @returns {boolean} true if running in Node.js or Node.js-compatible runtime, false otherwise
 */
export function isNode(): boolean {
  try {
    // Check if we're in any Node.js-like environment
    if (typeof process === "undefined") {
      return false;
    }

    // More permissive check - accept if process exists with some Node.js characteristics
    return Boolean(
      process &&
        // Standard Node.js
        (process.versions?.node ||
          // Node.js-like environments (tsx, ts-node, etc.)
          (process.platform && process.env && typeof require !== "undefined"))
    );
  } catch {
    return false;
  }
}
