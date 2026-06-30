import { Target, CalendarBlank, User, Star, CheckCircle } from "@phosphor-icons/react";

const GroupChallengesWidget = ({
  challenges,
  onCreateChallenge,
  className = "",
  ...props
}) => {
  const statusTheme = (status) => {
    switch (status) {
      case "active":    return { color: "var(--color-brand-600)", bg: "color-mix(in srgb, var(--color-brand-600) 10%, transparent)" };
      case "completed": return { color: "var(--color-success-600, #16a34a)", bg: "color-mix(in srgb, var(--color-success-600, #16a34a) 10%, transparent)" };
      case "upcoming":  return { color: "var(--color-warning-600, #d97706)", bg: "color-mix(in srgb, var(--color-warning-600, #d97706) 10%, transparent)" };
      default:          return { color: "var(--color-text-tertiary)", bg: "color-mix(in srgb, var(--color-text-tertiary) 10%, transparent)" };
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className={`bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-2xl p-6 ${className}`}>
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
            <Target size={20} weight="duotone" className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            Group Challenges
          </h3>
        </div>
        {onCreateChallenge && (
          <button
            onClick={onCreateChallenge}
            className="px-3 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-xl font-medium text-sm transition-colors"
          >
            Create
          </button>
        )}
      </div>

      {!challenges || challenges.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-3">
            <Target size={24} weight="duotone" className="text-[var(--color-text-tertiary)]" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            No challenges yet
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Create the first team challenge!
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {challenges
            .filter((c) => c && c._id)
            .slice(0, 4)
            .map((challenge, index) => {
              const progress = challenge.stats?.averageProgress || 0;
              const target = challenge.rules?.targetValue || 100;
              const pct = Math.min(100, Math.round((progress / target) * 100));
              const theme = statusTheme(challenge.status);

              return (
                <div
                  key={challenge._id || `challenge-${index}`}
                  className="p-4 rounded-xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  {/* header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
                        {challenge.title || "Untitled Challenge"}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-lg text-xs font-medium"
                          style={{ color: theme.color, background: theme.bg }}
                        >
                          {challenge.status || "pending"}
                        </span>
                        {challenge.startDate && challenge.endDate && (
                          <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                            <CalendarBlank size={12} weight="duotone" />
                            {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}
                          </div>
                        )}
                      </div>
                    </div>

                    {challenge.prize && (
                      <div className="flex items-center gap-1">
                        <Star size={16} weight="duotone" className="text-[var(--color-warning-500,#f59e0b)]" />
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">
                          {challenge.prize}
                        </span>
                      </div>
                    )}
                  </div>

                  {challenge.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                      {challenge.description}
                    </p>
                  )}

                  {/* progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Progress
                      </span>
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        {progress}/{target}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-hover)] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* footer row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <User size={14} weight="duotone" className="text-[var(--color-text-tertiary)]" />
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {challenge.participants?.length || 0} participants
                      </span>
                    </div>

                    {challenge.winner && (
                      <div className="flex items-center gap-1">
                        <CheckCircle size={14} weight="duotone" className="text-[var(--color-success-600,#16a34a)]" />
                        <span className="text-xs font-medium text-[var(--color-success-600,#16a34a)]">
                          {challenge.winner}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          {challenges.length > 4 && (
            <div className="text-center pt-2">
              <button className="text-sm text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] font-medium">
                View {challenges.length - 4} more challenges
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupChallengesWidget;
