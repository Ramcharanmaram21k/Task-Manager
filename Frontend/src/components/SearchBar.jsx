import { useId } from 'react';

export default function SearchBar({ value, onChange, onClear }) {
  const searchId = useId();

  return (
    <div className="search-bar" role="search">
      <label htmlFor={searchId}>Search</label>
      <div className="search-input">
        <input
          id={searchId}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search tasks by title or description"
        />
        {value ? (
          <button type="button" className="ghost-button" onClick={onClear} aria-label="Clear search">
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
