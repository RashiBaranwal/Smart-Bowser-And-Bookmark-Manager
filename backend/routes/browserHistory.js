import express from 'express';
import BrowserHistory from '../models/BrowserHistory.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all browser history with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { query, domain, startDate, endDate, limit = 100 } = req.query;

    let filter = { userId: req.userId };

    // Text search on url, title, or domain
    if (query) {
      filter.$or = [
        { url: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { domain: { $regex: query, $options: 'i' } }
      ];
    }

    // Filter by domain
    if (domain) {
      filter.domain = domain;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.visitTime = {};
      if (startDate) filter.visitTime.$gte = new Date(startDate);
      if (endDate) filter.visitTime.$lte = new Date(endDate);
    }

    const browserHistory = await BrowserHistory.find(filter)
      .sort({ visitTime: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: browserHistory.length,
      data: browserHistory
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get browser history statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalVisits = await BrowserHistory.countDocuments({ userId: req.userId });
    const topDomains = await BrowserHistory.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const recentVisits = await BrowserHistory.find({ userId: req.userId })
      .sort({ visitTime: -1 })
      .limit(10);

    // Get visit count by day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const visitsByDay = await BrowserHistory.aggregate([
      { $match: { userId: req.userId, visitTime: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitTime' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalVisits,
        topDomains,
        recentVisits,
        visitsByDay
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new browser history entry or update if exists
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { historyId, url, title, visitTime, domain, favicon } = req.body;

    // Check if entry with this historyId already exists for this user
    const existing = await BrowserHistory.findOne({ historyId, userId: req.userId });

    if (existing) {
      // Update visit count and visit time
      existing.visitCount += 1;
      existing.visitTime = visitTime;
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    // Create new entry with userId
    const browserHistory = await BrowserHistory.create({
      ...req.body,
      userId: req.userId
    });
    res.status(201).json({ success: true, data: browserHistory });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Bulk create/update browser history entries
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ success: false, error: 'Entries must be an array' });
    }

    const results = await Promise.all(
      entries.map(async (entry) => {
        const existing = await BrowserHistory.findOne({ historyId: entry.historyId, userId: req.userId });

        if (existing) {
          existing.visitCount = entry.visitCount || existing.visitCount;
          existing.visitTime = entry.visitTime;
          return existing.save();
        }

        return BrowserHistory.create({
          ...entry,
          userId: req.userId
        });
      })
    );

    res.status(201).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a browser history entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const browserHistory = await BrowserHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!browserHistory) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete all browser history
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await BrowserHistory.deleteMany({ userId: req.userId });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
