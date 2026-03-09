export type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionOptions = {
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
};

type OpenRouterChoice = {
  message: {
    role: string;
    content: string;
  };
};

type OpenRouterResponse = {
  choices: OpenRouterChoice[];
};

export async function createChatCompletion({
  messages,
  temperature = 0.2,
  maxTokens = 8000,
}: ChatCompletionOptions): Promise<OpenRouterResponse> {
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
        Referer: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Builder",
      },
      body: JSON.stringify({
        model: "stepfun/step-3.5-flash:free",
        stream: false,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data: OpenRouterResponse = await response.json();

  return data;
}