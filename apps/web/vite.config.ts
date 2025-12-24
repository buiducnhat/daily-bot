import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        filter: ({ path }) =>
          !(path.startsWith("/dashboard") || path.startsWith("/auth")),
        crawlLinks: true,
      },
    }),
    viteReact(),
    devtools(),
  ],
  envDir: "../../",
  build: {
    rollupOptions: {
      external: ["zlib-sync"],
    },
  },
});
