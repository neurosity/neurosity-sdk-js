export * from "./Neurosity";
export * from "./api/bluetooth";
export * from "./types";

// Re-export the firebase modular APIs that the SDK already bundles. Consumers
// that build on top of the SDK should import firebase functions through these
// namespaces rather than from `firebase/firestore` etc. directly — that way
// the FirebaseApp returned by `neurosity.__getApp()` and the
// `collection()` / `ref()` / `onAuthStateChanged()` calls operating on it
// resolve to the SAME firebase module instance, and Firebase's runtime brand
// checks pass.
//
// Why this matters: under pnpm, a consumer that also lists `firebase` as a
// direct dependency gets a SEPARATE physical copy from the one bundled into
// the SDK (peer-dep resolution variants live at their own
// `node_modules/.pnpm/firebase@X.Y.Z_<hash>/` paths). Two physical copies →
// two evaluations of the firebase classes → `collection(db, ...)` rejects a
// Firestore whose internal classes came from the other copy with
// "Expected first argument to collection() to be a CollectionReference,
// a DocumentReference or FirebaseFirestore". The console-next Support Inbox
// and the emulator power-on toggle hit this exact failure in 2026-05.
export * as app from "firebase/app";
export * as firestore from "firebase/firestore";
export * as database from "firebase/database";
export * as auth from "firebase/auth";
export * as functions from "firebase/functions";
