import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import "./ModalAnimation.css";
import { 
  TargetIcon,
  Cross2Icon,
  CheckIcon,
  TrashIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";

// Emoji categories for the picker
const EMOJI_CATEGORIES = {
  common: ["✅", "🔴", "🔵", "🟢", "⭐", "🎯", "💪", "🧠", "📚", "💧", "🏃", "🥗", "😊"],
  activity: ["🏋️", "🧘", "🚶", "🏃", "🚴", "🏊", "⚽", "🎮", "🎨", "🎵", "📝", "📚", "💻"],
  health: ["💧", "🥗", "🍎", "🥦", "💊", "😴", "🧠", "🧘", "❤️", "🦷", "🚭", "🧹", "☀️"],
  productivity: ["📝", "⏰", "📅", "📚", "💼", "💻", "📱", "✉️", "📊", "🔍", "⚙️", "🏆", "💯"],
  mindfulness: ["🧘", "😌", "🌱", "🌈", "🌞", "🌙", "💭", "🧠", "❤️", "🙏", "✨", "💫", "🔮"],
};

// Predefined colors
const COLOR_OPTIONS = [
  "#4f46e5", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#e11d48", // rose
  "#059669", // green
  "#dc2626", // red-600
];

const GroupHabitModal = ({ 
  isOpen, 
  onClose, 
  group,
  habit = null, // null for add, habit object for edit
  habitForm,
  setHabitForm,
  onSave,
  onDelete, // Add delete handler
  activeTab,
  setActiveTab,
  emojiCategory,
  setEmojiCategory
}) => {
  const modalRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = Boolean(habit);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHabitForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleScheduleChange = (field, value) => {
    setHabitForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }));
  };

  const handleTargetChange = (field, value) => {
    setHabitForm(prev => ({
      ...prev,
      defaultTarget: {
        ...prev.defaultTarget,
        [field]: value
      }
    }));
  };

  const handleFrequencyToggle = (day) => {
    setHabitForm(prev => {
      const newDays = prev.schedule.days.includes(day)
        ? prev.schedule.days.filter(d => d !== day)
        : [...prev.schedule.days, day].sort();
      
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          days: newDays
        }
      };
    });
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
      return;
    }

    try {
      setIsSubmitting(true);
      await onDelete(habit._id);
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-6 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto z-10 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-5">
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            onClick={onClose}
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
          
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
              <TargetIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-dmSerif gradient-text mb-1">
              {isEditing ? "Edit Habit" : "Add Group Habit"}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
              {isEditing ? "Update the habit details" : `Create a new habit template for ${group?.name}`}
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="flex border-b border-[var(--color-border-primary)] font-outfit">
              <button
                type="button"
                className={`px-3 py-2 font-medium text-xs ${
                  activeTab === "details"
                    ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
                onClick={() => setActiveTab("details")}
              >
                Details
              </button>
              <button
                type="button"
                className={`px-3 py-2 font-medium text-xs ${
                  activeTab === "appearance"
                    ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
                onClick={() => setActiveTab("appearance")}
              >
                Style
              </button>
              <button
                type="button"
                className={`px-3 py-2 font-medium text-xs ${
                  activeTab === "settings"
                    ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
              {isEditing && (
                <button
                  type="button"
                  className={`px-3 py-2 font-medium text-xs ${
                    activeTab === "manage"
                      ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                  onClick={() => setActiveTab("manage")}
                >
                  Manage
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={habitForm.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                    placeholder="e.g., Morning Exercise"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={habitForm.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent resize-none"
                    placeholder="Describe what this habit involves..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={habitForm.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                  >
                    <option value="health">Health & Fitness</option>
                    <option value="productivity">Productivity</option>
                    <option value="mindfulness">Mindfulness</option>
                    <option value="learning">Learning</option>
                    <option value="social">Social</option>
                    <option value="hobby">Hobbies</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Default Target
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={habitForm.defaultTarget.value}
                      onChange={(e) => handleTargetChange('value', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-20 px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                    />
                    <select
                      value={habitForm.defaultTarget.unit}
                      onChange={(e) => handleTargetChange('unit', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                    >
                      <option value="time">times</option>
                      <option value="minutes">minutes</option>
                      <option value="hours">hours</option>
                      <option value="pages">pages</option>
                      <option value="cups">cups</option>
                      <option value="steps">steps</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Icon
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2 border-b border-[var(--color-border-primary)] pb-2">
                      {Object.keys(EMOJI_CATEGORIES).map((category) => (
                        <button
                          key={category}
                          type="button"
                          className={`px-2 py-1 text-xs rounded font-outfit capitalize ${
                            emojiCategory === category
                              ? "bg-[var(--color-brand-500)] text-white"
                              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                          }`}
                          onClick={() => setEmojiCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {EMOJI_CATEGORIES[emojiCategory].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`p-2 rounded-lg text-lg hover:bg-[var(--color-surface-hover)] ${
                            habitForm.icon === emoji ? "bg-[var(--color-brand-100)] ring-2 ring-[var(--color-brand-500)]" : ""
                          }`}
                          onClick={() => setHabitForm(prev => ({ ...prev, icon: emoji }))}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-lg ${
                          habitForm.color === color ? "ring-2 ring-offset-2 ring-[var(--color-brand-500)]" : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setHabitForm(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Schedule
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`p-2 text-xs rounded-lg font-outfit ${
                          habitForm.schedule.days.includes(index)
                            ? "bg-[var(--color-brand-500)] text-white"
                            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                        onClick={() => handleFrequencyToggle(index)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRequired"
                    name="isRequired"
                    checked={habitForm.isRequired}
                    onChange={handleChange}
                    className="rounded border-[var(--color-border-primary)] text-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)]"
                  />
                  <label htmlFor="isRequired" className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                    Required habit for all members
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="reminderEnabled"
                      checked={habitForm.schedule.reminderEnabled}
                      onChange={(e) => handleScheduleChange('reminderEnabled', e.target.checked)}
                      className="rounded border-[var(--color-border-primary)] text-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)]"
                    />
                    <label htmlFor="reminderEnabled" className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                      Enable reminders
                    </label>
                  </div>
                  
                  {habitForm.schedule.reminderEnabled && (
                    <input
                      type="time"
                      value={habitForm.schedule.reminderTime}
                      onChange={(e) => handleScheduleChange('reminderTime', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Manage Tab */}
            {activeTab === "manage" && isEditing && (
              <div className="space-y-4">
                <div className="p-4 border border-amber-300 rounded-lg bg-amber-50">
                  <div className="flex gap-2 items-center">
                    <InfoCircledIcon className="text-amber-600" />
                    <p className="text-sm text-amber-700 font-outfit">
                      The actions below can't be undone. Please be certain.
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-outfit text-sm"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <TrashIcon className="w-4 h-4" />
                  {showDeleteConfirm ? "Are you sure? Click again to delete" : "Delete Group Habit"}
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 font-outfit text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !habitForm.name}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white transition-all duration-200 font-outfit text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    {isEditing ? "Update Habit" : "Create Habit"}
                  </>
                )}
              </button>
            </div>
          </form>


        </div>
      </div>
    </div>,
    document.body
  );
};

export default GroupHabitModal;
