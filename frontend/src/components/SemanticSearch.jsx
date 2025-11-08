import { useState } from 'react';
import axios from 'axios';
import './SemanticSearch.css';

const API_BASE = 'http://localhost:5000/api';

function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [question, setQuestion] = useState('');
  const [results, setResults] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  const handleSemanticSearch = async () => {
    if (!query.trim()) {
      alert('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/semantic-search`, {
        query,
        limit: 10,
        summarize: false,
        rerank: false
      });

      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/semantic-search/ask`, {
        question,
        limit: 5
      });

      setAnswer(response.data);
    } catch (error) {
      console.error('Question error:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      if (type === 'search') handleSemanticSearch();
      else handleAskQuestion();
    }
  };

  return (
    <div className="semantic-search-container">
      <div className="semantic-header">
        <h2>🧠 AI-Powered Smart Search</h2>
        <p className="semantic-subtitle">
          Search your browsing history, bookmarks, and saved content using natural language
        </p>
      </div>

      <div className="semantic-tabs">
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Semantic Search
        </button>
        <button
          className={`tab-btn ${activeTab === 'ask' ? 'active' : ''}`}
          onClick={() => setActiveTab('ask')}
        >
          💬 Ask Questions
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              className="semantic-input"
              placeholder="Try: 'I want to make burger' or 'machine learning tutorials'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'search')}
            />
            <button
              className="semantic-btn"
              onClick={handleSemanticSearch}
              disabled={loading}
            >
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
          </div>

          <div className="search-examples">
            <span className="example-label">Try:</span>
            <button className="example-btn" onClick={() => setQuery('I want to make burger')}>
              "I want to make burger"
            </button>
            <button className="example-btn" onClick={() => setQuery('programming tutorials')}>
              "programming tutorials"
            </button>
            <button className="example-btn" onClick={() => setQuery('healthy recipes')}>
              "healthy recipes"
            </button>
          </div>

          {results && (
            <div className="results-container">
              <div className="results-header">
                <h3>Found {results.count} result{results.count !== 1 ? 's' : ''}</h3>
                {results.summary && (
                  <div className="summary-box">
                    <strong>Summary:</strong> {results.summary}
                  </div>
                )}
              </div>

              <div className="results-list">
                {results.results.map((result, index) => (
                  <div key={result._id || index} className="result-card">
                    <div className="result-header">
                      <div className="result-title-row">
                        {result.favicon && (
                          <img
                            src={result.favicon}
                            alt=""
                            className="result-favicon"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <h4>{result.title}</h4>
                      </div>
                      <span className="result-score">
                        Match: {(result.score * 100).toFixed(0)}%
                      </span>
                    </div>

                    {result.description && (
                      <p className="result-description">{result.description}</p>
                    )}

                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="result-url"
                      >
                        {result.url}
                      </a>
                    )}

                    <div className="result-meta">
                      <span className="meta-badge">{result.contentType}</span>
                      <span className="meta-badge">{result.category}</span>
                      {result.dateAdded && (
                        <span className="meta-date">
                          {new Date(result.dateAdded).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ask' && (
        <div className="ask-section">
          <div className="search-input-group">
            <input
              type="text"
              className="semantic-input"
              placeholder="Ask: 'What did I save about machine learning?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'ask')}
            />
            <button
              className="semantic-btn"
              onClick={handleAskQuestion}
              disabled={loading}
            >
              {loading ? 'Thinking...' : '💬 Ask'}
            </button>
          </div>

          <div className="search-examples">
            <span className="example-label">Try:</span>
            <button className="example-btn" onClick={() => setQuestion('What did I save about programming?')}>
              "What did I save about programming?"
            </button>
            <button className="example-btn" onClick={() => setQuestion('Tell me about AI')}>
              "Tell me about AI"
            </button>
          </div>

          {answer && (
            <div className="answer-container">
              <div className="answer-box">
                <h3>Answer:</h3>
                <p className="answer-text">{answer.answer}</p>
              </div>

              {answer.sources && answer.sources.length > 0 && (
                <div className="sources-box">
                  <h4>Sources ({answer.sources.length}):</h4>
                  <ul className="sources-list">
                    {answer.sources.map((source, index) => (
                      <li key={index} className="source-item">
                        <strong>{source.title}</strong>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-link"
                          >
                            Open
                          </a>
                        )}
                        <span className="source-score">
                          {(source.score * 100).toFixed(0)}% match
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!results && !answer && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Smart AI Search</h3>
          <p>
            Search using natural language! The AI understands what you mean, not just keywords.
          </p>
          <div className="tips-box">
            <h4>Tips:</h4>
            <ul>
              <li>Use complete sentences: "I want to make burger"</li>
              <li>Ask questions: "What is machine learning?"</li>
              <li>Be specific: "healthy vegetarian recipes"</li>
              <li>Works on your browsing history and bookmarks!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default SemanticSearch;
