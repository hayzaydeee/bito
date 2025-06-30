// Widget type definitions
export const WIDGET_TYPES = {
  // Dashboard widgets
  "habits-overview": {
    title: "Habits Overview",
    icon: "📊",
    description: "Daily habit completion chart",
    defaultProps: { w: 6, h: 4 },
    category: "dashboard"
  },
  "weekly-progress": {
    title: "Weekly Progress",
    icon: "📈",
    description: "Weekly habit trend analysis",
    defaultProps: { w: 8, h: 6 },
    category: "dashboard"
  },
  "habit-list": {
    title: "Habits List",
    icon: "📋",
    description: "Manage your daily habits",
    defaultProps: { w: 4, h: 6 },
    category: "dashboard"
  },
  "quick-actions": {
    title: "Quick Actions",
    icon: "⚡",
    description: "Fast habit logging buttons",
    defaultProps: { w: 6, h: 4 },
    category: "dashboard"
  },

  // Analytics widgets
  "overview-cards": {
    title: "Overview Cards",
    icon: "📊",
    description: "Key metrics at a glance",
    defaultProps: { w: 12, h: 3 },
    category: "analytics"
  },
  "habit-streak-chart": {
    title: "Habit Streaks",
    icon: "📈",
    description: "Track your consistency over time",
    defaultProps: { w: 6, h: 6 },
    category: "analytics"
  },
  "completion-rate-chart": {
    title: "Completion Rates",
    icon: "🎯",
    description: "Success percentages over time",
    defaultProps: { w: 6, h: 6 },
    category: "analytics"
  },
  "weekly-heatmap": {
    title: "Weekly Heatmap",
    icon: "🔥",
    description: "Visual activity patterns",
    defaultProps: { w: 8, h: 5 },
    category: "analytics"
  },
  "top-habits": {
    title: "Top Performers",
    icon: "🏆",
    description: "Your most successful habits",
    defaultProps: { w: 4, h: 5 },
    category: "analytics"
  },
  "insights-panel": {
    title: "AI Insights",
    icon: "🧠",
    description: "Personalized recommendations",
    defaultProps: { w: 12, h: 4 },
    category: "analytics"
  },

  // Habits widgets (Modern Design)
  "habits-list-widget": {
    title: "Habits Manager",
    icon: "📝",
    description: "Clean, modern habit management with quick actions",
    defaultProps: { w: 8, h: 8 },
    category: "habits"
  },
  "habit-stats": {
    title: "Statistics",
    icon: "📊",
    description: "Beautiful overview of your habit performance",
    defaultProps: { w: 4, h: 6 },
    category: "habits"
  },
  "quick-add-habit": {
    title: "Quick Add",
    icon: "✨",
    description: "Fast habit creation with smart templates",
    defaultProps: { w: 4, h: 8 },
    category: "habits"
  },
  "recent-activity": {
    title: "Activity Feed",
    icon: "🎯",
    description: "Recent completions and achievements",
    defaultProps: { w: 4, h: 6 },
    category: "habits"
  },

  // Settings widgets
  "profile-widget": {
    title: "Profile & Account",
    icon: "👤",
    description: "Manage your account information and preferences",
    defaultProps: { w: 6, h: 6 },
    category: "settings"
  },
  "notifications-widget": {
    title: "Notification Settings",
    icon: "🔔",
    description: "Control notification and alert preferences",
    defaultProps: { w: 6, h: 6 },
    category: "settings"
  },
  "privacy-widget": {
    title: "Privacy & Security",
    icon: "🔒",
    description: "Manage privacy and security settings",
    defaultProps: { w: 6, h: 6 },
    category: "settings"
  },
  "appearance-widget": {
    title: "Appearance & Theme",
    icon: "🎨",
    description: "Customize the look and feel of your app",
    defaultProps: { w: 6, h: 6 },
    category: "settings"
  },
  "data-management-widget": {
    title: "Data Management",
    icon: "💾",
    description: "Import, export, and manage your data",
    defaultProps: { w: 6, h: 8 },
    category: "settings"
  },
  "help-support-widget": {
    title: "Help & Support",
    icon: "❓",
    description: "Get help and support resources",
    defaultProps: { w: 6, h: 8 },
    category: "settings"
  },
};

// Default widget sets
export const DEFAULT_WIDGETS = {
  dashboard: ["habits-overview", "quick-actions", "weekly-progress", "habit-list"],
  analytics: ["overview-cards", "habit-streak-chart", "completion-rate-chart", "weekly-heatmap", "top-habits", "insights-panel"],
  habits: ["habit-stats", "habits-list-widget", "quick-add-habit", "recent-activity"],
  settings: [
    "profile-widget",
    "notifications-widget", 
    "privacy-widget",
    "appearance-widget",
    "data-management-widget",
    "help-support-widget"
  ],
};

