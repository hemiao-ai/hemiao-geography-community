import "server-only";

export function guideConfig() {
  const baseUrl = process.env.GEOGRAPHY_AI_BASE_URL?.trim();
  const model = process.env.GEOGRAPHY_AI_MODEL?.trim();
  if (!baseUrl || !model) return null;

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password || url.search || url.hash) return null;
    url.pathname = url.pathname.replace(/\/+$/, "") + "/chat/completions";
    return { endpoint: url, model, key: process.env.GEOGRAPHY_AI_API_KEY?.trim() };
  } catch {
    return null;
  }
}
