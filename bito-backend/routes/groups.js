const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateJWT } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const GroupHabit = require('../models/GroupHabit');
// MemberHabit model removed — all Group habit adoption data lives in Habit (source: 'Group')
const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const emailService = require('../services/emailService');



// @route   GET /api/groups
// @desc    Get user's groups
// @access  Private
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    console.log('Fetching groups for user:', userId);
    
    if (!req.user || (!req.user._id && !req.user.id)) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const groups = await Group.findByUserId(userId);
    console.log('Found groups:', groups.length);
    
    res.json({
      success: true,
      groups: groups
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch groups',
      details: error.message
    });
  }
});

// @route   POST /api/groups
// @desc    Create new Group
// @access  Private
router.post('/', [
  authenticateJWT,
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('type')
    .optional()
    .isIn(['family', 'team', 'fitness', 'study', 'community', 'personal'])
    .withMessage('Invalid Group type')
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
    
    // Debug logging
    console.log('Creating Group for user:', {
      userId: req.user.id,
      userIdType: typeof req.user.id,
      userIdString: String(req.user.id),
      rawUserId: req.user._id,
      fullUser: JSON.stringify(req.user, null, 2)
    });
    
    // Fix: Extract proper ObjectId from user object (prevent object serialization bug)
    const userId = req.user._id || req.user.id;
    
    // Ensure we have a valid ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }
    
    // Create Group
    const Group = new Group({
      name,
      description,
      type: type || 'personal',
      ownerId: userId,
      settings: {
        isPublic: settings?.isPublic || false,
        allowInvites: settings?.allowInvites !== false, // Default true
        requireApproval: settings?.requireApproval !== false, // Default true
        privacyLevel: settings?.privacyLevel || 'invite-only'
      },
      members: [{
        userId: userId,
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
    
    await Group.save();
    
    console.log('Group created successfully:', {
      groupId: Group._id,
      ownerId: Group.ownerId,
      members: Group.members.map(m => ({ userId: m.userId, role: m.role, status: m.status }))
    });
    
    // Create activity for Group creation
    await Activity.createMemberActivity(
      Group._id,
      req.user.id,
      {
        memberName: req.user.name,
        memberRole: 'owner',
        message: `Created the ${Group.name} Group`
      },
      'member_joined'
    );
    
    // Populate owner info
    await Group.populate('ownerId', 'name email avatar');
    
    res.status(201).json({
      success: true,
      Group
    });
  } catch (error) {
    console.error('Error creating Group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Group'
    });
  }
});

// @route   GET /api/groups/:id
// @desc    Get Group details
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    // First, check membership without populating members (to avoid confusion)
    const groupForMembershipCheck = await Group.findById(req.params.id);
    
    if (!groupForMembershipCheck) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Check if user is a member
    const userIdToCheck = String(req.user._id || req.user.id);
    const isMemberResult = groupForMembershipCheck.isMember(userIdToCheck);
    
    if (!isMemberResult) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }
    
    // Now get the full Group with populated data for the response
    const Group = await Group.findById(req.params.id)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');
    
    // Get user's role in Group
    const userId = req.user._id || req.user.id;
    const userRole = Group.getMemberRole(userId);
    
    // Get Group habits (filtered by visibility)
    const groupHabits = await GroupHabit.findByGroup(
      Group._id,
      userRole
    );
    
    // Get Group stats (from adopted Habits, not legacy MemberHabit)
    const stats = await Habit.aggregate([
      { $match: { source: 'Group', groupId: Group._id, isActive: true } },
      { $group: {
        _id: '$groupId',
        totalHabits: { $sum: 1 },
        totalCompletions: { $sum: '$stats.totalChecks' },
        avgStreak: { $avg: '$stats.currentStreak' },
        activeMembers: { $addToSet: '$userId' }
      }},
      { $project: {
        totalHabits: 1,
        totalCompletions: 1,
        avgStreak: { $round: ['$avgStreak', 1] },
        activeMemberCount: { $size: '$activeMembers' }
      }}
    ]);
    
    res.json({
      success: true,
      Group: {
        ...Group.toObject(),
        userRole,
        habits: groupHabits,
        stats: stats[0] || { totalHabits: 0, totalCompletions: 0, activeMemberCount: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching Group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Group'
    });
  }
});

// @route   GET /api/groups/:id/overview
// @desc    Get team progress overview
// @access  Private
router.get('/:id/overview', authenticateJWT, async (req, res) => {
  try {
    const Group = await Group.findById(req.params.id);
    const userId = req.user._id || req.user.id;
    
    if (!Group || !Group.isMember(userId)) {
      return res.status(404).json({
        success: false,
        error: 'Group not found or access denied'
      });
    }
    
    // Get leaderboard data (from adopted Habits)
    const leaderboard = await Habit.find({
      source: 'Group',
      groupId: Group._id,
      isActive: true,
      'groupSettings.shareProgress': { $ne: 'private' }
    })
    .populate('userId', 'name avatar')
    .populate('groupHabitId', 'name icon')
    .sort({ 'stats.currentStreak': -1 })
    .limit(10)
    .lean();
    
    // Get completion stats for the week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    
    const memberProgress = await Habit.aggregate([
      {
        $match: {
          source: 'Group',
          groupId: Group._id,
          isActive: true,
          'groupSettings.shareProgress': { $ne: 'private' }
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
          from: 'groupHabits',
          localField: 'groupHabitId',
          foreignField: '_id',
          as: 'habit'
        }
      },
      {
        $group: {
          _id: '$userId',
          user: { $first: { $arrayElemAt: ['$user', 0] } },
          totalHabits: { $sum: 1 },
          totalCompletions: { $sum: '$stats.totalChecks' },
          currentStreaks: { $sum: '$stats.currentStreak' },
          avgCompletionRate: { $avg: '$stats.completionRate' },
          habits: {
            $push: {
              habit: { $arrayElemAt: ['$habit', 0] },
              currentStreak: '$stats.currentStreak',
              totalCompletions: '$stats.totalChecks',
              shareLevel: '$groupSettings.shareProgress'
            }
          }
        }
      },
      {
        $sort: { currentStreaks: -1 }
      }
    ]);
    
    // Get Group activity for the overview
    const recentActivity = await Activity.getGroupFeed(Group._id, {
      limit: 10,
      types: ['habit_completed', 'streak_milestone', 'goal_achieved']
    });
    
    // Calculate team stats
    const teamStats = {
      totalMembers: Group.memberCount,
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
        Group: {
          _id: Group._id,
          name: Group.name,
          type: Group.type
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Group overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Group overview'
    });
  }
});