// Default layouts
export const DEFAULT_LAYOUTS = {
  dashboard: {
    lg: [
      { i: "habits-overview", x: 0, y: 0, w: 6, h: 4 },
      { i: "quick-actions", x: 6, y: 0, w: 6, h: 4 },
      { i: "weekly-progress", x: 0, y: 4, w: 8, h: 6 },
      { i: "habit-list", x: 8, y: 4, w: 4, h: 6 },
    ],
    md: [
      { i: "habits-overview", x: 0, y: 0, w: 6, h: 4 },
      { i: "quick-actions", x: 6, y: 0, w: 6, h: 4 },
      { i: "weekly-progress", x: 0, y: 4, w: 12, h: 6 },
      { i: "habit-list", x: 0, y: 10, w: 12, h: 6 },
    ],
    sm: [
      { i: "habits-overview", x: 0, y: 0, w: 12, h: 4 },
      { i: "quick-actions", x: 0, y: 4, w: 12, h: 4 },
      { i: "weekly-progress", x: 0, y: 8, w: 12, h: 6 },
      { i: "habit-list", x: 0, y: 14, w: 12, h: 6 },
    ],
    xs: [
      { i: "habits-overview", x: 0, y: 0, w: 4, h: 3 },
      { i: "quick-actions", x: 0, y: 3, w: 4, h: 3 },
      { i: "weekly-progress", x: 0, y: 6, w: 4, h: 4 },
      { i: "habit-list", x: 0, y: 10, w: 4, h: 6 },
    ],
    xxs: [
      { i: "habits-overview", x: 0, y: 0, w: 2, h: 3 },
      { i: "quick-actions", x: 0, y: 3, w: 2, h: 3 },
      { i: "weekly-progress", x: 0, y: 6, w: 2, h: 4 },
      { i: "habit-list", x: 0, y: 10, w: 2, h: 6 },
    ],
  },
  analytics: {
    lg: [
      { i: "overview-cards", x: 0, y: 0, w: 12, h: 3 },
      { i: "habit-streak-chart", x: 0, y: 3, w: 6, h: 6 },
      { i: "completion-rate-chart", x: 6, y: 3, w: 6, h: 6 },
      { i: "weekly-heatmap", x: 0, y: 9, w: 8, h: 5 },
      { i: "top-habits", x: 8, y: 9, w: 4, h: 5 },
      { i: "insights-panel", x: 0, y: 14, w: 12, h: 4 }
    ],
    md: [
      { i: "overview-cards", x: 0, y: 0, w: 12, h: 3 },
      { i: "habit-streak-chart", x: 0, y: 3, w: 12, h: 6 },
      { i: "completion-rate-chart", x: 0, y: 9, w: 12, h: 6 },
      { i: "weekly-heatmap", x: 0, y: 15, w: 12, h: 5 },
      { i: "top-habits", x: 0, y: 20, w: 12, h: 5 },
      { i: "insights-panel", x: 0, y: 25, w: 12, h: 4 }
    ],
    sm: [
      { i: "overview-cards", x: 0, y: 0, w: 12, h: 4 },
      { i: "habit-streak-chart", x: 0, y: 4, w: 12, h: 7 },
      { i: "completion-rate-chart", x: 0, y: 11, w: 12, h: 7 },
      { i: "weekly-heatmap", x: 0, y: 18, w: 12, h: 6 },
      { i: "top-habits", x: 0, y: 24, w: 12, h: 6 },
      { i: "insights-panel", x: 0, y: 30, w: 12, h: 5 }
    ],
    xs: [
      { i: "overview-cards", x: 0, y: 0, w: 4, h: 4 },
      { i: "habit-streak-chart", x: 0, y: 4, w: 4, h: 7 },
      { i: "completion-rate-chart", x: 0, y: 11, w: 4, h: 7 },
      { i: "weekly-heatmap", x: 0, y: 18, w: 4, h: 6 },
      { i: "top-habits", x: 0, y: 24, w: 4, h: 6 },
      { i: "insights-panel", x: 0, y: 30, w: 4, h: 5 }
    ],
    xxs: [
      { i: "overview-cards", x: 0, y: 0, w: 2, h: 4 },
      { i: "habit-streak-chart", x: 0, y: 4, w: 2, h: 7 },
      { i: "completion-rate-chart", x: 0, y: 11, w: 2, h: 7 },
      { i: "weekly-heatmap", x: 0, y: 18, w: 2, h: 6 },
      { i: "top-habits", x: 0, y: 24, w: 2, h: 6 },
      { i: "insights-panel", x: 0, y: 30, w: 2, h: 5 }
    ]
  },
  habits: {
    lg: [
      { i: "habit-stats", x: 0, y: 0, w: 4, h: 6 },
      { i: "quick-add-habit", x: 4, y: 0, w: 4, h: 8 },
      { i: "recent-activity", x: 8, y: 0, w: 4, h: 6 },
      { i: "habits-list-widget", x: 0, y: 6, w: 8, h: 8 }
    ],
    md: [
      { i: "habit-stats", x: 0, y: 0, w: 6, h: 6 },
      { i: "quick-add-habit", x: 6, y: 0, w: 6, h: 8 },
      { i: "recent-activity", x: 0, y: 6, w: 6, h: 6 },
      { i: "habits-list-widget", x: 0, y: 12, w: 12, h: 8 }
    ],
    sm: [
      { i: "habit-stats", x: 0, y: 0, w: 12, h: 6 },
      { i: "quick-add-habit", x: 0, y: 6, w: 12, h: 8 },
      { i: "recent-activity", x: 0, y: 14, w: 12, h: 6 },
      { i: "habits-list-widget", x: 0, y: 20, w: 12, h: 8 }
    ],
    xs: [
      { i: "habit-stats", x: 0, y: 0, w: 4, h: 6 },
      { i: "quick-add-habit", x: 0, y: 6, w: 4, h: 8 },
      { i: "recent-activity", x: 0, y: 14, w: 4, h: 6 },
      { i: "habits-list-widget", x: 0, y: 20, w: 4, h: 8 }
    ],
    xxs: [
      { i: "habit-stats", x: 0, y: 0, w: 2, h: 6 },
      { i: "quick-add-habit", x: 0, y: 6, w: 2, h: 8 },
      { i: "recent-activity", x: 0, y: 14, w: 2, h: 6 },
      { i: "habits-list-widget", x: 0, y: 20, w: 2, h: 8 }
    ]
  },
  settings: {
    lg: [
      { i: "profile-widget", x: 0, y: 0, w: 6, h: 6 },
      { i: "notifications-widget", x: 6, y: 0, w: 6, h: 6 },
      { i: "privacy-widget", x: 0, y: 6, w: 6, h: 6 },
      { i: "appearance-widget", x: 6, y: 6, w: 6, h: 6 },
      { i: "data-management-widget", x: 0, y: 12, w: 6, h: 8 },
      { i: "help-support-widget", x: 6, y: 12, w: 6, h: 8 }
    ],
    md: [
      { i: "profile-widget", x: 0, y: 0, w: 8, h: 6 },
      { i: "notifications-widget", x: 0, y: 6, w: 8, h: 6 },
      { i: "privacy-widget", x: 0, y: 12, w: 8, h: 6 },
      { i: "appearance-widget", x: 0, y: 18, w: 8, h: 6 },
      { i: "data-management-widget", x: 0, y: 24, w: 8, h: 8 },
      { i: "help-support-widget", x: 0, y: 32, w: 8, h: 8 }
    ],
    sm: [
      { i: "profile-widget", x: 0, y: 0, w: 6, h: 6 },
      { i: "notifications-widget", x: 0, y: 6, w: 6, h: 6 },
      { i: "privacy-widget", x: 0, y: 12, w: 6, h: 6 },
      { i: "appearance-widget", x: 0, y: 18, w: 6, h: 6 },
      { i: "data-management-widget", x: 0, y: 24, w: 6, h: 8 },
      { i: "help-support-widget", x: 0, y: 32, w: 6, h: 8 }
    ],
    xs: [
      { i: "profile-widget", x: 0, y: 0, w: 4, h: 6 },
      { i: "notifications-widget", x: 0, y: 6, w: 4, h: 6 },
      { i: "privacy-widget", x: 0, y: 12, w: 4, h: 6 },
      { i: "appearance-widget", x: 0, y: 18, w: 4, h: 6 },
      { i: "data-management-widget", x: 0, y: 24, w: 4, h: 8 },
      { i: "help-support-widget", x: 0, y: 32, w: 4, h: 8 }
    ],
    xxs: [
      { i: "profile-widget", x: 0, y: 0, w: 2, h: 6 },
      { i: "notifications-widget", x: 0, y: 6, w: 2, h: 6 },
      { i: "privacy-widget", x: 0, y: 12, w: 2, h: 6 },
      { i: "appearance-widget", x: 0, y: 18, w: 2, h: 6 },
      { i: "data-management-widget", x: 0, y: 24, w: 2, h: 8 },
      { i: "help-support-widget", x: 0, y: 32, w: 2, h: 8 }
    ]
  }
};

// Storage keys
export const STORAGE_KEYS = {
  dashboard: {
    layouts: "habitTracker_dashboardLayouts",
    widgets: "habitTracker_dashboardWidgets"
  },
  analytics: {
    layouts: "habitTracker_analyticsLayouts", 
    widgets: "habitTracker_analyticsWidgets"
  },
  habits: {
    layouts: "habitTracker_habitsLayouts",
    widgets: "habitTracker_habitsWidgets"
  },
  settings: {
    layouts: "habitTracker_settingsLayouts",
    widgets: "habitTracker_settingsWidgets"
  },
};