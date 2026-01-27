import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "./src"),
      "@domain": path.resolve(__dirname, "./src/domain"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@repositories": path.resolve(__dirname, "./src/repositories"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@handlers": path.resolve(__dirname, "./src/handlers"),
    },
  },
  test: {
    include: ["**/__tests__/**/*.test.ts"],
  },
});
