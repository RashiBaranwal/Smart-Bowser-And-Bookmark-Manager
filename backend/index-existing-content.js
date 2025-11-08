// Script to index existing browser history and bookmarks into semantic search
// Run with: node index-existing-content.js

import dotenv from 'dotenv';
import connectDB from './config/db.js';
import BrowserHistory from './models/BrowserHistory.js';
import Bookmark from './models/Bookmark.js';
import SemanticContent from './models/SemanticContent.js';
import embeddingService from './services/embeddingService.js';
import vectorDatabaseService from './services/vectorDatabaseService.js';
import llmService from './services/llmService.js';

dotenv.config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function initializeServices() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    log('red', '✗ GOOGLE_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    embeddingService.initialize(apiKey);
    llmService.initialize(apiKey);
    await vectorDatabaseService.initialize('second_brain_content');
    log('green', '✓ Services initialized');
  } catch (error) {
    log('red', `✗ Failed to initialize services: ${error.message}`);
    process.exit(1);
  }
}

async function indexBrowserHistory() {
  log('blue', '\n=== Indexing Browser History ===');

  try {
    const history = await BrowserHistory.find().sort({ lastVisitTime: -1 });
    log('cyan', `Found ${history.length} history entries`);

    let indexed = 0;
    let skipped = 0;

    for (const item of history) {
      try {
        // Check if already indexed
        const existing = await SemanticContent.findOne({
          url: item.url,
          contentType: 'history'
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create searchable text
        const searchableText = embeddingService.createSearchableText(
          item.title || item.url,
          '',
          item.title || item.url,
          item.url,
          [item.domain]
        );

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(searchableText);

        // Save to MongoDB
        const content = await SemanticContent.create({
          title: item.title || item.url,
          description: `Visited ${item.visitCount} time(s)`,
          content: item.title || item.url,
          contentType: 'history',
          url: item.url,
          domain: item.domain,
          keywords: [item.domain],
          category: 'Web Browsing',
          sourceType: 'chrome_extension',
          metadata: {
            wordCount: (item.title || '').split(' ').length,
            language: 'en'
          },
          favicon: item.favicon,
          dateAdded: item.lastVisitTime
        });

        // Save to ChromaDB
        if (vectorDatabaseService.isInitialized()) {
          const vectorMetadata = {
            title: content.title,
            description: content.description,
            url: content.url,
            contentType: 'history',
            category: 'Web Browsing',
            dateAdded: content.dateAdded.toISOString(),
            mongoId: content._id.toString()
          };

          await vectorDatabaseService.addDocument(
            content._id.toString(),
            embedding,
            vectorMetadata,
            searchableText
          );

          content.vectorId = content._id.toString();
          content.isIndexed = true;
          await content.save();
        }

        indexed++;
        if (indexed % 10 === 0) {
          log('yellow', `  Indexed ${indexed}/${history.length}...`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        log('red', `  ✗ Error indexing ${item.url}: ${error.message}`);
      }
    }

    log('green', `✓ Indexed ${indexed} history entries (${skipped} already indexed)`);
    return indexed;

  } catch (error) {
    log('red', `✗ Error indexing browser history: ${error.message}`);
    return 0;
  }
}

async function indexBookmarks() {
  log('blue', '\n=== Indexing Bookmarks ===');

  try {
    const bookmarks = await Bookmark.find().sort({ dateAdded: -1 });
    log('cyan', `Found ${bookmarks.length} bookmarks`);

    let indexed = 0;
    let skipped = 0;

    for (const item of bookmarks) {
      try {
        // Check if already indexed
        const existing = await SemanticContent.findOne({
          url: item.url,
          contentType: 'bookmark'
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create searchable text
        const searchableText = embeddingService.createSearchableText(
          item.title,
          '',
          item.title,
          item.url,
          [item.domain, item.folder]
        );

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(searchableText);

        // Auto-categorize if LLM is available
        let category = 'Bookmarks';
        if (llmService.initialized) {
          try {
            category = await llmService.categorizeContent(item.title, '', item.title);
          } catch (error) {
            // Ignore categorization errors
          }
        }

        // Save to MongoDB
        const content = await SemanticContent.create({
          title: item.title,
          description: `Bookmark from folder: ${item.folder}`,
          content: item.title,
          contentType: 'bookmark',
          url: item.url,
          domain: item.domain,
          keywords: [item.domain, item.folder],
          category,
          sourceType: 'chrome_extension',
          metadata: {
            wordCount: item.title.split(' ').length,
            language: 'en'
          },
          favicon: item.favicon,
          dateAdded: item.dateAdded
        });

        // Save to ChromaDB
        if (vectorDatabaseService.isInitialized()) {
          const vectorMetadata = {
            title: content.title,
            description: content.description,
            url: content.url,
            contentType: 'bookmark',
            category: content.category,
            dateAdded: content.dateAdded.toISOString(),
            mongoId: content._id.toString()
          };

          await vectorDatabaseService.addDocument(
            content._id.toString(),
            embedding,
            vectorMetadata,
            searchableText
          );

          content.vectorId = content._id.toString();
          content.isIndexed = true;
          await content.save();
        }

        indexed++;
        if (indexed % 10 === 0) {
          log('yellow', `  Indexed ${indexed}/${bookmarks.length}...`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        log('red', `  ✗ Error indexing ${item.url}: ${error.message}`);
      }
    }

    log('green', `✓ Indexed ${indexed} bookmarks (${skipped} already indexed)`);
    return indexed;

  } catch (error) {
    log('red', `✗ Error indexing bookmarks: ${error.message}`);
    return 0;
  }
}

async function main() {
  log('blue', '\n========================================');
  log('blue', '  Index Browser History & Bookmarks');
  log('blue', '  Into Semantic Search System');
  log('blue', '========================================\n');

  try {
    // Connect to database
    await connectDB();
    log('green', '✓ Connected to MongoDB');

    // Initialize services
    await initializeServices();

    // Index browser history
    const historyCount = await indexBrowserHistory();

    // Index bookmarks
    const bookmarksCount = await indexBookmarks();

    // Show statistics
    log('blue', '\n========================================');
    log('green', '  Indexing Complete!');
    log('blue', '========================================');
    log('cyan', `Browser History Indexed: ${historyCount}`);
    log('cyan', `Bookmarks Indexed: ${bookmarksCount}`);
    log('cyan', `Total Indexed: ${historyCount + bookmarksCount}`);
    log('blue', '========================================\n');

    log('yellow', 'You can now search using natural language!');
    log('yellow', 'Example: "I want to make burger"');
    log('yellow', 'Try it at: http://localhost:5000/api/semantic-search\n');

    process.exit(0);

  } catch (error) {
    log('red', `\n✗ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the indexing
main();
