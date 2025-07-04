import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import "./ModalAnimation.css";
import {
  Cross2Icon,
  CheckIcon,
  LockClosedIcon,
  LockOpen1Icon,
  BackpackIcon,
  HomeIcon,
  PersonIcon,
  GlobeIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";

// Predefined color options for workspace (matching HabitEditModal)
const colorOptions = [
  "#4f46e5", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

// Workspace type options with better descriptions
const WORKSPACE_TYPES = [
  { 
    id: "personal", 
    name: "Personal", 
    description: "Track your own habits privately", 
    icon: "PersonIcon"
  },
  { 
    id: "team", 
    name: "Team", 
    description: "Collaborate with your work team", 
    icon: "BackpackIcon"
  },
  { 
    id: "family", 
    name: "Family", 
    description: "Track habits with your family members", 
    icon: "HomeIcon"
  },
  { 
    id: "fitness", 
    name: "Fitness", 
    description: "Track health and fitness goals together", 
    icon: "PersonIcon"
  },
  { 
    id: "study", 
    name: "Study", 
    description: "Academic and learning habits", 
    icon: "GlobeIcon"
  },
  { 
    id: "community", 
    name: "Community", 
    description: "Larger group for community initiatives", 
    icon: "GlobeIcon"
  },
];

const WorkspaceCreationModal = ({ isOpen, onClose, onSave }) => {
  const modalRef = useRef();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('details');
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#4f46e5", // Default color
    type: "team", // Default type - using a valid value from backend enum
    isPrivate: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
    }));
  };

  const handleColorSelect = (color) => {
    setFormData((prev) => ({
      ...prev,
      color,
    }));
  };

  const handlePrivacyToggle = () => {
    setFormData((prev) => ({
      ...prev,
      isPrivate: !prev.isPrivate,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render the appropriate icon
  const getIcon = (iconName) => {
    switch (iconName) {
      case "PersonIcon":
        return <PersonIcon className="w-4 h-4" />;
      case "GlobeIcon":
        return <GlobeIcon className="w-4 h-4" />;
      case "HomeIcon":
        return <HomeIcon className="w-4 h-4" />;
      case "BackpackIcon":
        return <BackpackIcon className="w-4 h-4" />;
      default:
        return <GlobeIcon className="w-4 h-4" />;
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
        className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto z-10 transform transition-all duration-200 scale-100"
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
              <BackpackIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-2xl font-dmSerif gradient-text mb-2">
              Create New Group
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Set up a workspace to collaborate on habits with others
            </p>
          </div>
          
          {/* Section Tabs */}
          <div className="border-b border-[var(--color-border-primary)]/20">
            <div className="flex space-x-4">
              <button
                type="button"
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === 'details' 
                    ? 'border-[var(--color-brand-500)] text-[var(--color-text-primary)]' 
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
                onClick={() => setActiveSection('details')}
              >
                Details
              </button>
              <button
                type="button"
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === 'appearance' 
                    ? 'border-[var(--color-brand-500)] text-[var(--color-text-primary)]' 
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
                onClick={() => setActiveSection('appearance')}
              >
                Appearance
              </button>
              <button
                type="button"
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === 'settings' 
                    ? 'border-[var(--color-brand-500)] text-[var(--color-text-primary)]' 
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
                onClick={() => setActiveSection('settings')}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Details Section */}
            {activeSection === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Fitness Squad"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                    autoFocus
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="What's this group about?"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Group Type
                  </label>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                    Choose the type that best fits your group's purpose
                  </p>
                  
                  <div className="space-y-2">
                    {WORKSPACE_TYPES.map((type) => (
                      <div
                        key={type.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.type === type.id 
                            ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]' 
                            : 'border-[var(--color-border-primary)] hover:border-[var(--color-brand-300)]'
                        }`}
                        onClick={() => handleTypeSelect(type.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-[var(--color-brand-500)]">
                            {getIcon(type.icon)}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)]">{type.name}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{type.description}</div>
                          </div>
                          {formData.type === type.id && (
                            <CheckIcon className="ml-auto text-[var(--color-brand-500)]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                    Group Color
                  </label>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                    Pick a color that represents your group's theme
                  </p>
                  
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className="w-10 h-10 rounded-full p-0 flex items-center justify-center"
                        style={{ 
                          backgroundColor: color
                        }}
                      >
                        {formData.color === color && (
                          <CheckIcon className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div 
                    className="mt-4 p-3 rounded-md" 
                    style={{ 
                      backgroundColor: formData.color, 
                      color: "#fff" 
                    }}
                  >
                    <div className="font-bold">Preview: {formData.name || "Your Group Name"}</div>
                    <div className="text-sm opacity-90">{formData.description || "Group description will appear here"}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block">
                        Private Group
                      </label>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Only invited members can join
                      </p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.isPrivate}
                        onChange={handlePrivacyToggle}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-[var(--color-surface-secondary)] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-brand-500)]"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-3 border rounded-md bg-[var(--color-surface-secondary)]">
                  <div className="flex gap-2 items-center">
                    <InfoCircledIcon className="text-[var(--color-text-secondary)] w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">
                        {formData.isPrivate ? "Private Group" : "Public Group"}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        {formData.isPrivate 
                          ? "Members need an invitation to join. You can control who has access."
                          : "Anyone with the link can request to join your group."
                        }
                      </div>
                    </div>
                    {formData.isPrivate ? (
                      <LockClosedIcon className="ml-auto text-[var(--color-text-secondary)] w-4 h-4" />
                    ) : (
                      <LockOpen1Icon className="ml-auto text-[var(--color-text-secondary)] w-4 h-4" />
                    )}
                  </div>
                </div>
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
                disabled={isSubmitting || !formData.name}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white transition-all duration-200 font-outfit text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WorkspaceCreationModal;
