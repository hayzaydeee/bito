import { useState, useEffect, useCallback } from "react";
import { X, Check, Warning, Sparkle } from "@phosphor-icons/react";
import { groupsAPI } from "../../services/api";
import AnimatedModal from "./AnimatedModal";
import HabitIcon from "../shared/HabitIcon";

const ChallengeJoinModal = ({ isOpen, challenge, onClose, onSuccess, mode = "join", initialHabitIds = [] }) => {
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allHabits, setAllHabits] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
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
        if (mode !== "relink") {
          const preSelected = new Set();
          (res.suggestions || []).forEach((s) => { if (s.score >= 70) preSelected.add(s.habitId); });
          if (isSingleMode && preSelected.size > 1) { const top = [...preSelected][0]; preSelected.clear(); preSelected.add(top); }
          setSelectedIds(preSelected);
        }
      }
    } catch {
      setSuggestions([]);
    } finally {
      setSuggesting(false);
    }
  }, [challenge?._id, isSingleMode, mode]);

  useEffect(() => {
    if (isOpen && challenge) {
      setSelectedIds(mode === "relink" && initialHabitIds.length ? new Set(initialHabitIds) : new Set());
      setSuggestions([]);
      setAllHabits([]);
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
      if (next.has(habitId)) { next.delete(habitId); }
      else { if (isSingleMode) next.clear(); next.add(habitId); }
      return next;
    });
  };

  const handleJoin = async () => {
    const matchMode = challenge.habitMatchMode || "single";
    if (matchMode === "all" || matchMode === "any") {
      if (selectedIds.size === 0) return setError("Please select at least one habit");
    }
    if (matchMode === "minimum" && challenge.habitMatchMinimum) {
      if (selectedIds.size < challenge.habitMatchMinimum)
        return setError(`Please select at least ${challenge.habitMatchMinimum} habit(s)`);
    }
    setLoading(true);
    setError("");
    try {
      const ids = [...selectedIds];
      if (mode === "relink") {
        await groupsAPI.updateParticipantHabits(challenge._id, ids);
        onSuccess?.();
        onClose();
        return;
      }
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

  const handleDismissWarnings = () => { onSuccess?.(pendingChallenge); onClose(); };

  const suggestedIds = new Set(suggestions.map((s) => s.habitId));
  const suggestedHabits = suggestions.map((s) => allHabits.find((h) => h._id === s.habitId)).filter(Boolean);
  const nonSuggestedHabits = allHabits.filter((h) => !suggestedIds.has(h._id));

  const initialSet = new Set(initialHabitIds);
  const currentlyTrackingNames = mode === "relink" && allHabits.length > 0
    ? initialHabitIds.map((id) => allHabits.find((h) => h._id === id)?.name).filter(Boolean)
    : [];

  const selectionChanged = mode === "relink" && (
    selectedIds.size !== initialSet.size ||
    [...selectedIds].some((id) => !initialSet.has(id))
  );

  const matchModeLabel = {
    single: isSingleMode ? "Choose one habit to track your progress" : "",
    any: "Completing any linked habit counts each day",
    all: "All linked habits must be completed each day",
    minimum: `Complete at least ${challenge.habitMatchMinimum || "N"} linked habits each day`,
  }[challenge.habitMatchMode || "single"];

  const HabitRow = ({ habit, score, reason, isInitial }) => {
    const isSelected = selectedIds.has(habit._id);
    const isCurrentTracker = isInitial && mode === "relink";
    return (
      <button
        onClick={() => toggleHabit(habit._id)}
        className={`w-full text-left p-3 rounded-[12px] border transition-colors ${
          isSelected
            ? "border-[var(--signal)] bg-[var(--signal)]/5"
            : "border-[var(--line-2)] hover:border-[var(--line-3)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected ? "bg-[var(--signal)] border-[var(--signal)]" : "border-[var(--line-2)]"
          }`}>
            {isSelected && <Check size={12} weight="bold" className="text-white" />}
          </div>
          <HabitIcon icon={habit.icon || "ClipboardText"} size={16} />
          <div className="flex-1 min-w-0">
            <p className="grp-mono text-sm font-medium text-[var(--ink)] truncate">{habit.name}</p>
            {reason && <p className="grp-mono text-[10px] text-[var(--ink-3)] mt-0.5 truncate">{reason}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {score && (
              <span className="grp-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--signal)]/10 text-[var(--signal)]">
                {score}%
              </span>
            )}
            {isCurrentTracker && !selectionChanged && (
              <span className="grp-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-3)]">
                tracking
              </span>
            )}
            {isCurrentTracker && selectionChanged && !isSelected && (
              <span className="grp-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--ember)]/10 text-[var(--ember)]">
                was tracking
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="grp relative w-full bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] px-6 pt-5 pb-3 border-b border-[var(--line-2)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="grp-kicker">{mode === "relink" ? "Change Habit" : "Join Challenge"}</p>
              <h2 className="grp-display text-xl font-bold text-[var(--ink)]">
                {mode === "relink" ? "Update Your Habit" : challenge.title}
              </h2>
              {mode === "join" && (
                <p className="grp-mono text-xs text-[var(--ink-3)] mt-0.5">{matchModeLabel}</p>
              )}
            </div>
            <button onClick={onClose} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors mt-0.5">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Currently tracking callout (relink mode) */}
          {mode === "relink" && currentlyTrackingNames.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-[var(--signal)]/5 border border-[var(--signal)]/20">
              <p className="grp-mono text-[10px] text-[var(--signal)] font-medium flex-1">
                Currently tracking:{" "}
                <span className="text-[var(--ink-2)]">
                  {currentlyTrackingNames.map((n) => `"${n}"`).join(", ")}
                </span>
              </p>
              {selectionChanged && (
                <span className="grp-mono text-[9px] font-bold uppercase tracking-wider text-[var(--ember)]">
                  Changing
                </span>
              )}
            </div>
          )}

          {/* Habit slot hint */}
          {challenge.habitSlot && (
            <div className="px-3 py-2 rounded-[10px] bg-[var(--bg-2)] border border-[var(--line-2)]">
              <p className="grp-mono text-[10px] text-[var(--ink-2)]">
                Looking for: <span className="text-[var(--ink)]">{challenge.habitSlot}</span>
              </p>
            </div>
          )}

          {/* AI loading hint */}
          {suggesting && (
            <p className="grp-mono text-[10px] text-[var(--ink-3)] animate-pulse flex items-center gap-1.5">
              <Sparkle size={10} weight="fill" className="text-[var(--signal)]" />
              Finding best matches…
            </p>
          )}

          {/* No habits fallback */}
          {!suggesting && allHabits.length === 0 && (
            <p className="grp-mono text-sm text-[var(--ink-3)] text-center py-6">
              No habits yet — create one first, then come back.
            </p>
          )}

          {/* Suggested habits */}
          {!suggesting && suggestedHabits.length > 0 && (
            <div>
              <p className="grp-kicker mb-2 flex items-center gap-1">
                <Sparkle size={10} weight="fill" className="text-[var(--signal)]" />
                Suggested
              </p>
              <div className="space-y-2">
                {suggestions.map((s) => {
                  const habit = allHabits.find((h) => h._id === s.habitId);
                  if (!habit) return null;
                  return (
                    <HabitRow
                      key={s.habitId}
                      habit={habit}
                      score={s.score}
                      reason={s.reason}
                      isInitial={initialSet.has(s.habitId)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* All other habits */}
          {!suggesting && nonSuggestedHabits.length > 0 && (
            <div>
              {suggestedHabits.length > 0 && <p className="grp-kicker mb-2">All habits</p>}
              <div className="space-y-2">
                {nonSuggestedHabits.map((h) => (
                  <HabitRow
                    key={h._id}
                    habit={h}
                    isInitial={initialSet.has(h._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Compatibility warning panel */}
          {compatibilityWarnings.length > 0 && (
            <div className="rounded-[12px] border border-[var(--ember)]/30 bg-[var(--ember)]/5 p-4 space-y-3">
              <p className="grp-mono text-xs font-semibold text-[var(--ember)] flex items-center gap-1.5">
                <Warning size={14} weight="fill" />
                Habit compatibility notice
              </p>
              <ul className="space-y-1.5">
                {compatibilityWarnings.map((w, i) => (
                  <li key={i} className="grp-mono text-[11px] text-[var(--ink-2)] leading-snug">{w.message}</li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setCompatibilityWarnings([]); setPendingChallenge(null); }}
                  className="grp-btn flex-1 justify-center"
                >
                  Go back
                </button>
                <button onClick={handleDismissWarnings} className="grp-btn flex-1 justify-center" style={{ background: "var(--ember)", color: "#fff", borderColor: "transparent" }}>
                  Join anyway
                </button>
              </div>
            </div>
          )}

          {error && <p className="grp-mono text-[11px] text-[var(--rose)]">{error}</p>}
        </div>

        {/* Footer */}
        {!compatibilityWarnings.length && (
          <div className="sticky bottom-0 bg-[var(--surface)] px-6 py-4 border-t border-[var(--line-2)]">
            <div className="flex gap-3">
              <button type="button" className="grp-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJoin}
                disabled={loading || (!suggesting && allHabits.length === 0)}
                className="grp-btn grp-btn--signal flex-1 justify-center gap-2 disabled:opacity-40"
              >
                <Check size={16} />
                {loading
                  ? (mode === "relink" ? "Saving…" : "Joining…")
                  : (mode === "relink"
                    ? (selectionChanged ? "Update Habit" : "Keep Habit")
                    : "Join Challenge"
                  )
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatedModal>
  );
};

export default ChallengeJoinModal;
