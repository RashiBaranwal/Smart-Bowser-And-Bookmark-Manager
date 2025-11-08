# Quick Start Guide - Semantic Search

Get your semantic search system running in 5 minutes!

## Prerequisites

- Node.js installed
- Python 3.7+ (for ChromaDB)
- MongoDB running

## Step-by-Step Setup

### 1. Install ChromaDB

```bash
pip install chromadb
```

**Note**: If you don't have Python/pip, you can install it from https://www.python.org/downloads/

### 2. Start ChromaDB Server

**IMPORTANT**: ChromaDB must be running before you start the backend server!

Open a new terminal and run:

```bash
chroma run --host localhost --port 8000
```

You should see:
```
Running Chroma
...
Chroma Server running on: http://localhost:8000
```

Keep this terminal open! ChromaDB must be running for semantic search to work.

**Troubleshooting**:
- If `chroma` command not found, try: `python -m chromadb.cli run --host localhost --port 8000`
- Or use Docker: `docker run -p 8000:8000 chromadb/chroma`

### 3. Get Google Gemini API Key (FREE)

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key

### 4. Configure Environment

Edit `backend/.env` and replace the placeholder:

```env
GOOGLE_API_KEY=your_actual_api_key_here
```

### 5. Check Your Setup (Optional but Recommended)

Before starting the server, verify everything is configured:

```bash
cd backend
npm run check
```

This will check if MongoDB, ChromaDB, and the API key are properly configured.

### 6. Start Backend Server

```bash
npm run dev
```

You should see:
```
✓ Embedding service initialized
✓ LLM service initialized
✓ Vector database initialized
Server is running on port 5000
MongoDB Connected: localhost
```

**Note**: The server will start even if ChromaDB isn't running, but semantic search features will be disabled. You'll see a warning message.

### 7. Test the System

Open a new terminal and run:

```bash
cd backend
node test-semantic-search.js
```

This will:
- Ingest sample content
- Perform semantic searches
- Test question answering
- Show statistics

## Quick Test with cURL

### Ingest a URL
```bash
curl -X POST http://localhost:5000/api/semantic-content/ingest/url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/Machine_learning"}'
```

### Search
```bash
curl -X POST http://localhost:5000/api/semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is machine learning?", "limit": 5}'
```

### Ask a Question
```bash
curl -X POST http://localhost:5000/api/semantic-search/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What did I save about machine learning?"}'
```

## What's Next?

1. Read the full guide: `SEMANTIC_SEARCH_GUIDE.md`
2. Build a frontend UI
3. Index your existing browser history and bookmarks
4. Integrate with the Chrome extension

## Troubleshooting

### "Vector database is not available"
→ Start ChromaDB: `chroma run --host localhost --port 8000`

### "Google API key is required"
→ Add your key to `backend/.env`

### "Server is not running"
→ Start backend: `cd backend && npm run dev`

## API Endpoints Summary

- `POST /api/semantic-content/ingest/url` - Ingest from URL
- `POST /api/semantic-content/ingest/file` - Upload file (PDF/image)
- `POST /api/semantic-content/ingest/text` - Save text/note
- `POST /api/semantic-search` - Semantic search
- `POST /api/semantic-search/ask` - Ask questions
- `POST /api/semantic-search/hybrid` - Hybrid search
- `GET /api/semantic-content/stats` - Get statistics

Full documentation in `SEMANTIC_SEARCH_GUIDE.md`

---

Happy searching! 🔍✨
