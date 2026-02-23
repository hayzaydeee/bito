/**
 * Shared category metadata — single source of truth for Transformer categories.
 * Colors are Tailwind-class-compatible fragments: use with `bg-${color}`, `text-${color}`, etc.
 */

const CATEGORY_META = {
  fitness: {
    icon: "💪",
    label: "Fitness",
    color: "emerald",
    gradient: "from-emerald-500/15 to-emerald-500/5",
    accent: "#10b981",
    ring: "#10b981",
  },
  health_wellness: {
    icon: "🧘",
    label: "Health & Wellness",
    color: "cyan",
    gradient: "from-cyan-500/15 to-cyan-500/5",
    accent: "#06b6d4",
    ring: "#06b6d4",
  },
  learning_skill: {
    icon: "📚",
    label: "Learning",
    color: "blue",
    gradient: "from-blue-500/15 to-blue-500/5",
    accent: "#3b82f6",
    ring: "#3b82f6",
  },
  productivity: {
    icon: "⚡",
    label: "Productivity",
    color: "amber",
    gradient: "from-amber-500/15 to-amber-500/5",
    accent: "#f59e0b",
    ring: "#f59e0b",
  },
  finance: {
    icon: "💰",
    label: "Finance",
    color: "green",
    gradient: "from-green-500/15 to-green-500/5",
    accent: "#22c55e",
    ring: "#22c55e",
  },
  event_prep: {
    icon: "🎯",
    label: "Event Prep",
    color: "orange",
    gradient: "from-orange-500/15 to-orange-500/5",
    accent: "#f97316",
    ring: "#f97316",
  },
  career: {
    icon: "💼",
    label: "Career",
    color: "indigo",
    gradient: "from-indigo-500/15 to-indigo-500/5",
    accent: "#6366f1",
    ring: "#6366f1",
  },
  relationships: {
    icon: "❤️",
    label: "Relationships",
    color: "rose",
    gradient: "from-rose-500/15 to-rose-500/5",
    accent: "#f43f5e",
    ring: "#f43f5e",
  },
  creative: {
    icon: "🎨",
    label: "Creative",
    color: "violet",
    gradient: "from-violet-500/15 to-violet-500/5",
    accent: "#8b5cf6",
    ring: "#8b5cf6",
  },
  custom: {
    icon: "✨",
    label: "Custom",
    color: "brand",
    gradient: "from-[var(--color-brand-500)]/15 to-[var(--color-brand-500)]/5",
    accent: "var(--color-brand-500)",
    ring: "#6366f1",
  },
};

export const STATUS_THEME = {
  preview: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Preview" },
  active: { bg: "bg-green-500/10", text: "text-green-400", label: "Active" },
  completed: { bg: "bg-gray-500/10", text: "text-gray-400", label: "Completed" },
  archived: { bg: "bg-red-500/10", text: "text-red-400", label: "Archived" },
  draft: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Draft" },
};

export const DIFFICULTY_COLORS = {
  easy: { bg: "bg-green-500/10", text: "text-green-400" },
  medium: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  hard: { bg: "bg-red-500/10", text: "text-red-400" },
};

export const METHODOLOGY_LABELS = {
  boolean: "Done / Not Done",
  numeric: "Count",
  duration: "Duration",
  rating: "Rating (1-5)",
};

export const SUGGESTED_GOALS = [
  "I want to run a 5K in 8 weeks",
  "Help me build a daily reading habit",
  "I want to become a morning person",
  "Help me reduce screen time and sleep better",
  "I want to learn to meditate consistently",
  "Help me get my finances in order",
];

export default CATEGORY_META;
