import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Bookmarks from './components/Bookmarks';
import InstantSearch from './components/InstantSearch';
import SemanticSearch from './components/SemanticSearch';
import AddEntry from './components/AddEntry';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('ai-search');
  const [showSignup, setShowSignup] = useState(false);
  const { user, logout, loading } = useAuth();

  console.log('App render - loading:', loading, 'user:', user);

  if (loading) {
    console.log('Showing loading screen');
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log('No user, showing auth screen');
    return showSignup ? (
      <Signup onToggleLogin={() => setShowSignup(false)} />
    ) : (
      <Login onToggleSignup={() => setShowSignup(true)} />
    );
  }

  console.log('User authenticated, showing dashboard');

  return (
    <div className="App">
      <nav className="main-nav">
        <div className="nav-brand">
          <h2>History & Bookmarks Hub</h2>
        </div>
        <div className="nav-links">
          <button
            className={`nav-btn ${activeView === 'ai-search' ? 'active' : ''}`}
            onClick={() => setActiveView('ai-search')}
          >
            🧠 AI Search
          </button>
          <button
            className={`nav-btn ${activeView === 'search' ? 'active' : ''}`}
            onClick={() => setActiveView('search')}
          >
            Instant Search
          </button>
          <button
            className={`nav-btn ${activeView === 'add' ? 'active' : ''}`}
            onClick={() => setActiveView('add')}
          >
            Add Entry
          </button>
          <button
            className={`nav-btn ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => setActiveView('history')}
          >
            Browser History
          </button>
          <button
            className={`nav-btn ${activeView === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveView('bookmarks')}
          >
            Bookmarks
          </button>
        </div>
        <div className="user-menu">
          <span className="user-name">👤 {user.name}</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="main-content">
        {activeView === 'ai-search' && <SemanticSearch />}
        {activeView === 'search' && <InstantSearch />}
        {activeView === 'add' && <AddEntry />}
        {activeView === 'history' && <Dashboard />}
        {activeView === 'bookmarks' && <Bookmarks />}
      </div>

      {/* Sidebar for quick guide */}
      <Sidebar />
    </div>
  );
}

export default App;