// @route   GET /api/groups/:id/activity
// @desc    Get Group activity feed
// @access  Private
router.get('/:id/activity', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, types } = req.query;
    const Group = await Group.findById(req.params.id);
    const userId = req.user._id || req.user.id;
    
    if (!Group || !Group.isMember(userId)) {
      return res.status(404).json({
        success: false,
        error: 'Group not found or access denied'
      });
    }
    
    const activityTypes = types ? types.split(',') : null;
    const activities = await Activity.getGroupFeed(Group._id, {
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

// @route   POST /api/groups/:id/members/invite
// @desc    Invite member to Group
// @access  Private
router.post('/:id/members/invite', [
  authenticateJWT,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'member', 'viewer'])
    .withMessage('Invalid role'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
], async (req, res) => {
  console.log(`🚀🚀🚀 INVITATION ENDPOINT DEFINITELY HIT: POST /api/groups/${req.params.id}/members/invite`);
  console.log(`📨📨📨 Request body:`, JSON.stringify(req.body, null, 2));
  console.log(`👤👤👤 User ID:`, req.user?.id);
  console.log(`🔄🔄🔄 Starting invitation process...`);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`❌ Validation errors:`, errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { email, role = 'member', message } = req.body;
    
    console.log(`📧 Invitation request: ${email} to join Group ${req.params.id} with role ${role}`);
    
    const Group = await Group.findById(req.params.id)
      .populate('ownerId', 'name email');
    
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    console.log(`📧 Group found: ${Group.name}, checking permissions for user ${req.user._id || req.user.id}`);
    
    const userId = req.user._id || req.user.id;
    
    // Check if user can invite members
    if (!Group.canUserAccess(userId, 'invite')) {
      console.log(`❌ Permission denied: User ${userId} cannot invite members to Group ${Group._id}`);
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to invite members'
      });
    }
    
    console.log(`✅ Permission granted: User can invite members`);
    
    // Check if the invited email already belongs to a Group member
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      console.log(`📧 Found existing user for email ${email}: ${existingUser._id}`);
      console.log(`📧 Checking if user ${existingUser._id} is already a member...`);
      console.log(`📧 Group members:`, Group.members.map(m => ({ 
        userId: m.userId.toString(), 
        status: m.status,
        role: m.role 
      })));
      
      const existingMember = Group.members.find(
        member => member.userId.toString() === existingUser._id.toString()
      );
      
      console.log(`📧 Existing member check result:`, existingMember ? 'FOUND' : 'NOT FOUND');
      
      if (existingMember) {
        console.log(`❌ User ${existingUser._id} is already a member of Group ${Group._id}`);
        return res.status(400).json({
          success: false,
          error: 'User is already a member of this Group'
        });
      }
    } else {
      console.log(`📧 No existing user found for email ${email}`);
    }
    
    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({
      groupId: Group._id,
      email: email,
      status: 'pending'
    });
    
    if (existingInvitation && !existingInvitation.isExpired()) {
      console.log(`📧 Found existing pending invitation for ${email}, extending expiration and updating...`);
      
      // Extend the expiration and update the invitation instead of creating a new one
      existingInvitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      existingInvitation.role = role; // Update role in case it changed
      existingInvitation.message = message; // Update message
      existingInvitation.invitedBy = userId; // Update who sent the invite
      
      await existingInvitation.save();
      
      // Send invitation email
      try {
        const emailResult = await emailService.sendInvitationEmail(existingInvitation, Group, req.user);
        console.log(`📧 Invitation email resent to ${email}`, emailResult.previewUrl ? `Preview: ${emailResult.previewUrl}` : '');
      } catch (emailError) {
        console.error('❌ Failed to send invitation email:', emailError);
        // Don't fail the invitation creation if email fails
      }
      
      console.log(`✅ Invitation updated and resent for ${email} to join ${Group.name} (ID: ${existingInvitation._id})`);
      
      return res.json({
        success: true,
        message: 'Invitation resent successfully',
        invitation: {
          id: existingInvitation._id,
          email: existingInvitation.email,
          role: existingInvitation.role,
          Group: Group.name,
          expiresAt: existingInvitation.expiresAt,
          status: existingInvitation.status
        }
      });
    }
    
    // Create new invitation
    console.log('📝 Creating new invitation for', email);
    
    const invitation = new Invitation({
      groupId: Group._id,
      invitedBy: userId,
      email: email,
      invitedUserId: existingUser ? existingUser._id : null,
      role: role,
      message: message
    });
    
    console.log('💾 Saving new invitation...');
    await invitation.save();
    console.log('✅ Invitation saved successfully:', {
      id: invitation._id,
      token: invitation.token ? 'generated' : 'missing',
      expiresAt: invitation.expiresAt
    });
    
    // Send invitation email
    try {
      const emailResult = await emailService.sendInvitationEmail(invitation, Group, req.user);
      console.log(`📧 Invitation email sent to ${email}`, emailResult.previewUrl ? `Preview: ${emailResult.previewUrl}` : '');
    } catch (emailError) {
      console.error('❌ Failed to send invitation email:', emailError);
      // Don't fail the invitation creation if email fails
    }

    console.log(`✅ Invitation successfully created for ${email} to join ${Group.name} (ID: ${invitation._id})`);
    
    res.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        Group: Group.name,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      }
    });
  } catch (error) {
    console.error('❌ Error sending invitation:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send invitation';
    if (error.name === 'ValidationError') {
      errorMessage = `Validation failed: ${Object.values(error.errors).map(e => e.message).join(', ')}`;
    } else if (error.code === 11000) {
      errorMessage = 'An invitation with this email already exists';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/groups/:id/invitations
// @desc    Get Group invitations
// @access  Private
router.get('/:id/invitations', authenticateJWT, async (req, res) => {
  try {
    const Group = await Group.findById(req.params.id);
    
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Check if user can view invitations (owners and admins)
    const userId = req.user._id || req.user.id;
    const userRole = Group.getMemberRole(userId);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view invitations'
      });
    }
    
    // Get invitations with optional status filter
    const { status } = req.query;
    const invitations = await Invitation.findByGroup(Group._id, {
      status: status,
      includeExpired: true
    });
    
    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations'
    });
  }
});

