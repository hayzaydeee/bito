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

  // Group Accountability widgets
  "group-overview": {
    title: "Group Overview",
    icon: "📊",
    description: "Key metrics and stats for the group",
    defaultProps: { w: 4, h: 4 },
    category: "group-accountability"
  },
  "member-progress": {
    title: "Member Progress",
    icon: "👥",
    description: "Track individual member progress and performance",
    defaultProps: { w: 8, h: 6 },
    category: "group-accountability"
  },
  "encouragement-feed": {
    title: "Encouragement Feed",
    icon: "💬",
    description: "Team encouragements and social interactions",
    defaultProps: { w: 6, h: 6 },
    category: "group-accountability"
  },
  "group-leaderboard": {
    title: "Leaderboard",
    icon: "🏆",
    description: "Member rankings and performance comparison",
    defaultProps: { w: 6, h: 6 },
    category: "group-accountability"
  },
  "group-challenges": {
    title: "Group Challenges",
    icon: "🎯",
    description: "Team challenges and milestone tracking",
    defaultProps: { w: 6, h: 6 },
    category: "group-accountability"
  },
};

// Default widget sets
export const DEFAULT_WIDGETS = {
  dashboard: ["habits-overview", "quick-actions", "habit-list"],
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
  groupAccountability: ["group-overview", "member-progress", "encouragement-feed", "group-leaderboard", "group-challenges"],
};

