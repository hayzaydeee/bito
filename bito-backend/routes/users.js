const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const Workspace = require('../models/Workspace');
const Activity = require('../models/Activity');
const { authenticateJWT } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        preferences: req.user.preferences,
        isVerified: req.user.isVerified,
        hasGoogleAuth: !!req.user.googleId,
        hasGithubAuth: !!req.user.githubId,
        hasPassword: !!req.user.password,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    }
  });
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', validateUserUpdate, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'avatar', 'preferences'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle nested preferences updates
    if (req.body.preferences) {
      updates.preferences = {
        ...req.user.preferences,
        ...req.body.preferences
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          preferences: user.preferences,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id);

    // Check current password if user has one
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password is required'
        });
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// @route   PUT /api/users/change-email
// @desc    Change user email
// @access  Private
router.put('/change-email', async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    // Validation
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    const user = await User.findById(req.user._id);

    // Verify password if user has one
    if (user.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Password is required to change email'
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Password is incorrect'
        });
      }
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered to another account'
      });
    }

    // Update email
    user.email = newEmail.toLowerCase();
    user.isVerified = false; // Reset verification status
    await user.save();

    res.json({
      success: true,
      message: 'Email changed successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Email change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change email'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get basic counts
    const [totalHabits, activeHabits, totalEntries, completedEntries] = await Promise.all([
      Habit.countDocuments({ userId }),
      Habit.countDocuments({ userId, isActive: true, isArchived: false }),
      HabitEntry.countDocuments({ userId }),
      HabitEntry.countDocuments({ userId, completed: true })
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await HabitEntry.getUserStatsForPeriod(
      userId,
      thirtyDaysAgo,
      new Date()
    );

    // Get longest streak across all habits
    const habitsWithStats = await Habit.find({ userId }).select('stats');
    const longestStreak = Math.max(
      0,
      ...habitsWithStats.map(habit => habit.stats.longestStreak || 0)
    );

    // Calculate completion rate
    const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalHabits,
          activeHabits,
          totalEntries,
          completedEntries,
          completionRate,
          longestStreak,
          recentActivity: {
            period: '30 days',
            totalEntries: recentStats.totalEntries,
            completedEntries: recentStats.completedEntries,
            totalValue: recentStats.totalValue,
            averageMood: recentStats.averageMood ? Math.round(recentStats.averageMood * 10) / 10 : null
          },
          memberSince: req.user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all data
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const { password, confirmDeletion } = req.body;
    const user = await User.findById(req.user._id);

    // Require confirmation
    if (confirmDeletion !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        success: false,
        error: 'Please confirm account deletion by sending confirmDeletion: "DELETE_MY_ACCOUNT"'
      });
    }

    // Verify password if user has one
    if (user.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Password is required to delete account'
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Password is incorrect'
        });
      }
    }

    // Delete all user data
    await Promise.all([
      HabitEntry.deleteMany({ userId: user._id }),
      Habit.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id)
    ]);

    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// @route   POST /api/users/export-data
// @desc    Export all user data
// @access  Private
router.post('/export-data', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user data
    const [habits, entries] = await Promise.all([
      Habit.find({ userId }).lean(),
      HabitEntry.find({ userId }).lean()
    ]);

    const exportData = {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        preferences: req.user.preferences,
        createdAt: req.user.createdAt
      },
      habits,
      entries,
      exportedAt: new Date(),
      version: '1.0'
    };

    res.json({
      success: true,
      message: 'Data exported successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications (activities across all workspaces)
// @access  Private
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, offset = 0, types } = req.query;

    // Get all workspaces the user belongs to
    const workspaces = await Workspace.find({
      'members.userId': userId
    }).select('_id name');

    const workspaceIds = workspaces.map(w => w._id);

    // Build activity query
    const query = {
      workspaceId: { $in: workspaceIds },
      userId: { $ne: userId } // Don't include user's own activities
    };

    // Filter by activity types if specified
    if (types) {
      const typeArray = types.split(',');
      query.type = { $in: typeArray };
    }

    // Get activities from all user's workspaces
    const activities = await Activity.find(query)
      .populate('userId', 'name email')
      .populate('workspaceId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Add workspace name to each activity for easier frontend handling
    const activitiesWithWorkspace = activities.map(activity => ({
      ...activity,
      workspaceId: activity.workspaceId?._id?.toString() || activity.workspaceId?.toString(), // Ensure workspaceId is a string
      workspaceName: activity.workspaceId?.name,
      userName: activity.userId?.name
    }));

    res.json({
      success: true,
      data: {
        notifications: activitiesWithWorkspace,
        hasMore: activities.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// @route   GET /api/users/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all workspaces the user belongs to
    const workspaces = await Workspace.find({
      'members.userId': userId
    }).select('_id');

    const workspaceIds = workspaces.map(w => w._id);

    // Count recent activities (last 24 hours) from all workspaces
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const count = await Activity.countDocuments({
      workspaceId: { $in: workspaceIds },
      userId: { $ne: userId }, // Don't include user's own activities
      createdAt: { $gte: yesterday },
      type: { 
        $in: ['habit_completed', 'habit_adopted', 'streak_milestone', 'member_joined', 'badge_earned'] 
      }
    });

    res.json({
      success: true,
      data: {
        count: Math.min(count, 99) // Cap at 99 for display purposes
      }
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification count'
    });
  }
});

// @route   PUT /api/users/notifications/:notificationId/read
// @desc    Mark a notification as read
// @access  Private
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    // For now, we'll just return success since we don't have read status tracking
    // In a full implementation, you'd update the activity or maintain a separate read status table
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', async (req, res) => {
  try {
    // For now, we'll just return success since we don't have read status tracking
    // In a full implementation, you'd update all activities or maintain a separate read status table
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

module.exports = router;
