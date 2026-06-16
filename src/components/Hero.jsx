import { useEffect, useState } from 'react';
import { BACKDROP_BASE } from '../api/tmdb';
import './Hero.css';

const ROTATE_MS = 10_000;

const Hero = ({ slides = [], onCardClick, mode, onClearMode }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  if (slides.length === 0) return null;

  const current = slides[index];

  return (
    <section className="hero" aria-roledescription="carousel">
      <div className="hero__stage">
        {slides.map((slide, i) => (
          <img
            key={slide.id}
            src={`${BACKDROP_BASE}${slide.backdrop_path}`}
            alt=""
            className={`hero__image${i === index ? ' is-active' : ''}`}
            aria-hidden={i !== index}
          />
        ))}
        <div className="hero__overlay" aria-hidden="true" />

        <button
          type="button"
          className="hero__nav-button"
          onClick={onClearMode}
          disabled={mode === 'now_playing'}
        >
          Now Playing
        </button>

        <div className="hero__content">
          <p className="hero__eyebrow">Top Rated</p>
          <h2 className="hero__title">{current.title}</h2>
          {current.overview && (
            <p className="hero__overview">{current.overview}</p>
          )}
          <div className="hero__meta">
            <span className="hero__rating">
              ⭐ {current.vote_average?.toFixed(1) ?? 'N/A'}
            </span>
            {current.release_date && (
              <span>{new Date(current.release_date).getFullYear()}</span>
            )}
          </div>
          <button
            type="button"
            className="hero__cta"
            onClick={() => onCardClick?.(current.id)}
          >
            View Details
          </button>
        </div>

        <div className="hero__dots" role="tablist" aria-label="Choose movie">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${slide.title}`}
              className={`hero__dot${i === index ? ' is-active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
