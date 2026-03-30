import esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const includeTests = process.argv.includes("--tests");

const entryPoints = {
  extension: "src/extension.ts"
};

if (includeTests) {
  Object.assign(entryPoints, {
    "test/suite/index": "src/test/suite/index.ts",
    "test/suite/extension.test": "src/test/suite/extension.test.ts"
  });
}

const ctx = await esbuild.context({
  entryPoints,
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