// @route   GET /api/groups/invitations/:token
// @desc    Get invitation details by token
// @access  Public
router.get('/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ 
      token: token,
      status: 'pending'
    })
    .populate('groupId', 'name description type')
    .populate('invitedBy', 'name email');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or has expired'
      });
    }
    
    if (invitation.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'This invitation has expired'
      });
    }
    
    res.json({
      success: true,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        message: invitation.message,
        Group: {
          id: invitation.groupId._id,
          name: invitation.groupId.name,
          description: invitation.groupId.description,
          type: invitation.groupId.type
        },
        invitedBy: {
          name: invitation.invitedBy.name,
          email: invitation.invitedBy.email
        },
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitation details'
    });
  }
});

// @route   POST /api/groups/invitations/:token/accept
// @desc    Accept Group invitation
// @access  Private
router.post('/invitations/:token/accept', authenticateJWT, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user._id || req.user.id;
    
    console.log(`👤 User ${userId} attempting to accept invitation with token ${token}`);
    console.log(`👤 User object:`, { id: req.user.id, _id: req.user._id, email: req.user.email });
    console.log(`👤 Using userId:`, userId, typeof userId);
    
    const invitation = await Invitation.findOne({ 
      token: token,
      status: 'pending'
    }).populate('groupId');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or has already been used'
      });
    }
    
    if (invitation.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'This invitation has expired'
      });
    }
    
    const Group = invitation.groupId;
    
    // Check if user is already a member
    const existingMember = Group.members.find(
      member => member.userId.toString() === userId.toString()
    );
    
    if (existingMember) {
      // Accept invitation but user is already a member
      await invitation.accept(userId);
      return res.status(400).json({
        success: false,
        error: 'You are already a member of this Group'
      });
    }
    
    // Add user to Group
    const memberEntry = {
      userId: new mongoose.Types.ObjectId(userId),
      role: invitation.role,
      status: 'active',
      joinedAt: new Date(),
      permissions: Group.getDefaultPermissions(invitation.role)
    };
    
    console.log(`👤 Adding member entry:`, {
      userId: memberEntry.userId.toString(),
      role: memberEntry.role,
      status: memberEntry.status
    });
    
    Group.members.push(memberEntry);
    
    // Update Group stats
    Group.stats.totalMembers = Group.members.length;
    Group.stats.activeMembers = Group.members.filter(m => m.status === 'active').length;
    
    await Group.save();
    
    // Accept the invitation
    await invitation.accept(userId);
    
    // Create activity entry
    const activity = new Activity({
      groupId: Group._id,
      userId: userId,
      type: 'member_joined',
      data: {
        groupName: Group.name,
        memberName: req.user.name || req.user.email,
        role: invitation.role
      },
      visibility: 'Group'
    });
    await activity.save();
    
    console.log(`✅ User ${userId} successfully joined Group ${Group._id} with role ${invitation.role}`);
    
    res.json({
      success: true,
      message: 'Successfully joined the Group!',
      Group: {
        id: Group._id,
        name: Group.name,
        type: Group.type,
        role: invitation.role
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    });
  }
});

// @route   POST /api/groups/invitations/:token/decline
// @desc    Decline Group invitation
// @access  Public
router.post('/invitations/:token/decline', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ 
      token: token,
      status: 'pending'
    });
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or has already been processed'
      });
    }
    
    await invitation.decline();
    
    res.json({
      success: true,
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline invitation'
    });
  }
});

// @route   DELETE /api/groups/:id/invitations/:invitationId
// @desc    Cancel Group invitation
// @access  Private
router.delete('/:id/invitations/:invitationId', authenticateJWT, async (req, res) => {
  try {
    const Group = await Group.findById(req.params.id);
    
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Check if user can cancel invitations
    if (!Group.canUserAccess(req.user.id, 'invite')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel invitations'
      });
    }
    
    const invitation = await Invitation.findOne({
      _id: req.params.invitationId,
      groupId: Group._id
    });
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }
    
    await invitation.cancel();
    
    res.json({
      success: true,
      message: 'Invitation cancelled'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invitation'
    });
  }
});

// @route   PUT /api/groups/:id/members/:userId
// @desc    Update member role
// @access  Private
router.put('/:id/members/:userId', [
  authenticateJWT,
  body('role')
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
    
    const Group = await Group.findById(req.params.id);
    
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Check if user can manage members (owner or admin)
    const userRole = Group.getMemberRole(req.user.id);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to manage members'
      });
    }
    
    // Can't change owner role
    if (Group.ownerId.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change Group owner role'
      });
    }
    
    // Find and update member
    const member = Group.members.find(
      m => m.userId.toString() === req.params.userId
    );
    
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }
    
    member.role = req.body.role;
    member.permissions = Group.getDefaultPermissions(req.body.role);
    
    await Group.save();
    
    res.json({
      success: true,
      message: 'Member role updated',
      member: {
        userId: member.userId,
        role: member.role,
        permissions: member.permissions
      }
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member role'
    });
  }
});

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove member from Group
// @access  Private
router.delete('/:id/members/:userId', authenticateJWT, async (req, res) => {
  try {
    const Group = await Group.findById(req.params.id);
    
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Check permissions
    const userRole = Group.getMemberRole(req.user.id);
    const isRemovingSelf = req.params.userId === req.user.id;
    
    if (!isRemovingSelf && (!userRole || !['owner', 'admin'].includes(userRole))) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to remove members'
      });
    }
    
    // Can't remove owner unless they're removing themselves
    if (Group.ownerId.toString() === req.params.userId && !isRemovingSelf) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove Group owner. Only the owner can leave/delete the Group.'
      });
    }

    // If owner is removing themselves, delete the entire Group
    if (Group.ownerId.toString() === req.params.userId && isRemovingSelf) {
      console.log(`🗑️ Owner leaving Group, initiating Group deletion...`);
      
      // Delete all related data (same as in the DELETE /:id endpoint)
      const groupHabits = await GroupHabit.find({ groupId: Group._id });
      const groupHabitIds = groupHabits.map(h => h._id);
      
      await HabitEntry.deleteMany({
        habitId: { $in: groupHabitIds }
      });

      // Clean up adopted Habits and their entries
      const adoptedHabits = await Habit.find({ source: 'Group', groupId: Group._id }).select('_id');
      const adoptedHabitIds = adoptedHabits.map(h => h._id);
      await HabitEntry.deleteMany({ habitId: { $in: adoptedHabitIds } });
      await Habit.deleteMany({ source: 'Group', groupId: Group._id });
      await GroupHabit.deleteMany({ groupId: Group._id });
      await Activity.deleteMany({ groupId: Group._id });
      await Invitation.deleteMany({ groupId: Group._id });
      await Group.findByIdAndDelete(Group._id);

      return res.json({
        success: true,
        message: 'Group deleted successfully'
      });
    }
    
    // Remove member
    Group.members = Group.members.filter(
      m => m.userId.toString() !== req.params.userId
    );
    
    // Update stats
    Group.stats.totalMembers = Group.members.length;
    Group.stats.activeMembers = Group.members.filter(m => m.status === 'active').length;
    
    await Group.save();
    
    // Deactivate member's adopted habits from this Group
    await Habit.updateMany(
      { source: 'Group', groupId: Group._id, userId: req.params.userId },
      { isActive: false }
    );
    
    res.json({
      success: true,
      message: isRemovingSelf ? 'Left Group successfully' : 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member'
    });
  }
});

