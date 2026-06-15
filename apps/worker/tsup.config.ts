import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/recordingWorker.ts"],
  format: ["cjs"],
  clean: true,
  noExternal: ["@qacc/shared", "@qacc/ai"],
})
