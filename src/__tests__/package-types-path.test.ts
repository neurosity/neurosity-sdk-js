import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// This test exists because we already shipped 7.3.0 with a broken
// `package.json:types` path. The published file pointed consumers at
// `dist/index.d.ts`, but the build only emits declarations to
// `dist/types/` (via `tsc --emitDeclarationOnly --outDir dist/types`).
// TypeScript silently treated the package as `any` for years, then bit
// console-next the moment it tried to use the firebase namespace
// re-exports added in #141.
//
// These assertions lock the package.json contract to what the build
// actually emits. If someone reverts the path, or moves where tsc
// writes its output, this test goes red BEFORE we publish a broken
// types path again.

const SDK_ROOT = resolve(__dirname, "../..");
const PKG_JSON_PATH = resolve(SDK_ROOT, "package.json");

interface PackageJson {
  types?: string;
  main?: string;
  module?: string;
  exports?: Record<string, unknown>;
  scripts?: Record<string, string>;
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(PKG_JSON_PATH, "utf8")) as PackageJson;
}

describe("package.json types path", () => {
  it("`types` field points at a relative path inside dist/", () => {
    const pkg = readPackageJson();
    expect(typeof pkg.types).toBe("string");
    expect(pkg.types).toMatch(/^dist\//);
    expect(pkg.types).toMatch(/\.d\.ts$/);
  });

  it("`exports['.'].types` matches the top-level `types` field", () => {
    const pkg = readPackageJson();
    const dotExport = (pkg.exports?.["."] ?? {}) as Record<string, string>;
    expect(typeof dotExport.types).toBe("string");
    // Allow leading "./" in exports paths but require otherwise identical.
    const normalize = (p: string): string => p.replace(/^\.\//, "");
    expect(normalize(dotExport.types)).toBe(normalize(pkg.types as string));
  });

  it("`build` script emits declarations to wherever `types` points", () => {
    // The defect we shipped in 7.3.0 was a mismatch between the build's
    // tsc outDir and the package.json `types` field. Catch a re-occurrence
    // by checking the script references the same dist subdirectory as
    // `types` does.
    const pkg = readPackageJson();
    const build = pkg.scripts?.build ?? "";
    const typesDir = (pkg.types as string).replace(/\/[^/]+$/, ""); // "dist/types"
    expect(build).toMatch(/tsc[^&|]*--emitDeclarationOnly/);
    expect(build).toContain(`--outDir ${typesDir}`);
  });

  it("after build, the file `types` points at actually exists", () => {
    // Skip when `dist/` isn't present — tests sometimes run pre-build in
    // local dev. CI runs `npm run build` first, so this is the load-bearing
    // check there.
    const pkg = readPackageJson();
    const typesPath = resolve(SDK_ROOT, pkg.types as string);
    if (!existsSync(resolve(SDK_ROOT, "dist"))) {
      // eslint-disable-next-line no-console
      console.warn(
        `[package-types-path.test] dist/ not built; skipping ${typesPath} existence check.`
      );
      return;
    }
    expect(existsSync(typesPath)).toBe(true);
  });

  it("the built types file re-exports the firebase namespaces", () => {
    // Pair with firebase-reexports.test.ts: that one checks the runtime
    // bindings; this one checks the SHIPPED .d.ts surface so consumers'
    // TypeScript actually sees the namespaces. If the build accidentally
    // strips them (e.g. someone moves the `export * as` lines into a
    // non-emitted file), TS2305 returns and customers' Support Inboxes
    // stop loading.
    const pkg = readPackageJson();
    const typesPath = resolve(SDK_ROOT, pkg.types as string);
    if (!existsSync(typesPath)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[package-types-path.test] ${typesPath} not built; skipping namespace surface check.`
      );
      return;
    }
    const content = readFileSync(typesPath, "utf8");
    for (const ns of ["app", "firestore", "database", "auth", "functions"]) {
      // Match `export * as <ns> from "firebase/<ns>";` regardless of quote
      // style or trailing comment. tsc's emit uses double quotes.
      expect(content).toMatch(
        new RegExp(`export \\* as ${ns} from ['"]firebase/${ns}['"]`)
      );
    }
  });
});
