import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: ["dist/**", "node_modules/**", "test-results/**", "src/gen/**", "eslint.config.js"]
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
        projectService: true,
        tsconfigRootDir: __dirname
      }
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Enforce awaiting/handling all promises (e.g., gRPC calls).
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: false, ignoreIIFE: false }
      ],
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
    // Tests can keep their own style (less strict on function declarations).
    files: ["src/utils/test/**/*.{ts,tsx}", "src/tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "func-style": "off",
      "no-restricted-syntax": "off"
    }
  }
];