// Leave Group - Self-service member exit
// Allow a user to remove themselves from a Group if they're not the owner
router.post('/:id/leave', authenticateJWT, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id; // Support both _id and id

    console.log('Leave Group request:', { 
      groupId, 
      userId: userId.toString(),
      userFromToken: { id: req.user._id || req.user.id, email: req.user.email }
    });

    // Find the Group
    const Group = await Group.findById(groupId);
    
    if (!Group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!Group.isMember(userId)) {
      console.log('User not a member check:', {
        userId: userId.toString(),
        members: Group.members.map(m => ({ 
          userId: m.userId.toString(), 
          status: m.status,
          role: m.role 
        }))
      });
      return res.status(403).json({ message: 'You are not a member of this Group' });
    }

    // Cannot leave if you're the only owner
    const isOwner = Group.getMemberRole(userId) === 'owner';
    const ownerCount = Group.members.filter(m => m.role === 'owner').length;

    if (isOwner && ownerCount <= 1) {
      return res.status(403).json({ 
        message: 'Cannot leave Group as the only owner. Transfer ownership first or delete the Group.' 
      });
    }

    // Create an activity record
    const activity = new Activity({
      groupId: Group._id,
      userId: userId,
      type: 'member_left',
      data: {
        groupName: Group.name,
        userRole: Group.getMemberRole(userId)
      }
    });
    await activity.save();

    // Remove the user from Group members
    Group.members = Group.members.filter(member => 
      member.userId.toString() !== userId.toString()
    );
    
    await Group.save();

    // Deactivate adopted habits for this user in this Group
    await Habit.updateMany(
      { source: 'Group', groupId: groupId, userId: userId },
      { isActive: false }
    );

    return res.status(200).json({ 
      message: 'Successfully left the Group',
      groupId: Group._id
    });
  } catch (error) {
    console.error('Error leaving Group:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/groups/:groupId/member-habits
// @desc    Get user's adopted habits in Group
// @access  Private
router.get('/:groupId/member-habits', authenticateJWT, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Verify user has access to Group
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const isMember = Group.members.some(member => 
      member.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Get user's adopted Group habits (now unified in Habit model)
    const groupHabits = await Habit.find({
      userId: userId,
      source: 'Group',
      groupId: groupId,
      isActive: true
    })
    .populate('groupHabitId', 'name description category icon color')
    .sort({ adoptedAt: -1 });

    res.json({
      success: true,
      habits: groupHabits
    });

  } catch (error) {
    console.error('Error fetching member habits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member habits',
      details: error.message
    });
  }
});

// @route   GET /api/groups/:groupId/group-trackers
// @desc    Get group tracking data for all members in Group
// @access  Private
router.get('/:groupId/group-trackers', authenticateJWT, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    console.log('🔍 Group Trackers Request:', {
      groupId,
      userId,
      startDate,
      endDate
    });

    // Verify Group exists and user has access
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const isMember = Group.members.some(member => 
      member.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.date.$lte = new Date(endDate);
      }
    }

    // Get all Group members' user IDs
    const memberUserIds = Group.members.map(member => member.userId);

    // Get all Group habits adopted by members
    const groupHabits = await Habit.find({
      groupId: groupId,
      source: 'Group',
      userId: { $in: memberUserIds },
      isActive: true
    })
    .populate('groupHabitId', 'name description category icon color')
    .populate('userId', 'name email');

    // Get habit entries for all Group habits within date range
    const habitIds = groupHabits.map(habit => habit._id);
    const habitEntries = await HabitEntry.find({
      habitId: { $in: habitIds },
      ...dateFilter
    })
    .populate('habitId')
    .populate('userId', 'name email')
    .sort({ date: -1 });

    // Group data by user and habit
    const trackers = [];
    const habitMap = new Map();
    
    // Create habit lookup map
    groupHabits.forEach(habit => {
      habitMap.set(habit._id.toString(), habit);
    });

    // Group entries by user and habit
    const userHabitEntries = new Map();
    
    habitEntries.forEach(entry => {
      const habit = habitMap.get(entry.habitId._id.toString());
      if (!habit) return;

      const key = `${habit.userId._id}_${habit._id}`;
      if (!userHabitEntries.has(key)) {
        const displayName = habit.userId.name || habit.userId.email?.split('@')[0] || 'Unknown User';
        
        userHabitEntries.set(key, {
          userId: habit.userId._id,
          userName: displayName, // For backward compatibility
          name: displayName, // For frontend .name access
          memberName: displayName, // For leaderboard compatibility
          habitId: habit._id,
          habitName: habit.groupHabitId?.name || habit.name,
          habitCategory: habit.groupHabitId?.category,
          habitIcon: habit.groupHabitId?.icon,
          habitColor: habit.groupHabitId?.color,
          entries: []
        });
      }
      
      userHabitEntries.get(key).entries.push({
        _id: entry._id,
        date: entry.date.toISOString(),
        completed: entry.completed,
        value: entry.value,
        notes: entry.notes,
        mood: entry.mood,
        completedAt: entry.completedAt
      });
    });

    // Convert map to array
    userHabitEntries.forEach((data) => {
      trackers.push(data);
    });

    // Get unique habits for reference
    const habits = Array.from(new Set(groupHabits.map(h => h.groupHabitId)))
      .filter(Boolean)
      .map(whId => {
        const habit = groupHabits.find(h => h.groupHabitId && h.groupHabitId._id.equals(whId._id));
        return habit?.groupHabitId;
      });

    console.log('📊 Group Trackers Response:', {
      trackersCount: trackers.length,
      habitsCount: habits.length,
      entriesCount: habitEntries.length
    });

    res.json({
      success: true,
      trackers,
      habits,
      memberTrackers: trackers, // Alternative format for compatibility
      totalEntries: habitEntries.length,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });

  } catch (error) {
    console.error('Error fetching group trackers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group trackers',
      details: error.message
    });
  }
});

