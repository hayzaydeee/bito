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

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
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

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateHabitCreation,
  validateHabitUpdate,
  validateHabitEntry,
  validateObjectId,
  validateDateRange,
  validatePagination
};
