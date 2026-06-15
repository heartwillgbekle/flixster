import { useEffect } from 'react';
import { BACKDROP_BASE } from '../api/tmdb';
import './MovieModal.css';

const formatRuntime = (minutes) => {
  if (!minutes || minutes <= 0) return 'Runtime unknown';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatReleaseDate = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const MovieModal = ({ details, isLoading, error, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="movie-modal__backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="movie-modal">
        <button
          type="button"
          className="movie-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {isLoading && (
          <p className="movie-modal__status">Loading details…</p>
        )}

        {error && !isLoading && (
          <div className="movie-modal__status movie-modal__status--error">
            <p>Could not load movie details.</p>
            <p className="movie-modal__error-detail">{error}</p>
          </div>
        )}

        {details && !isLoading && !error && (
          <>
            {details.backdrop_path && (
              <img
                className="movie-modal__backdrop-image"
                src={`${BACKDROP_BASE}${details.backdrop_path}`}
                alt=""
              />
            )}
            <div className="movie-modal__body">
              <h2 className="movie-modal__title">{details.title}</h2>
              {details.tagline && (
                <p className="movie-modal__tagline">{details.tagline}</p>
              )}
              <div className="movie-modal__meta">
                <span>{formatReleaseDate(details.release_date)}</span>
                <span aria-hidden="true">•</span>
                <span>{formatRuntime(details.runtime)}</span>
              </div>
              {details.genres?.length > 0 && (
                <ul className="movie-modal__genres">
                  {details.genres.map((g) => (
                    <li key={g.id} className="movie-modal__genre">
                      {g.name}
                    </li>
                  ))}
                </ul>
              )}
              {details.overview && (
                <p className="movie-modal__overview">{details.overview}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MovieModal;
