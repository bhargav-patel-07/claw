export type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionOptions = {
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
};

export async function createChatCompletionStream({
  messages,
  temperature = 0.2,
  maxTokens = 8000,
}: ChatCompletionOptions) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        Referer: "http://localhost:3000",
        "X-Title": "AI Builder",
      },
      body: JSON.stringify({
        model: "arcee-ai/trinity-large-preview:free",
        stream: true,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    }
  );

  if (!response.ok || !response.body) {
    throw new Error("Streaming request failed");
  }

  return response.body; // 🔥 return raw stream
}