import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        // Node.js globals
        global: "readonly",
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        // Web APIs
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        AbortController: "readonly",
        // Web Bluetooth API
        BluetoothDevice: "readonly",
        BluetoothRemoteGATTServer: "readonly",
        BluetoothRemoteGATTService: "readonly",
        BluetoothRemoteGATTCharacteristic: "readonly",
        BluetoothAdvertisingEvent: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Disable some overly strict rules for this project
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-wrapper-object-types": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-misused-new": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "no-prototype-builtins": "warn",
      "no-extra-boolean-cast": "warn",
      "no-async-promise-executor": "warn",
      "no-useless-catch": "warn"
    }
  },
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        // Jest globals
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        // Node.js globals
        global: "readonly",
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        // Browser globals for tests
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        // Web APIs
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        AbortController: "readonly",
        // Web Bluetooth API
        BluetoothDevice: "readonly",
        BluetoothRemoteGATTServer: "readonly",
        BluetoothRemoteGATTService: "readonly",
        BluetoothRemoteGATTCharacteristic: "readonly",
        BluetoothAdvertisingEvent: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // More relaxed rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-undef": "off" // Jest globals are handled by globals config
    }
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "**/*.js",
      "**/*.mjs",
      "examples/**/*.js",
      "website/**",
      "neurosity-react-starter/**"
    ]
  }
];