// @route   GET /api/groups/:groupId/members/:memberId/dashboard
// @desc    Get member's dashboard view (habits and entries) within Group context
// @access  Private
router.get('/:groupId/members/:memberId/dashboard', authenticateJWT, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const requestingUserId = req.user.id;

    console.log('🔍 Member Dashboard Request:', {
      groupId,
      memberId,
      requestingUserId
    });

    // Verify Group exists and requesting user has access
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const isRequestingUserMember = Group.members.some(member => 
      member.userId.toString() === requestingUserId
    );

    if (!isRequestingUserMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Verify target member is in the Group
    const targetMember = Group.members.find(member => 
      member.userId.toString() === memberId
    );

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        error: 'Member not found in this Group'
      });
    }

    // Get target member's user info
    const memberUser = await User.findById(memberId).select('name email avatar dashboardSharingPermissions');
    if (!memberUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check dashboard sharing permissions
    const hasPermission = checkDashboardSharingPermission(memberUser, requestingUserId, groupId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Member has not shared their dashboard with you'
      });
    }

    // Get member's habits (both personal and Group habits)
    const [personalHabits, groupHabits] = await Promise.all([
      // Personal habits
      Habit.find({
        userId: memberId,
        source: 'personal',
        isActive: true
      }).sort({ createdAt: -1 }),
      
      // Group habits for this specific Group
      Habit.find({
        userId: memberId,
        source: 'Group',
        groupId: groupId,
        isActive: true
      })
      .populate('groupHabitId', 'name description category icon color')
      .sort({ adoptedAt: -1 })
    ]);

    // Combine both types of habits
    const memberHabits = [...personalHabits, ...groupHabits];

    // Get habit entries for member's habits
    const habitIds = memberHabits.map(habit => habit._id);
    const habitEntries = await HabitEntry.find({
      habitId: { $in: habitIds },
      userId: memberId
    })
    .sort({ date: -1 });

    // Organize entries by habit ID and date for frontend compatibility
    const entriesByHabit = {};
    habitEntries.forEach(entry => {
      const habitId = entry.habitId.toString();
      if (!entriesByHabit[habitId]) {
        entriesByHabit[habitId] = {};
      }
      
      const dateKey = entry.date.toISOString().split('T')[0];
      entriesByHabit[habitId][dateKey] = {
        _id: entry._id,
        habitId: entry.habitId,
        date: dateKey,
        completed: entry.completed,
        value: entry.value,
        notes: entry.notes,
        mood: entry.mood,
        completedAt: entry.completedAt
      };
    });

    console.log('📊 Member Dashboard Response:', {
      memberName: memberUser.name,
      personalHabitsCount: personalHabits.length,
      groupHabitsCount: groupHabits.length,
      totalHabitsCount: memberHabits.length,
      entriesCount: habitEntries.length
    });

    res.json({
      success: true,
      member: {
        _id: memberUser._id,
        username: memberUser.name, // Use name field as username for backward compatibility
        email: memberUser.email,
        firstName: null, // These fields don't exist in the User model
        lastName: null,  // These fields don't exist in the User model
        name: memberUser.name || memberUser.email?.split('@')[0] || 'Unknown User',
        avatar: memberUser.avatar,
        role: targetMember.role,
        status: targetMember.status
      },
      habits: memberHabits,
      entries: entriesByHabit,
      totalEntries: habitEntries.length
    });

  } catch (error) {
    console.error('Error fetching member dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member dashboard',
      details: error.message
    });
  }
});

// Helper function to check dashboard sharing permissions
function checkDashboardSharingPermission(memberUser, requestingUserId, groupId) {
  // If no permissions are set, default to public to Group
  if (!memberUser.dashboardSharingPermissions || memberUser.dashboardSharingPermissions.length === 0) {
    return true;
  }

  const groupPermission = memberUser.dashboardSharingPermissions.find(
    perm => perm.groupId.toString() === groupId
  );

  if (!groupPermission) {
    // No specific permission for this Group, default to public
    return true;
  }

  // Check if public to Group
  if (groupPermission.isPublicToGroup) {
    return true;
  }

  // Check if specifically allowed
  if (groupPermission.allowedMembers && 
      groupPermission.allowedMembers.some(allowedId => 
        allowedId.toString() === requestingUserId
      )) {
    return true;
  }

  return false;
}

// @route   POST /api/groups/:groupId/habits/:habitId/adopt
// @desc    Adopt Group habit to personal dashboard
// @access  Private
router.post('/:groupId/habits/:habitId/adopt', [
  authenticateJWT,
  body('personalSettings.target.value')
    .optional()
    .isNumeric()
    .withMessage('Target value must be a number'),
  body('personalSettings.target.unit')
    .optional()
    .isString()
    .withMessage('Target unit must be a string'),
  body('personalSettings.reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Reminder time must be in HH:MM format'),
  body('personalSettings.shareProgress')
    .optional()
    .isIn(['full', 'progress-only', 'streaks-only', 'private'])
    .withMessage('shareProgress must be one of: full, progress-only, streaks-only, private'),
  body('personalSettings.allowInteraction')
    .optional()
    .isBoolean()
    .withMessage('allowInteraction must be a boolean'),
  body('personalSettings.shareInActivity')
    .optional()
    .isBoolean()
    .withMessage('shareInActivity must be a boolean')
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

    const { groupId, habitId } = req.params;
    const userId = req.user.id;
    const { personalSettings } = req.body;

    // Verify Group exists and user has access
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const isMember = Group.members.some(member => 
      member.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Verify Group habit exists
    const GroupHabit = await GroupHabit.findById(habitId);
    if (!GroupHabit || GroupHabit.groupId.toString() !== groupId) {
      return res.status(404).json({
        success: false,
        error: 'Group habit not found'
      });
    }

    // Check if user has already adopted this habit
    const existingHabit = await Habit.findOne({
      userId: userId,
      source: 'Group',
      groupId: groupId,
      groupHabitId: habitId,
      isActive: true
    });

    if (existingHabit) {
      return res.status(400).json({
        success: false,
        error: 'You have already adopted this habit'
      });
    }

    // Create unified habit with Group context
    const habit = new Habit({
      // Basic habit info from Group template
      name: GroupHabit.name,
      description: GroupHabit.description,
      userId: userId,
      category: GroupHabit.category,
      color: GroupHabit.color,
      icon: GroupHabit.icon,
      
      // Personal settings (can override defaults)
      frequency: GroupHabit.defaultSettings?.frequency || 'daily',
      weeklyTarget: personalSettings?.weeklyTarget || GroupHabit.defaultSettings?.weeklyTarget || 3,
      target: personalSettings?.target || GroupHabit.defaultSettings?.target || { value: 1, unit: 'times' },
      schedule: {
        days: GroupHabit.defaultSettings?.schedule?.days || [0,1,2,3,4,5,6],
        reminderTime: personalSettings?.reminderTime || GroupHabit.defaultSettings?.schedule?.reminderTime || '09:00',
        reminderEnabled: personalSettings?.reminderEnabled || false
      },
      
      // Group adoption context
      source: 'Group',
      groupId: groupId,
      groupHabitId: habitId,
      adoptedAt: new Date(),
      
      // Group settings for privacy and interaction
      groupSettings: {
        shareProgress: personalSettings?.shareProgress || 'progress-only',
        allowInteraction: personalSettings?.allowInteraction !== undefined ? personalSettings.allowInteraction : true,
        shareInActivity: personalSettings?.shareInActivity !== undefined ? personalSettings.shareInActivity : true
      },
      
      isActive: true
    });

    await habit.save();

    // Create activity entry
    const activity = new Activity({
      groupId: groupId,
      userId: userId,
      type: 'habit_adopted',
      data: {
        habitName: GroupHabit.name,
        habitId: habit._id,
        groupHabitId: habitId
      },
      visibility: 'Group'
    });
    await activity.save();

    res.status(201).json({
      success: true,
      habit: habit,
      message: 'Habit successfully adopted to your dashboard'
    });

  } catch (error) {
    console.error('Error adopting Group habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adopt habit',
      details: error.message
    });
  }
});

