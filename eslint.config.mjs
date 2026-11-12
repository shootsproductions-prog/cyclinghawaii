import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored pose-detection runtime for /fit (see scripts/sync-pose-assets.mjs).
    "public/pose/**",
    // macOS AppleDouble junk files that are tracked in this repo. They
    // are binary, so every one of them fails to parse.
    "**/._*",
  ]),
]);

export default eslintConfig;
