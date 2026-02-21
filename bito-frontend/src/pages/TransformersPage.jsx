import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  TrashIcon,
  Pencil1Icon,
  CheckCircledIcon,
  CrossCircledIcon,
  ArrowLeftIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { transformersAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

/* ── Constants ── */
const CATEGORY_META = {
  fitness: { icon: "💪", label: "Fitness" },
  health_wellness: { icon: "🧘", label: "Health & Wellness" },
  learning_skill: { icon: "📚", label: "Learning" },
  productivity: { icon: "⚡", label: "Productivity" },
  finance: { icon: "💰", label: "Finance" },
  event_prep: { icon: "🎯", label: "Event Prep" },
  career: { icon: "💼", label: "Career" },
  relationships: { icon: "❤️", label: "Relationships" },
  creative: { icon: "🎨", label: "Creative" },
  custom: { icon: "✨", label: "Custom" },
};

const STATUS_THEME = {
  preview: { bg: "bg-blue-500/10", text: "text-blue-600" },
  active: { bg: "bg-green-500/10", text: "text-green-600" },
  completed: { bg: "bg-gray-500/10", text: "text-gray-500" },
  archived: { bg: "bg-red-500/10", text: "text-red-500" },
  draft: { bg: "bg-yellow-500/10", text: "text-yellow-600" },
};

const DIFFICULTY_COLORS = {
  easy: "text-green-600 bg-green-500/10",
  medium: "text-yellow-600 bg-yellow-500/10",
  hard: "text-red-600 bg-red-500/10",
};

const METHODOLOGY_LABELS = {
  boolean: "Done / Not Done",
  numeric: "Count",
  duration: "Duration",
  rating: "Rating (1-5)",
};

const SUGGESTED_GOALS = [
  "I want to run a 5K in 8 weeks",
  "Help me build a daily reading habit",
  "I want to become a morning person",
  "Help me reduce screen time and sleep better",
  "I want to learn to meditate consistently",
  "Help me get my finances in order",
];

/* ================================================================
   TransformersPage — goal input, generation, preview, and list
   ================================================================ */
const TransformersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── State ──
  const [view, setView] = useState("list"); // "list" | "create" | "preview" | "detail"
  const [transformers, setTransformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create flow
  const [goalText, setGoalText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);

  // Preview / detail
  const [activeTransformer, setActiveTransformer] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null); // index of habit being edited
  const [editForm, setEditForm] = useState({});
  const [applyLoading, setApplyLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(null);

  // ── Fetch transformers ──
  const fetchTransformers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transformersAPI.list();
      if (res.success) setTransformers(res.transformers || []);
    } catch {
      setError("Failed to load transformers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransformers();
  }, [fetchTransformers]);

  // ── Generate ──
  const handleGenerate = async () => {
    if (!goalText.trim() || goalText.trim().length < 5) return;
    try {
      setGenerating(true);
      setError(null);
      setGeneratingStep(0);

      // Simulate progress steps
      const stepTimer = setInterval(() => {
        setGeneratingStep((s) => Math.min(s + 1, 3));
      }, 1500);

      const res = await transformersAPI.generate(goalText.trim());
      clearInterval(stepTimer);

      if (res.success) {
        setActiveTransformer(res.transformer);
        setView("preview");
        setGoalText("");
        fetchTransformers();
      } else {
        setError(res.error || "Generation failed");
      }
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
      setGeneratingStep(0);
    }
  };

  // ── Apply ──
  const handleApply = async () => {
    if (!activeTransformer) return;
    try {
      setApplyLoading(true);
      setError(null);
      const res = await transformersAPI.apply(activeTransformer._id);
      if (res.success) {
        setActiveTransformer(res.transformer);
        setView("list");
        fetchTransformers();
      } else {
        setError(res.error || "Failed to apply");
      }
    } catch (err) {
      setError(err.message || "Failed to apply transformer");
    } finally {
      setApplyLoading(false);
    }
  };

  // ── Edit habit in preview ──
  const startEditHabit = (index) => {
    setEditingHabit(index);
    setEditForm({ ...activeTransformer.system.habits[index] });
  };

  const saveEditHabit = async () => {
    if (editingHabit === null) return;
    const updatedHabits = [...activeTransformer.system.habits];
    updatedHabits[editingHabit] = editForm;

    try {
      const res = await transformersAPI.update(activeTransformer._id, {
        habits: updatedHabits,
      });
      if (res.success) {
        setActiveTransformer(res.transformer);
      }
    } catch {
      // Update locally even if save fails
      const updated = { ...activeTransformer };
      updated.system.habits = updatedHabits;
      setActiveTransformer(updated);
    }
    setEditingHabit(null);
    setEditForm({});
  };

  const removeHabit = async (index) => {
    const updatedHabits = activeTransformer.system.habits.filter((_, i) => i !== index);
    if (updatedHabits.length === 0) return; // Can't remove all

    try {
      const res = await transformersAPI.update(activeTransformer._id, {
        habits: updatedHabits,
      });
      if (res.success) {
        setActiveTransformer(res.transformer);
      }
    } catch {
      const updated = { ...activeTransformer };
      updated.system.habits = updatedHabits;
      setActiveTransformer(updated);
    }
  };

  // ── Archive ──
  const handleArchive = async (id) => {
    try {
      setArchiveLoading(id);
      const res = await transformersAPI.archive(id);
      if (res.success) {
        fetchTransformers();
        if (activeTransformer?._id === id) {
          setView("list");
          setActiveTransformer(null);
        }
      }
    } catch {
      setError("Failed to archive");
    } finally {
      setArchiveLoading(null);
    }
  };

  // ── View detail ──
  const openDetail = async (t) => {
    try {
      const res = await transformersAPI.get(t._id);
      if (res.success) {
        setActiveTransformer(res.transformer);
        setView(res.transformer.status === "preview" ? "preview" : "detail");
      }
    } catch {
      setError("Failed to load transformer");
    }
  };

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  // ── Generating overlay ──
  if (generating) {
    const steps = [
      "Understanding your goal...",
      "Researching best practices...",
      "Designing your habit system...",
      "Almost ready...",
    ];
    return (
      <div className="max-w-xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-5xl mb-6 animate-pulse">🧠</div>
        <h2 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-4">
          Generating Your Plan
        </h2>
        <div className="space-y-3 w-full max-w-xs">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                i < generatingStep ? "bg-green-500/20 text-green-600" :
                i === generatingStep ? "bg-[var(--color-brand-600)]/20 text-[var(--color-brand-600)] animate-pulse" :
                "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
              }`}>
                {i < generatingStep ? <CheckCircledIcon className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-sm font-spartan ${
                i <= generatingStep ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-tertiary)]"
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Preview view ──
  if ((view === "preview" || view === "detail") && activeTransformer) {
    const t = activeTransformer;
    const sys = t.system;
    const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
    const sTheme = STATUS_THEME[t.status] || STATUS_THEME.preview;
    const isPreview = t.status === "preview" || t.status === "draft";

    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => { setView("list"); setActiveTransformer(null); setEditingHabit(null); }}
          className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to transformers
        </button>

        {/* Header */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
          <div className="flex items-start gap-4">
            <span className="text-3xl">{sys.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-garamond font-bold text-[var(--color-text-primary)]">
                  {sys.name}
                </h1>
                <span className={`text-xs font-spartan font-medium px-2.5 py-1 rounded-lg ${sTheme.bg} ${sTheme.text}`}>
                  {t.status}
                </span>
              </div>
              {sys.description && (
                <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-1">{sys.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)] font-spartan mt-2">
                <span>{catMeta.icon} {catMeta.label}</span>
                {sys.estimatedDuration?.value && (
                  <span>{sys.estimatedDuration.value} {sys.estimatedDuration.unit}</span>
                )}
                <span>{sys.habits?.length || 0} habits</span>
              </div>
            </div>
          </div>

          {/* Goal */}
          {t.goal?.text && (
            <div className="mt-4 p-3 rounded-xl bg-[var(--color-surface-hover)]">
              <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Your goal</p>
              <p className="text-sm font-spartan text-[var(--color-text-primary)] italic">"{t.goal.text}"</p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-spartan">{error}</p>
        )}

        {/* Habits list */}
        <div className="space-y-3">
          <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Generated Habits ({sys.habits?.length || 0})
          </h3>

          {sys.habits?.map((h, i) => {
            const isEditing = editingHabit === i;
            const diff = DIFFICULTY_COLORS[h.difficulty] || DIFFICULTY_COLORS.medium;

            if (isEditing) {
              return (
                <div key={i} className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border-2 border-[var(--color-brand-600)]/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="flex-1 text-sm font-spartan font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-lg px-3 py-2 border border-[var(--color-border-primary)]/20 focus:outline-none focus:border-[var(--color-brand-600)]"
                      placeholder="Habit name"
                    />
                  </div>
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full text-xs font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-lg px-3 py-2 border border-[var(--color-border-primary)]/20 focus:outline-none focus:border-[var(--color-brand-600)] resize-none"
                    rows={2}
                    placeholder="Description"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase">Target value</label>
                      <input
                        type="number"
                        value={editForm.target?.value || ""}
                        onChange={(e) => setEditForm({ ...editForm, target: { ...editForm.target, value: Number(e.target.value) } })}
                        className="w-full text-xs font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 border border-[var(--color-border-primary)]/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase">Unit</label>
                      <input
                        value={editForm.target?.unit || ""}
                        onChange={(e) => setEditForm({ ...editForm, target: { ...editForm.target, unit: e.target.value } })}
                        className="w-full text-xs font-spartan bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 border border-[var(--color-border-primary)]/20 focus:outline-none"
                        placeholder="minutes, pages, etc."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditingHabit(null); setEditForm({}); }}
                      className="text-xs font-spartan px-3 py-1.5 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditHabit}
                      className="text-xs font-spartan font-medium px-3 py-1.5 rounded-lg bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{h.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)]">{h.name}</p>
                      <span className={`text-[10px] font-spartan font-medium px-2 py-0.5 rounded-md ${diff}`}>
                        {h.difficulty}
                      </span>
                      {!h.isRequired && (
                        <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)] italic">optional</span>
                      )}
                    </div>
                    {h.description && (
                      <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">{h.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-[var(--color-text-tertiary)] font-spartan">
                      <span>{METHODOLOGY_LABELS[h.methodology] || h.methodology}</span>
                      <span>
                        {h.frequency?.type === "daily" && "Daily"}
                        {h.frequency?.type === "weekly" && `${h.frequency.timesPerWeek || 3}x/week`}
                        {h.frequency?.type === "specific_days" && h.frequency.days?.join(", ")}
                      </span>
                      {h.target?.value && (
                        <span>{h.target.value} {h.target.unit || ""}</span>
                      )}
                    </div>
                  </div>

                  {/* Edit/remove controls (preview only) */}
                  {isPreview && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEditHabit(i)}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Edit habit"
                      >
                        <Pencil1Icon className="w-3.5 h-3.5" />
                      </button>
                      {sys.habits.length > 1 && (
                        <button
                          onClick={() => removeHabit(i)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
                          title="Remove habit"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Applied habits (active transformer) */}
        {t.status === "active" && t.appliedResources?.habitIds?.length > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
            <h3 className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              Created Habits
            </h3>
            <div className="space-y-2">
              {t.appliedResources.habitIds.map((h) => (
                <div key={h._id || h} className="flex items-center gap-2 text-sm font-spartan">
                  <span>{h.icon || "🎯"}</span>
                  <span className="text-[var(--color-text-primary)]">{h.name || "Habit"}</span>
                  {h.isActive === false && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">(archived)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action bar */}
        {isPreview && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
            <button
              onClick={handleApply}
              disabled={applyLoading}
              className="flex-1 h-10 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {applyLoading ? (
                <>
                  <ReloadIcon className="w-3.5 h-3.5 animate-spin" /> Applying...
                </>
              ) : (
                <>
                  <CheckCircledIcon className="w-4 h-4" /> Apply — Create {sys.habits?.length} Habits
                </>
              )}
            </button>
            <button
              onClick={() => handleArchive(t._id)}
              className="h-10 px-4 rounded-xl text-sm font-spartan text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Discard
            </button>
          </div>
        )}

        {/* Generation metadata */}
        {t.generation?.model && (
          <p className="text-[10px] text-[var(--color-text-tertiary)] font-spartan text-center">
            Generated by {t.generation.model} on {new Date(t.generation.generatedAt).toLocaleDateString()}
            {t.generation.tokenUsage?.input > 0 && ` · ${t.generation.tokenUsage.input + t.generation.tokenUsage.output} tokens`}
          </p>
        )}
      </div>
    );
  }

  // ── Create view ──
  if (view === "create") {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>

        <div className="text-center">
          <p className="text-4xl mb-3">🧠</p>
          <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)]">
            What do you want to achieve?
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-1">
            Describe your goal and AI will design a personalized habit system for you.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-spartan">
            {error}
          </div>
        )}

        <div>
          <textarea
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="e.g., I want to run a 5K in 8 weeks..."
            className="w-full h-32 p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-600)] resize-none"
            maxLength={1000}
            autoFocus
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] text-[var(--color-text-tertiary)] font-spartan">
              {goalText.length}/1000
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!goalText.trim() || goalText.trim().length < 5}
          className="w-full h-12 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate My Plan
        </button>

        {/* Suggested goals */}
        <div>
          <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
            Try a suggestion
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoalText(g)}
                className="text-xs font-spartan px-3 py-1.5 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/10 transition-colors"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── List view (default) ──
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-garamond font-bold text-[var(--color-text-primary)]">
            Transformers
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-0.5">
            AI-powered habit systems from your goals
          </p>
        </div>
        <button
          onClick={() => { setView("create"); setError(null); }}
          className="flex items-center gap-1.5 h-9 px-4 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-xs font-spartan font-medium transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New Transformer
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-spartan">{error}</p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-[var(--color-surface-hover)] rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && transformers.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🧠</p>
          <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
            No transformers yet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan max-w-sm mx-auto mb-4">
            Tell us your goal and AI will design a personalized habit system for you.
          </p>
          <button
            onClick={() => setView("create")}
            className="inline-flex items-center gap-1.5 h-9 px-5 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" /> Create your first Transformer
          </button>
        </div>
      )}

      {/* Transformer cards */}
      {!loading && transformers.length > 0 && (
        <div className="space-y-3">
          {transformers.map((t) => {
            const catMeta = CATEGORY_META[t.system?.category] || CATEGORY_META.custom;
            const sTheme = STATUS_THEME[t.status] || STATUS_THEME.preview;
            const habitCount = t.system?.habits?.length || t.habitCount || 0;

            return (
              <div
                key={t._id}
                onClick={() => openDetail(t)}
                className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{t.system?.icon || "🎯"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                        {t.system?.name || "Untitled"}
                      </p>
                      <span className={`text-[10px] font-spartan font-medium px-2 py-0.5 rounded-md ${sTheme.bg} ${sTheme.text}`}>
                        {t.status}
                      </span>
                    </div>
                    {t.system?.description && (
                      <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5 line-clamp-1">
                        {t.system.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)] font-spartan mt-2">
                      <span>{catMeta.icon} {catMeta.label}</span>
                      <span>{habitCount} habit{habitCount !== 1 && "s"}</span>
                      {t.system?.estimatedDuration?.value && (
                        <span>{t.system.estimatedDuration.value} {t.system.estimatedDuration.unit}</span>
                      )}
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Archive button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleArchive(t._id); }}
                    disabled={archiveLoading === t._id}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50"
                    title="Archive"
                  >
                    <CrossCircledIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransformersPage;
