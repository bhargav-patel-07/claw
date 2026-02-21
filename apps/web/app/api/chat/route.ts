import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/openai";
import { getSystemPrompt } from "../../../prompt/prompts";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: getSystemPrompt(),
      },
      ...messages,
    ],
  });

  return NextResponse.json({
    response: response,
  });
}