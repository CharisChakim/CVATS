import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const OPENROUTER_MODELS = [
  "openrouter/owl-alpha",
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];
const GEMINI_MODEL = "gemini-2.0-flash-exp";

const KIND_PROMPTS = {
  summary: `Rewrite this professional summary following this exact four-part structure:
① Role & specialization (what the person does and in what field) → ② Years of experience → ③ Core skills or key technologies → ④ A standout achievement or differentiator.

Rules:
- 2–4 sentences, ATS-friendly, confident, and specific
- Do NOT use "I", "my", or any first-person pronouns
- Do NOT start with "As a...", "Experienced...", or "Results-driven..."
- Start directly with the job title or professional identity (e.g., "Software engineer with 5 years...")
- Only use information already present in the input — do NOT invent skills, employers, years, or metrics`,

  experience: `Rewrite these job responsibilities as 3–6 concise bullet points.

Rules:
- One bullet per line, no leading dash or bullet symbol (the app inserts them automatically)
- Each bullet MUST begin with a strong past-tense action verb (e.g., Built, Led, Designed, Reduced, Improved, Automated, Delivered)
- Structure: action verb → what was done / context or scale → outcome or impact
- Quantify results only when the input already contains numbers — do NOT invent metrics
- Keep each bullet under 20 words
- Do NOT invent employers, tools, dates, or achievements not already in the input`,

  project: `Rewrite this project description as 2–4 concise bullet points.

Rules:
- One bullet per line, no leading dash or bullet symbol (the app inserts them automatically)
- Each bullet MUST begin with a strong action verb (e.g., Built, Developed, Designed, Integrated, Deployed, Implemented)
- First bullet: what was built and which core technologies were used
- Remaining bullets: key features, notable technical decisions, or measurable impact
- Keep each bullet under 20 words
- Do NOT invent technologies, metrics, or scope not already present in the input`,
};

export async function POST(req) {
  try {
    const body = await req.json();
    const text = (body?.text || "").toString().trim();
    const kind = body?.kind;

    if (!text) {
      return NextResponse.json({ error: "Nothing to refine — write something first." }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: "Text too long to refine." }, { status: 413 });
    }
    if (!KIND_PROMPTS[kind]) {
      return NextResponse.json({ error: "Unknown refine kind." }, { status: 400 });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const models = process.env.OPENROUTER_MODEL
      ? [process.env.OPENROUTER_MODEL, ...OPENROUTER_MODELS]
      : OPENROUTER_MODELS;

    const systemPrompt =
      "You are a resume editor. Refine the user's text per the instructions. Return ONLY the refined text — no preamble, no markdown headers, no quotes, no commentary.";
    const userPrompt = `${KIND_PROMPTS[kind]}\n\nInput:\n${text}`;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const callOptions = { temperature: 0.4, max_tokens: 4000 };

    let refined;
    let lastErr;

    for (const model of models) {
      try {
        refined = await callOpenRouter(model, messages, callOptions);
        break;
      } catch (err) {
        console.warn(`Refine model ${model} failed:`, err.message);
        lastErr = err;
      }
    }

    if (!refined && process.env.GEMINI_API_KEY) {
      try {
        refined = await callGemini(GEMINI_MODEL, messages, callOptions);
      } catch (err) {
        console.warn("Gemini refine fallback failed:", err.message);
        lastErr = err;
      }
    }

    if (!refined) {
      console.error("All refine models failed:", lastErr?.message);
      return NextResponse.json({ error: "Empty response from model." }, { status: 502 });
    }

    return NextResponse.json({ refined });
  } catch (error) {
    console.error("Error refining text:", error);
    return NextResponse.json({ error: error.message || "Failed to refine" }, { status: 500 });
  }
}

async function callOpenRouter(model, messages, { temperature, max_tokens }) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
      "X-Title": "CVATS",
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`Refine OpenRouter ${model} error:`, res.status, errBody.slice(0, 300));
    throw new Error(`Model request failed (${res.status})`);
  }

  return parseRefinedText(await res.json());
}

async function callGemini(model, messages, { temperature, max_tokens }) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`Refine Gemini error:`, res.status, errBody.slice(0, 300));
    throw new Error(`Gemini request failed (${res.status})`);
  }

  return parseRefinedText(await res.json());
}

function parseRefinedText(orJson) {
  const msg = orJson?.choices?.[0]?.message ?? {};
  let refined = (msg.content ?? msg.reasoning ?? "").toString().trim();

  refined = refined.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "");
  refined = refined.replace(/^["'`]+|["'`]+$/g, "").trim();
  refined = refined
    .split("\n")
    .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trimEnd())
    .filter(line => line.length > 0)
    .join("\n");

  if (!refined) throw new Error("Empty response from model");
  return refined;
}