// @route   PUT /api/groups/:groupId/member-habits/:memberHabitId
// @desc    Update member habit settings
// @access  Private
router.put('/:groupId/member-habits/:memberHabitId', [
  authenticateJWT,
  body('personalSettings.target.value')
    .optional()
    .isNumeric()
    .withMessage('Target value must be a number'),
  body('personalSettings.target.unit')
    .optional()
    .isString()
    .withMessage('Target unit must be a string'),
  body('personalSettings.reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Reminder time must be in HH:MM format'),
  body('personalSettings.isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean')
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

    const { groupId, memberHabitId } = req.params;
    const userId = req.user.id;
    const { personalSettings } = req.body;

    // Find and verify habit belongs to user (unified Habit model)
    const habit = await Habit.findOne({
      _id: memberHabitId,
      source: 'Group',
      groupId: groupId,
      userId: userId
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Member habit not found or access denied'
      });
    }

    // Update personal settings → map to Habit fields
    if (personalSettings) {
      if (personalSettings.target) {
        habit.target = { ...habit.target, ...personalSettings.target };
      }
      if (personalSettings.reminderTime !== undefined) {
        habit.schedule.reminderTime = personalSettings.reminderTime;
      }
      if (personalSettings.isPrivate !== undefined) {
        habit.groupSettings.shareProgress = personalSettings.isPrivate ? 'private' : 'progress-only';
      }
    }

    habit.updatedAt = new Date();
    await habit.save();

    // Populate the response
    await habit.populate('groupHabitId', 'name description category');
    await habit.populate('userId', 'name email');

    res.json({
      success: true,
      memberHabit: habit,
      message: 'Habit settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating member habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update habit settings',
      details: error.message
    });
  }
});

// @route   DELETE /api/groups/:groupId/member-habits/:memberHabitId
// @desc    Remove member habit from personal dashboard
// @access  Private
router.delete('/:groupId/member-habits/:memberHabitId', authenticateJWT, async (req, res) => {
  try {
    const { groupId, memberHabitId } = req.params;
    const userId = req.user.id;

    // Find and verify habit belongs to user (unified Habit model)
    const habit = await Habit.findOne({
      _id: memberHabitId,
      source: 'Group',
      groupId: groupId,
      userId: userId
    }).populate('groupHabitId', 'name');

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Member habit not found or access denied'
      });
    }

    // Soft delete - mark as inactive
    habit.isActive = false;
    habit.updatedAt = new Date();
    await habit.save();

    // Create activity entry
    const activity = new Activity({
      groupId: groupId,
      userId: userId,
      type: 'habit_removed',
      data: {
        habitName: habit.groupHabitId?.name || habit.name || 'Unknown habit',
        habitId: habit.groupHabitId?._id
      },
      visibility: 'Group'
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Habit removed from your dashboard'
    });

  } catch (error) {
    console.error('Error removing member habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove habit',
      details: error.message
    });
  }
});

// @route   GET /api/groups/:groupId/habits
// @desc    Get all habits for a Group
// @access  Private
router.get('/:groupId/habits', authenticateJWT, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Group ID'
      });
    }

    // Check if user is a member of the Group
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const isMember = Group.members.some(member => 
      member.userId.toString() === req.user.id && member.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Get all Group habits
    const groupHabits = await GroupHabit.find({ groupId })
      .populate('createdBy', 'email name')
      .sort({ createdAt: -1 });

    // Get member adoption counts for each habit (from unified Habit model)
    const habitsWithStats = await Promise.all(
      groupHabits.map(async (habit) => {
        const adoptedHabits = await Habit.find({
          groupHabitId: habit._id,
          source: 'Group',
          isActive: true
        })
        .populate('userId', 'name email')
        .select('userId');

        return {
          ...habit.toObject(),
          adoptionCount: adoptedHabits.length,
          adoptedBy: adoptedHabits.map(h => h.userId)
        };
      })
    );

    res.json({
      success: true,
      habits: habitsWithStats
    });

  } catch (error) {
    console.error('Error fetching Group habits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Group habits',
      details: error.message
    });
  }
});

// @route   POST /api/groups/:groupId/habits
// @desc    Create a new habit for a Group
// @access  Private
router.post('/:groupId/habits', [
  authenticateJWT,
  body('name')
    .notEmpty()
    .withMessage('Habit name is required')
    .isLength({ max: 100 })
    .withMessage('Habit name cannot exceed 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('category')
    .optional()
    .isIn(['health', 'productivity', 'learning', 'fitness', 'mindfulness', 'social', 'creative', 'other'])
    .withMessage('Invalid category'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please provide a valid hex color'),
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters')
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

    const { groupId } = req.params;
    const { name, description, category, color, icon } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Group ID'
      });
    }

    // Check if user is a member of the Group
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const isMember = Group.members.some(member => 
      member.userId.toString() === req.user.id && member.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Create the Group habit
    const GroupHabit = new GroupHabit({
      groupId,
      name,
      description,
      createdBy: req.user.id,
      category: category || 'other',
      color: color || '#3B82F6',
      icon: icon || '🎯'
    });

    await GroupHabit.save();

    // Populate the created habit with creator info
    await GroupHabit.populate('createdBy', 'email name');

    // Log activity
    try {
      const activity = new Activity({
        type: 'habit_created',
        userId: req.user.id,
        groupId,
        data: {
          habitId: GroupHabit._id,
          habitName: name
        },
        visibility: 'Group'
      });
      await activity.save();
    } catch (activityError) {
      console.error('Error logging activity:', activityError);
      // Don't fail the main operation
    }

    res.status(201).json({
      success: true,
      habit: {
        ...GroupHabit.toObject(),
        adoptionCount: 0,
        isAdoptedByUser: false
      }
    });

  } catch (error) {
    console.error('Error creating Group habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Group habit',
      details: error.message
    });
  }
});

