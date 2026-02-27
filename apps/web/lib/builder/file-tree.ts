// lib/builder/file-tree.ts

import type { GeneratedFile, FileTreeNode } from "@/types/builder";

export function buildFileTree(files: GeneratedFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      if (!file.path || file.path.trim() === "") return;
      const isDirectory = index < parts.length - 1;

      let existing = currentLevel.find((n) => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          isDirectory,
          children: [],
        };

        currentLevel.push(existing);
      }

      if (existing.isDirectory) {
        currentLevel = existing.children;
      }
      
    });
  }

  return root;
}