// Default layouts
export const DEFAULT_LAYOUTS = {
  dashboard: {
    lg: [
      { i: "habits-overview", x: 0, y: 0, w: 8, h: 6},
      { i: "quick-actions", x: 8, y: 0, w: 4, h: 5 },
      { i: "habit-list", x: 0, y: 6, w: 12, h: 11  }
    ],
    md: [
      { i: "habits-overview", x: 0, y: 0, w: 6, h: 4 },
      { i: "quick-actions", x: 6, y: 0, w: 6, h: 4 },
      { i: "habit-list", x: 0, y: 4, w: 12, h: 6 }
    ],
    sm: [
      { i: "habits-overview", x: 0, y: 0, w: 12, h: 12 },
      { i: "quick-actions", x: 0, y: 4, w: 12, h: 8 },
      { i: "habit-list", x: 0, y: 8, w: 12, h: 6 }
    ],
    xs: [
      { i: "habits-overview", x: 0, y: 0, w: 4, h: 4 },
      { i: "quick-actions", x: 0, y: 4, w: 4, h: 4 },
      { i: "habit-list", x: 0, y: 8, w: 4, h: 6 }
    ],
    xxs: [
      { i: "habits-overview", x: 0, y: 0, w: 2, h: 4 },
      { i: "quick-actions", x: 0, y: 4, w: 2, h: 4 },
      { i: "habit-list", x: 0, y: 8, w: 2, h: 6 }
    ],
  },
  analytics: {
    lg: [
      { i: "overview-cards", x: 0, y: 0, w: 12, h: 4 },
      { i: "habit-streak-chart", x: 0, y: 4, w: 7, h: 6 },
      { i: "top-habits", x: 7, y: 4, w: 5, h: 6 },
      { i: "completion-rate-chart", x: 0, y: 10, w: 6, h: 9 },
      { i: "weekly-heatmap", x: 6, y: 10, w: 6, h: 8 },
      { i: "insights-panel", x: 0, y: 19, w: 12, h: 8 }
    ],
    md: [
      { i: "overview-cards", x: 1, y: 0, w: 10, h: 4 },
      { i: "habit-streak-chart", x: 1, y: 3, w: 10, h: 6 },
      { i: "completion-rate-chart", x: 1, y: 9, w: 10, h: 6 },
      { i: "weekly-heatmap", x: 1, y: 15, w: 10, h: 6 },
      { i: "top-habits", x: 1, y: 20, w: 12, h: 5 },
      { i: "insights-panel", x: 1, y: 25, w: 10, h: 7 }
    ],
    sm: [
      { i: "overview-cards", x: 0, y: 0, w: 12, h: 6 },
      { i: "habit-streak-chart", x: 0, y: 4, w: 12, h: 6 },
      { i: "completion-rate-chart", x: 0, y: 11, w: 12, h: 7 },
      { i: "weekly-heatmap", x: 0, y: 18, w: 12, h: 6 },
      { i: "top-habits", x: 0, y: 24, w: 12, h: 6 },
      { i: "insights-panel", x: 0, y: 30, w: 12, h: 6 }
    ],
    xs: [
      { i: "overview-cards", x: 0, y: 0, w: 4, h: 6 },
      { i: "habit-streak-chart", x: 0, y: 4, w: 4, h: 6 },
      { i: "completion-rate-chart", x: 0, y: 11, w: 4, h: 7 },
      { i: "weekly-heatmap", x: 0, y: 18, w: 4, h: 6 },
      { i: "top-habits", x: 0, y: 24, w: 4, h: 6 },
      { i: "insights-panel", x: 0, y: 30, w: 4, h: 6 }
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
      { i: "profile-widget", x: 0, y: 0, w: 6, h: 6,},
      { i: "notifications-widget", x: 6, y: 0, w: 6, h: 8, },
      { i: "privacy-widget", x: 0, y: 6, w: 6, h: 8,  },
      { i: "appearance-widget", x: 6, y: 6, w: 6, h: 8, },
      { i: "data-management-widget", x: 0, y: 12, w: 6, h: 4, },
      { i: "help-support-widget", x: 6, y: 12, w: 6, h: 6, }
    ],
    md: [
      { i: "profile-widget", x: 0, y: 0, w: 6, h: 6 },
      { i: "notifications-widget", x: 6, y: 0, w: 6, h: 8 },
      { i: "privacy-widget", x: 0, y: 6, w: 6, h: 8 },
      { i: "appearance-widget", x: 6, y: 6, w: 6, h: 8 },
      { i: "data-management-widget", x: 0, y: 12, w: 12, h: 4 },
      { i: "help-support-widget", x: 0, y: 20, w: 12, h: 6 }
    ],
    sm: [
      { i: "profile-widget", x: 0, y: 0, w: 12, h: 6 },
      { i: "notifications-widget", x: 0, y: 6, w: 12, h: 8 },
      { i: "privacy-widget", x: 0, y: 12, w: 12, h: 8 },
      { i: "appearance-widget", x: 0, y: 18, w: 12, h: 8 },
      { i: "data-management-widget", x: 0, y: 24, w: 12, h: 4 },
      { i: "help-support-widget", x: 0, y: 32, w: 12, h: 6 }
    ],
    xs: [
      { i: "profile-widget", x: 0, y: 0, w: 4, h: 6 },
      { i: "notifications-widget", x: 0, y: 6, w: 4, h: 8 },
      { i: "privacy-widget", x: 0, y: 12, w: 4, h: 8 },
      { i: "appearance-widget", x: 0, y: 18, w: 4, h: 8 },
      { i: "data-management-widget", x: 0, y: 24, w: 4, h: 4 },
      { i: "help-support-widget", x: 0, y: 32, w: 4, h: 6 }
    ],
    xxs: [
      { i: "profile-widget", x: 0, y: 0, w: 2, h: 6 },
      { i: "notifications-widget", x: 0, y: 6, w: 2, h: 6 },
      { i: "privacy-widget", x: 0, y: 12, w: 2, h: 6 },
      { i: "appearance-widget", x: 0, y: 18, w: 2, h: 6 },
      { i: "data-management-widget", x: 0, y: 24, w: 2, h: 8 },
      { i: "help-support-widget", x: 0, y: 32, w: 2, h: 8 }
    ]
  },
  groupAccountability: {
    lg: [
      { i: "group-overview", x: 0, y: 0, w: 4, h: 4 },
      { i: "group-leaderboard", x: 4, y: 0, w: 4, h: 6 },
      { i: "group-challenges", x: 8, y: 0, w: 4, h: 6 },
      { i: "member-progress", x: 0, y: 4, w: 8, h: 6 },
      { i: "encouragement-feed", x: 0, y: 10, w: 12, h: 6 }
    ],
    md: [
      { i: "group-overview", x: 0, y: 0, w: 6, h: 4 },
      { i: "group-leaderboard", x: 6, y: 0, w: 6, h: 6 },
      { i: "member-progress", x: 0, y: 4, w: 12, h: 6 },
      { i: "group-challenges", x: 0, y: 10, w: 6, h: 6 },
      { i: "encouragement-feed", x: 6, y: 10, w: 6, h: 6 }
    ],
    sm: [
      { i: "group-overview", x: 0, y: 0, w: 12, h: 4 },
      { i: "member-progress", x: 0, y: 4, w: 12, h: 6 },
      { i: "group-leaderboard", x: 0, y: 10, w: 12, h: 6 },
      { i: "group-challenges", x: 0, y: 16, w: 12, h: 6 },
      { i: "encouragement-feed", x: 0, y: 22, w: 12, h: 6 }
    ],
    xs: [
      { i: "group-overview", x: 0, y: 0, w: 4, h: 4 },
      { i: "member-progress", x: 0, y: 4, w: 4, h: 6 },
      { i: "group-leaderboard", x: 0, y: 10, w: 4, h: 6 },
      { i: "group-challenges", x: 0, y: 16, w: 4, h: 6 },
      { i: "encouragement-feed", x: 0, y: 22, w: 4, h: 6 }
    ],
    xxs: [
      { i: "group-overview", x: 0, y: 0, w: 2, h: 4 },
      { i: "member-progress", x: 0, y: 4, w: 2, h: 6 },
      { i: "group-leaderboard", x: 0, y: 10, w: 2, h: 6 },
      { i: "group-challenges", x: 0, y: 16, w: 2, h: 6 },
      { i: "encouragement-feed", x: 0, y: 22, w: 2, h: 6 }
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
    widgets: "habitTracker_analyticsWidgets",
    timeRange: "habitTracker_analyticsTimeRange",
    topHabitsCategory: "habitTracker_analyticsTopHabitsCategory"
  },
  habits: {
    layouts: "habitTracker_habitsLayouts",
    widgets: "habitTracker_habitsWidgets"
  },
  settings: {
    layouts: "habitTracker_settingsLayouts",
    widgets: "habitTracker_settingsWidgets"
  },
  groupAccountability: {
    layouts: "habitTracker_groupAccountabilityLayouts",
    widgets: "habitTracker_groupAccountabilityWidgets"
  }
};

// Main widget registry export
export const widgetRegistry = {
  availableWidgets: WIDGET_TYPES,
  defaultWidgetSets: DEFAULT_WIDGETS,
  defaultLayouts: DEFAULT_LAYOUTS,
  storageKeys: STORAGE_KEYS
};