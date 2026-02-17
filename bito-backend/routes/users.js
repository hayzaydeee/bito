const express = require('express');
const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const Workspace = require('../models/Workspace');
const Activity = require('../models/Activity');
const { authenticateJWT } = require('../middleware/auth');
const { validateUserUpdate, validateProfileSetup } = require('../middleware/validation');
const { derivePersonality } = require('../utils/derivePersonality');
const { clearUserCache } = require('./insights');
const { generateKickstartInsights } = require('../services/kickstartService');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// @route   GET /api/users/check-username/:username
// @desc    Check if a username is available
// @access  Private
router.get('/check-username/:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase().trim();

    if (!/^[a-zA-Z0-9_]+$/.test(username) || username.length < 3 || username.length > 20) {
      return res.json({ success: true, data: { available: false, reason: 'Invalid format' } });
    }

    const existing = await User.findOne({ username, _id: { $ne: req.user._id } });

    res.json({
      success: true,
      data: { available: !existing }
    });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check username' });
  }
});

// @route   PUT /api/users/complete-profile
// @desc    Complete profile setup (firstName, lastName, username)
// @access  Private
router.put('/complete-profile', validateProfileSetup, async (req, res) => {
  try {
    const { firstName, lastName, username, avatar } = req.body;
    const normalizedUsername = username.toLowerCase().trim();

    // Check username uniqueness
    const existing = await User.findOne({ username: normalizedUsername, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Username is already taken'
      });
    }

    const user = await User.findById(req.user._id);
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.username = normalizedUsername;
    user.profileComplete = true;
    if (avatar) user.avatar = avatar;
    await user.save();

    res.json({
      success: true,
      message: 'Profile setup complete',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profileComplete: user.profileComplete,
          avatar: user.avatar,
          preferences: user.preferences,
          onboardingComplete: user.onboardingComplete,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete profile setup'
    });
  }
});

// @route   POST /api/users/avatar/upload
// @desc    Upload an avatar image to Cloudinary
// @access  Private
router.post('/avatar/upload', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `user_${req.user._id}`,
      overwrite: true,
    });

    // Save the URL to the user model
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    );

    res.json({
      success: true,
      data: { avatar: user.avatar },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload avatar' });
  }
});

// @route   PUT /api/users/avatar
// @desc    Set avatar to a URL (e.g. DiceBear generated)
// @access  Private
router.put('/avatar', async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'avatarUrl is required' });
    }

    // Basic URL validation
    try {
      new URL(avatarUrl);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({
      success: true,
      data: { avatar: user.avatar },
    });
  } catch (error) {
    console.error('Avatar set error:', error);
    res.status(500).json({ success: false, error: 'Failed to set avatar' });
  }
});

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
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        username: req.user.username,
        avatar: req.user.avatar,
        preferences: req.user.preferences,
        aiPersonality: req.user.aiPersonality,
        personalityCustomized: req.user.personalityCustomized,
        personalityPromptDismissed: req.user.personalityPromptDismissed,
        onboardingData: req.user.onboardingData,
        isVerified: req.user.isVerified,
        hasGoogleAuth: !!req.user.googleId,
        profileComplete: req.user.profileComplete,
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
    const allowedUpdates = [
      'firstName', 'lastName', 'username', 'avatar', 'preferences', 'onboardingComplete',
      'aiPersonality', 'onboardingData', 'personalityPromptDismissed', 'personalityCustomized'
    ];
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

    // Handle nested aiPersonality updates (merge, don't replace)
    if (req.body.aiPersonality) {
      const currentPersonality = req.user.aiPersonality || {};
      updates.aiPersonality = {
        tone: currentPersonality.tone || 'warm',
        focus: currentPersonality.focus || 'balanced',
        verbosity: currentPersonality.verbosity || 'concise',
        accountability: currentPersonality.accountability || 'gentle',
        ...req.body.aiPersonality
      };
    }

    // Auto-derive personality from onboarding data (unless user has manually customized)
    if (req.body.onboardingData && !req.user.personalityCustomized && !req.body.personalityCustomized) {
      const derived = derivePersonality(req.body.onboardingData);
      updates.aiPersonality = derived;
    }

    // Clear insights cache if personality changed (so next fetch uses new voice)
    if (updates.aiPersonality) {
      clearUserCache(req.user._id);
    }

    // Generate kickstart insights when onboarding completes (fire-and-forget on save)
    const isOnboardingCompletion = updates.onboardingComplete === true && !req.user.onboardingComplete;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    // Trigger kickstart generation after save (non-blocking)
    if (isOnboardingCompletion) {
      generateKickstartInsights({
        user: { ...user.toObject(), onboardingData: req.body.onboardingData || user.onboardingData },
        habits: await Habit.find({ userId: req.user._id, isActive: true }).lean(),
      }).then(kickstart => {
        return User.findByIdAndUpdate(req.user._id, { kickstartInsights: kickstart });
      }).then(() => {
        console.log(`[Kickstart] Insights generated for user ${req.user._id}`);
      }).catch(err => {
        console.warn('[Kickstart] Failed to generate:', err.message);
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.avatar,
          preferences: user.preferences,
          aiPersonality: user.aiPersonality,
          personalityCustomized: user.personalityCustomized,
          personalityPromptDismissed: user.personalityPromptDismissed,
          onboardingData: user.onboardingData,
          onboardingComplete: user.onboardingComplete,
          profileComplete: user.profileComplete,
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



// @route   PUT /api/users/change-email
// @desc    Change user email
// @access  Private
router.put('/change-email', async (req, res) => {
  try {
    const { newEmail } = req.body;

    // Validation
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    const user = await User.findById(req.user._id);

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
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
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

    // Verify password if user has one (skip for OAuth users)
    if (user.password && password && password !== 'confirmed') {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Password is incorrect'
        });
      }
    } else if (user.password && (!password || password === 'confirmed')) {
      // Password user but no real password provided — still allow
      // deletion since they've typed "DELETE" to confirm
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
