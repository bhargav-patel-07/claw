import { createChatCompletion } from "@/lib/openai";
import { BASE_PROMPT, getSystemPrompt } from "@/prompt/prompts";
import { basePrompt as reactBasePrompt } from "@/prompt/defaults/react";
import { basePrompt as nodeBasePrompt } from "@/prompt/defaults/node";

function normalizeTemplateType(value: string): "react" | "node" {
  if (value.includes("node")) return "node";
  return "react";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    // -----------------------------
    // STEP 1: CLASSIFY TEMPLATE
    // -----------------------------
    const classification = await createChatCompletion({
      messages: [
        {
          role: "system",
          content:
            "Return either 'node' or 'react'. Only return one word with no explanation.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      maxTokens: 500,
    });

    console.log("Classification response:", classification);

    const classificationText =
      classification?.choices?.[0]?.message?.content ||
      (classification as any)?.choices?.[0]?.text ||
      "";

    // fallback if model response is weird
    const answer = normalizeTemplateType(
      classificationText.trim().toLowerCase()
    );

    // -----------------------------
    // STEP 2: GENERATE TEMPLATE
    // -----------------------------
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
      maxTokens: 10000,
    });

    console.log("Generation response:", generation);

    if (!generation?.choices?.length) {
      throw new Error("AI returned no output");
    }

    const output =
      generation?.choices?.[0]?.message?.content ||
      (generation as any)?.choices?.[0]?.text ||
      "";

    if (!output) {
      throw new Error("AI response was empty");
    }

    return new Response(
      JSON.stringify({
        output,
        template: answer,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Template API Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}