import './SortControl.css';

const SORT_OPTIONS = [
  { value: 'default', label: 'Home' },
  { value: 'title-asc', label: 'Title' },
  { value: 'release-desc', label: 'Newest' },
  { value: 'rating-desc', label: 'Top Rated' },
];

const SortControl = ({ sortOption, onSortChange }) => (
  <nav className="sort-control" aria-label="Sort movies">
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
);

export default SortControl;
