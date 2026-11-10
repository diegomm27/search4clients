import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    // .claude/worktrees/ holds full checkouts of other branches; don't run their tests.
    exclude: [...configDefaults.exclude, ".claude/**"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname)
    }
  }
});
