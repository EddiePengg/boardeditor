// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  root: "./", // 项目根目录
  base: "/", // 公共基础路径
  server: {
    port: 3000,
  },
});
