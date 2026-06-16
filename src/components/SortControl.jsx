import { useEffect, useRef, useState } from 'react';
import './SortControl.css';

const SORT_OPTIONS = [
  { value: 'default', label: 'Home' },
  { value: 'title-asc', label: 'Title' },
  { value: 'release-desc', label: 'Newest' },
  { value: 'rating-desc', label: 'Top Rated' },
];

const SortControl = ({ sortOption, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortOption)?.label ?? 'Sort';

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const handleSelect = (value) => {
    onSortChange(value);
    setIsOpen(false);
  };

  return (
    <div className="sort-control" ref={containerRef}>
      {/* Inline horizontal nav — visible on desktop */}
      <nav className="sort-control__inline" aria-label="Sort movies">
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortOption === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`sort-control__option${isActive ? ' is-active' : ''}`}
              onClick={() => onSortChange(opt.value)}
              aria-pressed={isActive}
            >
              {opt.label}
            </button>
          );
        })}
      </nav>

      {/* Compact dropdown — visible on mobile */}
      <div className="sort-control__compact">
        <button
          type="button"
          className="sort-control__toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          {activeLabel} <span aria-hidden="true">▾</span>
        </button>
        {isOpen && (
          <ul className="sort-control__menu" role="menu">
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortOption === opt.value;
              return (
                <li key={opt.value} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={`sort-control__menu-item${
                      isActive ? ' is-active' : ''
                    }`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SortControl;
