const express = require('express');
const router = express.Router();
const Encouragement = require('../models/Encouragement');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Habit = require('../models/Habit');
const { authenticateJWT } = require('../middleware/auth');
const { validateEncouragement } = require('../middleware/validation');

// @route   POST /api/encouragements
// @desc    Send encouragement to another user
// @access  Private
router.post('/', authenticateJWT, validateEncouragement, async (req, res) => {
  try {
    const {
      toUserId,
      workspaceId,
      habitId,
      type,
      message,
      reaction
    } = req.body;

    // Verify the recipient user exists
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    // Verify workspace exists and sender is a member
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if sender is a member of the workspace
    const senderIsMember = workspace.members.some(member => 
      member.userId.toString() === req.user.id
    );
    if (!senderIsMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }

    // Check if recipient is a member of the workspace
    const recipientIsMember = workspace.members.some(member => 
      member.userId.toString() === toUserId
    );
    if (!recipientIsMember) {
      return res.status(403).json({
        success: false,
        message: 'Recipient is not a member of this workspace'
      });
    }

    // If habitId is provided, verify it exists and belongs to the recipient
    if (habitId) {
      const habit = await Habit.findOne({
        _id: habitId,
        userId: toUserId,
        workspaceId: workspaceId
      });
      if (!habit) {
        return res.status(404).json({
          success: false,
          message: 'Habit not found or does not belong to the recipient'
        });
      }
    }

    // Prevent self-encouragement
    if (req.user.id === toUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send encouragement to yourself'
      });
    }

    // Create the encouragement
    const encouragement = new Encouragement({
      fromUser: req.user.id,
      toUser: toUserId,
      workspace: workspaceId,
      habit: habitId || null,
      type: type || 'general_support',
      message,
      reaction: reaction || '👏'
    });

    await encouragement.save();

    // Populate the encouragement for response
    await encouragement.populate([
      { path: 'fromUser', select: 'name email avatar' },
      { path: 'toUser', select: 'name email avatar' },
      { path: 'workspace', select: 'name' },
      { path: 'habit', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      data: encouragement
    });

  } catch (error) {
    console.error('Error sending encouragement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send encouragement'
    });
  }
});

// @route   GET /api/encouragements/received
// @desc    Get encouragements received by the current user
// @access  Private
router.get('/received', authenticateJWT, async (req, res) => {
  try {
    const { workspaceId, unreadOnly, limit } = req.query;
    
    const options = {
      workspaceId: workspaceId || null,
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit) || 50
    };

    const encouragements = await Encouragement.getReceivedEncouragements(
      req.user.id,
      options
    );

    res.json({
      success: true,
      data: encouragements
    });

  } catch (error) {
    console.error('Error fetching received encouragements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch encouragements'
    });
  }
});

// @route   GET /api/encouragements/sent
// @desc    Get encouragements sent by the current user
// @access  Private
router.get('/sent', authenticateJWT, async (req, res) => {
  try {
    const { workspaceId, limit } = req.query;
    
    const options = {
      workspaceId: workspaceId || null,
      limit: parseInt(limit) || 50
    };

    const encouragements = await Encouragement.getSentEncouragements(
      req.user.id,
      options
    );

    res.json({
      success: true,
      data: encouragements
    });

  } catch (error) {
    console.error('Error fetching sent encouragements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent encouragements'
    });
  }
});

// @route   GET /api/encouragements/workspace/:workspaceId
// @desc    Get all encouragements in a workspace (for feed/activity)
// @access  Private
router.get('/workspace/:workspaceId', authenticateJWT, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { limit } = req.query;

    // Verify user is a member of the workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    const isMember = workspace.members.some(member => 
      member.userId.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }

    const options = {
      limit: parseInt(limit) || 100
    };

    const encouragements = await Encouragement.getWorkspaceEncouragements(
      workspaceId,
      options
    );

    res.json({
      success: true,
      data: encouragements
    });

  } catch (error) {
    console.error('Error fetching workspace encouragements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace encouragements'
    });
  }
});

// @route   PUT /api/encouragements/:id/read
// @desc    Mark encouragement as read
// @access  Private
router.put('/:id/read', authenticateJWT, async (req, res) => {
  try {
    const encouragement = await Encouragement.findOne({
      _id: req.params.id,
      toUser: req.user.id
    });

    if (!encouragement) {
      return res.status(404).json({
        success: false,
        message: 'Encouragement not found'
      });
    }

    await encouragement.markAsRead();

    res.json({
      success: true,
      data: encouragement
    });

  } catch (error) {
    console.error('Error marking encouragement as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark encouragement as read'
    });
  }
});

// @route   PUT /api/encouragements/:id/respond
// @desc    Respond to an encouragement
// @access  Private
router.put('/:id/respond', authenticateJWT, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }

    if (message.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Response cannot exceed 300 characters'
      });
    }

    const encouragement = await Encouragement.findOne({
      _id: req.params.id,
      toUser: req.user.id
    });

    if (!encouragement) {
      return res.status(404).json({
        success: false,
        message: 'Encouragement not found'
      });
    }

    await encouragement.addResponse(message.trim());

    // Populate for response
    await encouragement.populate([
      { path: 'fromUser', select: 'name email avatar' },
      { path: 'toUser', select: 'name email avatar' },
      { path: 'workspace', select: 'name' },
      { path: 'habit', select: 'name' }
    ]);

    res.json({
      success: true,
      data: encouragement
    });

  } catch (error) {
    console.error('Error responding to encouragement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to encouragement'
    });
  }
});

// @route   PUT /api/encouragements/mark-read
// @desc    Mark multiple encouragements as read
// @access  Private
router.put('/mark-read', authenticateJWT, async (req, res) => {
  try {
    const { encouragementIds } = req.body;

    if (!Array.isArray(encouragementIds) || encouragementIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of encouragement IDs'
      });
    }

    const result = await Encouragement.markAsRead(encouragementIds, req.user.id);

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error marking encouragements as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark encouragements as read'
    });
  }
});

// @route   GET /api/encouragements/stats
// @desc    Get encouragement statistics for the user
// @access  Private
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    
    const baseQuery = workspaceId ? { workspace: workspaceId } : {};

    // Get counts
    const [
      receivedCount,
      sentCount,
      unreadCount,
      respondedCount
    ] = await Promise.all([
      Encouragement.countDocuments({ ...baseQuery, toUser: req.user.id }),
      Encouragement.countDocuments({ ...baseQuery, fromUser: req.user.id }),
      Encouragement.countDocuments({ 
        ...baseQuery, 
        toUser: req.user.id, 
        isRead: false 
      }),
      Encouragement.countDocuments({ 
        ...baseQuery, 
        toUser: req.user.id,
        'response.message': { $exists: true, $ne: null }
      })
    ]);

    res.json({
      success: true,
      data: {
        received: receivedCount,
        sent: sentCount,
        unread: unreadCount,
        responded: respondedCount
      }
    });

  } catch (error) {
    console.error('Error fetching encouragement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch encouragement statistics'
    });
  }
});

module.exports = router;
