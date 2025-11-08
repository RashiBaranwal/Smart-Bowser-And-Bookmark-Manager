import { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open guide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)}>
          {/* Sidebar Content */}
          <div className="sidebar" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              className="sidebar-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close guide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Sidebar Header */}
            <div className="sidebar-header">
              <h2>Quick Guide</h2>
              <p>Learn how to use all features</p>
            </div>

            {/* Sidebar Content */}
            <div className="sidebar-content">
              {/* Instant Search Guide */}
              <div className="guide-section">
                <div className="guide-icon">🔍</div>
                <h3>Instant Search</h3>
                <p>
                  The most powerful feature! Search across your browser history,
                  bookmarks, and manually saved links all at once.
                </p>
                <ul>
                  <li>Just start typing any keyword</li>
                  <li>Results appear instantly as you type</li>
                  <li>Use tabs to filter by type</li>
                  <li>Click any result to open it</li>
                </ul>
              </div>

              {/* Browser History Guide */}
              <div className="guide-section">
                <div className="guide-icon">🕐</div>
                <h3>Browser History</h3>
                <p>
                  View all your browsing activity tracked automatically by the
                  Chrome extension.
                </p>
                <ul>
                  <li>See pages you've visited</li>
                  <li>View visit counts</li>
                  <li>Filter by domain or keyword</li>
                  <li>Auto-updates every 10 seconds</li>
                </ul>
              </div>

              {/* Bookmarks Guide */}
              <div className="guide-section">
                <div className="guide-icon">⭐</div>
                <h3>Bookmarks</h3>
                <p>
                  All your Chrome bookmarks synced automatically with folder
                  organization maintained.
                </p>
                <ul>
                  <li>Search by keyword or folder</li>
                  <li>View bookmark folders</li>
                  <li>See when bookmarks were added</li>
                  <li>Real-time sync with Chrome</li>
                </ul>
              </div>

              {/* Manual Entries Guide */}
              <div className="guide-section">
                <div className="guide-icon">➕</div>
                <h3>Manual Entries</h3>
                <p>
                  Save custom links with images and descriptions for easy retrieval later.
                </p>
                <ul>
                  <li>Add any URL manually</li>
                  <li>Upload images (recipes, screenshots, etc.)</li>
                  <li>Add short descriptions</li>
                  <li>Search by keywords in title or description</li>
                </ul>
                <div className="guide-example">
                  <strong>Example:</strong> Save a pancake recipe with an image,
                  then search "pancake" to find it instantly!
                </div>
              </div>

              {/* Tips & Tricks */}
              <div className="guide-section tips">
                <div className="guide-icon">💡</div>
                <h3>Tips & Tricks</h3>
                <ul>
                  <li>Use specific keywords for better results</li>
                  <li>Search by domain name (e.g., "github.com")</li>
                  <li>Filter by folder in bookmarks view</li>
                  <li>Click URLs to open in new tabs</li>
                  <li>Use Manual Entries for important links you want to remember</li>
                </ul>
              </div>

              {/* Extension Info */}
              <div className="guide-section">
                <div className="guide-icon">🔌</div>
                <h3>Chrome Extension</h3>
                <p>
                  Make sure the Chrome extension is installed and active for
                  automatic tracking.
                </p>
                <ul>
                  <li>Tracks browsing in real-time</li>
                  <li>Syncs bookmarks automatically</li>
                  <li>Click extension icon for manual sync</li>
                  <li>All data stays on your local machine</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
