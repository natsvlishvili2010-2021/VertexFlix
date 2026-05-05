export const runtime = 'nodejs';

function getSources(mediaType, tmdbId, season, episode) {
  if (mediaType === 'tv' && season && episode) {
    return [
      `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
      `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
      `https://www.2embed.online/embed/tv/${tmdbId}/${season}/${episode}`,
    ];
  }

  return [
    `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
    `https://vidsrc.to/embed/movie/${tmdbId}`,
    `https://www.2embed.online/embed/movie/${tmdbId}`,
  ];
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      cache: 'no-store',
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(t);
  }
}

function looksUnavailable(html) {
  const h = (html || '').toLowerCase();
  return (
    h.includes('this media is unavailable at the moment') ||
    h.includes('media is unavailable at the moment') ||
    h.includes('this video is unavailable')
  );
}

const cache = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const mediaType = (searchParams.get('mediaType') || 'movie').toLowerCase();
  const tmdbId = searchParams.get('tmdbId');
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');

  if (!tmdbId) {
    return Response.json({ error: 'tmdbId is required' }, { status: 400 });
  }

  const cacheKey = `${mediaType}:${tmdbId}:${season || ''}:${episode || ''}`;
  if (cache.has(cacheKey)) {
    return Response.json(cache.get(cacheKey));
  }

  const sources = getSources(mediaType, tmdbId, season, episode);

  const results = [];
  let anyAvailable = false;

  for (const url of sources) {
    try {
      const res = await fetchWithTimeout(url, 6000);
      const unavailable = looksUnavailable(res.text);
      const available = res.ok && !unavailable;
      results.push({ url, status: res.status, available, unavailable });
      if (available) anyAvailable = true;
    } catch {
      results.push({ url, status: 0, available: false, unavailable: false });
    }
  }

  const payload = { available: anyAvailable, sources: results };
  cache.set(cacheKey, payload);
  return Response.json(payload);
}
