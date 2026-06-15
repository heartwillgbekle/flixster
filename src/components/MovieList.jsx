import MovieCard from './MovieCard';
import './MovieList.css';

const MovieList = ({ movies, isLoading, error, hasMore, onLoadMore, onCardClick }) => {
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
          <MovieCard key={movie.id} movie={movie} onClick={onCardClick} />
        ))}
      </div>

      {isLoading && <p className="movie-list__status">Loading…</p>}

      {!isLoading && hasMore && movies.length > 0 && (
        <div className="movie-list__footer">
          <button
            type="button"
            className="movie-list__load-more"
            onClick={onLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
};

export default MovieList;
