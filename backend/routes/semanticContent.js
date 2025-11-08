import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import SemanticContent from '../models/SemanticContent.js';
import embeddingService from '../services/embeddingService.js';
import vectorDatabaseService from '../services/vectorDatabaseService.js';
import contentProcessingService from '../services/contentProcessingService.js';
import llmService from '../services/llmService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|txt|gif|bmp|tiff|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and text files are allowed!'));
    }
  }
});

// Helper function to extract domain
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return '';
  }
}

// Ingest content from URL
router.post('/ingest/url', authenticateToken, async (req, res) => {
  try {
    const { url, category, keywords } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    // Process the web page
    const processedContent = await contentProcessingService.processWebPage(url);

    // Auto-categorize if not provided
    let finalCategory = category;
    if (!finalCategory && llmService.initialized) {
      finalCategory = await llmService.categorizeContent(
        processedContent.title,
        processedContent.description,
        processedContent.content
      );
    }

    // Extract keywords using LLM if not provided
    let finalKeywords = keywords || processedContent.keywords || [];
    if (finalKeywords.length === 0 && llmService.initialized) {
      finalKeywords = await llmService.extractKeywords(processedContent.content, 10);
    }

    const domain = extractDomain(url);

    // Create database entry with userId
    const content = await SemanticContent.create({
      userId: req.userId,
      title: processedContent.title,
      description: processedContent.description,
      content: processedContent.content,
      contentType: 'webpage',
      url,
      domain,
      keywords: finalKeywords,
      category: finalCategory || 'General',
      sourceType: 'manual',
      metadata: {
        wordCount: processedContent.wordCount,
        language: 'en'
      },
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    });

    // Generate embedding and store in vector DB
    if (vectorDatabaseService.isInitialized()) {
      try {
        const searchableText = embeddingService.createSearchableText(
          content.title,
          content.description,
          content.content,
          content.url,
          content.keywords
        );

        const embedding = await embeddingService.generateEmbedding(searchableText);

        const vectorMetadata = {
          title: content.title,
          description: content.description,
          url: content.url,
          contentType: content.contentType,
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
      } catch (error) {
        console.error('Error indexing content:', error);
      }
    }

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error ingesting URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ingest file (PDF, image)
router.post('/ingest/file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File is required' });
    }

    const { category, keywords, title, description } = req.body;
    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).substring(1);

    let processedContent;

    // Process based on file type
    if (fileType === 'pdf') {
      processedContent = await contentProcessingService.processPDF(filePath);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(fileType)) {
      processedContent = await contentProcessingService.processImage(filePath);
    } else if (fileType === 'txt') {
      const textContent = await fs.readFile(filePath, 'utf-8');
      processedContent = contentProcessingService.processPlainText(textContent, title, description);
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type' });
    }

    // Auto-categorize if not provided
    let finalCategory = category;
    if (!finalCategory && llmService.initialized) {
      finalCategory = await llmService.categorizeContent(
        processedContent.title,
        processedContent.description,
        processedContent.content
      );
    }

    // Extract keywords using LLM if not provided
    let finalKeywords = keywords ? (Array.isArray(keywords) ? keywords : keywords.split(',')) : [];
    if (finalKeywords.length === 0 && llmService.initialized) {
      finalKeywords = await llmService.extractKeywords(processedContent.content, 10);
    }

    // Create database entry with userId
    const content = await SemanticContent.create({
      userId: req.userId,
      title: title || processedContent.title,
      description: description || processedContent.description,
      content: processedContent.content,
      contentType: processedContent.contentType,
      keywords: finalKeywords,
      category: finalCategory || 'General',
      sourceType: 'manual',
      filePath,
      fileType,
      metadata: {
        wordCount: processedContent.wordCount,
        pageCount: processedContent.pageCount || 0,
        confidence: processedContent.confidence || 0,
        language: 'en'
      }
    });

    // Generate embedding and store in vector DB
    if (vectorDatabaseService.isInitialized()) {
      try {
        const searchableText = embeddingService.createSearchableText(
          content.title,
          content.description,
          content.content,
          '',
          content.keywords
        );

        const embedding = await embeddingService.generateEmbedding(searchableText);

        const vectorMetadata = {
          title: content.title,
          description: content.description,
          contentType: content.contentType,
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
      } catch (error) {
        console.error('Error indexing content:', error);
      }
    }

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error ingesting file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ingest plain text/note
router.post('/ingest/text', authenticateToken, async (req, res) => {
  try {
    const { title, description, text, category, keywords } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text content is required' });
    }

    const processedContent = contentProcessingService.processPlainText(text, title, description);

    // Auto-categorize if not provided
    let finalCategory = category;
    if (!finalCategory && llmService.initialized) {
      finalCategory = await llmService.categorizeContent(
        processedContent.title,
        processedContent.description,
        processedContent.content
      );
    }

    // Extract keywords using LLM if not provided
    let finalKeywords = keywords || [];
    if (finalKeywords.length === 0 && llmService.initialized) {
      finalKeywords = await llmService.extractKeywords(processedContent.content, 10);
    }

    // Create database entry with userId
    const content = await SemanticContent.create({
      userId: req.userId,
      title: processedContent.title,
      description: processedContent.description,
      content: processedContent.content,
      contentType: 'note',
      keywords: finalKeywords,
      category: finalCategory || 'General',
      sourceType: 'manual',
      metadata: {
        wordCount: processedContent.wordCount,
        language: 'en'
      }
    });

    // Generate embedding and store in vector DB
    if (vectorDatabaseService.isInitialized()) {
      try {
        const searchableText = embeddingService.createSearchableText(
          content.title,
          content.description,
          content.content,
          '',
          content.keywords
        );

        const embedding = await embeddingService.generateEmbedding(searchableText);

        const vectorMetadata = {
          title: content.title,
          description: content.description,
          contentType: content.contentType,
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
      } catch (error) {
        console.error('Error indexing content:', error);
      }
    }

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error ingesting text:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all semantic content
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { contentType, category, limit = 100 } = req.query;

    let filter = { userId: req.userId };

    if (contentType) {
      filter.contentType = contentType;
    }

    if (category) {
      filter.category = category;
    }

    const content = await SemanticContent.find(filter)
      .sort({ dateAdded: -1 })
      .limit(parseInt(limit))
      .select('-content'); // Exclude full content for performance

    res.json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalContent = await SemanticContent.countDocuments({ userId: req.userId });
    const indexedContent = await SemanticContent.countDocuments({ userId: req.userId, isIndexed: true });

    const byType = await SemanticContent.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$contentType', count: { $sum: 1 } } }
    ]);

    const byCategory = await SemanticContent.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const vectorCount = vectorDatabaseService.isInitialized()
      ? await vectorDatabaseService.getDocumentCount()
      : 0;

    res.json({
      success: true,
      data: {
        totalContent,
        indexedContent,
        vectorCount,
        byType,
        byCategory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete semantic content
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const content = await SemanticContent.findOne({ _id: req.params.id, userId: req.userId });

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    // Delete from vector DB if indexed
    if (content.isIndexed && vectorDatabaseService.isInitialized()) {
      try {
        await vectorDatabaseService.deleteDocument(content.vectorId);
      } catch (error) {
        console.error('Error deleting from vector DB:', error);
      }
    }

    // Delete file if exists
    if (content.filePath) {
      try {
        await fs.unlink(content.filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    await SemanticContent.findByIdAndDelete(req.params.id);

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
