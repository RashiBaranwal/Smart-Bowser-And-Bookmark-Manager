import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import browserHistoryRoutes from './routes/browserHistory.js';
import bookmarkRoutes from './routes/bookmark.js';
import manualEntryRoutes from './routes/manualEntry.js';
import semanticContentRoutes from './routes/semanticContent.js';
import semanticSearchRoutes from './routes/semanticSearch.js';

// Import services
import embeddingService from './services/embeddingService.js';
import vectorDatabaseService from './services/vectorDatabaseService.js';
import llmService from './services/llmService.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize AI services
async function initializeServices() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  GOOGLE_API_KEY not found in environment variables.');
    console.warn('⚠️  Semantic search features will be disabled.');
    console.warn('⚠️  Please add GOOGLE_API_KEY to your .env file to enable AI features.');
    return;
  }

  try {
    // Initialize embedding service
    embeddingService.initialize(apiKey);
    console.log('✓ Embedding service initialized');

    // Initialize LLM service
    llmService.initialize(apiKey);
    console.log('✓ LLM service initialized');

    // Initialize vector database
    await vectorDatabaseService.initialize('second_brain_content');
    console.log('✓ Vector database initialized');
  } catch (error) {
    console.error('Error initializing services:', error.message);
    console.warn('⚠️  Some semantic search features may not be available.');
  }
}

// Initialize services
initializeServices();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/browser-history', browserHistoryRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/manual-entries', manualEntryRoutes);
app.use('/api/semantic-content', semanticContentRoutes);
app.use('/api/semantic-search', semanticSearchRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    services: {
      embedding: embeddingService.initialized,
      vectorDB: vectorDatabaseService.isInitialized(),
      llm: llmService.initialized
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
