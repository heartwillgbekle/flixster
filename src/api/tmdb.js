const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
export const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDb ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const getNowPlaying = (page = 1) =>
  tmdbFetch('/movie/now_playing', { page });

export const getTopRated = (page = 1) =>
  tmdbFetch('/movie/top_rated', { page });

export const searchMovies = (query, page = 1) =>
  tmdbFetch('/search/movie', { query, page, include_adult: false });

export const getMovieDetails = (movieId) =>
  tmdbFetch(`/movie/${movieId}`);

export const getMovieVideos = (movieId) =>
  tmdbFetch(`/movie/${movieId}/videos`);

const TYPE_RANK = { Trailer: 0, Teaser: 1 };

export const pickBestTrailer = (videos = []) => {
  const candidates = videos
    .filter((v) => v.site === 'YouTube' && v.key)
    .filter((v) => TYPE_RANK[v.type] !== undefined);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const typeDiff = TYPE_RANK[a.type] - TYPE_RANK[b.type];
    if (typeDiff !== 0) return typeDiff;
    if (a.official !== b.official) return a.official ? -1 : 1;
    return new Date(b.published_at) - new Date(a.published_at);
  });

  const best = candidates[0];
  return { key: best.key, name: best.name };
};
