import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";

const isProduction = process.env.NODE_ENV === "production";

// Common external dependencies
const external = [
  // Node.js built-ins
  "crypto",
  "events",
  "fs",
  "http",
  "https",
  "os",
  "path",
  "stream",
  "url",
  "util",
  // Mark peer dependencies as external
  "ws" // WebSocket library commonly used
];

// Common plugins for JS builds
const commonPlugins = [
  resolve({
    browser: true,
    preferBuiltins: false // Important for browser/RN compatibility
  }),
  commonjs(),
  typescript({
    tsconfig: "./tsconfig.json",
    declaration: false, // We'll generate types separately
    declarationMap: false
  })
];

export default [
  // CommonJS build (Node.js, Electron main process)
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
      exports: "named",
      sourcemap: true
    },
    external,
    plugins: [...commonPlugins, isProduction && terser()].filter(Boolean)
  },

  // ESM build (modern bundlers, Node ESM, React Native, Next.js)
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.mjs",
      format: "es",
      sourcemap: true
    },
    external,
    plugins: [...commonPlugins, isProduction && terser()].filter(Boolean)
  },

  // UMD build (browser, universal)
  {
    input: "src/index.ts",
    output: {
      file: "dist/neurosity.umd.js",
      format: "umd",
      name: "Neurosity",
      sourcemap: true,
      globals: {
        // Map external imports to global variables if needed
        ws: "WebSocket"
      }
    },
    external: external.filter(
      (dep) =>
        // Only keep external deps that have global equivalents
        ![
          "crypto",
          "events",
          "fs",
          "http",
          "https",
          "os",
          "path",
          "stream",
          "url",
          "util"
        ].includes(dep)
    ),
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationMap: false
      }),
      isProduction && terser()
    ].filter(Boolean)
  },

  // IIFE build (browser script tag)
  {
    input: "src/index.ts",
    output: {
      file: "dist/neurosity.iife.js",
      format: "iife",
      name: "Neurosity",
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationMap: false
      }),
      isProduction && terser()
    ].filter(Boolean)
  },

  // TypeScript declarations
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es"
    },
    plugins: [dts()]
  }
];
