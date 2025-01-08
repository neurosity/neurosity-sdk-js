import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ],
      "@typescript-eslint/ban-types": [
        "error",
        {
          types: {
            Function: {
              message: "Use specific function type like () => void instead"
            },
            Object: {
              message: "Use object or Record<string, unknown> instead"
            },
            "{}": {
              message: "Use object or Record<string, unknown> instead"
            }
          },
          extendDefaults: true
        }
      ]
    },
    files: ["src/**/*.ts"],
    ignores: ["dist/**/*", "node_modules/**/*"]
  }
];
