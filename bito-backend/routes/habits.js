const express = require('express');
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const { authenticateJWT } = require('../middleware/auth');
const { processChallengeProgress } = require('../controllers/challengeController');
const {
  validateHabitCreation,
  validateHabitUpdate,
  validateHabitEntry,
  validateObjectId,
  validateDateRange,
  validatePagination
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// @route   GET /api/habits
// @desc    Get all user habits
// @access  Private
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, active, archived } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId: req.user._id };
    
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';
    if (archived !== undefined) filter.isArchived = archived === 'true';

    // Get habits with pagination
    const [habits, total] = await Promise.all([
      Habit.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Habit.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        habits,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Habits fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch habits'
    });
  }
});

// @route   POST /api/habits
// @desc    Create a new habit
// @access  Private
router.post('/', validateHabitCreation, async (req, res) => {
  try {
    const habitData = {
      ...req.body,
      userId: req.user._id
    };

    const habit = new Habit(habitData);
    await habit.save();

    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: { habit }
    });
  } catch (error) {
    console.error('Habit creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create habit'
    });
  }
});

// @route   GET /api/habits/:id
// @desc    Get a specific habit
// @access  Private
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }

    res.json({
      success: true,
      data: { habit }
    });
  } catch (error) {
    console.error('Habit fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch habit'
    });
  }
});

// @route   PUT /api/habits/:id
// @desc    Update a habit
// @access  Private
router.put('/:id', [validateObjectId('id'), validateHabitUpdate], async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }

    res.json({
      success: true,
      message: 'Habit updated successfully',
      data: { habit }
    });
  } catch (error) {
    console.error('Habit update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update habit'
    });
  }
});

// @route   DELETE /api/habits/:id
// @desc    Delete a habit and all its entries
// @access  Private
router.delete('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }

    // Delete all entries for this habit
    await HabitEntry.deleteMany({ habitId: habit._id });
    
    // Delete the habit
    await Habit.findByIdAndDelete(habit._id);

    res.json({
      success: true,
      message: 'Habit and all associated entries deleted successfully'
    });
  } catch (error) {
    console.error('Habit deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete habit'
    });
  }
});

// @route   GET /api/habits/:id/entries
// @desc    Get habit entries for a date range
// @access  Private
router.get('/:id/entries', [validateObjectId('id'), validateDateRange, validatePagination], async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    // Verify habit ownership
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }

    // Build date filter
    const dateFilter = { habitId: req.params.id };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        // Parse date string and create UTC date to avoid timezone issues
        const start = new Date(startDate + 'T00:00:00.000Z');
        dateFilter.date.$gte = start;
      }
      if (endDate) {
        // Parse date string and create UTC date to avoid timezone issues
        const end = new Date(endDate + 'T23:59:59.999Z');
        dateFilter.date.$lte = end;
      }
    }

    // Get entries with pagination
    const [entries, total] = await Promise.all([
      HabitEntry.find(dateFilter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      HabitEntry.countDocuments(dateFilter)
    ]);

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Habit entries fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch habit entries'
    });
  }
});

// @route   POST /api/habits/:id/check
// @desc    Check/uncheck a habit for a specific date
// @access  Private
router.post('/:id/check', [validateObjectId('id'), validateHabitEntry], async (req, res) => {
  try {
    const { date = new Date(), completed = true, value = 1, notes, mood } = req.body;
    
    // Verify habit ownership
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }

    // Normalize date to start of day - handle timezone properly
    let entryDate;
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse YYYY-MM-DD format as UTC to avoid timezone issues
      entryDate = new Date(date + 'T00:00:00.000Z');
    } else {
      entryDate = new Date(date);
      entryDate.setHours(0, 0, 0, 0);
    }

    // Use findOneAndUpdate with upsert to avoid duplicate key errors
    const entry = await HabitEntry.findOneAndUpdate(
      {
        habitId: habit._id,
        date: entryDate
      },
      {
        habitId: habit._id,
        userId: req.user._id,
        date: entryDate,
        completed,
        value: completed ? value : 0,
        notes,
        mood,
        completedAt: completed ? new Date() : null
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Process challenge progress if this is a completion
    let challengeResult = null;
    if (completed && habit.workspaceId) {
      challengeResult = await processChallengeProgress(req.user._id, habit.workspaceId, habit._id);
    }

    res.json({
      success: true,
      message: `Habit ${completed ? 'checked' : 'unchecked'} successfully`,
      data: { 
        entry,
        challengeProgress: challengeResult?.processed ? challengeResult.updates : null
      }
    });
  } catch (error) {
    console.error('Habit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update habit entry'
    });
  }
});

// @route   GET /api/habits/stats
// @desc    Get habits statistics
// @access  Private
router.get('/stats', validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    // Default to last 30 days if no date range provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get habits with their stats
    const habits = await Habit.find({ userId, isActive: true }).select('name category stats');

    // Get entries for the date range
    const entries = await HabitEntry.find({
      userId,
      date: { $gte: start, $lte: end }
    });

    // Calculate aggregate stats
    const totalEntries = entries.length;
    const completedEntries = entries.filter(e => e.completed).length;
    const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

    // Group by category
    const categoryStats = {};
    habits.forEach(habit => {
      const category = habit.category;
      if (!categoryStats[category]) {
        categoryStats[category] = {
          habitCount: 0,
          totalEntries: 0,
          completedEntries: 0,
          completionRate: 0
        };
      }
      categoryStats[category].habitCount++;
    });

    entries.forEach(entry => {
      const habit = habits.find(h => h._id.toString() === entry.habitId.toString());
      if (habit) {
        const category = habit.category;
        categoryStats[category].totalEntries++;
        if (entry.completed) {
          categoryStats[category].completedEntries++;
        }
      }
    });

    // Calculate completion rates for categories
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.completionRate = stats.totalEntries > 0 
        ? Math.round((stats.completedEntries / stats.totalEntries) * 100) 
        : 0;
    });

    // Get daily completion counts for the period
    const dailyStats = {};
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        date: dateStr,
        totalChecks: 0,
        possibleChecks: habits.length
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    entries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0];
      if (dailyStats[dateStr] && entry.completed) {
        dailyStats[dateStr].totalChecks++;
      }
    });

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end,
          days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
        },
        overview: {
          totalHabits: habits.length,
          totalEntries,
          completedEntries,
          completionRate
        },
        categoryStats,
        dailyStats: Object.values(dailyStats),
        habits: habits.map(habit => ({
          id: habit._id,
          name: habit.name,
          category: habit.category,
          stats: habit.stats
        }))
      }
    });
  } catch (error) {
    console.error('Habits stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch habits statistics'
    });
  }
});

// @route   PUT /api/habits/:id/archive
// @desc    Archive/unarchive a habit
// @access  Private
router.put('/:id/archive', validateObjectId('id'), async (req, res) => {
  try {
    const { archived = true } = req.body;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isArchived: archived },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found'
      });
    }

    res.json({
      success: true,
      message: `Habit ${archived ? 'archived' : 'unarchived'} successfully`,
      data: { habit }
    });
  } catch (error) {
    console.error('Habit archive error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive habit'
    });
  }
});

module.exports = router;
