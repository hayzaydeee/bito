const mongoose = require('mongoose');

/* ═══════════════════════════════════════════════════════════════
   JournalEntry V2 — Multi-entry per day, long-form + micro
   ═══════════════════════════════════════════════════════════════ */

const journalEntryV2Schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Date the entry belongs to (normalized to midnight)
  date: {
    type: Date,
    required: true,
    index: true,
  },

  // Entry type
  type: {
    type: String,
    enum: ['longform', 'micro'],
    required: true,
    default: 'longform',
  },

  // ── Long-form fields (BlockNote rich text) ──────────────────
  richContent: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  // ── Plain text (used for both types: micro stores content here, longform stores extracted text) ──
  plainTextContent: {
    type: String,
    maxlength: [10000, 'Content cannot exceed 10000 characters'],
    trim: true,
    default: '',
  },

  // ── Metadata ────────────────────────────────────────────────
  mood: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  energy: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50,
  }],

  // Habit link (for micro-entries captured in habit context)
  linkedHabitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    default: null,
  },

  // Content stats
  wordCount: {
    type: Number,
    default: 0,
  },
  readingTime: {
    type: Number,
    default: 0,
  },

  // Usage tracking
  createdVia: {
    type: String,
    enum: ['page', 'quick-capture', 'slash-command', 'api'],
    default: 'page',
  },

  // Edit tracking (longform only)
  editSessions: {
    type: Number,
    default: 1,
  },
  lastEditedAt: {
    type: Date,
    default: Date.now,
  },

  // Soft delete support
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

/* ── Indexes ─────────────────────────────────────────────────── */

// Primary query: all entries for a user on a date, newest first
journalEntryV2Schema.index({ userId: 1, date: -1, createdAt: -1 });

// Entries by type (for filtering longform vs micro)
journalEntryV2Schema.index({ userId: 1, type: 1, date: -1 });

// Habit-linked entries
journalEntryV2Schema.index({ userId: 1, linkedHabitId: 1, date: -1 });

// Full-text search
journalEntryV2Schema.index({ plainTextContent: 'text', tags: 'text' });

// Soft-delete filter
journalEntryV2Schema.index({ userId: 1, isDeleted: 1, date: -1 });

/* ── Virtuals ────────────────────────────────────────────────── */

journalEntryV2Schema.virtual('formattedDate').get(function () {
  return this.date.toISOString().split('T')[0];
});

journalEntryV2Schema.virtual('isMicro').get(function () {
  return this.type === 'micro';
});

/* ── Static methods ──────────────────────────────────────────── */

// Get all entries for a user on a specific date
journalEntryV2Schema.statics.getDay = async function (userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .populate('linkedHabitId', 'name icon');
};

// Get indicators: which dates have entries (for week strip dots)
journalEntryV2Schema.statics.getIndicators = async function (userId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const results = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: start, $lte: end },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        count: { $sum: 1 },
        hasMicro: { $max: { $cond: [{ $eq: ['$type', 'micro'] }, true, false] } },
        hasLongform: { $max: { $cond: [{ $eq: ['$type', 'longform'] }, true, false] } },
      },
    },
  ]);

  const indicators = {};
  results.forEach(r => {
    indicators[r._id] = {
      count: r.count,
      hasMicro: r.hasMicro,
      hasLongform: r.hasLongform,
    };
  });
  return indicators;
};

// Create a micro-entry
journalEntryV2Schema.statics.createMicro = async function (userId, text, opts = {}) {
  const date = new Date(opts.date || new Date());
  date.setHours(0, 0, 0, 0);

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  return this.create({
    userId,
    date,
    type: 'micro',
    plainTextContent: text,
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
    mood: opts.mood || null,
    energy: opts.energy || null,
    tags: opts.tags || [],
    linkedHabitId: opts.linkedHabitId || null,
    createdVia: opts.createdVia || 'quick-capture',
  });
};

// Create or get today's longform entry
journalEntryV2Schema.statics.getOrCreateLongform = async function (userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  // Find existing longform for this day
  let entry = await this.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    type: 'longform',
    isDeleted: false,
  });

  if (!entry) {
    entry = await this.create({
      userId,
      date: startOfDay,
      type: 'longform',
      richContent: null,
      plainTextContent: '',
      createdVia: 'page',
    });
  }

  return entry;
};

/**
 * Extract plain text from BlockNote JSON content.
 * Handles inline content, tableContent rows, links, and nested children.
 * Shared with frontend (src/utils/sanitizeBlock.js) — keep in sync.
 */
journalEntryV2Schema.statics.extractPlainText = function (blockNoteContent) {
  if (!blockNoteContent || !Array.isArray(blockNoteContent)) {
    return '';
  }

  const extractInline = (items) => {
    if (!Array.isArray(items)) return '';
    let text = '';
    for (const item of items) {
      if (typeof item === 'string') {
        text += item;
      } else if (item && item.type === 'link') {
        text += extractInline(item.content);
      } else if (item && item.text) {
        text += item.text;
      }
    }
    return text;
  };

  const extractTextFromBlock = (block) => {
    if (!block) return '';
    let text = '';

    // Table content
    if (block.content && block.content.type === 'tableContent') {
      const rows = block.content.rows || [];
      for (const row of rows) {
        const cells = row.cells || [];
        const cellTexts = cells.map(cell => extractInline(cell));
        text += cellTexts.join('\t') + '\n';
      }
    } else if (block.content && Array.isArray(block.content)) {
      text += extractInline(block.content) + '\n';
    }

    // Recurse into children (nested blocks)
    if (Array.isArray(block.children)) {
      for (const child of block.children) {
        text += extractTextFromBlock(child);
      }
    }

    return text;
  };

  return blockNoteContent.map(extractTextFromBlock).join('').trim();
};

/* ── Instance methods ────────────────────────────────────────── */

// Update longform content
journalEntryV2Schema.methods.updateContent = function (richContent, plainText, metadata = {}) {
  this.richContent = richContent;
  this.plainTextContent = plainText || '';
  this.wordCount = this.plainTextContent.split(/\s+/).filter(w => w.length > 0).length;
  this.readingTime = Math.ceil(this.wordCount / 200);
  this.lastEditedAt = new Date();
  this.editSessions += 1;

  if (metadata.mood !== undefined) this.mood = metadata.mood;
  if (metadata.energy !== undefined) this.energy = metadata.energy;
  if (metadata.tags !== undefined) this.tags = metadata.tags;

  return this.save();
};

journalEntryV2Schema.methods.extractPlainText = function (blockNoteContent) {
  return this.constructor.extractPlainText(blockNoteContent);
};

// Soft delete
journalEntryV2Schema.methods.softDelete = function () {
  this.isDeleted = true;
  return this.save();
};

/* ── Default query filter (exclude soft-deleted) ─────────────── */
journalEntryV2Schema.pre(/^find/, function () {
  // Only auto-filter if isDeleted isn't explicitly queried
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model('JournalEntryV2', journalEntryV2Schema);
