const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const { authenticateJWT } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validateJournalEntry = [
  body('richContent').optional().isObject(),
  body('plainTextContent').optional().isString().isLength({ max: 10000 }),
  body('mood').optional().isInt({ min: 1, max: 5 }),
  body('energy').optional().isInt({ min: 1, max: 5 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().isLength({ max: 50 }),
  body('referencedHabits').optional().isArray(),
  body('referencedHabits.*.habitId').optional().isMongoId(),
  body('referencedHabits.*.sentiment').optional().isIn(['positive', 'negative', 'neutral'])
];

const validateDate = [
  param('date').isISO8601().toDate()
];

// Helper function to normalize date to start of day
const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// GET /api/journal/:date - Get daily journal entry
router.get('/:date', authenticateJWT, validateDate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const date = normalizeDate(req.params.date);
    const userId = req.user.id;

    const entry = await JournalEntry.findOne({
      userId,
      date
    }).populate('referencedHabits.habitId', 'name icon');

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/journal/:date - Create or update daily journal entry
router.post('/:date', authenticateJWT, validateDate, validateJournalEntry, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const date = normalizeDate(req.params.date);
    const userId = req.user.id;
    const { richContent, plainTextContent, mood, energy, tags, referencedHabits, createdVia } = req.body;

    // Find or create daily entry
    let entry = await JournalEntry.findOrCreateDaily(userId, date);
    
    // Extract plain text from rich content if not provided
    let extractedPlainText = plainTextContent;
    if (richContent && !plainTextContent) {
      extractedPlainText = entry.extractPlainText(richContent);
    }

    // Update content and metadata
    await entry.updateContent(richContent, extractedPlainText, {
      mood,
      energy,
      tags,
      referencedHabits
    });

    if (createdVia) {
      entry.createdVia = createdVia;
      await entry.save();
    }

    // Populate referenced habits for response
    await entry.populate('referencedHabits.habitId', 'name icon');

    res.status(entry.isNew ? 201 : 200).json(entry);
  } catch (error) {
    console.error('Error saving journal entry:', error);
    
    if (error.code === 11000) {
      // Duplicate key error - entry already exists, try to update
      try {
        const entry = await JournalEntry.findOne({
          userId: req.user.id,
          date: normalizeDate(req.params.date)
        });
        
        if (entry) {
          const { richContent, plainTextContent, mood, energy, tags, referencedHabits } = req.body;
          let extractedPlainText = plainTextContent;
          if (richContent && !plainTextContent) {
            extractedPlainText = entry.extractPlainText(richContent);
          }
          
          await entry.updateContent(richContent, extractedPlainText, {
            mood, energy, tags, referencedHabits
          });
          
          await entry.populate('referencedHabits.habitId', 'name icon');
          return res.json(entry);
        }
      } catch (updateError) {
        console.error('Error updating existing entry:', updateError);
      }
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/journal/:date - Update specific fields of daily journal entry
router.patch('/:date', authenticateJWT, validateDate, validateJournalEntry, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const date = normalizeDate(req.params.date);
    const userId = req.user.id;

    const entry = await JournalEntry.findOne({ userId, date });
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    const { richContent, plainTextContent, mood, energy, tags, referencedHabits } = req.body;
    
    // Extract plain text if rich content is provided but plain text isn't
    let extractedPlainText = plainTextContent;
    if (richContent && plainTextContent === undefined) {
      extractedPlainText = entry.extractPlainText(richContent);
    }

    await entry.updateContent(
      richContent !== undefined ? richContent : entry.richContent,
      extractedPlainText !== undefined ? extractedPlainText : entry.plainTextContent,
      { mood, energy, tags, referencedHabits }
    );

    await entry.populate('referencedHabits.habitId', 'name icon');
    res.json(entry);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/journal/:date - Delete daily journal entry
router.delete('/:date', authenticateJWT, validateDate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const date = normalizeDate(req.params.date);
    const userId = req.user.id;

    const entry = await JournalEntry.findOneAndDelete({ userId, date });
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/journal - Get journal entries with pagination
router.get('/', authenticateJWT, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter = {};
    if (req.query.startDate) {
      dateFilter.$gte = normalizeDate(req.query.startDate);
    }
    if (req.query.endDate) {
      const endDate = normalizeDate(req.query.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      dateFilter.$lte = endDate;
    }

    const filter = { userId };
    if (Object.keys(dateFilter).length > 0) {
      filter.date = dateFilter;
    }

    const entries = await JournalEntry.find(filter)
      .sort({ date: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate('referencedHabits.habitId', 'name icon');

    const total = await JournalEntry.countDocuments(filter);

    res.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/journal/search - Search journal entries
router.get('/search', authenticateJWT, [
  query('q').isString().isLength({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const searchQuery = req.query.q;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const entries = await JournalEntry.find({
      userId,
      $text: { $search: searchQuery }
    }, {
      score: { $meta: 'textScore' }
    })
    .sort({ score: { $meta: 'textScore' }, date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('referencedHabits.habitId', 'name icon');

    const total = await JournalEntry.countDocuments({
      userId,
      $text: { $search: searchQuery }
    });

    res.json({
      entries,
      query: searchQuery,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching journal entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/journal/stats - Get journal statistics
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await JournalEntry.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalWords: { $sum: '$wordCount' },
          averageWords: { $avg: '$wordCount' },
          totalReadingTime: { $sum: '$readingTime' },
          averageMood: { $avg: '$mood' },
          averageEnergy: { $avg: '$energy' },
          firstEntry: { $min: '$date' },
          lastEntry: { $max: '$date' }
        }
      }
    ]);

    // Get entries by month for streak calculation
    const entriesByMonth = await JournalEntry.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    res.json({
      stats: stats[0] || {
        totalEntries: 0,
        totalWords: 0,
        averageWords: 0,
        totalReadingTime: 0,
        averageMood: null,
        averageEnergy: null,
        firstEntry: null,
        lastEntry: null
      },
      entriesByMonth
    });
  } catch (error) {
    console.error('Error fetching journal stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
