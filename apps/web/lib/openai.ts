type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type CreateChatCompletionParams = {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ??
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiRole = "user" | "model";

type GeminiPart = {
  text: string;
};

type GeminiContent = {
  role: GeminiRole;
  parts: GeminiPart[];
};

export async function createChatCompletion({
  messages,
  maxTokens = 8000,
  temperature,
}: CreateChatCompletionParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const systemInstructionText = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n")
    .trim();

  const contents: GeminiContent[] = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "Continue." }],
    });
  }

  const generationConfig: {
    maxOutputTokens?: number;
    temperature?: number;
  } = {
    maxOutputTokens: maxTokens,
    ...(temperature === undefined ? {} : { temperature }),
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(systemInstructionText
        ? { systemInstruction: { parts: [{ text: systemInstructionText }] } }
        : {}),
      contents,
      generationConfig,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("") ?? "";

  return text.trim();
}

export function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message): ChatMessage | null => {
      if (!message || typeof message !== "object") {
        return null;
      }

      const rawRole =
        (message as { role?: unknown }).role === "assistant" ||
        (message as { role?: unknown }).role === "system"
          ? ((message as { role: ChatRole }).role as ChatRole)
          : "user";

      const rawContent = (message as { content?: unknown }).content;

      let content = "";
      if (typeof rawContent === "string") {
        content = rawContent;
      } else if (Array.isArray(rawContent)) {
        content = rawContent
          .map((block) => {
            if (
              block &&
              typeof block === "object" &&
              typeof (block as { text?: unknown }).text === "string"
            ) {
              return (block as { text: string }).text;
            }
            return "";
          })
          .join("\n")
          .trim();
      }

      if (!content) {
        return null;
      }

      return {
        role: rawRole,
        content,
      };
    })
    .filter((message): message is ChatMessage => Boolean(message));
}
