import { Router } from "express";

// Server-side proxy to Sarvam AI translation so the API key never reaches the
// browser. Results are cached in-memory per (text, target) so repeated UI
// toggles don't re-hit the API. Falls back to the original English text on any
// error, so a translation outage never breaks the dashboard.

export const translateRouter = Router();

const SARVAM_URL = "https://api.sarvam.ai/translate";
const cache = new Map<string, string>();

async function translateOne(text: string, target: string): Promise<string> {
  const key = `${target}::${text}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return text;

  try {
    const resp = await fetch(SARVAM_URL, {
      method: "POST",
      headers: { "api-subscription-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: text,
        source_language_code: "en-IN",
        target_language_code: target,
      }),
    });
    if (!resp.ok) return text;
    const data = (await resp.json()) as { translated_text?: string };
    const out = data.translated_text ?? text;
    cache.set(key, out);
    return out;
  } catch {
    return text;
  }
}

/**
 * @openapi
 * /translate:
 *   post:
 *     summary: Translate an array of UI strings (via Sarvam AI); English fallback on error
 *     tags: [Translate]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [texts]
 *             properties:
 *               texts: { type: array, items: { type: string } }
 *               target: { type: string, default: "hi-IN" }
 *     responses:
 *       200: { description: "{ translations: string[] } aligned to the input order" }
 */
translateRouter.post("/", async (req, res) => {
  const { texts, target = "hi-IN" } = req.body ?? {};
  if (!Array.isArray(texts) || texts.some((t) => typeof t !== "string")) {
    return res.status(400).json({ error: "texts must be an array of strings" });
  }
  if (texts.length > 200) {
    return res.status(400).json({ error: "too many strings in one request (max 200)" });
  }

  const translations = await Promise.all(texts.map((t: string) => translateOne(t, String(target))));
  res.json({ translations });
});
