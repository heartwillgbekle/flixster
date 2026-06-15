const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b:free';

const SYSTEM_PROMPT =
  'You are an enthusiastic but honest film critic helping a friend decide what to watch tonight. ' +
  "Write 2–3 sentences in the second person, focused on the movie's tone, mood, and ideal audience. " +
  'Do not include plot spoilers, do not say "this movie", do not start with "I", and avoid generic phrases ' +
  'like "must-see", "tour de force", or "edge-of-your-seat thriller". ' +
  'Output plain text only — no markdown, no headings, no bullet points.';

const buildUserPrompt = ({ title, genres, overview }) =>
  `Title: ${title}\nGenres: ${genres}\nOverview: ${overview}\n\nRecommend whether to watch this and who would enjoy it.`;

export async function getWatchRecommendation(details) {
  if (!API_KEY) {
    throw new Error('Missing VITE_OPENROUTER_API_KEY');
  }
  if (!details || !details.overview) {
    throw new Error('Insufficient context for recommendation');
  }

  const genres = (details.genres ?? []).map((g) => g.name).join(', ') || 'Unknown';

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Flixster',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildUserPrompt({
            title: details.title,
            genres,
            overview: details.overview,
          }),
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error('Empty response from model');
  }

  return text;
}
