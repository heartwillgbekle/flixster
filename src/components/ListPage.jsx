import MovieList from './MovieList';
import './ListPage.css';

const ListPage = ({
  title,
  description,
  emptyTitle,
  emptyText,
  movies,
  onCardClick,
  favorites,
  watched,
  onToggleFavorite,
  onToggleWatched,
}) => (
  <section className="list-page">
    <header className="list-page__header">
      <h2 className="list-page__title">{title}</h2>
      {description && <p className="list-page__description">{description}</p>}
      <p className="list-page__count">
        {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
      </p>
    </header>

    {movies.length === 0 ? (
      <div className="list-page__empty">
        <h3 className="list-page__empty-title">{emptyTitle}</h3>
        <p className="list-page__empty-text">{emptyText}</p>
      </div>
    ) : (
      <MovieList
        movies={movies}
        isLoading={false}
        error={null}
        hasMore={false}
        onLoadMore={() => {}}
        onCardClick={onCardClick}
        favorites={favorites}
        watched={watched}
        onToggleFavorite={onToggleFavorite}
        onToggleWatched={onToggleWatched}
      />
    )}
  </section>
);

export default ListPage;
