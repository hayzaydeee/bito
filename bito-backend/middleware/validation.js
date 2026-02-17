const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Magic link validation rules
const validateMagicLinkRequest = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

const validateMagicLinkVerify = [
  body('token')
    .isString()
    .notEmpty()
    .withMessage('Token is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('First name must be between 1 and 30 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Last name must be between 1 and 30 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto', 'bw'])
    .withMessage('Theme must be light, dark, auto, or bw'),
  body('preferences.scale')
    .optional()
    .isIn(['small', 'medium', 'large'])
    .withMessage('Scale must be small, medium, or large'),
  body('preferences.weekStartsOn')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Week starts on must be a number between 0 and 6'),
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  handleValidationErrors
];

// Habit validation rules
const validateHabitCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Habit name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['health', 'productivity', 'learning', 'fitness', 'mindfulness', 'social', 'creative', 'other'])
    .withMessage('Invalid category'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly, or monthly'),
  body('target.value')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Target value must be a positive integer'),
  body('target.unit')
    .optional()
    .isIn(['times', 'minutes', 'hours', 'pages', 'miles', 'calories', 'glasses', 'custom'])
    .withMessage('Invalid target unit'),
  body('schedule.days')
    .optional()
    .isArray()
    .withMessage('Schedule days must be an array'),
  body('schedule.days.*')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Schedule days must be numbers between 0 and 6'),
  body('schedule.reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Reminder time must be in HH:MM format'),
  handleValidationErrors
];

const validateHabitUpdate = [
  ...validateHabitCreation.slice(0, -1), // All creation rules except handler
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
  handleValidationErrors
];

// Habit entry validation rules
const validateHabitEntry = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean'),
  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Value must be a non-negative number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters'),
  body('mood')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Mood must be a number between 1 and 5'),
  handleValidationErrors
];

// Encouragement validation rules
const validateEncouragement = [
  body('toUserId')
    .isMongoId()
    .withMessage('To user ID must be a valid MongoDB ObjectId'),
  body('workspaceId')
    .isMongoId()
    .withMessage('Workspace ID must be a valid MongoDB ObjectId'),
  body('habitId')
    .optional()
    .isMongoId()
    .withMessage('Habit ID must be a valid MongoDB ObjectId'),
  body('type')
    .optional()
    .isIn(['general_support', 'streak_celebration', 'goal_achieved', 'comeback_support', 'milestone_reached', 'custom_message'])
    .withMessage('Invalid encouragement type'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  body('reaction')
    .optional()
    .isIn(['👏', '🔥', '💪', '⭐', '🎉', '👊', '💯', '🚀'])
    .withMessage('Invalid reaction emoji'),
  handleValidationErrors
];

// Parameter validation rules
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateProfileSetup = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('First name must be between 1 and 30 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('Last name must be between 1 and 30 characters'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateMagicLinkRequest,
  validateMagicLinkVerify,
  validateUserUpdate,
  validateProfileSetup,
  validateHabitCreation,
  validateHabitUpdate,
  validateHabitEntry,
  validateEncouragement,
  validateObjectId,
  validateDateRange,
  validatePagination
};
