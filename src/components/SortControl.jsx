import './SortControl.css';

const SortControl = ({ sortOption, onSortChange }) => (
  <div className="sort-control">
    <label htmlFor="sort-select" className="sort-control__label">
      Sort by:
    </label>
    <select
      id="sort-select"
      className="sort-control__select"
      value={sortOption}
      onChange={(e) => onSortChange(e.target.value)}
    >
      <option value="default">Default</option>
      <option value="title-asc">Title (A–Z)</option>
      <option value="release-desc">Release Date (newest)</option>
      <option value="rating-desc">Rating (highest)</option>
    </select>
  </div>
);

export default SortControl;
