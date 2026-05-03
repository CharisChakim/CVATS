import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Override via OPENROUTER_MODEL env var if a different Nemotron variant is wanted.
const DEFAULT_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not set");
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    const systemPrompt =
      "You extract structured data from resumes. Return ONLY a single JSON object that matches the requested schema. No prose, no markdown, no code fences.";

    const userPrompt = `
Extract the following information from the resume text and format it as a valid JSON object.
The JSON object MUST match this structure exactly:
{
  "contact": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "designation": "",
    "website": "",
    "linkedin": ""
  },
  "summary": { "content": "" },
  "education": [
    { "institution": "", "degree": "", "startDate": "", "endDate": "", "location": "" }
  ],
  "experience": [
    { "company": "", "role": "", "startDate": "", "endDate": "", "location": "", "content": "" }
  ],
  "projects": [
    { "name": "", "role": "", "startDate": "", "endDate": "", "link": "", "content": "" }
  ],
  "skills": { "content": "" },
  "certificates": [ { "name": "", "issuer": "", "date": "" } ],
  "languages": [ { "name": "", "level": "" } ]
}

Rules:
- If a field is not found, use "" for strings or [] for arrays.
- For experience and projects, "content" should be one bullet point per line, separated by '\\n'.
- Return ONLY the JSON object — no markdown, no commentary.

Resume Text:
${text}
`;

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
        temperature: 0.1,
        // Reasoning models (e.g. Nemotron Nano Omni reasoning) need headroom
        // for hidden reasoning tokens before producing the final JSON.
        max_tokens: 8000,
        response_format: { type: "json_object" },
      }),
    });

    if (!orRes.ok) {
      const errBody = await orRes.text();
      console.error("OpenRouter error:", orRes.status, errBody.slice(0, 500));
      return NextResponse.json(
        { error: `Model request failed (${orRes.status}). ${safeErrorMessage(errBody)}` },
        { status: 502 },
      );
    }

    const orJson = await orRes.json();
    const msg = orJson?.choices?.[0]?.message ?? {};
    // Reasoning models can return null content if the budget was consumed by
    // hidden reasoning; fall back to the reasoning trace as a last resort.
    let resultText = msg.content ?? msg.reasoning ?? "";

    if (typeof resultText !== "string") {
      resultText = Array.isArray(resultText)
        ? resultText.map(p => (typeof p === "string" ? p : p?.text || "")).join("")
        : "";
    }

    resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBrace = resultText.indexOf("{");
    const lastBrace = resultText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      resultText = resultText.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch (e) {
      console.error("Model returned non-JSON:", resultText.slice(0, 500));
      return NextResponse.json(
        { error: "Could not parse the resume. Please try again or fill it in manually." },
        { status: 502 },
      );
    }

    return NextResponse.json(mapToAppSchema(parsed));
  } catch (error) {
    console.error("Error parsing resume:", error);
    return NextResponse.json({ error: error.message || "Failed to parse resume" }, { status: 500 });
  }
}

function safeErrorMessage(body) {
  try {
    const j = JSON.parse(body);
    return j?.error?.message || j?.message || "";
  } catch {
    return "";
  }
}

// Map parsed model schema → app schema (resumeSlice / ResumeFields).
function mapToAppSchema(p) {
  const c = p.contact || {};
  const contact = {
    name: c.name || "",
    title: c.designation || "",
    email: c.email || "",
    phone: c.phone || "",
    address: c.location || "",
    linkedin: c.linkedin || "",
    github: "",
    blogs: "",
    twitter: "",
    portfolio: c.website || "",
  };

  const summary = { summary: p.summary?.content || "" };

  const education = (p.education || []).map(e => ({
    degree: e.degree || "",
    institution: e.institution || "",
    start: e.startDate || "",
    end: e.endDate || "",
    location: e.location || "",
    gpa: "",
  }));

  const experience = (p.experience || []).map(e => ({
    role: e.role || "",
    company: e.company || "",
    location: e.location || "",
    start: e.startDate || "",
    end: e.endDate || "",
    description: e.content || "",
  }));

  const projects = (p.projects || []).map(pr => ({
    title: pr.name || "",
    url: pr.link || "",
    description: pr.content || "",
  }));

  const skillItems = (p.skills?.content || "")
    .split(/[\n,;|·•]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const dedup = [];
  for (const s of skillItems) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(s);
    if (dedup.length >= 20) break;
  }
  const skills = { items: dedup };

  const certificates = (p.certificates || []).map(ct => ({
    title: ct.name || "",
    issuer: ct.issuer || "",
    date: ct.date || "",
  }));

  const languages = (p.languages || []).map(l => ({
    language: l.name || "",
    proficiency: l.level || "",
  }));

  return { contact, summary, education, experience, projects, skills, certificates, languages };
}
