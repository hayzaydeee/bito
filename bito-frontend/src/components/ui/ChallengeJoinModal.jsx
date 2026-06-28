import { useState, useEffect, useCallback } from "react";
import { X, CaretDown, CaretUp, Check, Warning } from "@phosphor-icons/react";
import { groupsAPI } from "../../services/api";
import AnimatedModal from "./AnimatedModal";
import HabitIcon from "../shared/HabitIcon";

const ChallengeJoinModal = ({ isOpen, challenge, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(true);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allHabits, setAllHabits] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState([]);
  const [pendingChallenge, setPendingChallenge] = useState(null);

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

        const preSelected = new Set();
        (res.suggestions || []).forEach((s) => {
          if (s.score >= 70) preSelected.add(s.habitId);
        });

        if (isSingleMode && preSelected.size > 1) {
          const top = [...preSelected][0];
          preSelected.clear();
          preSelected.add(top);
        }

        setSelectedIds(preSelected);
      }
    } catch {
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
      setCompatibilityWarnings([]);
      setPendingChallenge(null);
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
        if (isSingleMode) next.clear();
        next.add(habitId);
      }
      return next;
    });
  };

  const handleJoin = async () => {
    const mode = challenge.habitMatchMode || "single";
    if (mode === "all" || mode === "any") {
      if (selectedIds.size === 0) return setError("Please select at least one habit");
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
        if (res.compatibilityWarnings?.length) {
          setCompatibilityWarnings(res.compatibilityWarnings);
          setPendingChallenge(res.challenge);
        } else {
          onSuccess?.(res.challenge);
          onClose();
        }
      } else {
        setError(res.error || "Failed to join challenge");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDismissWarnings = () => {
    onSuccess?.(pendingChallenge);
    onClose();
  };

  const suggestedIds = new Set(suggestions.map((s) => s.habitId));
  const nonSuggestedHabits = allHabits.filter((h) => !suggestedIds.has(h._id));

  const matchModeLabel = {
    single: "Select one habit to track",
    any: "Select habits — completing any counts",
    all: "Select habits — must complete all daily",
    minimum: `Select habits — must complete ${challenge.habitMatchMinimum || "N"} daily`,
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="grp relative w-full bg-[var(--surface)] rounded-2xl border border-[var(--line)]/20 max-h-[85vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)]/10">
          <div>
            <h2 className="grp-display text-lg font-bold text-[var(--ink)]">Join Challenge</h2>
            <p className="grp-mono text-xs text-[var(--ink-3)] mt-0.5">{challenge.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
          >
            <X size={16} className="text-[var(--ink-2)]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* challenge info */}
          {challenge.habitSlot && (
            <div className="p-3 rounded-xl bg-[var(--signal)]/5 border border-[var(--signal)]/10">
              <p className="grp-mono text-xs font-medium text-[var(--signal)]">
                Looking for: {challenge.habitSlot}
              </p>
            </div>
          )}

          {/* match mode hint */}
          <p className="grp-mono text-xs text-[var(--ink-2)]">
            {matchModeLabel[challenge.habitMatchMode || "single"]}
          </p>

          {/* loading state */}
          {suggesting && (
            <div className="space-y-2">
              <div className="h-12 bg-[var(--surface-2)] rounded-xl animate-pulse" />
              <div className="h-12 bg-[var(--surface-2)] rounded-xl animate-pulse" />
            </div>
          )}

          {/* Suggested habits */}
          {!suggesting && suggestions.length > 0 && (
            <div>
              <p className="grp-mono text-xs font-semibold text-[var(--ink-2)] mb-2">
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
                            ? "border-[var(--signal)] bg-[var(--signal)]/5"
                            : "border-[var(--line)]/20 hover:border-[var(--line)]/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[var(--signal)] border-[var(--signal)]"
                              : "border-[var(--line)]/30"
                          }`}>
                            {isSelected && <Check size={14} weight="bold" className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <HabitIcon icon={habit.icon || "ClipboardText"} size={16} />
                              <p className="grp-mono text-sm font-medium text-[var(--ink)] truncate">
                                {habit.name}
                              </p>
                              <span className="grp-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--signal)]/10 text-[var(--signal)]">
                                {s.score}%
                              </span>
                            </div>
                            {s.reason && (
                              <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5 truncate">
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
                className="flex items-center gap-1.5 grp-mono text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
              >
                {showAllHabits ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
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
                              ? "border-[var(--signal)] bg-[var(--signal)]/5"
                              : "border-[var(--line)]/20 hover:border-[var(--line)]/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? "bg-[var(--signal)] border-[var(--signal)]"
                                : "border-[var(--line)]/30"
                            }`}>
                              {isSelected && <Check size={14} weight="bold" className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <HabitIcon icon={h.icon || "ClipboardText"} size={16} />
                                <p className="grp-mono text-sm font-medium text-[var(--ink)] truncate">
                                  {h.name}
                                </p>
                              </div>
                              {h.description && (
                                <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5 truncate">
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
              <p className="grp-mono text-sm text-[var(--ink-3)]">
                You don't have any habits in this group yet. Create a habit first, then join the challenge.
              </p>
            </div>
          )}

          {/* selection summary */}
          {selectedIds.size > 0 && (
            <p className="grp-mono text-xs text-[var(--ink-2)]">
              {selectedIds.size} habit{selectedIds.size !== 1 ? "s" : ""} selected
            </p>
          )}

          {error && <p className="grp-mono text-xs text-[var(--rose,#e11d48)]">{error}</p>}

          {/* Compatibility warning panel */}
          {compatibilityWarnings.length > 0 && (
            <div className="rounded-xl border border-[var(--ember)]/30 bg-[var(--ember)]/5 p-4 space-y-3">
              <p className="grp-mono text-xs font-semibold text-[var(--ember)] flex items-center gap-1.5">
                <Warning size={14} weight="fill" />
                Habit compatibility notice
              </p>
              <ul className="space-y-1.5">
                {compatibilityWarnings.map((w, i) => (
                  <li key={i} className="grp-mono text-[11px] text-[var(--ink-2)] leading-snug">
                    {w.message}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setCompatibilityWarnings([]); setPendingChallenge(null); }}
                  className="flex-1 h-9 border border-[var(--line)]/20 text-[var(--ink-2)] rounded-lg grp-mono text-xs font-medium hover:bg-[var(--surface-2)] transition-colors"
                >
                  Go back
                </button>
                <button
                  onClick={handleDismissWarnings}
                  className="flex-1 h-9 bg-[var(--ember)] hover:opacity-90 text-white rounded-lg grp-mono text-xs font-semibold transition-colors"
                >
                  Join anyway
                </button>
              </div>
            </div>
          )}

          {/* actions */}
          {!compatibilityWarnings.length && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 border border-[var(--line)]/20 text-[var(--ink-2)] rounded-xl grp-mono text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={loading || suggesting}
              className="flex-1 h-10 bg-[var(--signal)] hover:bg-[var(--signal-2)] disabled:opacity-50 text-white rounded-xl grp-mono text-sm font-medium transition-colors"
            >
              {loading ? "Joining…" : "Join Challenge"}
            </button>
          </div>
          )}
        </div>
      </div>
    </AnimatedModal>
  );
};

export default ChallengeJoinModal;
