/**
 * Calls OpenAI directly from the device using the user's API key (BYOK).
 * Billing goes to their OpenAI account, not your backend.
 */
import type { ChatMessage } from './api';

const DEFAULT_MODEL =
  process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';

export async function fetchCoachWithUserKey(
  apiKey: string,
  systemPrompt: string,
  history: ChatMessage[],
  userText: string
): Promise<{ reply: string }> {
  const m = DEFAULT_MODEL;
  const body = {
    model: m,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((x) => ({
        role: x.role as 'user' | 'assistant',
        content: x.content,
      })),
      { role: 'user' as const, content: userText },
    ],
    max_tokens: 900,
    temperature: 0.65,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const msg = json.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const reply = json.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('Empty reply from OpenAI');
  }

  return { reply };
}
