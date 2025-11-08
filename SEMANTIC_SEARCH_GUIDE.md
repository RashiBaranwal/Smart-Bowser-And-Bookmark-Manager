# Semantic Search System - Setup & Usage Guide

## Overview

Your history-retriever-app now has advanced semantic search capabilities! This system enables natural-language search across multiple content types using Google's Gemini AI (free) and ChromaDB vector database.

## Features

### Content Ingestion
- **Web Pages**: Automatically scrapes and extracts text from URLs
- **PDFs**: Extracts text from PDF documents
- **Images**: Uses OCR (Tesseract) to extract text from images
- **Notes**: Process plain text and notes

### Semantic Search
- **Natural Language Queries**: Search using questions like "articles about AI saved last month"
- **Embeddings**: Uses Google's text-embedding-004 model (free, high-quality)
- **Vector Database**: ChromaDB for fast similarity search
- **Hybrid Search**: Combines semantic and keyword search
- **Date Filtering**: Filter by date ranges
- **Content Type Filtering**: Filter by webpage, PDF, image, or note
- **Category Filtering**: Auto-categorizes content using AI

### AI-Powered Features
- **Re-ranking**: LLM-based result re-ranking for better relevance
- **Summarization**: Automatic summaries of search results
- **Question Answering**: Ask questions and get answers from your saved content
- **Similar Content**: Find related documents
- **Auto-categorization**: Automatically categorize content
- **Keyword Extraction**: Extract keywords using AI

## Setup Instructions

### 1. Install ChromaDB

ChromaDB is required for vector storage. Install it:

**Using pip (Python):**
```bash
pip install chromadb
```

**Then start the ChromaDB server:**
```bash
chroma run --host localhost --port 8000
```

Keep this running in a separate terminal window.

**Alternative - Using Docker:**
```bash
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

### 2. Get Google Gemini API Key (FREE!)

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 3. Update Environment Variables

Edit `backend/.env` and add your Google API key:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/history-retriever

# Replace with your actual API key
GOOGLE_API_KEY=your_actual_api_key_here
```

### 4. Start the Backend

```bash
cd backend
npm run dev
```

You should see:
```
✓ Embedding service initialized
✓ LLM service initialized
✓ Vector database initialized
Server is running on port 5000
```

## API Endpoints

### Content Ingestion

#### 1. Ingest from URL
```bash
POST /api/semantic-content/ingest/url
Content-Type: application/json

{
  "url": "https://example.com/article",
  "category": "Technology",  // optional
  "keywords": ["ai", "ml"]   // optional
}
```

#### 2. Ingest File (PDF, Image)
```bash
POST /api/semantic-content/ingest/file
Content-Type: multipart/form-data

file: [PDF or image file]
category: "Technology"  // optional
keywords: "ai,ml"       // optional
title: "Custom Title"   // optional
description: "..."      // optional
```

#### 3. Ingest Text/Note
```bash
POST /api/semantic-content/ingest/text
Content-Type: application/json

{
  "title": "My Note",
  "text": "Content goes here...",
  "description": "Optional description",
  "category": "Personal",
  "keywords": ["note", "idea"]
}
```

### Semantic Search

#### 1. Natural Language Search
```bash
POST /api/semantic-search
Content-Type: application/json

{
  "query": "articles about machine learning from last month",
  "limit": 10,
  "contentType": "webpage",     // optional: webpage, pdf, image, note
  "category": "Technology",      // optional
  "startDate": "2025-10-01",     // optional
  "endDate": "2025-11-01",       // optional
  "rerank": true,                // optional: LLM re-ranking
  "summarize": true              // optional: generate summary
}
```

**Response:**
```json
{
  "success": true,
  "query": "articles about machine learning",
  "count": 5,
  "summary": "You have saved several ML articles...",
  "results": [
    {
      "score": 0.95,
      "title": "Introduction to Machine Learning",
      "description": "...",
      "url": "...",
      "contentType": "webpage",
      "category": "Technology",
      "dateAdded": "2025-10-15T..."
    }
  ]
}
```

#### 2. Ask a Question
```bash
POST /api/semantic-search/ask
Content-Type: application/json

{
  "question": "What did I save about neural networks?",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "question": "What did I save about neural networks?",
  "answer": "Based on your saved content, you have...",
  "sources": [
    {
      "title": "Neural Network Basics",
      "url": "...",
      "contentType": "webpage",
      "score": 0.92
    }
  ]
}
```

#### 3. Hybrid Search (Semantic + Keyword)
```bash
POST /api/semantic-search/hybrid
Content-Type: application/json

{
  "query": "python tutorials",
  "limit": 10,
  "semanticWeight": 0.7  // 0-1, weight for semantic vs keyword
}
```

#### 4. Find Similar Content
```bash
GET /api/semantic-search/similar/{content_id}?limit=10
```

### Other Endpoints

#### Get All Content
```bash
GET /api/semantic-content?contentType=webpage&category=Technology&limit=100
```

