import express from 'express';
import SemanticContent from '../models/SemanticContent.js';
import embeddingService from '../services/embeddingService.js';
import vectorDatabaseService from '../services/vectorDatabaseService.js';
import llmService from '../services/llmService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Semantic search with natural language query
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      query,
      limit = 10,
      contentType,
      category,
      startDate,
      endDate,
      rerank = false,
      summarize = false
    } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    if (!vectorDatabaseService.isInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Vector database is not available. Please ensure ChromaDB is running.'
      });
    }

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Search vector database
    let results;

    if (startDate || endDate) {
      results = await vectorDatabaseService.searchWithDateFilter(
        queryEmbedding,
        startDate,
        endDate,
        parseInt(limit) * 2 // Get more results for filtering
      );
    } else {
      results = await vectorDatabaseService.search(
        queryEmbedding,
        parseInt(limit) * 2
      );
    }

    // Apply additional filters
    let filteredResults = results;

    if (contentType) {
      filteredResults = filteredResults.filter(r => r.metadata.contentType === contentType);
    }

    if (category) {
      filteredResults = filteredResults.filter(r => r.metadata.category === category);
    }

    // Trim to limit
    filteredResults = filteredResults.slice(0, parseInt(limit));

    // Re-rank results using LLM if requested
    if (rerank && filteredResults.length > 0 && llmService.initialized) {
      try {
        filteredResults = await llmService.reRankResults(query, filteredResults, parseInt(limit));
      } catch (error) {
        console.error('Error re-ranking:', error);
      }
    }

    // Generate summary if requested
    let summary = null;
    if (summarize && filteredResults.length > 0 && llmService.initialized) {
      try {
        summary = await llmService.summarizeResults(query, filteredResults);
      } catch (error) {
        console.error('Error summarizing:', error);
      }
    }

    // Fetch full content from MongoDB (only user's content)
    const mongoIds = filteredResults.map(r => r.metadata.mongoId);
    const fullContent = await SemanticContent.find({
      _id: { $in: mongoIds },
      userId: req.userId
    });

    // Merge results
    const enrichedResults = filteredResults.map(r => {
      const mongoDoc = fullContent.find(c => c._id.toString() === r.metadata.mongoId);
      return {
        score: r.score,
        distance: r.distance,
        ...mongoDoc.toObject()
      };
    });

    res.json({
      success: true,
      query,
      count: enrichedResults.length,
      summary,
      results: enrichedResults
    });
  } catch (error) {
    console.error('Error performing semantic search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Answer question using semantic search + LLM
router.post('/ask', authenticateToken, async (req, res) => {
  try {
    const { question, limit = 5 } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    if (!vectorDatabaseService.isInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Vector database is not available.'
      });
    }

    if (!llmService.initialized) {
      return res.status(503).json({
        success: false,
        error: 'LLM service is not available.'
      });
    }

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(question);

    // Search vector database
    const results = await vectorDatabaseService.search(queryEmbedding, parseInt(limit));

    if (results.length === 0) {
      return res.json({
        success: true,
        question,
        answer: "I couldn't find any relevant content in your second brain to answer this question.",
        sources: []
      });
    }

    // Generate answer using LLM
    const answer = await llmService.answerQuestion(question, results);

    // Get source information
    const sources = results.map(r => ({
      title: r.metadata.title,
      url: r.metadata.url,
      contentType: r.metadata.contentType,
      score: r.score
    }));

    res.json({
      success: true,
      question,
      answer,
      sources
    });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Hybrid search (combine semantic + keyword)
router.post('/hybrid', authenticateToken, async (req, res) => {
  try {
    const {
      query,
      limit = 10,
      contentType,
      category,
      semanticWeight = 0.7 // Weight for semantic search vs keyword search
    } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    // Semantic search
    let semanticResults = [];
    if (vectorDatabaseService.isInitialized()) {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      semanticResults = await vectorDatabaseService.search(queryEmbedding, parseInt(limit) * 2);
    }

    // Keyword search in MongoDB (only user's content)
    let filter = {
      userId: req.userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { keywords: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    };

    if (contentType) {
      filter.contentType = contentType;
    }

    if (category) {
      filter.category = category;
    }

    const keywordResults = await SemanticContent.find(filter)
      .limit(parseInt(limit) * 2)
      .lean();

    // Merge and score results
    const combinedResults = new Map();

    // Add semantic results
    semanticResults.forEach(r => {
      const id = r.metadata.mongoId;
      combinedResults.set(id, {
        id,
        semanticScore: r.score * semanticWeight,
        keywordScore: 0,
        metadata: r.metadata
      });
    });

    // Add keyword results
    keywordResults.forEach((r, idx) => {
      const id = r._id.toString();
      const keywordScore = (1 - idx / keywordResults.length) * (1 - semanticWeight);

      if (combinedResults.has(id)) {
        combinedResults.get(id).keywordScore = keywordScore;
      } else {
        combinedResults.set(id, {
          id,
          semanticScore: 0,
          keywordScore,
          metadata: r
        });
      }
    });

    // Calculate final scores and sort
    const rankedResults = Array.from(combinedResults.values())
      .map(r => ({
        ...r,
        finalScore: r.semanticScore + r.keywordScore
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, parseInt(limit));

    // Fetch full content (only user's content)
    const mongoIds = rankedResults.map(r => r.id);
    const fullContent = await SemanticContent.find({
      _id: { $in: mongoIds },
      userId: req.userId
    });

    const enrichedResults = rankedResults.map(r => {
      const mongoDoc = fullContent.find(c => c._id.toString() === r.id);
      return {
        score: r.finalScore,
        semanticScore: r.semanticScore,
        keywordScore: r.keywordScore,
        ...mongoDoc.toObject()
      };
    });

    res.json({
      success: true,
      query,
      searchType: 'hybrid',
      count: enrichedResults.length,
      results: enrichedResults
    });
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search similar content
router.get('/similar/:id', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const content = await SemanticContent.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    if (!vectorDatabaseService.isInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Vector database is not available.'
      });
    }

    // Generate embedding for the content
    const searchableText = embeddingService.createSearchableText(
      content.title,
      content.description,
      content.content,
      content.url,
      content.keywords
    );

    const embedding = await embeddingService.generateEmbedding(searchableText);

    // Search for similar content
    const results = await vectorDatabaseService.search(embedding, parseInt(limit) + 1);

    // Filter out the original content
    const filteredResults = results.filter(r => r.metadata.mongoId !== req.params.id);

    // Fetch full content (only user's content)
    const mongoIds = filteredResults.map(r => r.metadata.mongoId);
    const fullContent = await SemanticContent.find({
      _id: { $in: mongoIds },
      userId: req.userId
    });

    const enrichedResults = filteredResults.map(r => {
      const mongoDoc = fullContent.find(c => c._id.toString() === r.metadata.mongoId);
      return {
        score: r.score,
        ...mongoDoc.toObject()
      };
    });

    res.json({
      success: true,
      sourceContent: {
        id: content._id,
        title: content.title
      },
      count: enrichedResults.length,
      results: enrichedResults
    });
  } catch (error) {
    console.error('Error finding similar content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
