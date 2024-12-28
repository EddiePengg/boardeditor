import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/index.ts"], // 入口文件
    outfile: "bundle/index.js", // 输出文件路径
    bundle: true, // 打包所有依赖
    minify: true, // 压缩代码
    format: "esm", // 输出为 ESM 格式
    target: "esnext", // 目标环境
    sourcemap: true, // 生成 Source Map
    external: ["react", "react-dom"], // 不打包 React 等外部依赖
  })
  .catch(() => process.exit(1));
