const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

async function callEndpoint({ url, apiKey, model, messages, params, extraHeaders = {} }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({ model, messages, ...params }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`(${res.status}) ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const msg = json?.choices?.[0]?.message ?? {};
  let text = msg.content ?? msg.reasoning ?? '';
  if (Array.isArray(text)) text = text.map(p => (typeof p === 'string' ? p : p?.text || '')).join('');
  return text.toString();
}

/**
 * Call AI with automatic multi-provider fallback.
 * Tries OpenRouter → Groq → Gemini in order, skips providers with no API key.
 */
export async function callAI(messages, {
  openrouterModels = [],
  groqModels = [],
  geminiModels = [],
  temperature = 0.2,
  max_tokens,
  response_format,
} = {}) {
  const params = {
    temperature,
    ...(max_tokens && { max_tokens }),
    ...(response_format && { response_format }),
  };

  const errors = [];

  if (process.env.OPENROUTER_API_KEY) {
    for (const model of openrouterModels) {
      try {
        return await callEndpoint({
          url: OPENROUTER_URL,
          apiKey: process.env.OPENROUTER_API_KEY,
          model, messages, params,
          extraHeaders: {
            'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
            'X-Title': 'CVATS',
          },
        });
      } catch (err) {
        console.warn(`[OpenRouter] ${model}:`, err.message);
        errors.push(`OR:${model}: ${err.message}`);
      }
    }
  }

  if (process.env.GROQ_API_KEY) {
    for (const model of groqModels) {
      try {
        return await callEndpoint({ url: GROQ_URL, apiKey: process.env.GROQ_API_KEY, model, messages, params });
      } catch (err) {
        console.warn(`[Groq] ${model}:`, err.message);
        errors.push(`Groq:${model}: ${err.message}`);
      }
    }
  }

  if (process.env.GEMINI_API_KEY) {
    for (const model of geminiModels) {
      try {
        return await callEndpoint({ url: GEMINI_URL, apiKey: process.env.GEMINI_API_KEY, model, messages, params });
      } catch (err) {
        console.warn(`[Gemini] ${model}:`, err.message);
        errors.push(`Gemini:${model}: ${err.message}`);
      }
    }
  }

  throw new Error(`All AI providers failed. ${errors.slice(-3).join(' | ')}`);
}

export function extractJson(text) {
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object found in AI response');
  return JSON.parse(text.slice(first, last + 1));
}