#### Get Statistics
```bash
GET /api/semantic-content/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalContent": 150,
    "indexedContent": 150,
    "vectorCount": 150,
    "byType": [
      { "_id": "webpage", "count": 80 },
      { "_id": "pdf", "count": 40 },
      { "_id": "image", "count": 20 },
      { "_id": "note", "count": 10 }
    ],
    "byCategory": [
      { "_id": "Technology", "count": 90 },
      { "_id": "Science", "count": 30 }
    ]
  }
}
```

#### Delete Content
```bash
DELETE /api/semantic-content/{content_id}
```

## Usage Examples

### Example 1: Save a Web Article
```javascript
const response = await fetch('http://localhost:5000/api/semantic-content/ingest/url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://blog.example.com/ai-trends-2025'
  })
});

const data = await response.json();
console.log('Saved:', data.data.title);
```

### Example 2: Upload a PDF
```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('category', 'Research');

const response = await fetch('http://localhost:5000/api/semantic-content/ingest/file', {
  method: 'POST',
  body: formData
});
```

### Example 3: Semantic Search
```javascript
const response = await fetch('http://localhost:5000/api/semantic-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'machine learning tutorials for beginners',
    limit: 5,
    rerank: true,
    summarize: true
  })
});

const data = await response.json();
console.log('Summary:', data.summary);
console.log('Results:', data.results);
```

### Example 4: Ask a Question
```javascript
const response = await fetch('http://localhost:5000/api/semantic-search/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'What are the best practices for React hooks?'
  })
});

const data = await response.json();
console.log('Answer:', data.answer);
console.log('Sources:', data.sources);
```

## How It Works

1. **Content Ingestion:**
   - Content is processed (web scraping, PDF parsing, or OCR)
   - AI extracts keywords and categorizes content
   - Text is converted to embeddings using Gemini's text-embedding-004
   - Embeddings are stored in ChromaDB
   - Metadata is stored in MongoDB

2. **Semantic Search:**
   - Query is converted to embedding
   - ChromaDB finds similar embeddings (cosine similarity)
   - Results are filtered by date, type, category
   - Optional: LLM re-ranks results for better relevance
   - Optional: LLM generates summary

3. **Question Answering:**
   - Query is converted to embedding
   - Top similar documents are retrieved
   - LLM uses retrieved content to answer the question

## Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Embedding      │ ──> Google Gemini
│  Service        │     text-embedding-004
└────────┬────────┘
         │
         v
┌─────────────────┐
│   ChromaDB      │ ──> Vector Search
│  (Vector DB)    │     Cosine Similarity
└────────┬────────┘
         │
         v
┌─────────────────┐
│   MongoDB       │ ──> Full Content
│  (Metadata)     │     + Metadata
└────────┬────────┘
         │
         v
┌─────────────────┐
│   LLM Service   │ ──> Google Gemini
│  (Optional)     │     Re-rank, Summarize
└─────────────────┘
```

## Tips & Best Practices

1. **Keep ChromaDB Running**: The vector database must be running for semantic search to work

2. **API Key**: The Google Gemini API is free but has rate limits. For production, consider upgrading.

3. **Content Quality**: Better quality input = better search results
   - Add descriptions when possible
   - Include relevant keywords
   - Categorize content appropriately

4. **Search Strategies**:
   - Use semantic search for conceptual queries
   - Use hybrid search for specific terms + concepts
   - Use re-ranking for better relevance (but slower)

5. **Performance**:
   - Embedding generation: ~1-2 seconds per document
   - Vector search: Very fast (milliseconds)
   - LLM operations: 2-5 seconds

## Troubleshooting

### ChromaDB Not Running
```
Error: Vector database is not available
```
**Solution**: Start ChromaDB: `chroma run --host localhost --port 8000`

### API Key Issues
```
Error: Google API key is required
```
**Solution**: Add `GOOGLE_API_KEY` to `.env` file

### Rate Limiting
```
Error: Resource exhausted
```
**Solution**: Wait a moment and try again. Free tier has limits.

### OCR Not Working
```
Error: Failed to process image
```
**Solution**: Ensure image is clear and has readable text. Supported formats: JPG, PNG, GIF, BMP, TIFF

## Next Steps

1. **Build a Frontend**: Create a UI for the semantic search functionality
2. **Auto-Index Existing Content**: Index your browser history and bookmarks
3. **Chrome Extension Integration**: Add semantic search to the extension
4. **Scheduled Indexing**: Automatically index new content

## Technologies Used

- **Google Gemini AI**: Free embeddings (text-embedding-004) and LLM (gemini-1.5-flash)
- **ChromaDB**: Open-source vector database
- **Tesseract.js**: OCR for images
- **Cheerio**: Web scraping
- **pdf-parse**: PDF text extraction
- **MongoDB**: Metadata storage
- **Express.js**: API server

## Cost

**Everything is FREE!** ✨
- Google Gemini API: Free tier (generous limits)
- ChromaDB: Open source, free
- Tesseract: Open source, free
- All other tools: Open source

---

Built with Google Gemini AI + ChromaDB
