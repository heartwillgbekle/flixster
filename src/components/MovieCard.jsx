import { IMG_BASE } from '../api/tmdb';
import './MovieCard.css';

const FALLBACK_POSTER =
  'https://placehold.co/500x750?text=No+Poster';

const MovieCard = ({ movie, onClick }) => {
  const posterUrl = movie.poster_path
    ? `${IMG_BASE}${movie.poster_path}`
    : FALLBACK_POSTER;

  return (
    <button
      type="button"
      className="movie-card"
      onClick={() => onClick?.(movie.id)}
    >
      <img className="movie-card__poster" src={posterUrl} alt={movie.title} />
      <div className="movie-card__body">
        <h3 className="movie-card__title">{movie.title}</h3>
        <p className="movie-card__rating">
          ⭐ {movie.vote_average?.toFixed(1) ?? 'N/A'}
        </p>
      </div>
    </button>
  );
};

export default MovieCard;
