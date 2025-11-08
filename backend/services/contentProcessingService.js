import axios from 'axios';
import * as cheerio from 'cheerio';
import Tesseract from 'tesseract.js';
import fs from 'fs/promises';
import { createRequire } from 'module';

// pdf-parse is a CommonJS module, so we need to use require
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class ContentProcessingService {
  // Process web page - scrape and extract text
  async processWebPage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $('script, style, nav, footer, iframe, noscript').remove();

      // Extract metadata
      const title = $('title').text().trim() ||
                    $('meta[property="og:title"]').attr('content') ||
                    $('h1').first().text().trim() ||
                    'Untitled';

      const description = $('meta[name="description"]').attr('content') ||
                         $('meta[property="og:description"]').attr('content') ||
                         $('p').first().text().trim().substring(0, 200) ||
                         '';

      // Extract main content
      let content = '';

      // Try to find main content area
      const mainContent = $('main, article, .content, .post, .article, [role="main"]').first();

      if (mainContent.length > 0) {
        content = mainContent.text();
      } else {
        content = $('body').text();
      }

      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 50000); // Limit to ~50k chars

      // Extract keywords from meta tags
      const keywords = [];
      $('meta[name="keywords"]').each((i, el) => {
        const kw = $(el).attr('content');
        if (kw) keywords.push(...kw.split(',').map(k => k.trim()));
      });

      return {
        title,
        description,
        content,
        keywords,
        url,
        contentType: 'webpage',
        wordCount: content.split(' ').filter(w => w.length > 0).length
      };
    } catch (error) {
      console.error('Error processing web page:', error.message);
      throw new Error(`Failed to process web page: ${error.message}`);
    }
  }

  // Process PDF file
  async processPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);

      // Extract text content
      const content = data.text.trim();

      // Try to extract title from first page (usually in larger font)
      const lines = content.split('\n');
      const title = lines[0]?.trim().substring(0, 200) || 'Untitled PDF';

      // Create description from first few lines
      const description = lines.slice(0, 5).join(' ').trim().substring(0, 300);

      return {
        title,
        description,
        content: content.substring(0, 100000), // Limit to 100k chars
        contentType: 'pdf',
        pageCount: data.numpages,
        wordCount: content.split(' ').filter(w => w.length > 0).length,
        metadata: data.info
      };
    } catch (error) {
      console.error('Error processing PDF:', error.message);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  // Process image with OCR
  async processImage(filePath) {
    try {
      console.log('Starting OCR processing for:', filePath);

      const result = await Tesseract.recognize(filePath, 'eng', {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      });

      const content = result.data.text.trim();

      // Extract title from first line or use filename
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      const title = lines[0]?.trim().substring(0, 200) || 'Untitled Image';

      // Create description from first few lines
      const description = lines.slice(0, 3).join(' ').trim().substring(0, 300);

      return {
        title,
        description,
        content: content.substring(0, 50000),
        contentType: 'image',
        wordCount: content.split(' ').filter(w => w.length > 0).length,
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error('Error processing image with OCR:', error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // Process plain text or note
  processPlainText(text, title = '', description = '') {
    try {
      const content = text.trim();

      return {
        title: title || content.split('\n')[0]?.trim().substring(0, 200) || 'Untitled Note',
        description: description || content.substring(0, 300),
        content: content.substring(0, 100000),
        contentType: 'note',
        wordCount: content.split(' ').filter(w => w.length > 0).length
      };
    } catch (error) {
      console.error('Error processing plain text:', error.message);
      throw new Error(`Failed to process text: ${error.message}`);
    }
  }

  // Auto-detect and process content
  async processContent(input, type = 'auto') {
    try {
      if (type === 'url' || (type === 'auto' && typeof input === 'string' && input.startsWith('http'))) {
        return await this.processWebPage(input);
      }

      if (type === 'pdf' || (type === 'auto' && input.endsWith('.pdf'))) {
        return await this.processPDF(input);
      }

      if (type === 'image' || (type === 'auto' && this.isImageFile(input))) {
        return await this.processImage(input);
      }

      if (type === 'text' || type === 'auto') {
        return this.processPlainText(input);
      }

      throw new Error('Unsupported content type');
    } catch (error) {
      console.error('Error in processContent:', error.message);
      throw error;
    }
  }

  isImageFile(filePath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    return imageExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  // Extract domain from URL
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return '';
    }
  }
}

// Create singleton instance
const contentProcessingService = new ContentProcessingService();

export default contentProcessingService;
