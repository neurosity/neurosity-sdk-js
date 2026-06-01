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

  it("the built types file re-exports the core Neurosity class", () => {
    // The reason consumers install this package at all. If the dist
    // types ever lose the Neurosity surface (e.g. a wrong rollup output
    // root, a build that emits an empty index.d.ts) consumers turn into
    // `any` again silently.
    const pkg = readPackageJson();
    const typesPath = resolve(SDK_ROOT, pkg.types as string);
    if (!existsSync(typesPath)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[package-types-path.test] ${typesPath} not built; skipping core surface check.`
      );
      return;
    }
    const content = readFileSync(typesPath, "utf8");
    expect(content).toMatch(/export\s+\*\s+from\s+['"]\.\/Neurosity['"]/);
    expect(content).toMatch(/export\s+\*\s+from\s+['"]\.\/types['"]/);
  });
});

describe("package.json exports conditions", () => {
  it("`types` is listed FIRST in `exports['.']`", () => {
    // TypeScript's exports-condition resolution is order-sensitive: the
    // `types` key must come before `import`/`require`/`browser` or TS
    // ignores it. https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#package.json-exports-imports-and-self-referencing
    //
    // Catch the foot-gun before the next regression: a perfectly valid-
    // looking re-order during a refactor will silently strand all
    // consumers using `node16` / `nodenext` / `bundler` module
    // resolution.
    const pkg = readPackageJson();
    const dotExport = (pkg.exports?.["."] ?? {}) as Record<string, string>;
    const keys = Object.keys(dotExport);
    expect(keys[0]).toBe("types");
  });

  it("every condition in `exports['.']` points at an existing file (post-build)", () => {
    const pkg = readPackageJson();
    if (!existsSync(resolve(SDK_ROOT, "dist"))) {
      // eslint-disable-next-line no-console
      console.warn(
        "[package-types-path.test] dist/ not built; skipping conditions existence check."
      );
      return;
    }
    const dotExport = (pkg.exports?.["."] ?? {}) as Record<string, string>;
    for (const [condition, relativePath] of Object.entries(dotExport)) {
      const absolutePath = resolve(SDK_ROOT, relativePath);
      expect({
        condition,
        relativePath,
        exists: existsSync(absolutePath)
      }).toEqual({ condition, relativePath, exists: true });
    }
  });

  it("`main`, `module`, `browser`, `types` all point at existing files (post-build)", () => {
    const pkg = readPackageJson();
    if (!existsSync(resolve(SDK_ROOT, "dist"))) {
      // eslint-disable-next-line no-console
      console.warn(
        "[package-types-path.test] dist/ not built; skipping top-level entry-point check."
      );
      return;
    }
    for (const field of ["main", "module", "browser", "types"] as const) {
      const relativePath = (pkg as Record<string, unknown>)[field] as
        | string
        | undefined;
      expect(typeof relativePath).toBe("string");
      const absolutePath = resolve(SDK_ROOT, relativePath as string);
      expect({ field, relativePath, exists: existsSync(absolutePath) }).toEqual(
        { field, relativePath, exists: true }
      );
    }
  });

  it("`files` array includes the directory the dist entries live in", () => {
    // `files` is what actually gets shipped on npm publish. If someone
    // narrows it (`files: ["dist/cjs"]`) the types and ESM build silently
    // disappear from the tarball even though local builds keep working.
    const pkg = readPackageJson() as PackageJson & { files?: string[] };
    expect(Array.isArray(pkg.files)).toBe(true);
    const distRoot = (pkg.types as string).split("/")[0]; // "dist"
    expect(pkg.files).toContain(distRoot);
  });
});
