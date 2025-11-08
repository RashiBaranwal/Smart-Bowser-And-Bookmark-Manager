// Setup checker script
// Run with: node check-setup.js

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

async function checkMongoDBConnection() {
  try {
    const mongoose = await import('mongoose');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/history-retriever';

    await mongoose.default.connect(uri);
    log('green', '✓', 'MongoDB is running and accessible');
    await mongoose.default.disconnect();
    return true;
  } catch (error) {
    log('red', '✗', 'MongoDB is not accessible');
    log('yellow', '→', 'Please start MongoDB:');
    log('yellow', '  ', '  Windows: mongod');
    log('yellow', '  ', '  Mac/Linux: brew services start mongodb-community');
    return false;
  }
}

async function checkChromaDB() {
  try {
    const response = await axios.get('http://localhost:8000/api/v1/heartbeat', { timeout: 3000 });
    log('green', '✓', 'ChromaDB is running');
    return true;
  } catch (error) {
    log('red', '✗', 'ChromaDB is not running');
    log('yellow', '→', 'Please start ChromaDB in a separate terminal:');
    log('yellow', '  ', '  pip install chromadb');
    log('yellow', '  ', '  chroma run --host localhost --port 8000');
    log('yellow', '→', 'Alternative (if chroma command not found):');
    log('yellow', '  ', '  python -m chromadb.cli run --host localhost --port 8000');
    log('yellow', '→', 'Or use Docker:');
    log('yellow', '  ', '  docker run -p 8000:8000 chromadb/chroma');
    return false;
  }
}

async function checkGoogleAPIKey() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey === 'your_google_api_key_here') {
    log('red', '✗', 'Google API Key not configured');
    log('yellow', '→', 'Get a FREE API key:');
    log('yellow', '  ', '  1. Visit: https://aistudio.google.com/app/apikey');
    log('yellow', '  ', '  2. Sign in with Google');
    log('yellow', '  ', '  3. Click "Create API Key"');
    log('yellow', '  ', '  4. Add to backend/.env:');
    log('yellow', '  ', '     GOOGLE_API_KEY=your_actual_key_here');
    return false;
  }

  log('green', '✓', 'Google API Key is configured');
  return true;
}

async function checkAllDependencies() {
  console.log('\n' + colors.blue + '='.repeat(50) + colors.reset);
  console.log(colors.blue + '  Semantic Search System - Setup Checker' + colors.reset);
  console.log(colors.blue + '='.repeat(50) + colors.reset + '\n');

  const checks = {
    mongodb: await checkMongoDBConnection(),
    chromadb: await checkChromaDB(),
    apiKey: await checkGoogleAPIKey()
  };

  console.log('\n' + colors.blue + '='.repeat(50) + colors.reset);

  const allPassed = Object.values(checks).every(c => c);

  if (allPassed) {
    log('green', '✓', 'All checks passed! You\'re ready to start the server.');
    log('blue', '→', 'Start the server with: npm run dev');
  } else {
    log('yellow', '⚠', 'Some checks failed. Please fix the issues above.');

    if (!checks.chromadb) {
      log('yellow', 'ℹ', 'Note: The server will still start without ChromaDB,');
      log('yellow', ' ', '      but semantic search features will be disabled.');
    }
  }

  console.log(colors.blue + '='.repeat(50) + colors.reset + '\n');

  process.exit(allPassed ? 0 : 1);
}

checkAllDependencies();
