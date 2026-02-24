import { useState, useRef, useEffect } from "react";
import {
  PaperPlaneIcon,
  ReloadIcon,
  PersonIcon,
  MagicWandIcon,
} from "@radix-ui/react-icons";

/**
 * RefinementChat — chat panel for the conversational refinement studio.
 * Shows message history + input bar. Calls onSend(message) when user submits.
 */
const RefinementChat = ({
  refinements = [],
  turnsRemaining = 5,
  onSend,
  isSending = false,
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

  const suggestions = [
    "Make Phase 1 easier",
    "Add a meditation habit",
    "Reduce to 2 phases",
    "Swap a habit for something more social",
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages area — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-brand-500)]/10 flex items-center justify-center">
              <MagicWandIcon className="w-6 h-6 text-[var(--color-brand-500)]" />
            </div>
            <div>
              <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)]">
                Refine Your Plan
              </p>
              <p className="text-xs font-spartan text-[var(--color-text-tertiary)] mt-1 max-w-[240px]">
                Tell me what to change — add habits, adjust difficulty, restructure phases, or anything else.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-[300px]">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-spartan text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-brand-500)]/10 flex items-center justify-center mt-0.5">
                <MagicWandIcon className="w-3.5 h-3.5 text-[var(--color-brand-500)]" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-spartan ${
                msg.role === "user"
                  ? "bg-[var(--color-brand-600)] text-white rounded-br-md"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>

            {msg.role === "user" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mt-0.5">
                <PersonIcon className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-2.5 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-brand-500)]/10 flex items-center justify-center">
              <MagicWandIcon className="w-3.5 h-3.5 text-[var(--color-brand-500)]" />
            </div>
            <div className="bg-[var(--color-surface-hover)] rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar — fixed at bottom */}
      <div className="flex-shrink-0 p-3 border-t border-[var(--color-border-primary)]/20 bg-[var(--color-bg-primary)]">
        {turnsRemaining <= 0 ? (
          <p className="text-xs font-spartan text-[var(--color-text-tertiary)] text-center py-2">
            No refinement turns remaining. Apply the plan or regenerate.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              placeholder="Describe what to change..."
              className="flex-1 h-10 px-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-brand-500)]/50 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="h-10 w-10 rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white flex items-center justify-center transition-all disabled:opacity-30"
            >
              {isSending ? (
                <ReloadIcon className="w-4 h-4 animate-spin" />
              ) : (
                <PaperPlaneIcon className="w-4 h-4" />
              )}
            </button>
          </form>
        )}
        <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)] text-center mt-1.5">
          {turnsRemaining} refinement{turnsRemaining !== 1 ? "s" : ""} remaining
        </p>
      </div>
    </div>
  );
};

export default RefinementChat;
