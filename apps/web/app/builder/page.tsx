"use client";

import Editor from "@monaco-editor/react";
import { FileIcon, FolderIcon, GripVerticalIcon } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { InputGroup, InputGroupButton } from "@/components/ui/input-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Position = {
  x: number;
  y: number;
};

type LeftTab = "files" | "chat";
type RightTab = "code" | "preview";

type GeneratedFile = {
  path: string;
  content: string;
};

type FileTreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileTreeNode[];
};

const INPUT_WIDTH = 720;
const DEFAULT_CODE = `// Start building\nexport default function App() {\n  return <h1>Hello Bhargav</h1>;\n}`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractBoltArtifactXml(value: string): string {
  const match = value.match(/<boltArtifact[\s\S]*?<\/boltArtifact>/i);
  return match ? match[0] : value;
}

function parseFilesFromArtifact(value: string): GeneratedFile[] {
  const xml = extractBoltArtifactXml(value);

  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const parserError = doc.getElementsByTagName("parsererror")[0];

    if (!parserError) {
      const actions = Array.from(doc.getElementsByTagName("boltAction"));
      const byPath = new Map<string, string>();

      for (const action of actions) {
        if (action.getAttribute("type") !== "file") {
          continue;
        }

        const filePath = action.getAttribute("filePath")?.trim();
        if (!filePath) {
          continue;
        }

        byPath.set(filePath.replace(/\\/g, "/"), action.textContent ?? "");
      }

      return Array.from(byPath.entries())
        .map(([path, content]) => ({ path, content }))
        .sort((a, b) => a.path.localeCompare(b.path));
    }
  }

  const regex =
    /<boltAction\b[^>]*type=("|')file\1[^>]*filePath=("|')([^"']+)\2[^>]*>([\s\S]*?)<\/boltAction>/gi;
  const byPath = new Map<string, string>();

  let match = regex.exec(xml);
  while (match) {
    const filePath = match[3]?.trim();
    const rawContent = match[4] ?? "";

    if (filePath) {
      byPath.set(filePath.replace(/\\/g, "/"), decodeXmlEntities(rawContent));
    }

    match = regex.exec(xml);
  }

  return Array.from(byPath.entries())
    .map(([path, content]) => ({ path, content }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function buildFileTree(files: GeneratedFile[]): FileTreeNode[] {
  const root: FileTreeNode = {
    name: "",
    path: "",
    isDirectory: true,
    children: [],
  };

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const nextPath = current.path ? `${current.path}/${part}` : part;
      const isDirectory = index < parts.length - 1;

      let child = current.children.find(
        (node) => node.name === part && node.isDirectory === isDirectory,
      );

      if (!child) {
        child = {
          name: part,
          path: nextPath,
          isDirectory,
          children: [],
        };
        current.children.push(child);
      }

      current = child;
    });
  }

  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .map((node) => ({ ...node, children: sortNodes(node.children) }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  };

  return sortNodes(root.children);
}

