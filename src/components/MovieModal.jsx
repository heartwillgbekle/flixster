import { useEffect, useState } from 'react';
import { BACKDROP_BASE } from '../api/tmdb';
import { getWatchRecommendation } from '../api/ai';
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

const MovieModal = ({ details, trailer, isLoading, error, onClose }) => {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    setShowTrailer(false);
    if (!trailer?.key) return;
    const id = setTimeout(() => setShowTrailer(true), 1500);
    return () => clearTimeout(id);
  }, [trailer?.key]);

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

  useEffect(() => {
    if (!details || !details.overview) return;

    let cancelled = false;
    setAiInsight(null);
    setAiError(null);
    setLoadingInsight(true);

    getWatchRecommendation(details)
      .then((text) => {
        if (!cancelled) setAiInsight(text);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('AI insight failed', {
            movieId: details.id,
            message: err.message,
          });
          setAiError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingInsight(false);
      });

    return () => {
      cancelled = true;
    };
  }, [details?.id]);

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
            <div className="movie-modal__media">
              {showTrailer && trailer?.key ? (
                <iframe
                  key={trailer.key}
                  className="movie-modal__trailer"
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&loop=1&playlist=${trailer.key}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`}
                  title={`${details.title} trailer: ${trailer.name}`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                />
              ) : (
                details.backdrop_path && (
                  <img
                    className="movie-modal__backdrop-image"
                    src={`${BACKDROP_BASE}${details.backdrop_path}`}
                    alt=""
                  />
                )
              )}
            </div>
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

              <section className="movie-modal__ai" aria-live="polite">
                <h3 className="movie-modal__ai-heading">Watch Recommendation</h3>
                {loadingInsight && (
                  <p className="movie-modal__ai-status">
                    Generating…
                  </p>
                )}
                {!loadingInsight && aiInsight && (
                  <p className="movie-modal__ai-text">{aiInsight}</p>
                )}
                {!loadingInsight && aiError && (
                  <p className="movie-modal__ai-status movie-modal__ai-status--fallback">
                    We couldn&apos;t generate a recommendation for this one — check
                    out the overview above!
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MovieModal;
