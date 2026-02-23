"use client";

import { GripVerticalIcon } from "lucide-react";
import { InputGroup, InputGroupButton } from "@/components/ui/input-group";

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onDragStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
  isLoading: boolean;
};

export default function FloatingInput({
  prompt,
  onPromptChange,
  onSubmit,
  onDragStart,
  isLoading,
}: Props) {
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
          className="border-input h-12 min-w-0 flex-1 border bg-transparent px-3 text-sm outline-none"
          placeholder="Build what you think should exist"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
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