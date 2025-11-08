import { GoogleGenerativeAI } from '@google/generative-ai';

class LLMService {
  constructor() {
    this.genAI = null;
    this.initialized = false;
  }

  initialize(apiKey) {
    if (!apiKey) {
      throw new Error('Google API key is required for LLM service');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.initialized = true;
  }

  async reRankResults(query, results, topK = 10) {
    if (!this.initialized) {
      throw new Error('LLM service not initialized. Call initialize() first.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Create prompt for re-ranking
      const resultsText = results.map((r, idx) => {
        return `[${idx + 1}] Title: ${r.metadata.title}
Description: ${r.metadata.description || 'N/A'}
Snippet: ${r.document.substring(0, 200)}...
Score: ${r.score.toFixed(4)}`;
      }).join('\n\n');

      const prompt = `You are a search result ranker. Given a user query and search results, re-rank the results based on relevance to the query.

User Query: "${query}"

Search Results:
${resultsText}

Task: Analyze the results and return ONLY the numbers of the top ${Math.min(topK, results.length)} most relevant results, in order from most to least relevant. Return as a JSON array of numbers.

Example format: [3, 1, 5, 2, 7]

Your response:`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse the response
      const rankingMatch = response.match(/\[[\d,\s]+\]/);
      if (rankingMatch) {
        const ranking = JSON.parse(rankingMatch[0]);

        // Reorder results based on ranking
        const reranked = ranking
          .map(idx => results[idx - 1])
          .filter(r => r !== undefined);

        return reranked;
      }

      // If parsing fails, return original results
      return results.slice(0, topK);
    } catch (error) {
      console.error('Error re-ranking results:', error);
      // Return original results on error
      return results.slice(0, topK);
    }
  }

  async summarizeResults(query, results) {
    if (!this.initialized) {
      throw new Error('LLM service not initialized. Call initialize() first.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Create context from top results
      const context = results.slice(0, 5).map((r, idx) => {
        return `[Source ${idx + 1}] ${r.metadata.title}
${r.document.substring(0, 500)}...`;
      }).join('\n\n');

      const prompt = `You are a helpful assistant that summarizes search results.

User Query: "${query}"

Top Search Results:
${context}

Task: Provide a comprehensive summary that answers the user's query based on the search results. Be concise but informative. Mention which sources you're drawing from.

Summary:`;

      const result = await model.generateContent(prompt);
      const summary = result.response.text();

      return summary;
    } catch (error) {
      console.error('Error summarizing results:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  async answerQuestion(query, results) {
    if (!this.initialized) {
      throw new Error('LLM service not initialized. Call initialize() first.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Create context from top results
      const context = results.slice(0, 3).map((r, idx) => {
        return `[${r.metadata.title}]
${r.document.substring(0, 1000)}`;
      }).join('\n\n---\n\n');

      const prompt = `You are a helpful assistant that answers questions based on the user's saved content.

User Question: "${query}"

Relevant Content from User's Second Brain:
${context}

Task: Answer the user's question based ONLY on the content provided above. If the content doesn't contain enough information to answer the question, say so. Cite which documents you're using.

Answer:`;

      const result = await model.generateContent(prompt);
      const answer = result.response.text();

      return answer;
    } catch (error) {
      console.error('Error answering question:', error);
      return 'Unable to answer question at this time.';
    }
  }

  async extractKeywords(text, maxKeywords = 10) {
    if (!this.initialized) {
      throw new Error('LLM service not initialized. Call initialize() first.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Extract the ${maxKeywords} most important keywords or key phrases from the following text. Return ONLY a JSON array of strings.

Text:
${text.substring(0, 2000)}

Return format: ["keyword1", "keyword2", "keyword3", ...]

Your response:`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse the response
      const keywordsMatch = response.match(/\[.*\]/s);
      if (keywordsMatch) {
        const keywords = JSON.parse(keywordsMatch[0]);
        return keywords;
      }

      return [];
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  async categorizeContent(title, description, content) {
    if (!this.initialized) {
      throw new Error('LLM service not initialized. Call initialize() first.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Categorize the following content into ONE of these categories:
- Technology
- Science
- Business
- Health
- Entertainment
- Education
- News
- Tutorial
- Documentation
- Research
- Personal
- Other

Title: ${title}
Description: ${description}
Content snippet: ${content.substring(0, 500)}

Return ONLY the category name, nothing else.

Category:`;

      const result = await model.generateContent(prompt);
      const category = result.response.text().trim();

      return category;
    } catch (error) {
      console.error('Error categorizing content:', error);
      return 'Other';
    }
  }
}

// Create singleton instance
const llmService = new LLMService();

export default llmService;
