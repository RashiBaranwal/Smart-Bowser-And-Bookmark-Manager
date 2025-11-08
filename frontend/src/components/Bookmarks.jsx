import { useState, useEffect } from 'react';
import { bookmarkAPI } from '../services/api';
import './Bookmarks.css';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folders, setFolders] = useState([]);

  // Fetch bookmarks
  const fetchBookmarks = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await bookmarkAPI.getAll(filters);
      setBookmarks(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bookmarks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await bookmarkAPI.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const response = await bookmarkAPI.getFolders();
      setFolders(response.data.data);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    fetchStats();
    fetchFolders();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBookmarks();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle filter
  const handleFilter = () => {
    const filters = {};
    if (filterQuery) filters.query = filterQuery;
    if (selectedFolder) filters.folder = selectedFolder;
    fetchBookmarks(filters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilterQuery('');
    setSelectedFolder('');
    fetchBookmarks({});
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await bookmarkAPI.delete(id);
      fetchBookmarks();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all bookmarks from the database?')) {
      try {
        await bookmarkAPI.deleteAll();
        fetchBookmarks();
        fetchStats();
      } catch (err) {
        console.error('Failed to clear all:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="bookmarks-container">
      <header className="bookmarks-header">
        <h1>Bookmarks</h1>
        <p>All your saved bookmarks in one place</p>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Search bookmarks by title, URL, or tags..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
        <select
          className="folder-select"
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
        >
          <option value="">All Folders</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
        <button className="apply-filter-btn" onClick={handleFilter}>
          Search
        </button>
        <button className="clear-filter-btn" onClick={handleClearFilters}>
          Clear
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Bookmarks</h3>
            <p className="stat-value">{stats.totalBookmarks}</p>
          </div>
          <div className="stat-card">
            <h3>Folders</h3>
            <p className="stat-value">{stats.topFolders.length}</p>
          </div>
          <div className="stat-card">
            <h3>Top Domains</h3>
            <p className="stat-value">{stats.topDomains.length}</p>
          </div>
        </div>
      )}

      {/* Bookmarks Section */}
      <div className="bookmarks-section">
        <div className="bookmarks-header-row">
          <h2>Saved Bookmarks ({bookmarks.length})</h2>
          {bookmarks.length > 0 && (
            <button className="clear-all-btn" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <p>No bookmarks found. Install the Chrome extension to start syncing!</p>
          </div>
        ) : (
          <div className="bookmarks-list">
            {bookmarks.map((item) => (
              <div key={item._id} className="bookmark-item">
                <div className="bookmark-favicon">
                  {item.favicon && (
                    <img src={item.favicon} alt="" width="24" height="24" />
                  )}
                </div>
                <div className="bookmark-content">
                  <h3 className="bookmark-title">{item.title}</h3>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bookmark-url"
                  >
                    {item.url}
                  </a>
                  <div className="bookmark-meta">
                    <span className="folder-badge">{item.parentFolder}</span>
                    <span className="domain-badge">{item.domain}</span>
                    <span className="date-added">Added {formatDate(item.dateAdded)}</span>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(item._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
