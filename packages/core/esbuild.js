import esbuild from "esbuild";

// 获取命令行参数，检查是否需要 watch 模式
const watch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/index.ts"],
  outfile: "bundle/index.js",
  bundle: true,
  minify: true,
  keepNames: true,
  minifyIdentifiers: false,
  format: "esm",
  target: "esnext",
  sourcemap: true,
  external: ["react", "react-dom"],
};

if (watch) {
  // watch 模式
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log("watching...");
} else {
  // 普通构建
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
