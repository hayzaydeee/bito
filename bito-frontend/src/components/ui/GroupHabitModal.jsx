import { useState } from "react";
import { Target } from "@phosphor-icons/react";
import { FormModal, FormTabs, FormField, FormRow, ColorPicker, DayPicker, ToggleRow, FormActions, INPUT_CLS, TEXTAREA_CLS, SELECT_CLS, COLOR_OPTIONS } from "./FormPrimitives";
import IconPicker from "../shared/IconPicker";

const TABS_ADD = [
  { id: "details", label: "Details" },
  { id: "appearance", label: "Style" },
  { id: "settings", label: "Settings" },
];
const TABS_EDIT = [
  ...TABS_ADD,
  { id: "manage", label: "Manage" },
];

const GroupHabitModal = ({
  isOpen, onClose,
  habit = null,
  habitForm, setHabitForm,
  onSave, onDelete,
  activeTab, setActiveTab,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);

  const isEditing = Boolean(habit);
  const TABS = isEditing ? TABS_EDIT : TABS_ADD;

  const set = (key, value) => setHabitForm((p) => ({ ...p, [key]: value }));
  const setSchedule = (key, value) => setHabitForm((p) => ({ ...p, schedule: { ...p.schedule, [key]: value } }));
  const setTarget = (key, value) => setHabitForm((p) => ({ ...p, defaultTarget: { ...p.defaultTarget, [key]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try { await onSave(); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      setTimeout(() => setDeleteStep(0), 3000);
      return;
    }
    setIsSubmitting(true);
    try { await onDelete(habit._id); } finally { setIsSubmitting(false); setDeleteStep(0); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg"
      title={isEditing ? "Edit Habit" : "Add Group Habit"}
      icon={<Target size={18} className="text-[var(--signal)]" />}>
      <form onSubmit={handleSubmit}>
        <FormTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === "details" && (
          <div className="space-y-4">
            <FormField label="Habit name" required>
              <input type="text" className={INPUT_CLS} value={habitForm.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g., Morning run" autoFocus />
            </FormField>
            <FormField label="Description">
              <textarea className={TEXTAREA_CLS} rows={3} value={habitForm.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe what this habit involves..." />
            </FormField>
            <FormField label="Category">
              <select className={SELECT_CLS} value={habitForm.category}
                onChange={(e) => set("category", e.target.value)}>
                <option value="health">Health & Fitness</option>
                <option value="productivity">Productivity</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="learning">Learning</option>
                <option value="social">Social</option>
                <option value="creative">Hobbies & Creative</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Default target">
              <div className="flex gap-2">
                <input type="number" min="1"
                  className={INPUT_CLS + " w-20 flex-shrink-0"}
                  value={habitForm.defaultTarget.value}
                  onChange={(e) => setTarget("value", parseInt(e.target.value) || 1)} />
                <select className={SELECT_CLS}
                  value={habitForm.defaultTarget.unit}
                  onChange={(e) => setTarget("unit", e.target.value)}>
                  <option value="times">times</option>
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="pages">pages</option>
                  <option value="miles">miles</option>
                  <option value="calories">calories</option>
                  <option value="glasses">glasses</option>
                  <option value="custom">custom</option>
                </select>
              </div>
            </FormField>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-5">
            <FormField label="Icon">
              <IconPicker value={habitForm.icon} onChange={(icon) => set("icon", icon)} />
            </FormField>
            <FormField label="Color">
              <ColorPicker value={habitForm.color} onChange={(c) => set("color", c)} colors={COLOR_OPTIONS} />
            </FormField>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-5">
            <FormField label="Schedule">
              <DayPicker selected={habitForm.schedule.days}
                onChange={(days) => setSchedule("days", days)} />
            </FormField>
            <ToggleRow id="isRequired" label="Required for all members"
              description="All group members must adopt this habit"
              checked={habitForm.isRequired}
              onChange={(v) => set("isRequired", v)} />
            <ToggleRow id="reminderEnabled" label="Enable reminders"
              checked={habitForm.schedule.reminderEnabled}
              onChange={(v) => setSchedule("reminderEnabled", v)} />
            {habitForm.schedule.reminderEnabled && (
              <FormField label="Reminder time">
                <input type="time" className={INPUT_CLS}
                  value={habitForm.schedule.reminderTime}
                  onChange={(e) => setSchedule("reminderTime", e.target.value)} />
              </FormField>
            )}
          </div>
        )}

        {activeTab === "manage" && isEditing && (
          <div className="space-y-4">
            <div className="rounded-[12px] border border-[var(--rose)]/25 bg-[var(--rose)]/5 p-4">
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                Deleting this habit will remove it from the group. Members who have adopted it will keep their personal copies.
              </p>
            </div>
          </div>
        )}

        <FormActions
          onCancel={onClose}
          submitLabel={isEditing ? "Update Habit" : "Create Habit"}
          loading={isSubmitting}
          disabled={!habitForm.name?.trim()}
          destructive={isEditing && activeTab === "manage" ? {
            label: deleteStep === 1 ? "Confirm delete?" : "Delete habit",
            onClick: handleDelete,
            loading: isSubmitting,
          } : undefined}
        />
      </form>
    </FormModal>
  );
};

export default GroupHabitModal;