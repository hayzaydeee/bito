/**
 * @typedef {Object} Habit
 * @property {number} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} color - Hex color code
 * @property {string} icon - Emoji icon
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} Completion
 * @property {string} id - Format: "YYYY-MM-DD_habitId"
 * @property {number} habitId - Reference to habit
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {Date} timestamp - When completion was logged
 * @property {string} [notes] - Optional notes
 */

/**
 * @typedef {Object} DateRange
 * @property {Date} start - Start date
 * @property {Date} end - End date
 */

export const HABIT_COLORS = [
  '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', 
  '#6366f1', '#ef4444', '#f97316', '#ec4899',
  '#14b8a6', '#84cc16'
];

export const HABIT_ICONS = [
  '💪', '📖', '😴', '✍️', '🧠', '💼', 
  '🚶', '🎵', '📱', '⏰', '🍎', '🧘'
];
