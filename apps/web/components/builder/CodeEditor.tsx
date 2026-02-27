"use client";

import { useRef, useMemo } from "react";
import Editor from "@monaco-editor/react";

type Props = {
  code: string;
  fileName?: string;
  onChange: (value: string) => void;
};

export default function CodeEditor({
  code,
  fileName = "",
  onChange,
}: Props) {
  const configuredRef = useRef(false);

  // 🔎 Auto detect language based on file extension
  const language = useMemo(() => {
    if (fileName.endsWith(".json")) return "json";
    if (fileName.endsWith(".tsx")) return "typescript";
    if (fileName.endsWith(".ts")) return "typescript";
    if (fileName.endsWith(".jsx")) return "javascript";
    if (fileName.endsWith(".js")) return "javascript";
    if (fileName.endsWith(".css")) return "css";
    if (fileName.endsWith(".html")) return "html";
    return "typescript";
  }, [fileName]);

  return (
    <Editor
      height="100%"
      theme="vs-light"
      language={language}
      value={code}
      onChange={(value) => onChange(value ?? "")}
      onMount={(editor, monaco) => {
        if (!configuredRef.current) {
          configuredRef.current = true;

          // ✅ TypeScript / React config
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: 99, // ESNext
            module: 99, // ESNext
            moduleResolution: 2, // NodeJs
            jsx: 4, // ReactJSX
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            allowNonTsExtensions: true,
            skipLibCheck: true,
            noEmit: true,
            strict: false,
          });
           monaco.languages.typescript.typescriptDefaults.addExtraLib(
  `
  declare namespace JSX {
    interface IntrinsicElements {
      div: any;
      span: any;
      button: any;
      input: any;
      h1: any;
      h2: any;
      h3: any;
      p: any;
      a: any;
    }
  }

  declare module "react" {
    export = React;
    namespace React {
      interface FC<P = {}> {
        (props: P): any;
      }
      const useState: any;
      const useEffect: any;
      const useRef: any;
      const useMemo: any;
    }
  }

  declare module "react-dom/client";
  declare module "lucide-react";
  `,
  "file:///node_modules/@types/react/index.d.ts"
);
          

          // ✅ package.json schema validation
          monaco.languages.json?.jsonDefaults?.setDiagnosticsOptions({
            validate: true,
            enableSchemaRequest: true,
            schemas: [
              {
                uri: "https://json.schemastore.org/package.json",
                fileMatch: ["package.json"],
              },
            ],
          });
        }
      }}
      options={{
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
}