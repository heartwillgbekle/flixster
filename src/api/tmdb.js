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

export const searchMovies = (query, page = 1) =>
  tmdbFetch('/search/movie', { query, page, include_adult: false });

export const getMovieDetails = (movieId) =>
  tmdbFetch(`/movie/${movieId}`);
