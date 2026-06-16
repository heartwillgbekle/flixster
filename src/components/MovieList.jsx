import MovieCard from './MovieCard';
import './MovieList.css';

const MovieList = ({
  movies,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onCardClick,
  favorites,
  watched,
  onToggleFavorite,
  onToggleWatched,
}) => {
  if (error) {
    return <p className="movie-list__status movie-list__status--error">Error: {error}</p>;
  }

  if (!isLoading && movies.length === 0) {
    return <p className="movie-list__status">No movies found.</p>;
  }

  return (
    <>
      <div className="movie-list">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={onCardClick}
            isFavorite={favorites?.has(movie.id) ?? false}
            isWatched={watched?.has(movie.id) ?? false}
            onToggleFavorite={onToggleFavorite}
            onToggleWatched={onToggleWatched}
          />
        ))}
      </div>

      {isLoading && movies.length === 0 && (
        <p className="movie-list__status">Loading…</p>
      )}

      {hasMore && movies.length > 0 && (
        <div className="movie-list__footer">
          <button
            type="button"
            className="movie-list__load-more"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </>
  );
};

export default MovieList;
