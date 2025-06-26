const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Workspace = require('../models/Workspace');
const WorkspaceHabit = require('../models/WorkspaceHabit');
const MemberHabit = require('../models/MemberHabit');
const Activity = require('../models/Activity');
const User = require('../models/User');

// @route   GET /api/workspaces
// @desc    Get user's workspaces
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const workspaces = await Workspace.findByUserId(req.user.id);
    
    // Add member counts and recent activity for each workspace
    const workspacesWithStats = await Promise.all(
      workspaces.map(async (workspace) => {
        const stats = await MemberHabit.getWorkspaceStats(workspace._id);
        const recentActivity = await Activity.find({
          workspaceId: workspace._id,
          visibility: { $in: ['public', 'workspace'] }
        })
        .populate('userId', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(3);
        
        return {
          ...workspace.toObject(),
          stats: stats[0] || { totalHabits: 0, totalCompletions: 0, activeMemberCount: 0 },
          recentActivity
        };
      })
    );
    
    res.json({
      success: true,
      workspaces: workspacesWithStats
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspaces'
    });
  }
});

// @route   POST /api/workspaces
// @desc    Create new workspace
// @access  Private
router.post('/', [
  auth,
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workspace name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('type')
    .optional()
    .isIn(['family', 'team', 'fitness', 'study', 'community', 'personal'])
    .withMessage('Invalid workspace type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { name, description, type, settings } = req.body;
    
    // Create workspace
    const workspace = new Workspace({
      name,
      description,
      type: type || 'personal',
      ownerId: req.user.id,
      settings: {
        isPublic: settings?.isPublic || false,
        allowInvites: settings?.allowInvites !== false, // Default true
        requireApproval: settings?.requireApproval !== false, // Default true
        privacyLevel: settings?.privacyLevel || 'invite-only'
      },
      members: [{
        userId: req.user.id,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
        permissions: {
          canInviteMembers: true,
          canCreateHabits: true,
          canViewAllProgress: true,
          canManageSettings: true
        }
      }],
      stats: {
        totalMembers: 1,
        activeMembers: 1,
        totalHabits: 0,
        totalCompletions: 0
      }
    });
    
    await workspace.save();
    
    // Create activity for workspace creation
    await Activity.createMemberActivity(
      workspace._id,
      req.user.id,
      {
        memberName: req.user.name,
        memberRole: 'owner',
        message: `Created the ${workspace.name} workspace`
      },
      'member_joined'
    );
    
    // Populate owner info
    await workspace.populate('ownerId', 'name email avatar');
    
    res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workspace'
    });
  }
});

// @route   GET /api/workspaces/:id
// @desc    Get workspace details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }
    
    // Check if user is a member
    if (!workspace.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this workspace.'
      });
    }
    
    // Get user's role in workspace
    const userRole = workspace.getMemberRole(req.user.id);
    
    // Get workspace habits (filtered by visibility)
    const workspaceHabits = await WorkspaceHabit.findByWorkspace(
      workspace._id,
      userRole
    );
    
    // Get workspace stats
    const stats = await MemberHabit.getWorkspaceStats(workspace._id);
    
    res.json({
      success: true,
      workspace: {
        ...workspace.toObject(),
        userRole,
        habits: workspaceHabits,
        stats: stats[0] || { totalHabits: 0, totalCompletions: 0, activeMemberCount: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace'
    });
  }
});

// @route   GET /api/workspaces/:id/overview
// @desc    Get team progress overview
// @access  Private
router.get('/:id/overview', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace || !workspace.isMember(req.user.id)) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found or access denied'
      });
    }
    
    // Get leaderboard data
    const leaderboard = await MemberHabit.getWorkspaceLeaderboard(
      workspace._id,
      'currentStreak',
      10
    );
    
    // Get completion stats for the week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    
    const memberProgress = await MemberHabit.aggregate([
      {
        $match: {
          workspaceId: workspace._id,
          isActive: true,
          'personalSettings.shareProgress': { $ne: 'private' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'workspacehabits',
          localField: 'workspaceHabitId',
          foreignField: '_id',
          as: 'habit'
        }
      },
      {
        $group: {
          _id: '$userId',
          user: { $first: { $arrayElemAt: ['$user', 0] } },
          totalHabits: { $sum: 1 },
          totalCompletions: { $sum: '$totalCompletions' },
          currentStreaks: { $sum: '$currentStreak' },
          avgCompletionRate: { $avg: '$completionRate' },
          habits: {
            $push: {
              habit: { $arrayElemAt: ['$habit', 0] },
              currentStreak: '$currentStreak',
              totalCompletions: '$totalCompletions',
              shareLevel: '$personalSettings.shareProgress'
            }
          }
        }
      },
      {
        $sort: { currentStreaks: -1 }
      }
    ]);
    
    // Get workspace activity for the overview
    const recentActivity = await Activity.getWorkspaceFeed(workspace._id, {
      limit: 10,
      types: ['habit_completed', 'streak_milestone', 'goal_achieved']
    });
    
    // Calculate team stats
    const teamStats = {
      totalMembers: workspace.memberCount,
      activeHabits: leaderboard.length,
      totalCompletions: memberProgress.reduce(
        (sum, member) => sum + member.totalCompletions, 0
      ),
      averageStreak: memberProgress.length > 0 
        ? Math.round(
            memberProgress.reduce(
              (sum, member) => sum + member.currentStreaks, 0
            ) / memberProgress.length
          )
        : 0
    };
    
    res.json({
      success: true,
      overview: {
        teamStats,
        leaderboard,
        memberProgress,
        recentActivity,
        workspace: {
          _id: workspace._id,
          name: workspace.name,
          type: workspace.type
        }
      }
    });
  } catch (error) {
    console.error('Error fetching workspace overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace overview'
    });
  }
});

// @route   GET /api/workspaces/:id/activity
// @desc    Get workspace activity feed
// @access  Private
router.get('/:id/activity', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, types } = req.query;
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace || !workspace.isMember(req.user.id)) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found or access denied'
      });
    }
    
    const activityTypes = types ? types.split(',') : null;
    const activities = await Activity.getWorkspaceFeed(workspace._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      types: activityTypes
    });
    
    res.json({
      success: true,
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: activities.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed'
    });
  }
});

// @route   POST /api/workspaces/:id/members/invite
// @desc    Invite member to workspace
// @access  Private
router.post('/:id/members/invite', [
  auth,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'member', 'viewer'])
    .withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { email, role = 'member', message } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }
    
    // Check if user can invite members
    if (!workspace.canUserAccess(req.user.id, 'invite')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to invite members'
      });
    }
    
    // Check if user is already a member
    const existingMember = workspace.members.find(
      member => member.email === email
    );
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this workspace'
      });
    }
    
    // Create invitation (this would integrate with email service)
    const invitation = {
      workspaceId: workspace._id,
      workspaceName: workspace.name,
      invitedBy: req.user.name,
      invitedByEmail: req.user.email,
      email,
      role,
      message,
      token: generateInviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    // TODO: Send invitation email
    // await sendInvitationEmail(invitation);
    
    // For now, just add to pending invitations (you'd have an Invitation model)
    res.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        email,
        role,
        workspace: workspace.name,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation'
    });
  }
});

// Helper function to generate invitation tokens
function generateInviteToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

module.exports = router;
