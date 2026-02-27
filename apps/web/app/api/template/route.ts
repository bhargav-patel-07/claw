import { createChatCompletionStream } from "@/lib/openai";
import { BASE_PROMPT, getSystemPrompt } from "@/prompt/prompts";
import { basePrompt as reactBasePrompt } from "@/prompt/defaults/react";
import { basePrompt as nodeBasePrompt } from "@/prompt/defaults/node";

function normalizeTemplateType(value: string): "react" | "node" {
  return value === "node" ? "node" : "react";
}

async function streamToString(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      if (line.includes("[DONE]")) break;

      const json = JSON.parse(line.replace("data: ", ""));
      const token = json.choices?.[0]?.delta?.content;

      if (token) {
        fullText += token;
      }
    }
  }

  return fullText;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    // 1️⃣ Stream classification
    const classificationStream = await createChatCompletionStream({
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

    const classificationText = await streamToString(classificationStream);
    const answer = normalizeTemplateType(
      classificationText.trim().toLowerCase()
    );

    // 2️⃣ Stream actual generation
    const generationStream = await createChatCompletionStream({
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

    // 🔥 Return raw stream to client
    return new Response(generationStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return new Response(message, { status: 500 });
  }
}