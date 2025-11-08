import express from 'express';
import Bookmark from '../models/Bookmark.js';

const router = express.Router();

// Get all bookmarks with optional filters
router.get('/', async (req, res) => {
  try {
    const { query, folder, domain, limit = 100 } = req.query;

    let filter = {};

    // Text search on title, url, folder, or tags
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { url: { $regex: query, $options: 'i' } },
        { parentFolder: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ];
    }

    // Filter by folder
    if (folder) {
      filter.parentFolder = folder;
    }

    // Filter by domain
    if (domain) {
      filter.domain = domain;
    }

    const bookmarks = await Bookmark.find(filter)
      .sort({ dateAdded: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: bookmarks.length,
      data: bookmarks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bookmark statistics
router.get('/stats', async (req, res) => {
  try {
    const totalBookmarks = await Bookmark.countDocuments({});

    const topFolders = await Bookmark.aggregate([
      { $match: {} },
      { $group: { _id: '$parentFolder', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topDomains = await Bookmark.aggregate([
      { $match: {} },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const recentBookmarks = await Bookmark.find({})
      .sort({ dateAdded: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalBookmarks,
        topFolders,
        topDomains,
        recentBookmarks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search bookmarks with instant results
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json({ success: true, count: 0, data: [] });
    }

    const bookmarks = await Bookmark.find({
            $or: [
        { title: { $regex: q, $options: 'i' } },
        { url: { $regex: q, $options: 'i' } },
        { parentFolder: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { domain: { $regex: q, $options: 'i' } }
      ]
    })
    .sort({ dateAdded: -1 })
    .limit(50);

    res.json({
      success: true,
      count: bookmarks.length,
      data: bookmarks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get folders list
router.get('/folders', async (req, res) => {
  try {
    const folders = await Bookmark.distinct('parentFolder', {});
    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update bookmark
router.post('/', async (req, res) => {
  try {
    const { bookmarkId } = req.body;

    // Check if bookmark already exists for this user
    const existing = await Bookmark.findOne({ bookmarkId });

    if (existing) {
      // Update existing bookmark
      Object.assign(existing, req.body);
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    // Create new bookmark with userId
    const bookmark = await Bookmark.create({
      ...req.body,
    });
    res.status(201).json({ success: true, data: bookmark });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Bulk create/update bookmarks
router.post('/bulk', async (req, res) => {
  try {
    const { bookmarks } = req.body;

    if (!Array.isArray(bookmarks)) {
      return res.status(400).json({ success: false, error: 'Bookmarks must be an array' });
    }

    const results = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const existing = await Bookmark.findOne({ bookmarkId: bookmark.bookmarkId });

        if (existing) {
          Object.assign(existing, bookmark);
          return existing.save();
        }

        return Bookmark.create({
          ...bookmark,
            });
      })
    );

    res.status(201).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a bookmark
router.delete('/:id', async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      _id: req.params.id,
    });

    if (!bookmark) {
      return res.status(404).json({ success: false, error: 'Bookmark not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete all bookmarks
router.delete('/', async (req, res) => {
  try {
    await Bookmark.deleteMany({});
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
