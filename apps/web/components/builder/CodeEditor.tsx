"use client";

import Editor from "@monaco-editor/react";

type Props = {
  code: string;
  language?: string;
  onChange: (value: string) => void;
};

export default function CodeEditor({
  code,
  language = "typescript",
  onChange,
}: Props) {
  return (
    <Editor
      height="100%"
      theme="vs-light"
      language={language}
      value={code}
      onChange={(value) => onChange(value ?? "")}
    />
  );
}