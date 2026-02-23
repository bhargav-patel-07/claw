import type { FileSystemTree } from "@webcontainer/api";

export type Position = {
  x: number;
  y: number;
};

export type LeftTab = "files" | "chat";
export type RightTab = "code" | "preview";

export type GeneratedFile = {
  path: string;
  content: string;
};

export type FileTreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileTreeNode[];
};

export type FileNode = {
  file: { contents: string };
};

export type DirectoryNode = {
  directory: FileSystemTree;
};

export type FileSystemEntry = FileNode | DirectoryNode;

export enum StepType {
  CreateFile,
  CreateFolder,
  EditFile,
  DeleteFile,
  RunScript
}

export type Step = {
  id: number;
  type: StepType;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  code?: string;
  path?: string;
};
