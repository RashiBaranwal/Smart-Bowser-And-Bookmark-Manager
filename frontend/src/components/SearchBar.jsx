import { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onFilter }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('');

  const handleFilter = (e) => {
    e.preventDefault();
    const filters = {};
    if (filterQuery) filters.query = filterQuery;
    if (filterDomain) filters.domain = filterDomain;
    onFilter(filters);
  };

  const handleClearFilters = () => {
    setFilterQuery('');
    setFilterDomain('');
    onFilter({});
  };

  const handleInputChange = (e) => {
    setFilterQuery(e.target.value);
    // Auto-filter as user types
    const filters = {};
    if (e.target.value) filters.query = e.target.value;
    if (filterDomain) filters.domain = filterDomain;
    onFilter(filters);
  };

  return (
    <div className="search-bar-container">
      <form className="filter-form" onSubmit={handleFilter}>
        <div className="filter-group">
          <input
            type="text"
            className="filter-input"
            placeholder="Search by URL, title, or domain..."
            value={filterQuery}
            onChange={handleInputChange}
          />
          <input
            type="text"
            className="domain-input"
            placeholder="Filter by domain (e.g., github.com)..."
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
          />
          <button type="submit" className="apply-filter-btn">
            Apply Filters
          </button>
          <button
            type="button"
            className="clear-filter-btn"
            onClick={handleClearFilters}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
