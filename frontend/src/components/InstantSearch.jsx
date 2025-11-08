import { useState } from 'react';
import { bookmarkAPI, browserHistoryAPI, manualEntryAPI } from '../services/api';
import './InstantSearch.css';

const InstantSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ bookmarks: [], history: [], manualEntries: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Perform instant search
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ bookmarks: [], history: [], manualEntries: [] });
      return;
    }

    setLoading(true);
    try {
      // Search bookmarks, history, and manual entries simultaneously
      const [bookmarkResponse, historyResponse, manualResponse] = await Promise.all([
        bookmarkAPI.search(searchQuery),
        browserHistoryAPI.getAll({ query: searchQuery, limit: 50 }),
        manualEntryAPI.search(searchQuery)
      ]);

      setResults({
        bookmarks: bookmarkResponse.data.data || [],
        history: historyResponse.data.data || [],
        manualEntries: manualResponse.data.data || []
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Instant search as user types
    performSearch(value);
  };

  const formatDate = (dateString) => {
    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const totalResults = results.bookmarks.length + results.history.length + results.manualEntries.length;

  const displayResults = () => {
    if (activeTab === 'all') {
      return (
        <>
          {renderManualEntries()}
          {renderBookmarks()}
          {renderHistory()}
        </>
      );
    } else if (activeTab === 'bookmarks') {
      return renderBookmarks();
    } else if (activeTab === 'history') {
      return renderHistory();
    } else if (activeTab === 'manual') {
      return renderManualEntries();
    }
  };

  const renderManualEntries = () => {
    if (results.manualEntries.length === 0) return null;

    return (
      <div className="results-section">
        <h3 className="results-section-title">
          Manual Entries ({results.manualEntries.length})
        </h3>
        <div className="results-list">
          {results.manualEntries.map((entry) => (
            <div key={entry._id} className="result-item manual-result">
              <div className="result-image">
                {entry.imageData ? (
                  <img src={entry.imageData} alt={entry.title} width="60" height="60" />
                ) : entry.favicon ? (
                  <img src={entry.favicon} alt="" width="20" height="20" />
                ) : null}
              </div>
              <div className="result-content">
                <div className="result-header">
                  <span className="result-type-badge manual-badge">Manual Entry</span>
                  <span className="result-category">{entry.category}</span>
                </div>
                <h4 className="result-title">{entry.title}</h4>
                {entry.description && (
                  <p className="result-description">{entry.description}</p>
                )}
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-url"
                >
                  {entry.url}
                </a>
                <div className="result-meta">
                  <span className="result-domain">{entry.domain}</span>
                  <span className="result-date">Added {formatDate(entry.dateAdded)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBookmarks = () => {
    if (results.bookmarks.length === 0) return null;

    return (
      <div className="results-section">
        <h3 className="results-section-title">
          Bookmarks ({results.bookmarks.length})
        </h3>
        <div className="results-list">
          {results.bookmarks.map((bookmark) => (
            <div key={bookmark._id} className="result-item bookmark-result">
              <div className="result-favicon">
                {bookmark.favicon && (
                  <img src={bookmark.favicon} alt="" width="20" height="20" />
                )}
              </div>
              <div className="result-content">
                <div className="result-header">
                  <span className="result-type-badge bookmark-badge">Bookmark</span>
                  <span className="result-folder">{bookmark.parentFolder}</span>
                </div>
                <h4 className="result-title">{bookmark.title}</h4>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-url"
                >
                  {bookmark.url}
                </a>
                <div className="result-meta">
                  <span className="result-domain">{bookmark.domain}</span>
                  <span className="result-date">Added {formatDate(bookmark.dateAdded)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (results.history.length === 0) return null;

    return (
      <div className="results-section">
        <h3 className="results-section-title">
          Browser History ({results.history.length})
        </h3>
        <div className="results-list">
          {results.history.map((history) => (
            <div key={history._id} className="result-item history-result">
              <div className="result-favicon">
                {history.favicon && (
                  <img src={history.favicon} alt="" width="20" height="20" />
                )}
              </div>
              <div className="result-content">
                <div className="result-header">
                  <span className="result-type-badge history-badge">History</span>
                  {history.visitCount > 1 && (
                    <span className="visit-count">{history.visitCount} visits</span>
                  )}
                </div>
                <h4 className="result-title">{history.title}</h4>
                <a
                  href={history.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-url"
                >
                  {history.url}
                </a>
                <div className="result-meta">
                  <span className="result-domain">{history.domain}</span>
                  <span className="result-date">Visited {formatDate(history.visitTime)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="instant-search">
      <header className="search-header">
        <h1>Instant Search</h1>
        <p>Search across your browser history, bookmarks, and manual entries instantly</p>
      </header>

      <div className="search-box">
        <input
          type="text"
          className="search-input-main"
          placeholder="Type to search across history, bookmarks, and manual entries... (e.g., 'pancake')"
          value={query}
          onChange={handleInputChange}
          autoFocus
        />
        {loading && <div className="search-loader">Searching...</div>}
      </div>

      {query && (
        <div className="search-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Results ({totalResults})
          </button>
          <button
            className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Manual Entries ({results.manualEntries.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            Bookmarks ({results.bookmarks.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History ({results.history.length})
          </button>
        </div>
      )}

      <div className="search-results">
        {!query ? (
          <div className="empty-search">
            <p>Start typing to search across history, bookmarks, and manual entries</p>
            <div className="search-tips">
              <h4>Search Tips:</h4>
              <ul>
                <li>Search by page title, URL, or domain name</li>
                <li>Manual entries show images and descriptions</li>
                <li>Results appear instantly as you type</li>
                <li>Use specific keywords for better results (e.g., "pancake" for recipes)</li>
              </ul>
            </div>
          </div>
        ) : totalResults === 0 ? (
          <div className="no-results">
            <p>No results found for "{query}"</p>
            <p className="no-results-hint">Try different keywords or check your spelling</p>
          </div>
        ) : (
          displayResults()
        )}
      </div>
    </div>
  );
};

export default InstantSearch;