// @route   GET /api/groups/Group-habits/:id
// @desc    Get Group habit details
// @access  Private
router.get('/Group-habits/:id', authenticateJWT, async (req, res) => {
  try {
    const GroupHabit = await GroupHabit.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('groupId', 'name');

    if (!GroupHabit) {
      return res.status(404).json({
        success: false,
        error: 'Group habit not found'
      });
    }

    // Check if user is a member of the Group
    const Group = await Group.findById(GroupHabit.groupId);
    const isMember = Group.members.some(member => 
      member.userId.toString() === req.user.id && member.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Get adoption stats (from unified Habit model)
    const adoptionCount = await Habit.countDocuments({
      groupHabitId: GroupHabit._id,
      source: 'Group',
      isActive: true
    });

    const isAdoptedByUser = await Habit.exists({
      groupHabitId: GroupHabit._id,
      userId: req.user.id,
      source: 'Group',
      isActive: true
    });

    res.json({
      success: true,
      habit: {
        ...GroupHabit.toObject(),
        adoptionCount,
        isAdoptedByUser: !!isAdoptedByUser
      }
    });

  } catch (error) {
    console.error('Error fetching Group habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Group habit',
      details: error.message
    });
  }
});

// @route   PUT /api/groups/Group-habits/:id
// @desc    Update Group habit
// @access  Private
router.put('/Group-habits/:id', [
  authenticateJWT,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Habit name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('category')
    .optional()
    .isIn(['health', 'productivity', 'mindfulness', 'fitness', 'learning', 'social', 'creative', 'other'])
    .withMessage('Invalid category'),
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  body('settings.visibility')
    .optional()
    .isIn(['all', 'admins-only', 'self-only'])
    .withMessage('Invalid visibility setting'),
  body('settings.allowCustomization')
    .optional()
    .isBoolean()
    .withMessage('allowCustomization must be a boolean'),
  body('icon')
    .optional()
    .isString()
    .withMessage('Icon must be a string'),
  body('color')
    .optional()
    .isString()
    .withMessage('Color must be a string')
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

    const GroupHabit = await GroupHabit.findById(req.params.id);

    if (!GroupHabit) {
      return res.status(404).json({
        success: false,
        error: 'Group habit not found'
      });
    }

    // Check permissions
    const Group = await Group.findById(GroupHabit.groupId);
    const userMember = Group.members.find(member => 
      member.userId.toString() === req.user.id && member.status === 'active'
    );

    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Check if user can edit (creator, admin, or owner)
    const canEdit = GroupHabit.createdBy.toString() === req.user.id ||
                   userMember.role === 'admin' ||
                   userMember.role === 'owner';

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this habit'
      });
    }

    const { name, description, category, isRequired, settings, icon, color, schedule } = req.body;

    // Update habit
    if (name !== undefined) GroupHabit.name = name;
    if (description !== undefined) GroupHabit.description = description;
    if (category !== undefined) GroupHabit.category = category;
    if (isRequired !== undefined) GroupHabit.isRequired = isRequired;
    if (icon !== undefined) GroupHabit.icon = icon;
    if (color !== undefined) GroupHabit.color = color;
    
    if (settings) {
      if (!GroupHabit.settings) GroupHabit.settings = {};
      if (settings.visibility !== undefined) GroupHabit.settings.visibility = settings.visibility;
      if (settings.allowCustomization !== undefined) GroupHabit.settings.allowCustomization = settings.allowCustomization;
      if (settings.defaultTarget) {
        GroupHabit.settings.defaultTarget = settings.defaultTarget;
      }
      if (schedule) {
        GroupHabit.settings.schedule = schedule;
      }
    }

    await GroupHabit.save();

    res.json({
      success: true,
      habit: GroupHabit
    });

  } catch (error) {
    console.error('Error updating Group habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Group habit',
      details: error.message
    });
  }
});

