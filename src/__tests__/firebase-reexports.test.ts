import * as sdk from "../index";

// These tests pin the public surface added in fix/reexport-firebase-modules.
// The whole point of those re-exports is that consumers can reach firebase
// through the SDK and share class identity with the SDK's bundled copy.
// If a future refactor accidentally drops a namespace — or worse, drops a
// specific function from it — the consumer's `collection(db, ...)` call
// falls back to their own `firebase/firestore` import and the brand check
// fails again. Catch that here before it ships.
describe("firebase modular re-exports", () => {
  it("exposes the five firebase namespaces", () => {
    expect(typeof sdk.app).toBe("object");
    expect(typeof sdk.firestore).toBe("object");
    expect(typeof sdk.database).toBe("object");
    expect(typeof sdk.auth).toBe("object");
    expect(typeof sdk.functions).toBe("object");
  });

  it.each([
    "getFirestore",
    "collection",
    "doc",
    "query",
    "where",
    "orderBy",
    "limit",
    "onSnapshot"
  ])(
    "sdk.firestore.%s should be a function (console-next reads use it)",
    (name) => {
      expect(typeof (sdk.firestore as Record<string, unknown>)[name]).toBe(
        "function"
      );
    }
  );

  it.each(["getDatabase", "ref", "update", "get", "set", "onValue"])(
    "sdk.database.%s should be a function (emulator power-on / device settings)",
    (name) => {
      expect(typeof (sdk.database as Record<string, unknown>)[name]).toBe(
        "function"
      );
    }
  );

  it.each(["getAuth", "onAuthStateChanged"])(
    "sdk.auth.%s should be a function",
    (name) => {
      expect(typeof (sdk.auth as Record<string, unknown>)[name]).toBe(
        "function"
      );
    }
  );

  it.each(["getFunctions", "httpsCallable"])(
    "sdk.functions.%s should be a function",
    (name) => {
      expect(typeof (sdk.functions as Record<string, unknown>)[name]).toBe(
        "function"
      );
    }
  );

  it("the re-exported firebase is the SAME module the SDK uses internally", async () => {
    // The whole reason for this PR. If `sdk.firestore` and the SDK's
    // internal `import { getFirestore } from "firebase/firestore"` resolved
    // to different module copies, the consumer fix would be a no-op — a
    // consumer calling
    // `sdk.firestore.collection(sdk.firestore.getFirestore(sdkApp), "x")`
    // would still cross modules and trip the brand check.
    //
    // Verify they're the same reference.
    const directFirestore = await import("firebase/firestore");
    expect(sdk.firestore.getFirestore).toBe(directFirestore.getFirestore);
    expect(sdk.firestore.collection).toBe(directFirestore.collection);

    const directDatabase = await import("firebase/database");
    expect(sdk.database.ref).toBe(directDatabase.ref);
    expect(sdk.database.update).toBe(directDatabase.update);
  });
});
