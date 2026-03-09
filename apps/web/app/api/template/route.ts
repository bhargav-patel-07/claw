import { createChatCompletion } from "@/lib/openai";
import { BASE_PROMPT, getSystemPrompt } from "@/prompt/prompts";
import { basePrompt as reactBasePrompt } from "@/prompt/defaults/react";
import { basePrompt as nodeBasePrompt } from "@/prompt/defaults/node";

function normalizeTemplateType(value: string): "react" | "node" {
  return value === "node" ? "node" : "react";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    // 1️⃣ CLASSIFY PROJECT TYPE
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

    const classificationText =
  classification?.choices?.[0]?.message?.content;

if (!classificationText) {
  throw new Error("Classification failed: no response from AI");
}

const answer = normalizeTemplateType(
  classificationText.trim().toLowerCase()
);

    // 2️⃣ GENERATE FILES
    const generation = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: `${BASE_PROMPT}\n${getSystemPrompt()}`,
        },
        {
          role: "user",
          content: `${
            answer === "react" ? reactBasePrompt : nodeBasePrompt
          }\n\nUser request:\n${prompt}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 8000,
    });

    const output = generation.choices?.[0]?.message?.content ?? "";

    return Response.json({
      output,
      template: answer,
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return new Response(message, { status: 500 });
  }
}