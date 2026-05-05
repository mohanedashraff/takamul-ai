import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/**/__tests__/**/*.{test,spec}.ts",
      "src/**/*.{test,spec}.ts",
    ],
    coverage: {
      reporter: ["text", "html"],
      include:  ["src/lib/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
