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

// Days of the week for frequency selector (0=Sunday to 6=Saturday to match backend)
const DAYS_OF_WEEK = [
  { id: 1, short: "Mon", fullName: "Monday" },
  { id: 2, short: "Tue", fullName: "Tuesday" },
  { id: 3, short: "Wed", fullName: "Wednesday" },
  { id: 4, short: "Thu", fullName: "Thursday" },
  { id: 5, short: "Fri", fullName: "Friday" },
  { id: 6, short: "Sat", fullName: "Saturday" },
  { id: 0, short: "Sun", fullName: "Sunday" },
];

// Predefined colors
const COLOR_OPTIONS = [
  "#4f46e5", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} data-modal="habit-edit">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-primary)] shadow-xl p-6 w-full max-w-md animate-zoom-in mx-auto"
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          className="absolute top-4 right-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          onClick={onClose}
        >
          <Cross2Icon />
        </button>
        
        {/* Header */}
        <h2 className="text-2xl font-dmSerif gradient-text mb-5">
          {habit ? "Edit Habit" : "Create New Habit"}
        </h2>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-[var(--color-border-primary)]">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "details" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "appearance" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
              onClick={() => setActiveTab("appearance")}
            >
              Appearance
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "settings" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
            {habit && (
              <button
                className={`px-4 py-2 font-medium text-sm ${activeTab === "danger" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
                onClick={() => setActiveTab("danger")}
              >
                Manage
              </button>
            )}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === "details" && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Habit Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Drink water"
                    className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Why this habit matters to you"
                    className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                    rows="4"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Schedule
                  </label>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                    Which days should you perform this habit?
                  </p>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                          formData.schedule.days.includes(day.id)
                            ? "bg-[var(--color-brand-500)] text-white"
                            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]"
                        }`}
                        onClick={() => handleFrequencyToggle(day.id)}
                        title={day.fullName}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                    {formData.schedule.days.length === 7 
                      ? "Every day" 
                      : formData.schedule.days.length === 0 
                      ? "No days selected" 
                      : `${formData.schedule.days.length} day${formData.schedule.days.length > 1 ? 's' : ''} per week`}
                  </p>
                  {errors.schedule && (
                    <p className="text-xs text-red-500 mt-1">{errors.schedule}</p>
                  )}
                </div>
                
                {/* Reminder Settings */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reminder Settings
                  </label>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-medium">Enable Reminders</span>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Get notified to complete this habit
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.schedule.reminderEnabled}
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
                      <label className="block text-sm font-medium mb-1">
                        Reminder Time
                      </label>
                      <input
                        type="time"
                        value={formData.schedule.reminderTime}
                        onChange={(e) => 
                          setFormData({
                            ...formData, 
                            schedule: { 
                              ...formData.schedule, 
                              reminderTime: e.target.value 
                            }
                          })
                        }
                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
          
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-12 h-12 rounded-md flex items-center justify-center text-2xl"
                    style={{ backgroundColor: formData.color, color: "#fff" }}
                  >
                    {formData.icon}
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Current icon
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {Object.keys(EMOJI_CATEGORIES).map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          emojiCategory === category
                            ? "bg-[var(--color-brand-500)] text-white"
                            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]"
                        }`}
                        onClick={() => setEmojiCategory(category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="border border-[var(--color-border-primary)] p-3 rounded-md bg-[var(--color-surface-elevated)]">
                    <div className="flex flex-wrap gap-2">
                      {EMOJI_CATEGORIES[emojiCategory].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="w-8 h-8 flex items-center justify-center text-xl hover:bg-[var(--color-surface-hover)] rounded-md transition-colors"
                          onClick={() => handleIconSelect(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        border: formData.color === color ? "3px solid white" : "none",
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
              <div className="flex justify-between items-center p-3 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-elevated)]">
                <div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">
                    {formData.isActive ? "Active" : "Archived"}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {formData.isActive 
                      ? "Visible in your habit tracker" 
                      : "Hidden from your habit tracker"
                    }
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.isActive}
                    onChange={() => handleSwitchChange("isActive")}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${formData.isActive ? "bg-[var(--color-brand-500)]" : "bg-[var(--color-text-tertiary)]"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${formData.isActive ? "translate-x-5" : "translate-x-1"}`}></div>
                  </div>
                </label>
              </div>
            </div>
          )}
          
          {activeTab === "danger" && habit && (
            <div className="space-y-4">
              <div className="p-4 border border-amber-300 rounded-md bg-amber-50">
                <div className="flex gap-2 items-center">
                  <InfoCircledIcon className="text-amber-600" />
                  <p className="text-sm text-amber-700">
                    The actions below can't be undone. Please be certain.
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-amber-300 rounded-md text-amber-700 hover:bg-amber-50 transition-colors"
                onClick={handleArchive}
              >
                <ArchiveIcon />
                {formData.isActive ? "Archive Habit" : "Restore Habit"}
              </button>
              
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                onClick={handleDelete}
              >
                <TrashIcon />
                {showDeleteConfirm ? "Are you sure? Click again to delete" : "Delete Habit"}
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-primary)]">
          <button
            type="button"
            className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-md transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-md flex items-center gap-2 transition-colors"
            onClick={handleSubmit}
          >
            <CheckIcon />
            {habit ? "Update Habit" : "Create Habit"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomHabitEditModal;
