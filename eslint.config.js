import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "test-results/**",
      "allure-results/**",
      "allure-report/**",
      "src/gen/**",
      "eslint.config.js",
      "playwright.config.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname
      }
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Enforce awaiting/handling all promises (e.g., gRPC calls).
      "@typescript-eslint/no-floating-promises": ["error", { ignoreVoid: true, ignoreIIFE: false }],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/return-await": ["error", "always"],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { arguments: false, attributes: false } }
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" }
      ],
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-explicit-any": "error",

      // Prefer arrow functions; avoid `function` keyword in most code.
      "func-style": ["error", "expression"],
      "prefer-arrow-callback": ["error", { allowNamedFunctions: false, allowUnboundThis: true }],
      "no-restricted-syntax": [
        "error",
        { selector: "FunctionDeclaration", message: "Use `const foo = () => {}` instead." }
      ]
    }
  },
  {
    // Tests and test-server: allow more conditional flexibility.
    files: ["test-server/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off"
    }
  }
];
