import { config } from 'dotenv';
config(); // load .env

// If you target Node < 18, uncomment the next line
// import fetch from 'node-fetch';

export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionOptions = {
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
};

export async function createChatCompletion({
  messages,
  temperature = 0.2,
  maxTokens = 8000,
}: ChatCompletionOptions) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      Referer: 'http://localhost:3000',
      'X-Title': 'AI Builder',
    },
    body: JSON.stringify({
      model: 'arcee-ai/trinity-large-preview:free',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message ?? JSON.stringify(data);
    throw new Error(errMsg);
  }

  return data.choices?.[0]?.message?.content ?? '';
}