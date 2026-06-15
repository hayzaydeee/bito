import { useState, useRef, useEffect } from "react";
import {
  PaperPlaneIcon,
  ReloadIcon,
  PersonIcon,
  MagicWandIcon,
  FileTextIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import HabitIcon from "../shared/HabitIcon";

/**
 * RefinementChat — chat panel for the conversational refinement studio.
 * Warm-conversational DRILL re-skin: soft chat bubbles kept (signal-filled
 * for the user, hairline surface for the assistant), with serif headings,
 * mono meta, and signal accents replacing the old brand/green palette.
 * Calls onSend(message) on submit, onToggleArtifact() to open/close the plan.
 */
const RefinementChat = ({
  refinements = [],
  turnsRemaining = 5,
  onSend,
  isSending = false,
  planName = "Plan",
  planIcon = "Target",
  onToggleArtifact,
  isArtifactOpen = false,
  userAvatar,
  mutations = [],
  isActive = false,
}) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [refinements.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isSending || turnsRemaining <= 0) return;
    onSend(msg);
    setInput("");
  };

  // Build display messages from refinements
  const messages = refinements.map((r, i) => ({
    id: i,
    role: r.role,
    content: r.message,
    timestamp: r.timestamp,
  }));

  const suggestions = isActive
    ? [
        "This feels too ambitious right now",
        "Add a new habit to my routine",
        "One of my habits isn't working",
        "Adjust my schedule for this week",
      ]
    : [
        "Make Phase 1 easier",
        "Add a meditation habit",
        "Reduce to 2 phases",
        "Swap a habit for something more social",
      ];

  const mutationLabels = {
    modifyHabit: "• Updated",
    addHabit: "+ Created",
    removeHabit: "− Archived",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages area — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[var(--signal)]/15 flex items-center justify-center">
              <MagicWandIcon className="w-7 h-7 text-[var(--signal)]" />
            </div>
            <div>
              <p className="std-display text-lg font-bold text-[var(--ink)]">
                Refine your plan
              </p>
              <p className="text-sm text-[var(--ink-2)] mt-1.5 max-w-[280px] leading-relaxed">
                Tell me what to change — add habits, adjust difficulty, restructure phases, or anything else.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2.5 max-w-[380px]">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2 rounded-full text-sm text-[var(--ink-2)] border border-[var(--line-2)] hover:text-[var(--ink)] hover:border-[var(--signal)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={`flex gap-2.5 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--signal)]/15 flex items-center justify-center mt-0.5">
                  <MagicWandIcon className="w-4 h-4 text-[var(--signal)]" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--signal)] text-[var(--signal-ink)] rounded-br-md"
                    : "bg-[var(--surface)] text-[var(--ink)] rounded-bl-md border border-[var(--line-2)]"
                }`}
              >
                {msg.content}
              </div>

              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--line-2)] flex items-center justify-center mt-0.5 overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PersonIcon className="w-4 h-4 text-[var(--ink-2)]" />
                  )}
                </div>
              )}
            </div>

            {/* Inline artifact card — after assistant messages */}
            {msg.role === "assistant" && (
              <div className="ml-10 mt-2.5">
                <button
                  onClick={onToggleArtifact}
                  className={`w-full max-w-[300px] flex items-center gap-3 px-4 py-3 rounded-[var(--r-btn)] border transition-all text-left group ${
                    isArtifactOpen
                      ? "border-[var(--signal)]/40 bg-[var(--signal)]/10"
                      : "border-[var(--line-2)] bg-[var(--surface)] hover:border-[var(--signal)]/40 hover:bg-[var(--signal)]/5"
                  }`}
                >
                  <div className="w-9 h-9 rounded-[var(--r-tag)] bg-[var(--signal)]/15 flex items-center justify-center flex-shrink-0">
                    <FileTextIcon className="w-4.5 h-4.5 text-[var(--signal)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate flex items-center gap-1.5">
                      <HabitIcon icon={planIcon} size={14} />
                      {planName}
                    </p>
                    <p className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)] mt-0.5">
                      Plan · Updated
                    </p>
                  </div>
                  <ChevronRightIcon
                    className={`w-4 h-4 text-[var(--ink-3)] transition-transform ${
                      isArtifactOpen ? "rotate-180" : "group-hover:translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Habit mutation feedback — shown after active-mode refinements */}
        {mutations.length > 0 && !isSending && (
          <div className="ml-10 space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
            <p className="std-kicker">Habits updated</p>
            {mutations.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-tag)] bg-[var(--signal)]/10 border border-[var(--signal)]/20 text-sm"
              >
                <span className="std-mono text-[11px] text-[var(--signal)]">
                  {mutationLabels[m.action] || "•"}
                </span>
                <span className="text-[var(--ink)]">
                  {m.habitName || m.name || "Habit"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-2.5 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--signal)]/15 flex items-center justify-center">
              <MagicWandIcon className="w-4 h-4 text-[var(--signal)]" />
            </div>
            <div className="bg-[var(--surface-2)] rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-3)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-3)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-3)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar — fixed at bottom */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--line-2)] bg-[var(--surface)]/50">
        {turnsRemaining <= 0 ? (
          <p className="text-sm text-[var(--ink-2)] text-center py-2">
            No refinement turns remaining. Apply the plan or regenerate.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              placeholder="Describe what to change..."
              className="flex-1 h-11 px-4 rounded-[var(--r-btn)] bg-[var(--bg-2)] border border-[var(--line-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] outline-none focus:border-[var(--signal)] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="h-11 w-11 rounded-[var(--r-btn)] bg-[var(--signal)] hover:bg-[var(--signal-2)] text-[var(--signal-ink)] flex items-center justify-center transition-all disabled:opacity-30"
            >
              {isSending ? (
                <ReloadIcon className="w-4 h-4 animate-spin" />
              ) : (
                <PaperPlaneIcon className="w-4 h-4" />
              )}
            </button>
          </form>
        )}
        <p className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)] text-center mt-2">
          {turnsRemaining} refinement{turnsRemaining !== 1 ? "s" : ""} remaining
        </p>
      </div>
    </div>
  );
};

export default RefinementChat;
