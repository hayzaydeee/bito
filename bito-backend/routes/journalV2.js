const express = require('express');
const router = express.Router();
const JournalEntryV2 = require('../models/JournalEntryV2');
const JournalEntry = require('../models/JournalEntry'); // Legacy model for archive
const { authenticateJWT } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const { uploadToCloudinary } = require('../config/cloudinary');
const multer = require('multer');

// Journal-specific upload — accepts images + common file types, rejects videos
const journalUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      return cb(new Error('Video uploads are not supported'), false);
    }
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain', 'text/csv',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`), false);
    }
  },
});

/* ═══════════════════════════════════════════════════════════════
   Journal V2 Routes — Multi-entry per day
   ═══════════════════════════════════════════════════════════════ */

// ── Helpers ─────────────────────────────────────────────────────

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const validateDate = [
  param('date').isISO8601().toDate(),
];

const validateMicroEntry = [
  body('text').isString().isLength({ min: 1, max: 2000 }).withMessage('Text is required (max 2000 chars)'),
  body('mood').optional().custom(v => v === null || (Number.isInteger(v) && v >= 1 && v <= 5)),
  body('energy').optional().custom(v => v === null || (Number.isInteger(v) && v >= 1 && v <= 5)),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().isLength({ max: 50 }),
  body('linkedHabitId').optional().isMongoId(),
];

const validateLongformEntry = [
  body('richContent').optional().custom(v => v === null || typeof v === 'object'),
  body('plainTextContent').optional().isString().isLength({ max: 100000 }),
  body('mood').optional().custom(v => v === null || v === undefined || (Number.isInteger(v) && v >= 1 && v <= 5)),
  body('energy').optional().custom(v => v === null || v === undefined || (Number.isInteger(v) && v >= 1 && v <= 5)),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().isLength({ max: 50 }),
];

// ── POST /api/journal-v2/upload-image — Upload an image or file for journal entries ──

