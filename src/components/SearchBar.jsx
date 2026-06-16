import { useEffect, useRef, useState } from 'react';
import './SearchBar.css';

const SearchIcon = () => (
  <svg
    className="search-bar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const SearchBar = ({ activeQuery, onSearch, onClear }) => {
  const [inputValue, setInputValue] = useState(activeQuery);
  const [isExpanded, setIsExpanded] = useState(Boolean(activeQuery));
  const inputRef = useRef(null);

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  const collapse = () => setIsExpanded(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      collapse();
      return;
    }
    onSearch(trimmed);
    collapse();
  };

  const handleClear = () => {
    setInputValue('');
    onClear();
    collapse();
  };

  const handleBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (!inputValue && !activeQuery) collapse();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (activeQuery) handleClear();
      else collapse();
    }
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        className="search-bar__trigger"
        onClick={() => setIsExpanded(true)}
        aria-label="Open search"
        title="Search movies"
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <form
      className="search-bar"
      onSubmit={handleSubmit}
      onBlur={handleBlur}
      role="search"
    >
      <span className="search-bar__icon-wrap" aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        className="search-bar__input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search movies..."
        aria-label="Search movies"
      />
      {activeQuery ? (
        <button
          type="button"
          className="search-bar__button search-bar__button--clear"
          onClick={handleClear}
        >
          Clear
        </button>
      ) : (
        <button type="submit" className="search-bar__button">
          Search
        </button>
      )}
    </form>
  );
};

export default SearchBar;
