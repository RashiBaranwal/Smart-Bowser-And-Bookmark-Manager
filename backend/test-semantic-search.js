// Test script for semantic search functionality
// Run with: node test-semantic-search.js

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('blue', '\n=== Testing Health Check ===');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    log('green', '✓ Server is running');
    log('yellow', `Services status: ${JSON.stringify(response.data.services, null, 2)}`);
    return response.data.services;
  } catch (error) {
    log('red', '✗ Server is not running or unreachable');
    log('red', 'Please start the server with: npm run dev');
    process.exit(1);
  }
}

async function testIngestURL() {
  log('blue', '\n=== Testing URL Ingestion ===');
  try {
    const response = await axios.post(`${API_BASE}/semantic-content/ingest/url`, {
      url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
      category: 'Technology'
    });

    if (response.data.success) {
      log('green', '✓ Successfully ingested URL');
      log('yellow', `Title: ${response.data.data.title}`);
      log('yellow', `Content Type: ${response.data.data.contentType}`);
      log('yellow', `Category: ${response.data.data.category}`);
      log('yellow', `Word Count: ${response.data.data.metadata.wordCount}`);
      log('yellow', `Indexed: ${response.data.data.isIndexed}`);
      return response.data.data._id;
    }
  } catch (error) {
    log('red', `✗ Error ingesting URL: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testIngestText() {
  log('blue', '\n=== Testing Text Ingestion ===');
  try {
    const response = await axios.post(`${API_BASE}/semantic-content/ingest/text`, {
      title: 'Machine Learning Basics',
      text: 'Machine learning is a subset of artificial intelligence that focuses on building systems that can learn from data. It includes supervised learning, unsupervised learning, and reinforcement learning. Popular algorithms include neural networks, decision trees, and support vector machines.',
      category: 'Technology'
    });

    if (response.data.success) {
      log('green', '✓ Successfully ingested text');
      log('yellow', `Title: ${response.data.data.title}`);
      log('yellow', `Category: ${response.data.data.category}`);
      log('yellow', `Keywords: ${response.data.data.keywords.join(', ')}`);
      return response.data.data._id;
    }
  } catch (error) {
    log('red', `✗ Error ingesting text: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testSemanticSearch() {
  log('blue', '\n=== Testing Semantic Search ===');
  try {
    const response = await axios.post(`${API_BASE}/semantic-search`, {
      query: 'What is machine learning and AI?',
      limit: 5,
      rerank: false,
      summarize: false
    });

    if (response.data.success) {
      log('green', `✓ Found ${response.data.count} results`);
      response.data.results.forEach((result, idx) => {
        log('yellow', `\n[${idx + 1}] ${result.title}`);
        log('yellow', `    Score: ${result.score.toFixed(4)}`);
        log('yellow', `    Type: ${result.contentType}`);
        log('yellow', `    Category: ${result.category}`);
      });
    }
  } catch (error) {
    log('red', `✗ Error in semantic search: ${error.response?.data?.error || error.message}`);
  }
}

async function testSemanticSearchWithReranking() {
  log('blue', '\n=== Testing Semantic Search with Re-ranking ===');
  try {
    const response = await axios.post(`${API_BASE}/semantic-search`, {
      query: 'artificial intelligence and neural networks',
      limit: 3,
      rerank: true,
      summarize: false
    });

    if (response.data.success) {
      log('green', `✓ Found ${response.data.count} re-ranked results`);
      response.data.results.forEach((result, idx) => {
        log('yellow', `\n[${idx + 1}] ${result.title}`);
        log('yellow', `    Score: ${result.score.toFixed(4)}`);
      });
    }
  } catch (error) {
    log('red', `✗ Error in re-ranking: ${error.response?.data?.error || error.message}`);
  }
}

async function testQuestionAnswering() {
  log('blue', '\n=== Testing Question Answering ===');
  try {
    const response = await axios.post(`${API_BASE}/semantic-search/ask`, {
      question: 'What are the main types of machine learning?',
      limit: 3
    });

    if (response.data.success) {
      log('green', '✓ Question answered successfully');
      log('yellow', `\nQuestion: ${response.data.question}`);
      log('yellow', `\nAnswer: ${response.data.answer}`);
      log('yellow', `\nSources (${response.data.sources.length}):`);
      response.data.sources.forEach((source, idx) => {
        log('yellow', `  ${idx + 1}. ${source.title} (score: ${source.score.toFixed(4)})`);
      });
    }
  } catch (error) {
    log('red', `✗ Error answering question: ${error.response?.data?.error || error.message}`);
  }
}

async function testHybridSearch() {
  log('blue', '\n=== Testing Hybrid Search ===');
  try {
    const response = await axios.post(`${API_BASE}/semantic-search/hybrid`, {
      query: 'machine learning',
      limit: 5,
      semanticWeight: 0.7
    });

    if (response.data.success) {
      log('green', `✓ Found ${response.data.count} hybrid results`);
      response.data.results.forEach((result, idx) => {
        log('yellow', `\n[${idx + 1}] ${result.title}`);
        log('yellow', `    Final Score: ${result.score.toFixed(4)}`);
        log('yellow', `    Semantic: ${result.semanticScore.toFixed(4)} | Keyword: ${result.keywordScore.toFixed(4)}`);
      });
    }
  } catch (error) {
    log('red', `✗ Error in hybrid search: ${error.response?.data?.error || error.message}`);
  }
}

async function testStats() {
  log('blue', '\n=== Testing Statistics ===');
  try {
    const response = await axios.get(`${API_BASE}/semantic-content/stats`);

    if (response.data.success) {
      log('green', '✓ Statistics retrieved');
      log('yellow', `Total Content: ${response.data.data.totalContent}`);
      log('yellow', `Indexed Content: ${response.data.data.indexedContent}`);
      log('yellow', `Vector Count: ${response.data.data.vectorCount}`);
      log('yellow', '\nBy Type:');
      response.data.data.byType.forEach(type => {
        log('yellow', `  ${type._id}: ${type.count}`);
      });
      log('yellow', '\nBy Category:');
      response.data.data.byCategory.forEach(cat => {
        log('yellow', `  ${cat._id}: ${cat.count}`);
      });
    }
  } catch (error) {
    log('red', `✗ Error getting stats: ${error.response?.data?.error || error.message}`);
  }
}

// Main test runner
async function runTests() {
  log('blue', '\n========================================');
  log('blue', '  SEMANTIC SEARCH SYSTEM TEST SUITE');
  log('blue', '========================================');

  // Check health
  const services = await testHealthCheck();

  if (!services.embedding || !services.vectorDB || !services.llm) {
    log('yellow', '\n⚠️  WARNING: Some services are not initialized');
    log('yellow', 'Please ensure:');
    log('yellow', '1. GOOGLE_API_KEY is set in .env');
    log('yellow', '2. ChromaDB is running (chroma run --host localhost --port 8000)');

    if (!services.vectorDB) {
      log('red', '\n✗ ChromaDB is not running. Exiting tests.');
      log('yellow', 'Start ChromaDB with: chroma run --host localhost --port 8000');
      process.exit(1);
    }
  }

  // Wait a bit for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Run tests
  await testIngestText();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testIngestURL();
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for processing

  await testStats();
  await testSemanticSearch();
  await testSemanticSearchWithReranking();
  await testQuestionAnswering();
  await testHybridSearch();

  log('blue', '\n========================================');
  log('green', '  ALL TESTS COMPLETED!');
  log('blue', '========================================\n');
}

// Run the tests
runTests().catch(error => {
  log('red', `\nFatal error: ${error.message}`);
  process.exit(1);
});
