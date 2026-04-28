const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

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
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
}

export function getTrendingPeople(page = 1, timeWindow = 'week') {
  return tmdbFetch(`/trending/person/${timeWindow}`, { page });
}

export function getPopular(mediaType = 'movie', page = 1) {
  return tmdbFetch(`/${mediaType}/popular`, { page });
}

export function getTopRated(mediaType = 'movie', page = 1) {
  return tmdbFetch(`/${mediaType}/top_rated`, { page });
}

export function getNowPlaying(page = 1) {
  return tmdbFetch('/movie/now_playing', { page });
}

export function getUpcoming(page = 1) {
  return tmdbFetch('/movie/upcoming', { page });
}

export function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`, { append_to_response: 'videos,credits,similar,recommendations' });
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
  return tmdbFetch('/search/multi', { query, page });
}

export function searchMovies(query, page = 1) {
  return tmdbFetch('/search/movie', { query, page, include_adult: false });
}

export function searchTV(query, page = 1) {
  return tmdbFetch('/search/tv', { query, page, include_adult: false });
}

export function discoverMovies(filters = {}, page = 1) {
  return tmdbFetch('/discover/movie', { ...filters, page });
}

export function discoverTV(filters = {}, page = 1) {
  return tmdbFetch('/discover/tv', { ...filters, page });
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
