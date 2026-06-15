import { IMG_BASE } from '../api/tmdb';
import './MovieCard.css';

const FALLBACK_POSTER = 'https://placehold.co/500x750?text=No+Poster';

const MovieCard = ({
  movie,
  onClick,
  isFavorite = false,
  isWatched = false,
  onToggleFavorite,
  onToggleWatched,
}) => {
  const posterUrl = movie.poster_path
    ? `${IMG_BASE}${movie.poster_path}`
    : FALLBACK_POSTER;

  const open = () => onClick?.(movie.id);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  const handleAction = (e, fn) => {
    e.stopPropagation();
    fn?.(movie.id);
  };

  return (
    <div
      className="movie-card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={handleKeyDown}
      aria-label={`Open details for ${movie.title}`}
    >
      <div className="movie-card__poster-wrap">
        <img
          className="movie-card__poster"
          src={posterUrl}
          alt={`${movie.title} poster`}
        />
        <span
          className="movie-card__rating"
          aria-label={`Rating ${movie.vote_average?.toFixed(1) ?? 'unknown'}`}
        >
          ⭐ {movie.vote_average?.toFixed(1) ?? 'N/A'}
        </span>
        <button
          type="button"
          className={`movie-card__icon-btn movie-card__icon-btn--fav${
            isFavorite ? ' is-active' : ''
          }`}
          onClick={(e) => handleAction(e, onToggleFavorite)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>
      <div className="movie-card__body">
        <button
          type="button"
          className={`movie-card__watched${isWatched ? ' is-active' : ''}`}
          onClick={(e) => handleAction(e, onToggleWatched)}
          aria-pressed={isWatched}
        >
          {isWatched ? '✓ Watched' : 'Mark as watched'}
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