// @route   DELETE /api/groups/Group-habits/:id
// @desc    Delete Group habit
// @access  Private
router.delete('/Group-habits/:id', authenticateJWT, async (req, res) => {
  try {
    const GroupHabit = await GroupHabit.findById(req.params.id);

    if (!GroupHabit) {
      return res.status(404).json({
        success: false,
        error: 'Group habit not found'
      });
    }

    // Check permissions
    const Group = await Group.findById(GroupHabit.groupId);
    const userMember = Group.members.find(member => 
      member.userId.toString() === req.user.id && member.status === 'active'
    );

    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Check if user can delete (creator, admin, or owner)
    const canDelete = GroupHabit.createdBy.toString() === req.user.id ||
                     userMember.role === 'admin' ||
                     userMember.role === 'owner';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this habit'
      });
    }

    // Check if habit is adopted by any members
    const adoptionCount = await Habit.countDocuments({
      groupHabitId: GroupHabit._id,
      source: 'Group',
      isActive: true
    });

    if (adoptionCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete habit. It is currently adopted by ${adoptionCount} member(s). Please ask them to unadopt it first.`
      });
    }

    // Delete the habit
    await GroupHabit.findByIdAndDelete(req.params.id);

    // Log activity
    try {
      const activity = new Activity({
        groupId: GroupHabit.groupId,
        userId: req.user.id,
        type: 'habit_deleted',
        data: {
          habitId: GroupHabit._id,
          habitName: GroupHabit.name
        },
        visibility: 'Group'
      });
      await activity.save();
    } catch (activityError) {
      console.error('Error logging activity:', activityError);
      // Don't fail the main operation
    }

    res.json({
      success: true,
      message: 'Group habit deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Group habit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Group habit',
      details: error.message
    });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update Group settings
// @access  Private (Owners and Admins)
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { name, description, type, settings } = req.body;

    console.log(`🔧 UPDATE Group REQUEST: Group ${groupId}, User ${userId}`);

    // Find the Group
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check permissions - only owners and admins can update settings
    const userRole = Group.getMemberRole(userId);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update Group settings'
      });
    }

    console.log(`🔧 Permission check passed - User role: ${userRole}`);

    // Validate and update basic fields
    if (name !== undefined) {
      if (!name.trim() || name.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Group name must be 1-100 characters'
        });
      }
      Group.name = name.trim();
    }

    if (description !== undefined) {
      if (description.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Description cannot exceed 500 characters'
        });
      }
      Group.description = description.trim();
    }

    if (type !== undefined) {
      const validTypes = ['family', 'team', 'fitness', 'study', 'community', 'personal'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Group type'
        });
      }
      Group.type = type;
    }

    // Update settings object
    if (settings) {
      if (settings.isPublic !== undefined) {
        Group.settings.isPublic = Boolean(settings.isPublic);
      }
      
      if (settings.allowInvites !== undefined) {
        Group.settings.allowInvites = Boolean(settings.allowInvites);
      }
      
      if (settings.requireApproval !== undefined) {
        Group.settings.requireApproval = Boolean(settings.requireApproval);
      }
      
      if (settings.privacyLevel !== undefined) {
        const validLevels = ['open', 'members-only', 'invite-only'];
        if (!validLevels.includes(settings.privacyLevel)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid privacy level'
          });
        }
        Group.settings.privacyLevel = settings.privacyLevel;
      }

      if (settings.allowMemberHabitCreation !== undefined) {
        Group.settings.allowMemberHabitCreation = Boolean(settings.allowMemberHabitCreation);
      }

      if (settings.defaultHabitVisibility !== undefined) {
        const validVisibility = ['public', 'progress-only', 'streaks-only', 'private'];
        if (!validVisibility.includes(settings.defaultHabitVisibility)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid default habit visibility'
          });
        }
        Group.settings.defaultHabitVisibility = settings.defaultHabitVisibility;
      }
    }

    // Save the updated Group
    Group.updatedAt = new Date();
    await Group.save();

    console.log(`🔧 Group updated successfully`);

    // Return the updated Group
    const updatedGroup = await Group.findById(groupId)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    res.json({
      success: true,
      message: 'Group settings updated successfully',
      Group: updatedGroup
    });

  } catch (error) {
    console.error('Error updating Group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Group settings',
      details: error.message
    });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete entire Group
// @route   DELETE /api/groups/:id
// @access  Private (Owner only)
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;

    console.log(`🗑️ DELETE Group REQUEST: Group ${groupId}, User ${userId}`);

    // Get the Group and verify ownership
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is the owner
    const member = Group.members.find(
      (m) => m.userId.toString() === userId.toString()
    );

    if (!member || member.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this Group'
      });
    }

    console.log(`🗑️ Confirmed ownership, proceeding with deletion...`);

    // Delete all related data in the correct order to avoid reference errors
    
    // 1. Delete all habit entries for Group habits
    const groupHabits = await GroupHabit.find({ groupId });
    const groupHabitIds = groupHabits.map(h => h._id);
    
    await HabitEntry.deleteMany({
      habitId: { $in: groupHabitIds }
    });
    console.log(`🗑️ Deleted habit entries for Group habits`);

    // 2. Delete all adopted habits and their entries for this Group
    const adoptedHabits = await Habit.find({ source: 'Group', groupId }).select('_id');
    const adoptedHabitIds = adoptedHabits.map(h => h._id);
    
    await HabitEntry.deleteMany({
      habitId: { $in: adoptedHabitIds }
    });
    await Habit.deleteMany({ source: 'Group', groupId });
    console.log(`🗑️ Deleted adopted habits and their entries`);

    // 3. Delete Group habits
    await GroupHabit.deleteMany({ groupId });
    console.log(`🗑️ Deleted Group habits`);

    // 4. Delete activities
    await Activity.deleteMany({ groupId });
    console.log(`🗑️ Deleted activities`);

    // 5. Delete invitations
    await Invitation.deleteMany({ groupId });
    console.log(`🗑️ Deleted invitations`);

    // 7. Finally delete the Group itself
    await Group.findByIdAndDelete(groupId);
    console.log(`🗑️ Deleted Group`);

    res.json({
      success: true,
      message: 'Group and all related data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Group',
      details: error.message
    });
  }
});

// @route   GET /api/groups/:id/dashboard-permissions
// @desc    Get user's dashboard sharing permissions for a Group
// @access  Private
router.get('/:id/dashboard-permissions', authenticateJWT, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;

    // Find the Group to verify membership
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is a member
    const isMember = Group.members.some(member => 
      member.userId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Get user's dashboard permissions for this Group
    const user = await User.findById(userId);
    const permissions = user.dashboardSharingPermissions?.find(
      perm => perm.groupId.toString() === groupId
    ) || { isPublicToGroup: true };

    res.json({
      success: true,
      permissions: {
        isPublicToGroup: permissions.isPublicToGroup !== false,
        allowedMembers: permissions.allowedMembers || []
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard permissions'
    });
  }
});

// @route   PUT /api/groups/:id/dashboard-permissions
// @desc    Update user's dashboard sharing permissions for a Group
// @access  Private
router.put('/:id/dashboard-permissions', authenticateJWT, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { isPublicToGroup, allowedMembers } = req.body;

    // Find the Group to verify membership
    const Group = await Group.findById(groupId);
    if (!Group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is a member
    const isMember = Group.members.some(member => 
      member.userId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this Group.'
      });
    }

    // Update user's dashboard permissions
    const user = await User.findById(userId);
    
    // Initialize dashboardSharingPermissions if it doesn't exist
    if (!user.dashboardSharingPermissions) {
      user.dashboardSharingPermissions = [];
    }

    // Find existing permission for this Group or create new one
    const existingPermissionIndex = user.dashboardSharingPermissions.findIndex(
      perm => perm.groupId.toString() === groupId
    );

    const newPermission = {
      groupId: groupId,
      isPublicToGroup: isPublicToGroup !== false,
      allowedMembers: allowedMembers || [],
      updatedAt: new Date()
    };

    if (existingPermissionIndex >= 0) {
      user.dashboardSharingPermissions[existingPermissionIndex] = newPermission;
    } else {
      user.dashboardSharingPermissions.push(newPermission);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Dashboard sharing permissions updated successfully',
      permissions: {
        isPublicToGroup: newPermission.isPublicToGroup,
        allowedMembers: newPermission.allowedMembers
      }
    });

  } catch (error) {
    console.error('Error updating dashboard permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dashboard permissions'
    });
  }
});

module.exports = router;
