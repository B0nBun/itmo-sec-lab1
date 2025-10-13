import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import security from "eslint-plugin-security"

export default defineConfig([
  {
    files: ["src/**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node }
  },
  security.configs.recommended,
]);
