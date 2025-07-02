import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./ModalAnimation.css";
import { 
  PlusIcon,
  Cross2Icon,
  TrashIcon,
  CheckIcon,
  ArchiveIcon,
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

const CustomHabitEditModal = ({ 
  isOpen, 
  onClose, 
  habit = null, 
  onSave,
  onDelete, 
  onArchive 
}) => {
  // Modal container ref for click outside detection
  const modalRef = useRef();

  // Initialize state with habit data or empty values
  const [formData, setFormData] = useState({
    name: "",
    icon: "✅",
    description: "",
    color: "#4f46e5",
    isActive: true,
    schedule: {
      days: [0, 1, 2, 3, 4, 5, 6], // Default to every day (0=Sunday, 6=Saturday)
      reminderTime: "",
      reminderEnabled: false
    },
  });
  
  const [activeTab, setActiveTab] = useState("details");
  const [emojiCategory, setEmojiCategory] = useState("common");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  // Close on Escape key and manage body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      window.addEventListener("keydown", handleEscape);
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Update form when habit changes
  useEffect(() => {
    if (habit) {
      console.log('Loading habit for edit:', JSON.stringify(habit, null, 2));
      setFormData({
        name: habit.name || "",
        icon: habit.icon || "✅",
        description: habit.description || "",
        color: habit.color || "#4f46e5",
        isActive: habit.isActive !== undefined ? habit.isActive : true,
        schedule: {
          days: habit.schedule?.days || habit.frequency || [0, 1, 2, 3, 4, 5, 6], // Support legacy frequency
          reminderTime: habit.schedule?.reminderTime || "",
          reminderEnabled: habit.schedule?.reminderEnabled || false
        },
      });
    }
  }, [habit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIconSelect = (icon) => {
    setFormData((prev) => ({
      ...prev,
      icon,
    }));
  };

  const handleFrequencyToggle = (day) => {
    setFormData((prev) => {
      // If day is in schedule.days, remove it, otherwise add it
      const newDays = prev.schedule.days.includes(day)
        ? prev.schedule.days.filter((d) => d !== day)
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

  const handleSwitchChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (formData.schedule.days.length === 0) {
      newErrors.schedule = "Please select at least one day";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    console.log('Submitting habit data (full):', JSON.stringify(formData, null, 2));
    
    // Determine if this is a create or update operation
    const isUpdate = !!habit && !!habit._id;
    
    let submitData;
    
    if (isUpdate) {
      // For updates, send basic fields and properly formatted schedule
      const scheduleData = {
        days: formData.schedule.days,
        reminderEnabled: formData.schedule.reminderEnabled,
        // Only include reminderTime if it's not empty and reminderEnabled is true
        ...(formData.schedule.reminderEnabled && formData.schedule.reminderTime && {
          reminderTime: formData.schedule.reminderTime
        })
      };
      
      submitData = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        isActive: formData.isActive,
        schedule: scheduleData
      };
    } else {
      // For creates, send all necessary fields
      const scheduleData = {
        days: formData.schedule.days,
        reminderEnabled: formData.schedule.reminderEnabled,
        // Only include reminderTime if it's not empty and reminderEnabled is true
        ...(formData.schedule.reminderEnabled && formData.schedule.reminderTime && {
          reminderTime: formData.schedule.reminderTime
        })
      };
      
      submitData = {
        name: formData.name,
        color: formData.color,
        icon: formData.icon,
        description: formData.description,
        isActive: formData.isActive,
        frequency: 'daily', // Backend expects this field for creates
        schedule: scheduleData,
      };
    }
    
    console.log('Final submit data:', JSON.stringify(submitData, null, 2));
    
    onSave(submitData);
    onClose();
  };
  
  const handleArchive = () => {
    onArchive({ 
      ...habit, 
      isActive: !formData.isActive 
    });
    onClose();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(habit._id);
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

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
        <div className="space-y-4">
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            onClick={onClose}
          >
            <Cross2Icon />
          </button>
          
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
              {habit ? <CheckIcon className="w-6 h-6 text-white" /> : <PlusIcon className="w-6 h-6 text-white" />}
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-1">
              {habit ? "Edit Habit" : "Create Habit"}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
              {habit ? "Update your habit details" : "Add a new habit to track"}
            </p>
          </div>
          
          {/* Tabs */}
          <div className="mb-4">
            <div className="flex border-b border-[var(--color-border-primary)]">
              <button
                type="button"
                className={`px-3 py-2 font-medium text-xs ${activeTab === "details" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
                onClick={() => setActiveTab("details")}
              >
                Details
              </button>
              <button
                type="button"
                className={`px-3 py-2 font-medium text-xs ${activeTab === "appearance" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
                onClick={() => setActiveTab("appearance")}
              >
                Style
              </button>
              <button
                type="button"
                className={`px-3 py-2 font-medium text-xs ${activeTab === "settings" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
              {habit && (
                <button
                  type="button"
                  className={`px-3 py-2 font-medium text-xs ${activeTab === "danger" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
                  onClick={() => setActiveTab("danger")}
                >
                  Manage
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-4">
            {activeTab === "details" && (
              <div className="space-y-3">
                {/* Basic Info */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-10 px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
                    placeholder="e.g., Daily Exercise"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full h-16 px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors resize-none text-sm"
                    placeholder="Describe this habit..."
                  />
                </div>

                {/* Schedule */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Schedule
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                      const dayId = index === 6 ? 0 : index + 1; // Convert to backend format (0=Sunday)
                      const isSelected = formData.schedule?.days?.includes(dayId) ?? true;
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleFrequencyToggle(dayId)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 font-outfit ${
                            isSelected
                              ? 'bg-[var(--color-brand-500)] text-white'
                              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  {errors.schedule && <p className="text-xs text-red-500 mt-1">{errors.schedule}</p>}
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                {/* Icon & Color Preview */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.icon}
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Preview
                  </span>
                </div>
                
                {/* Compact Emoji Picker */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">Icon</label>
                  <div className="flex gap-1 mb-2">
                    {Object.keys(EMOJI_CATEGORIES).map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`px-2 py-1 text-xs rounded transition-colors font-outfit ${
                          emojiCategory === category
                            ? "bg-[var(--color-brand-500)] text-white"
                            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]"
                        }`}
                        onClick={() => setEmojiCategory(category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="border border-[var(--color-border-primary)]/40 p-2 rounded-lg bg-[var(--color-surface-elevated)]">
                    <div className="flex flex-wrap gap-1">
                      {EMOJI_CATEGORIES[emojiCategory].slice(0, 12).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`w-8 h-8 flex items-center justify-center text-lg hover:bg-[var(--color-surface-hover)] rounded transition-colors ${
                            formData.icon === emoji ? 'bg-[var(--color-brand-100)] ring-1 ring-[var(--color-brand-500)]' : ''
                          }`}
                          onClick={() => handleIconSelect(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Compact Color Picker */}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">Color</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                        style={{ 
                          backgroundColor: color,
                          border: formData.color === color ? "2px solid white" : "1px solid var(--color-border-primary)",
                          outline: formData.color === color ? `2px solid ${color}` : "none"
                        }}
                        onClick={() => setFormData({...formData, color})}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Reminders */}
                <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                      Enable Reminders
                    </span>
                    <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                      Get notifications for this habit
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.schedule.reminderEnabled || false}
                      onChange={(e) => 
                        setFormData({
                          ...formData, 
                          schedule: { 
                            ...formData.schedule, 
                            reminderEnabled: e.target.checked 
                          }
                        })
                      }
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      formData.schedule.reminderEnabled 
                        ? 'bg-[var(--color-brand-500)]' 
                        : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        formData.schedule.reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                      } mt-0.5 ml-0.5`} />
                    </div>
                  </label>
                </div>
                
                {formData.schedule.reminderEnabled && (
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule.reminderTime || ''}
                      onChange={(e) => 
                        setFormData({
                          ...formData, 
                          schedule: { 
                            ...formData.schedule, 
                            reminderTime: e.target.value 
                          }
                        })
                      }
                      className="w-full h-10 px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
                    />
                  </div>
                )}

                {/* Active Setting */}
                <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                      {formData.isActive ? "Active" : "Archived"}
                    </span>
                    <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                      {formData.isActive 
                        ? "Visible in your habit tracker" 
                        : "Hidden from your habit tracker"
                      }
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={() => handleSwitchChange("isActive")}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      formData.isActive 
                        ? 'bg-[var(--color-brand-500)]' 
                        : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        formData.isActive ? 'translate-x-5' : 'translate-x-0'
                      } mt-0.5 ml-0.5`} />
                    </div>
                  </label>
                </div>
              </div>
            )}
            
            {activeTab === "danger" && habit && (
              <div className="space-y-4">
                <div className="p-4 border border-amber-300 rounded-lg bg-amber-50">
                  <div className="flex gap-2 items-center">
                    <InfoCircledIcon className="text-amber-600" />
                    <p className="text-sm text-amber-700">
                      The actions below can't be undone. Please be certain.
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-amber-300 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                  onClick={handleArchive}
                >
                  <ArchiveIcon />
                  {formData.isActive ? "Archive Habit" : "Restore Habit"}
                </button>
                
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  onClick={handleDelete}
                >
                  <TrashIcon />
                  {showDeleteConfirm ? "Are you sure? Click again to delete" : "Delete Habit"}
                </button>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-primary)]">
            <button
              type="button"
              className="flex-1 h-10 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-lg transition-all duration-200 font-outfit font-medium text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 h-10 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:bg-[var(--color-surface-elevated)] disabled:text-[var(--color-text-tertiary)] text-white rounded-lg transition-all duration-200 font-outfit font-semibold flex items-center justify-center gap-2 text-sm"
              onClick={handleSubmit}
              disabled={!formData.name.trim()}
            >
              <CheckIcon className="w-4 h-4" />
              {habit ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomHabitEditModal;
