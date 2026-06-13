// Server-side Overpass proxy. Browsers get CORS-blocked by Overpass's rate-limit (406)
// error responses, which carry no CORS headers; calling from here sidesteps that, runs
// from Vercel's IP (not the visitor's rate-limited one), fails over between mirrors, and
// lets the edge cache the result per query.

export const config = { maxDuration: 30 };

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const ENDPOINT_TIMEOUT_MS = 8000;

const fetchElements = async (endpoint, query) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENDPOINT_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
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
    try {
      const elements = await fetchElements(endpoint, query);
      // Cache the same query at the edge for a day so repeat lookups skip Overpass entirely.
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
      res.status(200).json({ elements });
      return;
    } catch (error) {
      lastError = error && error.message ? error.message : String(error);
    }
  }
  res.status(502).json({ error: lastError });
}
