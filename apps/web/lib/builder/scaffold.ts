// lib/builder/scaffold.ts

import type { GeneratedFile } from "@/types/builder";
import type { FileSystemTree } from "@webcontainer/api";

export function buildFileSystemTree(
  files: GeneratedFile[]
): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const file of files) {
    const parts = file.path.split("/");
    let current: FileSystemTree = tree;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = {
          file: { contents: file.content },
        };
      } else {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = (current[part] as { directory: FileSystemTree }).directory;
      }
    });
  }

  return tree;
}