import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    include: ["src/test/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    testTimeout: 30000,
  },
});
