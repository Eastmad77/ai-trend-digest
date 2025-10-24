import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function summariseBatch(items) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompts = items.map(
    (x, i) =>
      `${i + 1}. Title: ${x.title}\nSource: ${x.source}\nURL: ${x.link}\nExcerpt: ${x.excerpt?.slice(0, 800)}`
  );

  const system =
    "You are a crisp, neutral news summariser. Produce SEO-friendly titles (≤75 chars), 1–2 sentence summaries, and 3–6 keywords. Keep factual. British English.";
  const user = `Summarise each item with JSON array of:
[{ "title": "...", "summary": "...", "keywords": ["...", "..."] }]
Items:\n${prompts.join("\n\n")}`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    response_format: { type: "json_object" }
  });

  let parsed = [];
  try {
    const json = JSON.parse(res.choices[0].message.content || "{}");
    parsed = Array.isArray(json) ? json : json.items || [];
  } catch {
    parsed = [];
  }

  // Map back onto items
  return items.map((orig, idx) => {
    const s = parsed[idx] || {};
    return {
      ...orig,
      aiTitle: s.title || orig.title,
      aiSummary: s.summary || "",
      aiKeywords: Array.isArray(s.keywords) ? s.keywords : []
    };
  });
}
