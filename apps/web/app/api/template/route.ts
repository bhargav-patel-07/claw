import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/openai";
import { BASE_PROMPT, getSystemPrompt } from "@/prompt/prompts";
import { basePrompt as reactBasePrompt } from "@/prompt/defaults/react";
import { basePrompt as nodeBasePrompt } from "@/prompt/defaults/node";

function normalizeTemplateType(value: string): "react" | "node" {
  return value === "node" ? "node" : "react";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: unknown };
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const classification = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: "Return either node or react. Only return one word.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      maxTokens: 10,
    });

    const answer = normalizeTemplateType(classification.trim().toLowerCase());

    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${BASE_PROMPT}\n${getSystemPrompt()}`,
        },
        {
          role: "user",
          content: `${answer === "react" ? reactBasePrompt : nodeBasePrompt}\n\nUser request:\n${prompt}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 8000,
    });

    return NextResponse.json({ response });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
