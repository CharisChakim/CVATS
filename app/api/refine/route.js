import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

const KIND_PROMPTS = {
  summary:
    "Rewrite the candidate's professional summary so it is concise (3-4 sentences), confident, ATS-friendly, and uses strong action wording. Keep it factual — do not invent skills, employers, dates, or numbers that are not present in the input.",
  experience:
    "Rewrite the candidate's job responsibility bullets. Output 3-6 bullet points, one per line, no leading dash or number. Each bullet must start with a strong action verb, focus on impact and quantifiable outcomes when present, and stay ATS-friendly. Do not invent metrics, employers, or dates that are not in the input.",
  project:
    "Rewrite the project description as 2-5 bullet points, one per line, no leading dash or number. Each bullet must lead with an action verb and highlight what was built, technologies used, and measurable impact when present. Do not invent technologies, dates, or metrics that are not in the input.",
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

    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const systemPrompt =
      "You are a resume editor. Refine the user's text per the instructions. Return ONLY the refined text — no preamble, no markdown headers, no quotes, no commentary.";
    const userPrompt = `${KIND_PROMPTS[kind]}\n\nInput:\n${text}`;

    const orRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
        "X-Title": "Resumave",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!orRes.ok) {
      const errBody = await orRes.text();
      console.error("OpenRouter refine error:", orRes.status, errBody.slice(0, 500));
      return NextResponse.json(
        { error: `Model request failed (${orRes.status}).` },
        { status: 502 },
      );
    }

    const orJson = await orRes.json();
    const msg = orJson?.choices?.[0]?.message ?? {};
    let refined = (msg.content ?? msg.reasoning ?? "").toString().trim();

    // Strip surrounding quotes / code fences the model sometimes adds.
    refined = refined.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "");
    refined = refined.replace(/^["'`]+|["'`]+$/g, "").trim();
    // Strip leading bullet markers from each line so we hand back clean text.
    refined = refined
      .split("\n")
      .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trimEnd())
      .filter(line => line.length > 0)
      .join("\n");

    if (!refined) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 502 });
    }

    return NextResponse.json({ refined });
  } catch (error) {
    console.error("Error refining text:", error);
    return NextResponse.json({ error: error.message || "Failed to refine" }, { status: 500 });
  }
}
