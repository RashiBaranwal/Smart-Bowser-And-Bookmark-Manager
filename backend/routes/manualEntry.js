import express from 'express';
import ManualEntry from '../models/ManualEntry.js';

const router = express.Router();

// Function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return '';
  }
}

// Get all manual entries with optional filters
router.get('/', async (req, res) => {
  try {
    const { query, category, limit = 100 } = req.query;

    let filter = {};

    // Text search on title, description, keywords, url
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { keywords: { $regex: query, $options: 'i' } },
        { url: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    const entries = await ManualEntry.find(filter)
      .sort({ dateAdded: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const totalEntries = await ManualEntry.countDocuments({});

    const topCategories = await ManualEntry.aggregate([
      { $match: {} },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const recentEntries = await ManualEntry.find({})
      .sort({ dateAdded: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalEntries,
        topCategories,
        recentEntries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Instant search manual entries
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json({ success: true, count: 0, data: [] });
    }

    const entries = await ManualEntry.find({
            $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { keywords: { $regex: q, $options: 'i' } },
        { url: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    })
    .sort({ dateAdded: -1 })
    .limit(50);

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new manual entry
router.post('/', async (req, res) => {
  try {
    const { title, url, description, keywords, imageData, category } = req.body;

    // Extract keywords from description if not provided
    const finalKeywords = keywords && keywords.length > 0
      ? keywords
      : description
        ? description.toLowerCase().split(' ').filter(word => word.length > 3)
        : [];

    const domain = extractDomain(url);

    const entry = await ManualEntry.create({
            title,
      url,
      description: description || '',
      keywords: finalKeywords,
      imageData: imageData || '',
      category: category || 'General',
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      dateAdded: new Date()
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update manual entry
router.put('/:id', async (req, res) => {
  try {
    const { title, url, description, keywords, imageData, category } = req.body;

    const entry = await ManualEntry.findOne({ _id: req.params.id });

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    if (title) entry.title = title;
    if (url) {
      entry.url = url;
      entry.domain = extractDomain(url);
      entry.favicon = `https://www.google.com/s2/favicons?domain=${entry.domain}&sz=32`;
    }
    if (description !== undefined) entry.description = description;
    if (keywords) entry.keywords = keywords;
    if (imageData !== undefined) entry.imageData = imageData;
    if (category) entry.category = category;

    await entry.save();

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a manual entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await ManualEntry.findOneAndDelete({
      _id: req.params.id,
    });

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete all manual entries
router.delete('/', async (req, res) => {
  try {
    await ManualEntry.deleteMany({});
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