router.post('/upload-image', authenticateJWT, (req, res, next) => {
  journalUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'bito/journal',
      resource_type: isImage ? 'image' : 'raw',
      transformation: isImage ? [{ quality: 'auto', fetch_format: 'auto' }] : [],
      public_id: `journal_${req.user._id}_${Date.now()}`,
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Journal upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// ── GET /api/journal-v2/day/:date — All entries for a day ──────

router.get('/day/:date', authenticateJWT, validateDate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const entries = await JournalEntryV2.getDay(req.user.id, req.params.date);

    // Find the longform entry (if any)
    const longform = entries.find(e => e.type === 'longform') || null;
    const micros = entries.filter(e => e.type === 'micro');

    res.json({ date: req.params.date, longform, micros, totalEntries: entries.length });
  } catch (error) {
    console.error('Error fetching day entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/journal-v2/indicators — Date indicators for week strip ──

router.get('/indicators', authenticateJWT, [
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const indicators = await JournalEntryV2.getIndicators(
      req.user.id,
      req.query.startDate,
      req.query.endDate,
    );

    res.json(indicators);
  } catch (error) {
    console.error('Error fetching indicators:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/journal-v2/micro/:date — Create micro-entry ─────

router.post('/micro/:date', authenticateJWT, validateDate, validateMicroEntry, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { text, mood, energy, tags, linkedHabitId } = req.body;

    const entry = await JournalEntryV2.createMicro(req.user.id, text, {
      date: req.params.date,
      mood,
      energy,
      tags,
      linkedHabitId,
      createdVia: 'quick-capture',
    });

    await entry.populate('linkedHabitId', 'name icon');
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating micro-entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/journal-v2/longform/:date — Create/update longform ──

router.post('/longform/:date', authenticateJWT, validateDate, validateLongformEntry, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const date = normalizeDate(req.params.date);
    const { richContent, plainTextContent, mood, energy, tags, createdVia } = req.body;

    // Get or create the day's longform entry
    let entry = await JournalEntryV2.getOrCreateLongform(req.user.id, date);

    // Extract plain text from rich content if not provided
    let extractedPlainText = plainTextContent;
    if (richContent && !plainTextContent) {
      extractedPlainText = JournalEntryV2.extractPlainText(richContent);
    }

    // Update content
    await entry.updateContent(richContent, extractedPlainText, { mood, energy, tags });

    if (createdVia) {
      entry.createdVia = createdVia;
      await entry.save();
    }

    res.json(entry);
  } catch (error) {
    console.error('Error saving longform entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PATCH /api/journal-v2/:id — Update any entry by ID ─────────

router.patch('/:id', authenticateJWT, [
  param('id').isMongoId(),
  body('text').optional().isString().isLength({ max: 10000 }),
  body('richContent').optional().custom(v => v === null || typeof v === 'object'),
  body('plainTextContent').optional().isString().isLength({ max: 10000 }),
  body('mood').optional().custom(v => v === null || v === undefined || (Number.isInteger(v) && v >= 1 && v <= 5)),
  body('energy').optional().custom(v => v === null || v === undefined || (Number.isInteger(v) && v >= 1 && v <= 5)),
  body('tags').optional().isArray(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const entry = await JournalEntryV2.findOne({ _id: req.params.id, userId: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const { text, richContent, plainTextContent, mood, energy, tags } = req.body;

    if (entry.type === 'micro') {
      // Micro-entry update: just update text + metadata
      if (text !== undefined) {
        entry.plainTextContent = text;
        entry.wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        entry.readingTime = Math.ceil(entry.wordCount / 200);
      }
      if (mood !== undefined) entry.mood = mood;
      if (energy !== undefined) entry.energy = energy;
      if (tags !== undefined) entry.tags = tags;
      entry.lastEditedAt = new Date();
      entry.editSessions += 1;
      await entry.save();
    } else {
      // Longform update
      let extractedPlainText = plainTextContent;
      if (richContent && plainTextContent === undefined) {
        extractedPlainText = JournalEntryV2.extractPlainText(richContent);
      }
      await entry.updateContent(
        richContent !== undefined ? richContent : entry.richContent,
        extractedPlainText !== undefined ? extractedPlainText : entry.plainTextContent,
        { mood, energy, tags },
      );
    }

    await entry.populate('linkedHabitId', 'name icon');
    res.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /api/journal-v2/:id — Soft delete an entry ──────────

router.delete('/:id', authenticateJWT, [
  param('id').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const entry = await JournalEntryV2.findOne({ _id: req.params.id, userId: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    await entry.softDelete();
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/journal-v2/search — Full-text search ──────────────

router.get('/search', authenticateJWT, [
  query('q').isString().isLength({ min: 1, max: 200 }),
  query('type').optional().isIn(['longform', 'micro']),
  query('tag').optional().isString(),
  query('habitId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { q, type, tag, habitId } = req.query;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user.id,
      $text: { $search: q },
    };
    if (type) filter.type = type;
    if (tag) filter.tags = tag;
    if (habitId) filter.linkedHabitId = habitId;

    const entries = await JournalEntryV2.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('linkedHabitId', 'name icon');

    const total = await JournalEntryV2.countDocuments(filter);

    res.json({
      entries,
      query: q,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error searching entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/journal-v2/thread/:habitId — Entries linked to a habit ──

router.get('/thread/:habitId', authenticateJWT, [
  param('habitId').isMongoId(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user.id,
      linkedHabitId: req.params.habitId,
    };

    const entries = await JournalEntryV2.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('linkedHabitId', 'name icon');

    const total = await JournalEntryV2.countDocuments(filter);

    res.json({
      entries,
      habitId: req.params.habitId,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching habit thread:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/journal-v2/stats — Aggregated statistics ──────────

router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = require('mongoose');

    const stats = await JournalEntryV2.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalLongform: { $sum: { $cond: [{ $eq: ['$type', 'longform'] }, 1, 0] } },
          totalMicro: { $sum: { $cond: [{ $eq: ['$type', 'micro'] }, 1, 0] } },
          totalWords: { $sum: '$wordCount' },
          averageWords: { $avg: '$wordCount' },
          averageMood: { $avg: '$mood' },
          averageEnergy: { $avg: '$energy' },
          firstEntry: { $min: '$date' },
          lastEntry: { $max: '$date' },
          uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        },
      },
      {
        $project: {
          _id: 0,
          totalEntries: 1,
          totalLongform: 1,
          totalMicro: 1,
          totalWords: 1,
          averageWords: { $round: ['$averageWords', 0] },
          averageMood: { $round: ['$averageMood', 1] },
          averageEnergy: { $round: ['$averageEnergy', 1] },
          firstEntry: 1,
          lastEntry: 1,
          uniqueDays: { $size: '$uniqueDays' },
        },
      },
    ]);

    res.json({
      stats: stats[0] || {
        totalEntries: 0, totalLongform: 0, totalMicro: 0,
        totalWords: 0, averageWords: 0, averageMood: null, averageEnergy: null,
        firstEntry: null, lastEntry: null, uniqueDays: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching journal stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/journal-v2/archive — Read-only legacy entries ─────

router.get('/archive', authenticateJWT, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const entries = await JournalEntry.find({ userId: req.user.id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('referencedHabits.habitId', 'name icon');

    const total = await JournalEntry.countDocuments({ userId: req.user.id });

    res.json({
      entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching archive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
