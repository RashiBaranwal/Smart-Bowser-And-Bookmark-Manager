import { GoogleGenerativeAI } from '@google/generative-ai';

class EmbeddingService {
  constructor() {
    this.genAI = null;
    this.initialized = false;
  }

  initialize(apiKey) {
    if (!apiKey) {
      throw new Error('Google API key is required for embedding service');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.initialized = true;
  }

  async generateEmbedding(text) {
    if (!this.initialized) {
      throw new Error('Embedding service not initialized. Call initialize() first.');
    }

    try {
      // Use text-embedding-004 model (latest Gemini embedding model)
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });

      // Clean and truncate text if needed (max ~10k tokens)
      const cleanText = text.trim().substring(0, 40000);

      const result = await model.embedContent(cleanText);
      const embedding = result.embedding;

      return embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async generateBatchEmbeddings(texts) {
    if (!this.initialized) {
      throw new Error('Embedding service not initialized. Call initialize() first.');
    }

    try {
      const embeddings = [];

      // Process in batches to avoid rate limits
      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return embeddings;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  // Helper method to create searchable text from content
  createSearchableText(title, description, content, url = '', keywords = []) {
    const parts = [
      title || '',
      description || '',
      content || '',
      keywords.join(' ') || '',
      url || ''
    ];

    return parts.filter(p => p).join(' ').trim();
  }
}

// Create singleton instance
const embeddingService = new EmbeddingService();

export default embeddingService;
