import { useEffect, useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ activeQuery, onSearch, onClear }) => {
  const [inputValue, setInputValue] = useState(activeQuery);

  useEffect(() => {
    setInputValue(activeQuery);
  }, [activeQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    onClear();
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="search-bar__input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search movies..."
      />
      <button type="submit" className="search-bar__button">
        Search
      </button>
      {activeQuery && (
        <button
          type="button"
          className="search-bar__button search-bar__button--clear"
          onClick={handleClear}
        >
          Clear
        </button>
      )}
    </form>
  );
};

export default SearchBar;
