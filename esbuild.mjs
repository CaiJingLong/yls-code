import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: {
    extension: "src/extension.ts",
    "test/suite/index": "src/test/suite/index.ts",
    "test/suite/extension.test": "src/test/suite/extension.test.ts"
  },
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  outdir: "dist",
  sourcemap: true,
  external: ["vscode"],
  logLevel: "info"
});

if (watch) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
