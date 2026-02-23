"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type {
  Position,
  LeftTab,
  RightTab,
  GeneratedFile,
} from "@/types/builder";

import FileTree from "@/components/builder/FileTree";
import FloatingInput from "@/components/builder/FloatingInput";
import CodeEditor from "@/components/builder/CodeEditor";

import { buildFileTree } from "@/lib/builder/file-tree";
import { parseXml } from "../../lib/builder/file-parser";
import { runPreview } from "@/lib/builder/preview-runner";

const INPUT_WIDTH = 720;
const DEFAULT_CODE = `// Start building
export default function App() {
  return <h1>Hello Bhargav</h1>;
}`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function BuilderPage() {
  const inputRef = useRef<HTMLDivElement>(null);

  const filesRef = useRef<GeneratedFile[]>([]);

  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [position, setPosition] = useState<Position | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [leftTab, setLeftTab] = useState<LeftTab>("files");
  const [rightTab, setRightTab] = useState<RightTab>("code");

  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLogs, setPreviewLogs] = useState("");
  const [previewStatus, setPreviewStatus] = useState("Preview is idle");
  const [previewTrigger, setPreviewTrigger] = useState(0);

  const fileTree = useMemo(() => {
    const tree = buildFileTree(generatedFiles);
    console.log("File Tree:", tree);
    return tree;
  }, [generatedFiles]);

  useEffect(() => {
    filesRef.current = generatedFiles;
  }, [generatedFiles]);

  useEffect(() => {
    console.log("Generated Files State:", generatedFiles);
  }, [generatedFiles]);

  // Drag logic
  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!isDragging) return;

      const rect = inputRef.current?.getBoundingClientRect();
      const panelWidth = rect?.width ?? INPUT_WIDTH;
      const panelHeight = rect?.height ?? 64;

      const maxX = Math.max(window.innerWidth - panelWidth, 0);
      const maxY = Math.max(window.innerHeight - panelHeight, 0);

      setPosition({
        x: clamp(event.clientX - dragOffset.x, 0, maxX),
        y: clamp(event.clientY - dragOffset.y, 0, maxY),
      });
    }

    function onPointerUp() {
      setIsDragging(false);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragOffset, isDragging]);

  // Run preview when switching tab
  useEffect(() => {
    if (rightTab !== "preview") return;

    if (filesRef.current.length === 0) {
      setPreviewStatus("Generate files first to start preview");
      return;
    }

    runPreview(filesRef.current, {
      setPreviewUrl,
      setPreviewLogs,
      setPreviewStatus,
    });
  }, [rightTab, previewTrigger]);

  async function onSubmitPrompt() {
    const nextPrompt = prompt.trim();
    if (!nextPrompt || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: nextPrompt }),
      });

      const raw = await response.text();
      const payload = JSON.parse(raw);

      if (!response.ok) {
        throw new Error(payload?.error || "Template generation failed");
      }

      const modelOutput =
        typeof payload.response === "string" ? payload.response : "";

      const steps = parseXml(modelOutput);

      if (!steps.length) {
        throw new Error("No steps parsed from AI response");
      }

      const first = steps[0];

      setGeneratedFiles(
        steps.map((step) => ({
          path: step.path || "",
          content: step.code || "",
        })),
      );
      setSelectedFilePath(first.path || null);
      setCode(first.code || "");

      setLeftTab("files");
      setRightTab("code");

      setPreviewStatus("Preview ready to run");
      setPreviewUrl(null);
      setPreviewLogs("");
      setPreviewTrigger((v) => v + 1);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        {/* LEFT PANEL */}
        <ResizablePanel defaultSize={15} minSize={10}>
          <div className="flex h-full flex-col">
            <ToggleGroup
              variant="outline"
              type="single"
              value={leftTab}
              onValueChange={(value) => value && setLeftTab(value as LeftTab)}
            >
              <ToggleGroupItem value="files">Files</ToggleGroupItem>
              <ToggleGroupItem value="chat">Chat</ToggleGroupItem>
            </ToggleGroup>

            <div className="mt-3 flex-1 overflow-auto border p-3">
              {leftTab === "files" ? (
                generatedFiles.length ? (
                  <FileTree
                    nodes={fileTree}
                    selectedPath={selectedFilePath}
                    onSelect={(path) => {
                      console.log("Selected File Path:", path);
                      const file = generatedFiles.find((f) => f.path === path);
                      console.log("File Content:", file?.content);
                      setSelectedFilePath(path);
                      setCode(file?.content ?? "");
                      setRightTab("code");
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Submit a prompt to generate files.
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chat view reserved for follow-ups.
                </p>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* RIGHT PANEL */}
        <ResizablePanel defaultSize={85} minSize={20}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={8} minSize={6}>
              <div className="flex items-center justify-between p-4">
                <ToggleGroup
                  variant="outline"
                  type="single"
                  value={rightTab}
                  onValueChange={(value) =>
                    value && setRightTab(value as RightTab)
                  }
                >
                  <ToggleGroupItem value="code">Code</ToggleGroupItem>
                  <ToggleGroupItem value="preview">Preview</ToggleGroupItem>
                </ToggleGroup>

                {rightTab === "preview" && (
                  <button
                    onClick={() => setPreviewTrigger((v) => v + 1)}
                    className="rounded border px-3 py-1 text-xs"
                  >
                    Reload Preview
                  </button>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={92} minSize={20}>
              <div className="h-full w-full overflow-hidden bg-muted p-2">
                {rightTab === "code" ? (
                  <CodeEditor
                    code={code}
                    language="typescript"
                    onChange={(next) => {
                      setCode(next);

                      if (!selectedFilePath) return;

                      setGeneratedFiles((prev) =>
                        prev.map((file) =>
                          file.path === selectedFilePath
                            ? { ...file, content: next }
                            : file,
                        ),
                      );
                    }}
                  />
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl ?? ""}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                ) : (
                  <div className="flex h-full flex-col bg-white p-4">
                    <p className="text-sm text-muted-foreground">
                      {previewStatus}
                    </p>
                    <pre className="mt-3 flex-1 overflow-auto bg-black p-3 text-xs text-green-400">
                      {previewLogs || "Waiting for logs..."}
                    </pre>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* FLOATING INPUT */}
      <div
        ref={inputRef}
        className={`absolute z-20 w-[720px] ${
          position ? "" : "bottom-4 left-1/2 -translate-x-1/2"
        }`}
        style={position ? { left: position.x, top: position.y } : undefined}
      >
        <FloatingInput
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={onSubmitPrompt}
          isLoading={isLoading}
          onDragStart={(event: ReactPointerEvent<HTMLButtonElement>) => {
            const rect = inputRef.current?.getBoundingClientRect();
            if (!rect) return;

            setDragOffset({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });

            setIsDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
        />

        {error && (
          <p className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
