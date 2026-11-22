import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // All-page sweeps run 4-5 s idle; the 5 s default failed a different one on each loaded gate run.
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ["src/**/*.test.ts", "src/**/*.spec.ts", "tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
