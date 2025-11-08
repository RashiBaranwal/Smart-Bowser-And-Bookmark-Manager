import { useState, useEffect } from 'react';
import { browserHistoryAPI } from '../services/api';
import SearchBar from './SearchBar';
import './Dashboard.css';

const Dashboard = () => {
  const [browserHistory, setBrowserHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch browser history
  const fetchBrowserHistory = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await browserHistoryAPI.getAll(filters);
      setBrowserHistory(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch browser history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await browserHistoryAPI.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchBrowserHistory();
    fetchStats();

    // Auto-refresh every 10 seconds to get real-time updates
    const interval = setInterval(() => {
      fetchBrowserHistory();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle filter/search
  const handleFilter = (filters) => {
    fetchBrowserHistory(filters);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await browserHistoryAPI.delete(id);
      fetchBrowserHistory();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all browser history from the database?')) {
      try {
        await browserHistoryAPI.deleteAll();
        fetchBrowserHistory();
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
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Browser History Retriever</h1>
        <p>Track and manage your browsing history in real-time</p>
      </header>

      <SearchBar onFilter={handleFilter} />

      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Visits</h3>
            <p className="stat-value">{stats.totalVisits}</p>
          </div>
          <div className="stat-card">
            <h3>Top Domains</h3>
            <p className="stat-value">{stats.topDomains.length}</p>
          </div>
          <div className="stat-card">
            <h3>Recent Activity</h3>
            <p className="stat-value">
              {stats.recentVisits.length > 0 ? 'Active' : 'No activity'}
            </p>
          </div>
        </div>
      )}

      <div className="history-section">
        <div className="history-header">
          <h2>Browser History ({browserHistory.length})</h2>
          {browserHistory.length > 0 && (
            <button className="clear-btn" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : browserHistory.length === 0 ? (
          <div className="empty-state">
            <p>No browser history found. Install the Chrome extension to start tracking!</p>
          </div>
        ) : (
          <div className="history-list">
            {browserHistory.map((item) => (
              <div key={item._id} className="history-item">
                <div className="history-favicon">
                  {item.favicon && (
                    <img src={item.favicon} alt="" width="24" height="24" />
                  )}
                </div>
                <div className="history-content">
                  <h3 className="history-title">{item.title}</h3>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="history-url"
                  >
                    {item.url}
                  </a>
                  <div className="history-meta">
                    <span className="domain-badge">{item.domain}</span>
                    <span className="timestamp">{formatDate(item.visitTime)}</span>
                    {item.visitCount > 1 && (
                      <span className="visit-count">Visited {item.visitCount}x</span>
                    )}
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

export default Dashboard;
