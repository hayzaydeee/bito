import { useState } from "react";
import { UsersThree } from "@phosphor-icons/react";
import { FormModal, FormTabs, FormField, ColorPicker, ToggleRow, FormActions, INPUT_CLS, TEXTAREA_CLS } from "./FormPrimitives";
import IntensitySelector from "../groups/IntensitySelector";
import { GROUP_TYPE_CONFIG } from "../groups/groupTypeConfig";

const TABS = [
  { id: "details", label: "Details" },
  { id: "appearance", label: "Appearance" },
  { id: "settings", label: "Settings" },
  { id: "intensity", label: "Intensity" },
];
const GROUP_TYPES = Object.entries(GROUP_TYPE_CONFIG).map(([id, cfg]) => ({ id, label: cfg.label, Icon: cfg.Icon }));
const DEFAULT_FORM = { name: "", description: "", color: "#4f46e5", type: "team", isPrivate: true, intensity: "accountable" };

const GroupCreationModal = ({ isOpen, onClose, onSave }) => {
  const [tab, setTab] = useState("details");
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key, value) => {
    setFormData((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Group name is required";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setIsSubmitting(true);
    try {
      await onSave(formData);
      setFormData(DEFAULT_FORM);
      setTab("details");
      onClose();
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" title="New Group"
      icon={<UsersThree size={18} className="text-[var(--color-brand-400)]" />}>
      <form onSubmit={handleSubmit}>
        <FormTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "details" && (
          <div className="space-y-4">
            <FormField label="Group name" required error={errors.name}>
              <input type="text" className={INPUT_CLS} value={formData.name}
                onChange={(e) => set("name", e.target.value)} placeholder="e.g., Morning grind" autoFocus />
            </FormField>
            <FormField label="Description">
              <textarea className={TEXTAREA_CLS} rows={3} value={formData.description}
                onChange={(e) => set("description", e.target.value)} placeholder="What's this group about?" />
            </FormField>
            <FormField label="Group type">
              <div className="grid grid-cols-2 gap-2">
                {GROUP_TYPES.map((gtype) => {
                  const active = formData.type === gtype.id;
                  const GIcon = gtype.Icon;
                  return (
                    <button key={gtype.id} type="button" onClick={() => set("type", gtype.id)}
                      className={"flex items-center gap-2.5 px-3 h-11 rounded-xl text-sm font-spartan font-medium border transition-colors text-left " +
                        (active ? "bg-[var(--color-brand-600)]/12 border-[var(--color-brand-500)]/40 text-[var(--color-brand-400)]"
                                : "bg-[var(--color-surface-elevated)]/40 border-[var(--color-border-primary)]/15 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")}>
                      <GIcon size={15} weight="duotone" />{gtype.label}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>
        )}

        {tab === "appearance" && (
          <div className="space-y-5">
            <FormField label="Color">
              <ColorPicker value={formData.color} onChange={(c) => set("color", c)} />
            </FormField>
            <div className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ backgroundColor: formData.color + "20", border: "1px solid " + formData.color + "40" }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: formData.color + "30" }}>
            {(() => { const cfg = GROUP_TYPE_CONFIG[formData.type]; if (!cfg) return null; const PIcon = cfg.Icon; return <PIcon size={16} weight="duotone" style={{ color: formData.color }} />; })()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-garamond font-bold text-[var(--color-text-primary)] truncate">{formData.name || "Your group name"}</p>
                <p className="text-xs font-spartan text-[var(--color-text-tertiary)] truncate">{formData.description || "Description"}</p>
              </div>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-3">
            <ToggleRow id="isPrivate" label="Private group" description="Only invited members can join"
              checked={formData.isPrivate} onChange={(v) => set("isPrivate", v)} />
          </div>
        )}

        {tab === "intensity" && (
          <IntensitySelector value={formData.intensity} onChange={(v) => set("intensity", v)} />
        )}

        <FormActions onCancel={onClose} submitLabel="Create Group" loading={isSubmitting} disabled={!formData.name.trim()} />
      </form>
    </FormModal>
  );
};

export default GroupCreationModal;