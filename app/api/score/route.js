import { NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TEXT_MODELS = [
    process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];
const VISION_MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free';

const SYSTEM_PROMPT =
    'You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the provided resume against the job description and return a structured JSON score report. Be honest and specific. Return ONLY a valid JSON object — no prose, no markdown, no code fences.';

function buildTextPrompt(cvText, jobText) {
    return `Analyze this resume against the job description below. Return ONLY a JSON object matching this exact schema:
{
  "overallScore": <integer 0-100>,
  "breakdown": {
    "skills": {
      "score": <integer 0-100>,
      "matched": [<list of skills/technologies from the resume that match the job>],
      "missing": [<list of important skills/technologies from the job not found in the resume>]
    },
    "experience": {
      "score": <integer 0-100>,
      "feedback": "<1-2 sentences about experience fit>"
    },
    "education": {
      "score": <integer 0-100>,
      "feedback": "<1 sentence about education fit>"
    },
    "keywords": {
      "score": <integer 0-100>,
      "matched": [<list of key ATS keywords found in both>],
      "missing": [<list of important ATS keywords from job not in resume>]
    }
  },
  "recommendations": [<3-5 specific, actionable improvement suggestions as strings>],
  "summary": "<2-3 sentence overall assessment>"
}

RESUME:
${cvText}

JOB DESCRIPTION:
${jobText}`;
}

function buildVisionPrompt(cvText) {
    return `The attached image is a job posting screenshot. Analyze this resume against the job description shown in the image. Return ONLY a JSON object matching this exact schema:
{
  "overallScore": <integer 0-100>,
  "breakdown": {
    "skills": {
      "score": <integer 0-100>,
      "matched": [<matched skills>],
      "missing": [<missing skills>]
    },
    "experience": {
      "score": <integer 0-100>,
      "feedback": "<1-2 sentences>"
    },
    "education": {
      "score": <integer 0-100>,
      "feedback": "<1 sentence>"
    },
    "keywords": {
      "score": <integer 0-100>,
      "matched": [<matched keywords>],
      "missing": [<missing keywords>]
    }
  },
  "recommendations": [<3-5 actionable suggestions>],
  "summary": "<2-3 sentence overall assessment>"
}

RESUME:
${cvText}`;
}

async function callWithFallback(models, messages) {
    let lastErr;
    for (const model of models) {
        try {
            return await callOpenRouter(model, messages);
        } catch (err) {
            console.warn(`Model ${model} failed, trying next:`, err.message);
            lastErr = err;
        }
    }
    throw lastErr;
}

async function callOpenRouter(model, messages) {
    const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
            'X-Title': 'CVATS',
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.2,
            max_tokens: 2500,
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        const errBody = await res.text();
        console.error('OpenRouter score error:', res.status, errBody.slice(0, 300));
        throw new Error(`Model request failed (${res.status})`);
    }

    const json = await res.json();
    const msg = json?.choices?.[0]?.message ?? {};
    let text = (msg.content ?? msg.reasoning ?? '').toString();

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1) text = text.slice(first, last + 1);

    return JSON.parse(text);
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { cvText, jobText, jobImageBase64 } = body;

        if (!cvText || cvText.trim().length < 50) {
            return NextResponse.json(
                { error: 'CV content is too short. Please add more details to your resume.' },
                { status: 400 },
            );
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
        }

        let result;

        if (jobImageBase64) {
            // Vision path: job posting is a screenshot image
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: buildVisionPrompt(cvText),
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: jobImageBase64,
                            },
                        },
                    ],
                },
            ];
            result = await callOpenRouter(VISION_MODEL, messages);
        } else {
            // Text path: job posting is plain text
            if (!jobText || jobText.trim().length < 50) {
                return NextResponse.json(
                    { error: 'Job description is too short. Please provide more details.' },
                    { status: 400 },
                );
            }
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildTextPrompt(cvText.slice(0, 6000), jobText.slice(0, 6000)) },
            ];
            result = await callWithFallback(TEXT_MODELS, messages);
        }

        // Validate and normalize the result
        if (typeof result.overallScore !== 'number') {
            throw new Error('Invalid score format from AI');
        }

        result.overallScore = Math.min(100, Math.max(0, Math.round(result.overallScore)));

        for (const key of ['skills', 'experience', 'education', 'keywords']) {
            if (result.breakdown?.[key]?.score != null) {
                result.breakdown[key].score = Math.min(100, Math.max(0, Math.round(result.breakdown[key].score)));
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Score route error:', error);
        return NextResponse.json({ error: error.message || 'Failed to score resume' }, { status: 500 });
    }
}
