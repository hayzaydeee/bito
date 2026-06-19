import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wizardStepVariants } from "../../utils/motion";
import { Cross2Icon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";
import { UsersThree } from "@phosphor-icons/react";
import { ColorPicker, ToggleRow, INPUT_CLS, TEXTAREA_CLS } from "./FormPrimitives";
import IntensitySelector from "../groups/IntensitySelector";
import { GROUP_TYPE_CONFIG } from "../groups/groupTypeConfig";
import AnimatedModal from "./AnimatedModal";

const STEP_COUNT = 3;
const STEP_LABELS = ["Details", "Style", "Settings"];
const LS_COMPACT_KEY = "bito_wizard_compact_group";
const GROUP_TYPES = Object.entries(GROUP_TYPE_CONFIG).map(([id, cfg]) => ({ id, label: cfg.label, Icon: cfg.Icon }));
const DEFAULT_FORM = { name: "", description: "", color: "#4f46e5", type: "team", isPrivate: true, intensity: "accountable" };

const ProgressDots = ({ step, total, labels }) => (
  <div className="flex items-center justify-center gap-3">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex flex-col items-center gap-1">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === step ? 24 : 8,
            backgroundColor: i <= step ? "var(--signal)" : "var(--line-2)",
          }}
        />
        <span
          className="std-mono text-[9px] uppercase tracking-wide transition-colors duration-200"
          style={{ color: i <= step ? "var(--signal)" : "var(--ink-3)" }}
        >
          {labels[i]}
        </span>
      </div>
    ))}
  </div>
);

const GroupCreationModal = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [compactMode, setCompactMode] = useState(() => {
    try { return localStorage.getItem(LS_COMPACT_KEY) === "true"; }
    catch { return false; }
  });

  const set = (key, value) => {
    setFormData((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const goNext = useCallback(() => {
    let err = {};
    if (step === 0 && !formData.name.trim()) err.name = "Group name is required";
    if (Object.keys(err).length > 0) { setErrors(err); return; }
    setErrors({});
    if (step >= STEP_COUNT - 1) return;
    setDirection(1);
    setStep((s) => s + 1);
  }, [step, formData]);

  const goBack = useCallback(() => {
    if (step <= 0) { onClose(); return; }
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step, onClose]);

  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    try { localStorage.setItem(LS_COMPACT_KEY, String(next)); } catch {}
    if (!next) setStep(0);
  };

  const handleSubmit = async () => {
    let err = {};
    if (!formData.name.trim()) err.name = "Group name is required";
    if (Object.keys(err).length > 0) { setErrors(err); return; }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      setFormData(DEFAULT_FORM);
      setStep(0);
      onClose();
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep0 = () => (
    <div className="space-y-4">
      <div>
        <label className="grp-kicker block mb-1.5">Group name *</label>
        <input 
          type="text" 
          className={INPUT_CLS} 
          value={formData.name}
          onChange={(e) => set("name", e.target.value)} 
          placeholder="e.g., Morning grind" 
          autoFocus={step === 0 && !compactMode}
        />
        {errors.name && <p className="grp-mono text-[11px] text-[var(--rose)] mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="grp-kicker block mb-1.5">Description</label>
        <textarea 
          className={`${TEXTAREA_CLS} h-auto py-2`} 
          rows={3} 
          value={formData.description}
          onChange={(e) => set("description", e.target.value)} 
          placeholder="What's this group about?" 
        />
      </div>
      <div>
        <label className="grp-kicker block mb-1.5">Group type</label>
        <div className="grid grid-cols-2 gap-2">
          {GROUP_TYPES.map((gtype) => {
            const active = formData.type === gtype.id;
            const GIcon = gtype.Icon;
            return (
              <button 
                key={gtype.id} 
                type="button" 
                onClick={() => set("type", gtype.id)}
                className={"flex items-center gap-2.5 px-3 h-11 rounded-[10px] text-sm font-medium border transition-colors text-left " +
                  (active ? "bg-[var(--signal)]/12 border-[var(--signal)]/45 text-[var(--signal)]"
                          : "bg-[var(--bg-2)] border-[var(--line-2)] text-[var(--ink-2)] hover:text-[var(--ink)]")}
              >
                <GIcon size={15} weight="duotone" />{gtype.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <label className="grp-kicker block mb-1.5">Color</label>
        <ColorPicker value={formData.color} onChange={(c) => set("color", c)} />
      </div>
      <div className="rounded-[12px] px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: formData.color + "20", border: "1px solid " + formData.color + "40" }}>
        <span className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: formData.color + "30" }}>
          {(() => { 
            const cfg = GROUP_TYPE_CONFIG[formData.type]; 
            if (!cfg) return null; 
            const PIcon = cfg.Icon; 
            return <PIcon size={16} weight="duotone" style={{ color: formData.color }} />; 
          })()}
        </span>
        <div className="min-w-0">
          <p className="grp-display text-base font-bold text-[var(--ink)] truncate">{formData.name || "Your group name"}</p>
          <p className="grp-mono text-[10px] text-[var(--ink-3)] truncate uppercase tracking-wider">{formData.description || "Description"}</p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <ToggleRow 
          id="isPrivate" 
          label="Private group" 
          description="Only invited members can join"
          checked={formData.isPrivate} 
          onChange={(v) => set("isPrivate", v)} 
        />
      </div>
      <div>
        <label className="grp-kicker block mb-1.5">Intensity</label>
        <IntensitySelector value={formData.intensity} onChange={(v) => set("intensity", v)} />
      </div>
    </div>
  );

  const renderCompact = () => (
    <div className="space-y-5">
      {renderStep0()}
      <hr className="border-[var(--line-2)]" />
      {renderStep1()}
      <hr className="border-[var(--line-2)]" />
      {renderStep2()}
    </div>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2];
  const isLastStep = step === STEP_COUNT - 1;

  if (!isOpen) return null;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="grp relative w-full bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] px-6 pt-5 pb-3 border-b border-[var(--line-2)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[8px] bg-[var(--signal)]/10 flex items-center justify-center text-[var(--signal)]">
                <UsersThree size={18} weight="duotone" />
              </div>
              <div>
                <p className="grp-kicker">Group Setup</p>
                <h2 className="grp-display text-xl font-bold text-[var(--ink)]">New Group</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleCompact}
                className="grp-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--signal)] transition-colors"
              >
                {compactMode ? "Step mode" : "Quick mode"}
              </button>
              <button
                className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
                onClick={onClose}
              >
                <Cross2Icon />
              </button>
            </div>
          </div>
          {!compactMode && <ProgressDots step={step} total={STEP_COUNT} labels={STEP_LABELS} />}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {compactMode ? (
            renderCompact()
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={wizardStepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {stepContent[step]()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--surface)] px-6 py-4 border-t border-[var(--line-2)]">
          {compactMode ? (
            <div className="flex gap-3">
              <button type="button" className="grp-btn flex-1 justify-center" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="grp-btn grp-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
                onClick={handleSubmit}
                disabled={!formData.name.trim() || isSubmitting}
              >
                <CheckIcon className="w-4 h-4" />
                {isSubmitting ? "Creating..." : "Create"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button type="button" className="grp-btn gap-1.5" onClick={goBack}>
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                {step === 0 ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                className="grp-btn grp-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
                onClick={isLastStep ? handleSubmit : goNext}
                disabled={isSubmitting}
              >
                {isLastStep ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    {isSubmitting ? "Creating..." : "Create Group"}
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </AnimatedModal>
  );
};

export default GroupCreationModal;