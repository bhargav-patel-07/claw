"use client";

import type { GeneratedFile } from "@/types/builder";
import type { WebContainerProcess } from "@webcontainer/api";

import { getWebContainer } from "./webcontainer";
import { buildFileSystemTree } from "./scaffold";

let serverProcess: WebContainerProcess | null = null;
let hasInstalled = false;

type PreviewHandlers = {
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setPreviewLogs: React.Dispatch<React.SetStateAction<string>>;
  setPreviewStatus: React.Dispatch<React.SetStateAction<string>>;
};

export async function runPreview(
  files: GeneratedFile[],
  handlers: PreviewHandlers,
) {
  const { setPreviewUrl, setPreviewLogs, setPreviewStatus } = handlers;

  if (!files.length) {
    setPreviewStatus("No files to preview");
    return;
  }
  

  // Inject required files if missing
  if (!files.some((f) => f.path === "package.json")) {
    files.push({
      path: "package.json",
      content: JSON.stringify(
        {
          name: "web-preview",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: {
            dev: "vite",
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "lucide-react": "^0.395.0",
          },
          devDependencies: {
            vite: "^5.2.0",
            "@vitejs/plugin-react": "^4.2.0",
            tailwindcss: "^3.4.0",
            postcss: "^8.4.35",
            autoprefixer: "^10.4.17",
          },
        },
        null,
        2
      ),
    });
  }

  if (!files.some((f) => f.path === "tailwind.config.js")) {
    files.push({
      path: "tailwind.config.js",
      content: `
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
`,
    });
  }

  if (!files.some((f) => f.path === "postcss.config.js")) {
    files.push({
      path: "postcss.config.js",
      content: `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,
    });
  }

  if (!files.some((f) => f.path === "src/index.css")) {
    files.push({
      path: "src/index.css",
      content: `
@tailwind base;
@tailwind components;
@tailwind utilities;
`,
    });
  }

  if (!files.some((f) => f.path === "vite.config.ts")) {
    files.push({
      path: "vite.config.ts",
      content: `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    cors: true,
  },
})
`,
    });
  }

  if (!files.some((f) => f.path === "index.html")) {
    files.push({
      path: "index.html",
      content: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    });
  }

  if (!files.some((f) => f.path === "src/main.tsx")) {
    files.push({
      path: "src/main.tsx",
      content: `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`,
    });
  }

  try {
    setPreviewStatus("Booting container...");
    setPreviewLogs("");
    setPreviewUrl(null);

    const webcontainer = await getWebContainer();

    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }

    const tree = buildFileSystemTree(files);

    await webcontainer.mount(tree);

    const rootFiles = await webcontainer.fs.readdir("/");

    if (!rootFiles.includes("package.json")) {
      throw new Error("package.json not mounted correctly");
    }

    if (!hasInstalled) {
      setPreviewStatus("Installing dependencies...");

      const installProcess = await webcontainer.spawn("npm", [
        "install",
        "--legacy-peer-deps",
      ]);

      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            setPreviewLogs((prev) => prev + data);
          },
        }),
      );

      const exitCode = await installProcess.exit;

      if (exitCode !== 0) {
        throw new Error("npm install failed");
      }

      hasInstalled = true;
    }

    setPreviewStatus("Starting dev server...");

    serverProcess = await webcontainer.spawn("npm", ["run", "dev"]);

    serverProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          setPreviewLogs((prev) => prev + data);
        },
      }),
    );

    webcontainer.on("server-ready", (_port, url) => {
      setPreviewStatus("Preview running");
      setPreviewUrl(url);
    });
  } catch (error: unknown) {
    setPreviewStatus("Preview failed");
    setPreviewLogs((prev) => prev + "\n" + (error as Error).message);
  }
}
