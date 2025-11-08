import { ChromaClient } from 'chromadb';

// Custom embedding function class that tells ChromaDB we're providing our own embeddings
class CustomEmbeddingFunction {
  constructor() {
    // This is a placeholder - we generate embeddings externally using Gemini
  }

  async generate(texts) {
    // This won't be called since we provide embeddings directly
    // But ChromaDB requires this method to exist
    return [];
  }
}

class VectorDatabaseService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.initialized = false;
  }

  async initialize(collectionName = 'second_brain_content') {
    try {
      // Try to connect to ChromaDB server
      const serverPath = process.env.CHROMA_SERVER_URL || 'http://localhost:8000';

      this.client = new ChromaClient({
        path: serverPath
      });

      console.log(`Attempting to connect to ChromaDB at ${serverPath}...`);

      // Test connection with heartbeat
      try {
        await this.client.heartbeat();
        console.log('✓ ChromaDB connection successful');
      } catch (error) {
        throw new Error(`Cannot connect to ChromaDB at ${serverPath}. Please ensure ChromaDB is running.`);
      }

      // Get or create collection with custom embedding function
      try {
        this.collection = await this.client.getOrCreateCollection({
          name: collectionName,
          embeddingFunction: new CustomEmbeddingFunction(),
          metadata: {
            description: 'Second Brain semantic search collection',
            'hnsw:space': 'cosine' // Use cosine similarity for embeddings
          }
        });
        console.log(`✓ ChromaDB collection "${collectionName}" initialized`);
      } catch (error) {
        console.error('Error creating collection:', error);
        throw error;
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ChromaDB:', error.message);
      console.warn('⚠️  ChromaDB is not running or not accessible at http://localhost:8000');
      console.warn('⚠️  Start ChromaDB with: python -m chromadb.cli run --host localhost --port 8000');
      console.warn('⚠️  Semantic search features will be disabled.');
      this.initialized = false;
    }
  }

  async addDocument(id, embedding, metadata, document) {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        metadatas: [metadata],
        documents: [document]
      });

      return { success: true, id };
    } catch (error) {
      console.error('Error adding document to vector DB:', error);
      throw new Error(`Failed to add document: ${error.message}`);
    }
  }

  async addDocuments(ids, embeddings, metadatas, documents) {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      await this.collection.add({
        ids,
        embeddings,
        metadatas,
        documents
      });

      return { success: true, count: ids.length };
    } catch (error) {
      console.error('Error adding documents to vector DB:', error);
      throw new Error(`Failed to add documents: ${error.message}`);
    }
  }

  async search(queryEmbedding, nResults = 10, filters = null) {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      const params = {
        queryEmbeddings: [queryEmbedding],
        nResults
      };

      // Add metadata filters if provided
      if (filters) {
        params.where = filters;
      }

      const results = await this.collection.query(params);

      // Format results
      return this.formatResults(results);
    } catch (error) {
      console.error('Error searching vector DB:', error);
      throw new Error(`Failed to search: ${error.message}`);
    }
  }

  async searchWithDateFilter(queryEmbedding, startDate, endDate, nResults = 10) {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: nResults * 2, // Get more results to filter
      });

      // Format and filter by date
      const formattedResults = this.formatResults(results);

      if (startDate || endDate) {
        return formattedResults.filter(result => {
          const dateAdded = new Date(result.metadata.dateAdded);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();

          return dateAdded >= start && dateAdded <= end;
        }).slice(0, nResults);
      }

      return formattedResults;
    } catch (error) {
      console.error('Error searching with date filter:', error);
      throw new Error(`Failed to search with date filter: ${error.message}`);
    }
  }

  formatResults(results) {
    const formatted = [];

    if (!results.ids || results.ids.length === 0) {
      return formatted;
    }

    const ids = results.ids[0];
    const distances = results.distances[0];
    const metadatas = results.metadatas[0];
    const documents = results.documents[0];

    for (let i = 0; i < ids.length; i++) {
      formatted.push({
        id: ids[i],
        score: 1 - distances[i], // Convert distance to similarity score
        distance: distances[i],
        metadata: metadatas[i],
        document: documents[i]
      });
    }

    return formatted;
  }

  async updateDocument(id, embedding, metadata, document) {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      await this.collection.update({
        ids: [id],
        embeddings: [embedding],
        metadatas: [metadata],
        documents: [document]
      });

      return { success: true, id };
    } catch (error) {
      console.error('Error updating document in vector DB:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async deleteDocument(id) {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      await this.collection.delete({
        ids: [id]
      });

      return { success: true, id };
    } catch (error) {
      console.error('Error deleting document from vector DB:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async deleteDocuments(ids) {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      await this.collection.delete({
        ids
      });

      return { success: true, count: ids.length };
    } catch (error) {
      console.error('Error deleting documents from vector DB:', error);
      throw new Error(`Failed to delete documents: ${error.message}`);
    }
  }

  async getDocumentCount() {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      const count = await this.collection.count();
      return count;
    } catch (error) {
      console.error('Error getting document count:', error);
      return 0;
    }
  }

  async clearCollection() {
    if (!this.initialized) {
      throw new Error('Vector database not initialized');
    }

    try {
      await this.client.deleteCollection({ name: this.collection.name });
      await this.initialize(this.collection.name);
      return { success: true };
    } catch (error) {
      console.error('Error clearing collection:', error);
      throw new Error(`Failed to clear collection: ${error.message}`);
    }
  }

  isInitialized() {
    return this.initialized;
  }
}

// Create singleton instance
const vectorDatabaseService = new VectorDatabaseService();

export default vectorDatabaseService;
