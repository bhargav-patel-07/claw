import { createChatCompletionStream } from "@/lib/openai";
import { getSystemPrompt } from "../../../prompt/prompts";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await createChatCompletionStream({
    messages: [
      {
        role: "system",
        content: getSystemPrompt(),
      },
      ...messages,
    ],
  });

  // 🔥 DO NOT use NextResponse.json
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}