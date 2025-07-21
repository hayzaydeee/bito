const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Rich content storage (BlockNote JSON document)
  richContent: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Plain text version for search and fallback
  plainTextContent: {
    type: String,
    maxlength: [10000, 'Journal content cannot exceed 10000 characters'],
    trim: true,
    default: ''
  },
  
  // Daily metadata
  mood: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  energy: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // Habit references for context and analytics
  referencedHabits: [{
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit'
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    mentioned: {
      type: Boolean,
      default: true
    }
  }],
  
  // Content metadata
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number, // estimated minutes
    default: 0
  },
  
  // Usage tracking
  createdVia: {
    type: String,
    enum: ['modal', 'dedicated', 'mobile', 'api'],
    default: 'modal'
  },
  editSessions: {
    type: Number,
    default: 1
  },
  
  // Timestamps
  lastEditedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound index for unique daily entries per user
journalEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

// Text search index
journalEntrySchema.index({ 
  plainTextContent: 'text', 
  tags: 'text' 
});

// Performance indexes
journalEntrySchema.index({ userId: 1, date: -1 }); // Latest entries first
journalEntrySchema.index({ userId: 1, 'referencedHabits.habitId': 1 }); // Habit analytics

// Virtual for formatted date
journalEntrySchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0]; // YYYY-MM-DD
});

// Static method to find or create daily entry
journalEntrySchema.statics.findOrCreateDaily = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Use findOneAndUpdate with upsert to prevent duplicate key errors
  const entry = await this.findOneAndUpdate(
    {
      userId,
      date: startOfDay
    },
    {
      $setOnInsert: {
        userId,
        date: startOfDay,
        richContent: null,
        plainTextContent: '',
        createdVia: 'modal',
        mood: null,
        energy: null,
        tags: [],
        referencedHabits: [],
        wordCount: 0,
        readingTime: 0
      }
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );
  
  return entry;
};

// Instance method to update content and metadata
journalEntrySchema.methods.updateContent = function(richContent, plainText, metadata = {}) {
  this.richContent = richContent;
  this.plainTextContent = plainText || '';
  this.wordCount = this.plainTextContent.split(/\s+/).filter(word => word.length > 0).length;
  this.readingTime = Math.ceil(this.wordCount / 200); // ~200 words per minute
  this.lastEditedAt = new Date();
  this.editSessions += 1;
  
  // Update optional metadata
  if (metadata.mood !== undefined) this.mood = metadata.mood;
  if (metadata.energy !== undefined) this.energy = metadata.energy;
  if (metadata.tags !== undefined) this.tags = metadata.tags;
  if (metadata.referencedHabits !== undefined) this.referencedHabits = metadata.referencedHabits;
  
  return this.save();
};

// Instance method to extract plain text from BlockNote content
journalEntrySchema.methods.extractPlainText = function(blockNoteContent) {
  if (!blockNoteContent || !Array.isArray(blockNoteContent)) {
    return '';
  }
  
  const extractTextFromBlock = (block) => {
    let text = '';
    
    if (block.content && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (typeof item === 'string') {
          text += item;
        } else if (item.text) {
          text += item.text;
        } else if (item.content) {
          text += extractTextFromBlock(item);
        }
      }
    }
    
    // Add newline for block separation
    return text + '\n';
  };
  
  return blockNoteContent
    .map(extractTextFromBlock)
    .join('')
    .trim();
};

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
