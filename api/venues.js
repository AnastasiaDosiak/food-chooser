// Server-side Overpass proxy. Browsers get CORS-blocked by Overpass's rate-limit (406/429)
// error responses, which carry no CORS headers; calling from here sidesteps that, runs from
// Vercel's IP (not the visitor's), retries + fails over between mirrors, and lets the edge
// cache the result per query so repeat lookups never touch Overpass.

export const config = { maxDuration: 60 };

// Fail fast: the client has a curated fallback, so a quick miss beats a long wait.
const OVERPASS_ENDPOINTS = [
  { url: 'https://overpass-api.de/api/interpreter', timeoutMs: 6000, attempts: 1 },
  { url: 'https://overpass.kumi.systems/api/interpreter', timeoutMs: 7000, attempts: 1 },
];
const RETRY_BACKOFF_MS = 1000;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchElements = async (url, query, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Overpass ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data.elements) ? data.elements : [];
  } finally {
    clearTimeout(timer);
  }
};

export default async function handler(req, res) {
  const query = typeof req.query?.q === 'string' ? req.query.q : null;
  if (!query) {
    res.status(400).json({ error: 'Missing q parameter' });
    return;
  }

  let lastError = 'Overpass unreachable';
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= endpoint.attempts; attempt += 1) {
      try {
        const elements = await fetchElements(endpoint.url, query, endpoint.timeoutMs);
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
        res.status(200).json({ elements });
        return;
      } catch (error) {
        lastError = error && error.message ? error.message : String(error);
        if (attempt < endpoint.attempts) {
          await sleep(RETRY_BACKOFF_MS);
        }
      }
    }
  }
  res.status(502).json({ error: lastError });
}
