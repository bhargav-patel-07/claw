import { createChatCompletion } from "@/lib/openai";
import { getSystemPrompt } from "../../../prompt/prompts";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        ...messages,
      ],
    });

    const output = completion.choices?.[0]?.message?.content ?? "";

    return Response.json({
      output,
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return new Response(message, { status: 500 });
  }
}