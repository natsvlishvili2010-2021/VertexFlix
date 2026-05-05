const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const BLOCKED_KEYWORD_IDS = [
  260863, // hardcore
  198385, // hentai
  9199, // sexploitation
  155477, // softcore
  301, // erotic
  10084, // pornography
  6917, // explicit sex
];

const MIN_VOTE_COUNT = 10;
const MIN_POPULARITY = 2;

function isLikelyPorn(item) {
  const haystack = [
    item?.title,
    item?.original_title,
    item?.name,
    item?.original_name,
    item?.overview,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const overview = (item?.overview || '').toString().toLowerCase();

  if (!haystack) return false;

  // Strong indicators. (Avoid generic words like "sex" which would cause many false positives.)
  const strongRegexes = [
    /\bporn\b/i,
    /\bporno\b/i,
    /\bxxx\b/i,
    /\bhardcore\b/i,
    /\bblowjob\b/i,
    /\bcumshot\b/i,
    /\bgangbang\b/i,
    /\bbukkake\b/i,
    /\bdeepthroat\b/i,
    /\banal\b/i,
    /double\s+penetration/i,
    /\bthreesome\b/i,
    /\borgy\b/i,
  ];

  // Stricter phrase/combination checks for mis-tagged softcore/sexploitation content.
  // These are designed to avoid filtering normal non-porn 18+ movies.
  const hasSoftcorePhrasing = (() => {
    if (!overview) return false;

    // Direct phrases
    const phrases = [
      'seductive pleasures',
      'exotic fantasies',
    ];
    if (phrases.some((p) => overview.includes(p))) return true;

    // Combination signals
    const hasFantasy = overview.includes('fantasy') || overview.includes('fantasies');
    const hasSatisfy = overview.includes('satisfy') || overview.includes('satisfies') || overview.includes('satisfying');
    const hasSeductive = overview.includes('seductive') || overview.includes('sensual');
    if (hasFantasy && hasSatisfy) return true;
    if (hasFantasy && hasSeductive) return true;

    return false;
  })();

  return strongRegexes.some((re) => re.test(haystack)) || hasSoftcorePhrasing;
}

function isBlockedTitleLike(item) {
  return item?.adult === true || isLikelyPorn(item);
}

function isLowQualityTitleLike(item) {
  // Only apply to titles (movie/tv). Do not filter people.
  const mediaType = item?.media_type;
  const looksLikePerson = mediaType === 'person' || (item && 'known_for_department' in item);
  if (looksLikePerson) return false;

  const voteCount = typeof item?.vote_count === 'number' ? item.vote_count : 0;
  const popularity = typeof item?.popularity === 'number' ? item.popularity : 0;

  // If we don't have any signal at all, treat as low-quality.
  if (voteCount === 0 && popularity === 0) return true;

  return voteCount < MIN_VOTE_COUNT || popularity < MIN_POPULARITY;
}

function filterNestedResults(obj, key) {
  if (!obj || !obj[key] || !Array.isArray(obj[key].results)) return obj;
  return {
    ...obj,
    [key]: {
      ...obj[key],
      results: obj[key].results.filter((it) => !isBlockedTitleLike(it)),
    },
  };
}

function filterAdultResults(data) {
  if (!data || !Array.isArray(data.results)) return data;
  return {
    ...data,
    results: data.results
      .filter((item) => item?.adult !== true)
      .filter((item) => !isLikelyPorn(item)),
  };
}

function filterTitleQualityResults(data) {
  if (!data || !Array.isArray(data.results)) return data;
  return {
    ...data,
    results: data.results.filter((item) => !isLowQualityTitleLike(item)),
  };
}

async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function getTrending(mediaType = 'all', timeWindow = 'week') {
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`)
    .then(filterAdultResults)
    .then(filterTitleQualityResults);
}

export function getTrendingPeople(page = 1, timeWindow = 'week') {
  return tmdbFetch(`/trending/person/${timeWindow}`, { page });
}

export function getPopular(mediaType = 'movie', page = 1) {
  return tmdbFetch(`/${mediaType}/popular`, { page })
    .then(filterAdultResults)
    .then(filterTitleQualityResults);
}

export function getTopRated(mediaType = 'movie', page = 1) {
  return tmdbFetch(`/${mediaType}/top_rated`, { page })
    .then(filterAdultResults)
    .then(filterTitleQualityResults);
}

export function getNowPlaying(page = 1) {
  return tmdbFetch('/movie/now_playing', { page })
    .then(filterAdultResults)
    .then(filterTitleQualityResults);
}

export function getUpcoming(page = 1) {
  return tmdbFetch('/movie/upcoming', { page })
    .then(filterAdultResults)
    .then(filterTitleQualityResults);
}

export function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`, { append_to_response: 'videos,credits,similar,recommendations' }).then((movie) => {
    if (!movie) return movie;
    if (isBlockedTitleLike(movie)) return null;

    let out = movie;
    out = filterNestedResults(out, 'similar');
    out = filterNestedResults(out, 'recommendations');
    return out;
  });
}

export function getMovieCredits(id) {
  return tmdbFetch(`/movie/${id}/credits`);
}

export function getTVCredits(id) {
  return tmdbFetch(`/tv/${id}/credits`);
}

export function getSimilarMovies(id) {
  return tmdbFetch(`/movie/${id}/similar`);
}

export function getTVDetails(id) {
  return tmdbFetch(`/tv/${id}`, { append_to_response: 'videos,credits,similar,recommendations' });
}

export function getTVSeason(id, seasonNumber) {
  return tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
}

export function getSimilarTV(id) {
  return tmdbFetch(`/tv/${id}/similar`);
}

export function searchMulti(query, page = 1) {
  return tmdbFetch('/search/multi', { query, page, include_adult: false })
    .then(filterAdultResults)
    .then(filterTitleQualityResults);
}

export function searchMovies(query, page = 1) {
  return tmdbFetch('/search/movie', { query, page, include_adult: false })
    .then(filterAdultResults)
    .then(filterTitleQualityResults);
}

export function searchTV(query, page = 1) {
  return tmdbFetch('/search/tv', { query, page, include_adult: false })
    .then(filterAdultResults)
    .then(filterTitleQualityResults);
}

export function discoverMovies(filters = {}, page = 1) {
  return tmdbFetch('/discover/movie', {
    ...filters,
    page,
    include_adult: false,
    include_video: false,
    without_keywords: BLOCKED_KEYWORD_IDS.join(','),
    'vote_count.gte': MIN_VOTE_COUNT,
    'popularity.gte': MIN_POPULARITY,
  }).then(filterAdultResults);
}

export function discoverTV(filters = {}, page = 1) {
  return tmdbFetch('/discover/tv', {
    ...filters,
    page,
    include_adult: false,
    include_video: false,
    without_keywords: BLOCKED_KEYWORD_IDS.join(','),
    'vote_count.gte': MIN_VOTE_COUNT,
    'popularity.gte': MIN_POPULARITY,
  }).then(filterAdultResults);
}

export function getGenres(mediaType = 'movie') {
  return tmdbFetch(`/genre/${mediaType}/list`);
}

export function getPersonDetails(id) {
  return tmdbFetch(`/person/${id}`, { append_to_response: 'combined_credits,images' });
}

export function getPopularPeople(page = 1) {
  return tmdbFetch('/person/popular', { page });
}

export function searchPeople(query, page = 1) {
  return tmdbFetch('/search/person', { query, page });
}

export function getImageUrl(path, size = 'w780') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
