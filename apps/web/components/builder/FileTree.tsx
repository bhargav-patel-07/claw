"use client";

import { FileIcon, FolderIcon } from "lucide-react";
import type { FileTreeNode } from "../../types/builder";

type Props = {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  level?: number;
};

export default function FileTree({
  nodes,
  selectedPath,
  onSelect,
  level = 0,
}: Props) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <div key={node.path}>
          <button
            type="button"
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${
              selectedPath === node.path
                ? "bg-muted"
                : "hover:bg-muted/60"
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

          {node.isDirectory && node.children.length > 0 && (
            <FileTree
              nodes={node.children}
              selectedPath={selectedPath}
              onSelect={onSelect}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}