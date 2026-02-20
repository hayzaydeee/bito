import { useState, useEffect, useCallback } from "react";
import { Cross2Icon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from "@radix-ui/react-icons";
import { groupsAPI } from "../../services/api";

const inputClass =
  "w-full h-10 px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-xl text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-600)]/40";

const ChallengeJoinModal = ({ isOpen, challenge, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(true);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allHabits, setAllHabits] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAllHabits, setShowAllHabits] = useState(false);

  const isSingleMode = !challenge?.habitMatchMode || challenge.habitMatchMode === "single";

  const fetchSuggestions = useCallback(async () => {
    if (!challenge?._id) return;
    setSuggesting(true);
    setError("");

    try {
      const res = await groupsAPI.suggestHabitsForChallenge(challenge._id);
      if (res.success) {
        setSuggestions(res.suggestions || []);
        setAllHabits(res.habits || []);

        // Pre-select habits with score >= 70
        const preSelected = new Set();
        (res.suggestions || []).forEach((s) => {
          if (s.score >= 70) preSelected.add(s.habitId);
        });

        // For single mode, only pre-select the top one
        if (isSingleMode && preSelected.size > 1) {
          const top = [...preSelected][0];
          preSelected.clear();
          preSelected.add(top);
        }

        setSelectedIds(preSelected);
      }
    } catch {
      // Fallback: show all habits without suggestions
      setSuggestions([]);
      setShowAllHabits(true);
    } finally {
      setSuggesting(false);
    }
  }, [challenge?._id, isSingleMode]);

  useEffect(() => {
    if (isOpen && challenge) {
      setSelectedIds(new Set());
      setSuggestions([]);
      setAllHabits([]);
      setShowAllHabits(false);
      setError("");
      fetchSuggestions();
    }
  }, [isOpen, challenge, fetchSuggestions]);

  if (!isOpen || !challenge) return null;

  const toggleHabit = (habitId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        if (isSingleMode) {
          // Single mode: only one at a time
          next.clear();
        }
        next.add(habitId);
      }
      return next;
    });
  };

  const handleJoin = async () => {
    // Validate selection based on match mode
    const mode = challenge.habitMatchMode || "single";
    if (mode === "all" || mode === "any") {
      if (selectedIds.size === 0) {
        return setError("Please select at least one habit");
      }
    }
    if (mode === "minimum" && challenge.habitMatchMinimum) {
      if (selectedIds.size < challenge.habitMatchMinimum) {
        return setError(`Please select at least ${challenge.habitMatchMinimum} habit(s)`);
      }
    }

    setLoading(true);
    setError("");

    try {
      const ids = [...selectedIds];
      const res = await groupsAPI.joinChallenge(challenge._id, ids);
      if (res.success) {
        onSuccess?.(res.challenge);
        onClose();
      } else {
        setError(res.error || "Failed to join challenge");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Habits that are suggested vs. all others
  const suggestedIds = new Set(suggestions.map((s) => s.habitId));
  const nonSuggestedHabits = allHabits.filter((h) => !suggestedIds.has(h._id));

  const matchModeLabel = {
    single: "Select one habit to track",
    any: "Select habits — completing any counts",
    all: "Select habits — must complete all daily",
    minimum: `Select habits — must complete ${challenge.habitMatchMinimum || "N"} daily`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/20 shadow-xl max-h-[85vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-primary)]/10">
          <div>
            <h2 className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">
              Join Challenge
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">
              {challenge.title}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors">
            <Cross2Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* challenge info */}
          {challenge.habitSlot && (
            <div className="p-3 rounded-xl bg-[var(--color-brand-600)]/5 border border-[var(--color-brand-600)]/10">
              <p className="text-xs font-spartan font-medium text-[var(--color-brand-600)]">
                Looking for: {challenge.habitSlot}
              </p>
            </div>
          )}

          {/* match mode hint */}
          <p className="text-xs font-spartan text-[var(--color-text-secondary)]">
            {matchModeLabel[challenge.habitMatchMode || "single"]}
          </p>

          {/* loading state */}
          {suggesting && (
            <div className="space-y-2">
              <div className="h-12 bg-[var(--color-surface-hover)] rounded-xl animate-pulse" />
              <div className="h-12 bg-[var(--color-surface-hover)] rounded-xl animate-pulse" />
            </div>
          )}

          {/* Suggested habits */}
          {!suggesting && suggestions.length > 0 && (
            <div>
              <p className="text-xs font-spartan font-semibold text-[var(--color-text-secondary)] mb-2">
                ✨ Suggested Habits
              </p>
              <ul className="space-y-2">
                {suggestions.map((s) => {
                  const habit = allHabits.find((h) => h._id === s.habitId);
                  if (!habit) return null;
                  const isSelected = selectedIds.has(s.habitId);

                  return (
                    <li key={s.habitId}>
                      <button
                        onClick={() => toggleHabit(s.habitId)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          isSelected
                            ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)]/5"
                            : "border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[var(--color-brand-600)] border-[var(--color-brand-600)]"
                              : "border-[var(--color-border-primary)]/30"
                          }`}>
                            {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{habit.icon || "📋"}</span>
                              <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)] truncate">
                                {habit.name}
                              </p>
                              <span className="text-[10px] font-spartan font-medium px-1.5 py-0.5 rounded bg-[var(--color-brand-600)]/10 text-[var(--color-brand-600)]">
                                {s.score}%
                              </span>
                            </div>
                            {s.reason && (
                              <p className="text-[10px] text-[var(--color-text-tertiary)] font-spartan mt-0.5 truncate">
                                {s.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* All habits toggle */}
          {!suggesting && nonSuggestedHabits.length > 0 && (
            <div>
              <button
                onClick={() => setShowAllHabits((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-spartan font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {showAllHabits ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                {showAllHabits ? "Hide" : "Show"} all my habits ({nonSuggestedHabits.length})
              </button>

              {showAllHabits && (
                <ul className="space-y-2 mt-2">
                  {nonSuggestedHabits.map((h) => {
                    const isSelected = selectedIds.has(h._id);
                    return (
                      <li key={h._id}>
                        <button
                          onClick={() => toggleHabit(h._id)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${
                            isSelected
                              ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)]/5"
                              : "border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? "bg-[var(--color-brand-600)] border-[var(--color-brand-600)]"
                                : "border-[var(--color-border-primary)]/30"
                            }`}>
                              {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{h.icon || "📋"}</span>
                                <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)] truncate">
                                  {h.name}
                                </p>
                              </div>
                              {h.description && (
                                <p className="text-[10px] text-[var(--color-text-tertiary)] font-spartan mt-0.5 truncate">
                                  {h.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* No habits fallback */}
          {!suggesting && allHabits.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--color-text-tertiary)] font-spartan">
                You don't have any habits in this workspace yet. Create a habit first, then join the challenge.
              </p>
            </div>
          )}

          {/* selection summary */}
          {selectedIds.size > 0 && (
            <p className="text-xs font-spartan text-[var(--color-text-secondary)]">
              {selectedIds.size} habit{selectedIds.size !== 1 ? "s" : ""} selected
            </p>
          )}

          {error && <p className="text-xs text-red-500 font-spartan">{error}</p>}

          {/* actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 border border-[var(--color-border-primary)]/20 text-[var(--color-text-secondary)] rounded-xl text-sm font-spartan font-medium hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={loading || suggesting}
              className="flex-1 h-10 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] disabled:opacity-50 text-white rounded-xl text-sm font-spartan font-medium transition-colors"
            >
              {loading ? "Joining…" : "Join Challenge"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeJoinModal;