function getEditorLanguage(filePath: string | null): string {
  if (!filePath) {
    return "typescript";
  }

  const extension = filePath.split(".").pop()?.toLowerCase() ?? "";

  switch (extension) {
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "js":
      return "javascript";
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "html":
      return "html";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
}

function FileTree({
  nodes,
  selectedPath,
  onSelect,
  level = 0,
}: {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  level?: number;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <div key={node.path}>
          <button
            type="button"
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${
              selectedPath === node.path ? "bg-muted" : "hover:bg-muted/60"
            }`}
            style={{ paddingLeft: `${8 + level * 12}px` }}
            onClick={() => {
              if (!node.isDirectory) {
                onSelect(node.path);
              }
            }}
          >
            {node.isDirectory ? (
              <FolderIcon className="size-4 text-amber-600" />
            ) : (
              <FileIcon className="size-4 text-blue-600" />
            )}
            <span className="truncate">{node.name}</span>
          </button>

          {node.isDirectory && node.children.length > 0 ? (
            <FileTree
              nodes={node.children}
              selectedPath={selectedPath}
              onSelect={onSelect}
              level={level + 1}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function FloatingInput({
  prompt,
  onPromptChange,
  onDragStart,
  onSubmit,
  isLoading,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
  onDragStart: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <InputGroup className="w-full border-2">
      <div className="flex w-full items-center">
        <button
          type="button"
          aria-label="Drag input"
          className="inline-flex h-12 w-8 shrink-0 cursor-grab items-center justify-center border bg-muted/70 text-muted-foreground active:cursor-grabbing"
          onPointerDown={onDragStart}
        >
          <GripVerticalIcon className="size-4" />
        </button>

        <InputGroupButton
          type="button"
          size="sm"
          variant="outline"
          className="h-12 rounded-none px-3"
        >
          +
        </InputGroupButton>

        <input
          data-slot="input-group-control"
          className="border-input h-12 min-w-0 flex-1 border bg-transparent px-3 text-sm outline-none"
          placeholder="Build what you think should exist"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
        />

        <InputGroupButton
          type="button"
          size="sm"
          variant="default"
          className="h-12 rounded-none bg-green-900 px-6"
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Running" : "Enter"}
        </InputGroupButton>
      </div>
    </InputGroup>
  );
}

export default function BuilderPage() {
  const inputRef = useRef<HTMLDivElement>(null);
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

  const fileTree = useMemo(() => buildFileTree(generatedFiles), [generatedFiles]);
  const editorLanguage = useMemo(() => getEditorLanguage(selectedFilePath), [selectedFilePath]);

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
  }, [dragOffset.x, dragOffset.y, isDragging]);

  useEffect(() => {
    function onResize() {
      const rect = inputRef.current?.getBoundingClientRect();
      const panelWidth = rect?.width ?? INPUT_WIDTH;
      const panelHeight = rect?.height ?? 64;

      const maxX = Math.max(window.innerWidth - panelWidth, 0);
      const maxY = Math.max(window.innerHeight - panelHeight, 0);

      setPosition((prev) => {
        if (!prev) return prev;

        return {
          x: clamp(prev.x, 0, maxX),
          y: clamp(prev.y, 0, maxY),
        };
      });
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function onSubmitPrompt() {
    const nextPrompt = prompt.trim();

    if (!nextPrompt || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: nextPrompt }),
      });

      const rawBody = await response.text();
      let payload: { response?: unknown; error?: unknown } = {};

      try {
        payload = JSON.parse(rawBody) as { response?: unknown; error?: unknown };
      } catch {
        payload = {};
      }

      if (!response.ok) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : rawBody || "Failed to generate template";
        throw new Error(message);
      }

      const modelOutput =
        typeof payload.response === "string" ? payload.response : "";
      const files = parseFilesFromArtifact(modelOutput);

      if (files.length === 0) {
        throw new Error("No files were found in the XML response");
      }

      const firstFile = files[0];
      setGeneratedFiles(files);
      setSelectedFilePath(firstFile.path);
      setCode(firstFile.content);
      setLeftTab("files");
      setRightTab("code");
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error while generating template";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={20} minSize={12}>
          <div className="flex h-full flex-col p-3">
            <ToggleGroup
              variant="outline"
              type="single"
              value={leftTab}
              onValueChange={(value) => {
                if (value === "files" || value === "chat") {
                  setLeftTab(value);
                }
              }}
            >
              <ToggleGroupItem value="files" aria-label="Toggle files">
                Files
              </ToggleGroupItem>
              <ToggleGroupItem value="chat" aria-label="Toggle chat">
                Chat
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="mt-3 min-h-0 flex-1 overflow-auto rounded border bg-background p-2">
              {leftTab === "files" ? (
                generatedFiles.length > 0 ? (
                  <FileTree
                    nodes={fileTree}
                    selectedPath={selectedFilePath}
                    onSelect={(path) => {
                      setSelectedFilePath(path);
                      const selectedFile = generatedFiles.find((file) => file.path === path);
                      setCode(selectedFile?.content ?? "");
                      setRightTab("code");
                    }}
                  />
                ) : (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    Submit a prompt to generate files.
                  </p>
                )
              ) : (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  Chat view is reserved for follow-up interactions.
                </p>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={80} minSize={20}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={10} minSize={10}>
              <div className="flex h-full items-center justify-between gap-4 p-6">
                <ToggleGroup
                  variant="outline"
                  type="single"
                  value={rightTab}
                  onValueChange={(value) => {
                    if (value === "code" || value === "preview") {
                      setRightTab(value);
                    }
                  }}
                >
                  <ToggleGroupItem value="code" aria-label="Toggle code">
                    Code
                  </ToggleGroupItem>
                  <ToggleGroupItem value="preview" aria-label="Toggle preview">
                    Preview
                  </ToggleGroupItem>
                </ToggleGroup>

                {selectedFilePath ? (
                  <p className="max-w-[60%] truncate text-sm text-muted-foreground">
                    {selectedFilePath}
                  </p>
                ) : null}
              </div>
            </ResizablePanel>
            <ResizableHandle />

            <ResizablePanel defaultSize={95} minSize={20}>
              <div className="h-full w-full overflow-hidden bg-green-900 p-2">
                {rightTab === "code" ? (
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    theme="vs-light"
                    value={code}
                    onChange={(value) => {
                      const nextCode = value ?? "";
                      setCode(nextCode);

                      if (!selectedFilePath) {
                        return;
                      }

                      setGeneratedFiles((prev) =>
                        prev.map((file) =>
                          file.path === selectedFilePath
                            ? { ...file, content: nextCode }
                            : file,
                        ),
                      );
                    }}
                    options={{
                      fontSize: 16,
                      minimap: { enabled: false },
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded bg-white/90 text-sm text-muted-foreground">
                    Preview panel coming next.
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <div
        ref={inputRef}
        className={`absolute z-20 w-[720px] max-w-[calc(100vw-16px)] ${
          position ? "" : "bottom-4 left-1/2 -translate-x-1/2 transform"
        }`}
        style={position ? { left: position.x, top: position.y } : undefined}
      >
        <FloatingInput
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={onSubmitPrompt}
          isLoading={isLoading}
          onDragStart={(event) => {
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

        {error ? (
          <p className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
