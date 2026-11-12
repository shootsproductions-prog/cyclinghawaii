import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover the pure logic in src/lib (fit geometry, ride file
// parsers, training analysis). Run with `npm test`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
