import React, { memo } from 'react';
import { useAnalyticsInsights } from '../../globalHooks/useAnalyticsInsights';

/* ---------------------------------------------------------------------
   AnalyticsInsights - comprehensive AI-powered analytics section.
   Renders structured sections: Summary, Patterns, Trends, Correlations,
   Recommendations.  Falls back to rule-based insights when LLM is off.
   --------------------------------------------------------------------- */

/* -- Section wrapper ------------------------------------------------- */
const Section = ({ title, icon, children, accent }) => (
  <div className="analytics-section">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <h4
        className="text-sm font-spartan font-semibold uppercase tracking-wider"
        style={{ color: accent || 'var(--color-text-secondary)' }}
      >
        {title}
      </h4>
    </div>
    {children}
  </div>
);

/* -- Insight card ---------------------------------------------------- */
const InsightCard = ({ item, accentVar }) => {
  let borderColor = 'var(--color-brand-400)';
  if (item.sentiment === 'positive' || item.direction === 'up') borderColor = 'var(--color-success)';
  if (item.sentiment === 'negative' || item.direction === 'down') borderColor = 'var(--color-warning)';
  if (item.priority === 'high') borderColor = 'var(--color-warning)';
  if (accentVar) borderColor = accentVar;

  return (
    <div
      className="analytics-insight-card p-3 rounded-lg border-l-[3px] bg-[var(--color-surface-elevated)] transition-all duration-200 hover:translate-x-0.5"
      style={{ borderLeftColor: borderColor }}
    >
      <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)] mb-0.5">
        {item.icon && <span className="mr-1.5">{item.icon}</span>}
        {item.title}
      </p>
      <p className="text-xs font-spartan text-[var(--color-text-secondary)] leading-relaxed">
        {item.body}
      </p>
    </div>
  );
};

/* -- Direction badge for trends -------------------------------------- */
const TrendBadge = ({ direction }) => {
  const config = {
    up:     { label: 'Rising',  bg: 'rgba(34,197,94,0.12)',  color: 'var(--color-success)' },
    down:   { label: 'Falling', bg: 'rgba(239,68,68,0.12)',  color: 'var(--color-warning)' },
    stable: { label: 'Stable',  bg: 'rgba(99,102,241,0.12)', color: 'var(--color-brand-400)' },
  };
  const c = config[direction] || config.stable;
  return (
    <span
      className="inline-block text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full ml-2"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
};

/* -- Priority badge for recommendations ------------------------------ */
const PriorityBadge = ({ priority }) => {
  const config = {
    high:   { label: 'High',   bg: 'rgba(239,68,68,0.12)',   color: 'var(--color-warning)' },
    medium: { label: 'Medium', bg: 'rgba(234,179,8,0.12)',   color: '#ca8a04' },
    low:    { label: 'Low',    bg: 'rgba(99,102,241,0.12)',  color: 'var(--color-brand-400)' },
  };
  const c = config[priority] || config.medium;
  return (
    <span
      className="inline-block text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full ml-2"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
};

/* -- Loading skeleton ------------------------------------------------ */
const Skeleton = () => (
  <div className="card p-5 space-y-5 animate-pulse">
    <div className="h-5 bg-[var(--color-surface-elevated)] rounded w-48" />
    <div className="space-y-2">
      <div className="h-3 bg-[var(--color-surface-elevated)] rounded w-full" />
      <div className="h-3 bg-[var(--color-surface-elevated)] rounded w-3/4" />
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-[var(--color-surface-elevated)] rounded-lg" />
      ))}
    </div>
  </div>
);

/* -- Main component -------------------------------------------------- */
const AnalyticsInsights = memo(({ habits, entries, timeRange }) => {
  const apiRange = timeRange === 'all' ? 'all' : timeRange;
  const { sections, llmUsed, isLoading, error, refresh, generatedAt, tier, entryCount, thresholds } = useAnalyticsInsights(apiRange);

  if (isLoading) return <Skeleton />;

  /* -- Seedling empty-state ---------------------------------------- */
  if (tier === 'seedling') {
    const target = thresholds?.sprouting ?? 7;
    const pct = Math.min(100, Math.round(((entryCount ?? 0) / target) * 100));
    const remaining = Math.max(0, target - (entryCount ?? 0));

    return (
      <div className="card p-5 text-center space-y-4">
        <span className="text-3xl">🌱</span>
        <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">
          Building Your Data
        </h3>
        <p className="text-sm font-spartan text-[var(--color-text-secondary)] max-w-md mx-auto">
          Track {remaining} more {remaining === 1 ? 'entry' : 'entries'} to unlock AI-powered analytics.
          Keep logging your habits — insights get smarter with more data!
        </p>
        <div className="max-w-xs mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-spartan font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Progress
            </span>
            <span className="text-[10px] font-spartan text-[var(--color-text-muted)]">
              {entryCount ?? 0}/{target}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--color-brand-400), var(--color-brand-500, #7c3aed))',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !sections) {
    return (
      <div className="card p-5">
        <p className="text-sm font-spartan text-[var(--color-text-muted)]">
          Unable to load insights.{' '}
          <button onClick={refresh} className="underline hover:text-[var(--color-brand-400)]">
            Retry
          </button>
        </p>
      </div>
    );
  }

  const { summary, patterns, trends, correlations, recommendations } = sections;
  const hasContent = summary || patterns?.length || trends?.length || correlations?.length || recommendations?.length;

  if (!hasContent) return null;

  return (
    <div className="analytics-insights-panel space-y-5">
      {/* -- Header --------------------------------------------------- */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">
            AI Insights
          </h3>
          {llmUsed && (
            <span
              className="text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--color-brand-400)',
              }}
            >
              powered by OpenAI
            </span>
          )}
          {tier === 'sprouting' && (
            <span
              className="text-[10px] font-spartan font-medium px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(34,197,94,0.12)',
                color: 'var(--color-success)',
              }}
            >
              Early data
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          className="text-xs font-spartan text-[var(--color-text-muted)] hover:text-[var(--color-brand-400)] transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* -- Summary card (glassmorphic) ------------------------------ */}
      {summary && (
        <div
          className="glass-insight relative overflow-hidden rounded-2xl border p-5 transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(99,102,241,0.04) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'rgba(99,102,241,0.18)',
            boxShadow: '0 2px 12px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="glass-sheen pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 55%, transparent 60%)',
              backgroundSize: '200% 100%',
              backgroundPosition: '200% 0',
              transition: 'background-position 600ms ease',
            }}
          />
          <p className="text-sm font-spartan leading-relaxed relative z-10 text-[var(--color-text-secondary)]">
            {summary}
          </p>
        </div>
      )}

      {/* -- Sectioned panels ----------------------------------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Patterns */}
        {patterns?.length > 0 && (
          <Section title="Patterns" icon="🔍" accent="var(--color-brand-400)">
            <div className="space-y-2">
              {patterns.map((item, i) => (
                <InsightCard key={`p-${i}`} item={item} />
              ))}
            </div>
          </Section>
        )}

        {/* Trends */}
        {trends?.length > 0 && (
          <Section title="Trends" icon="📈" accent="var(--color-success)">
            <div className="space-y-2">
              {trends.map((item, i) => (
                <div key={`t-${i}`}>
                  <InsightCard item={item} />
                  {item.direction && (
                    <div className="mt-1 ml-3">
                      <TrendBadge direction={item.direction} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Correlations */}
        {correlations?.length > 0 && (
          <Section title="Correlations" icon="🔗" accent="#a78bfa">
            <div className="space-y-2">
              {correlations.map((item, i) => (
                <InsightCard key={`c-${i}`} item={item} accentVar="#a78bfa" />
              ))}
            </div>
          </Section>
        )}

        {/* Recommendations */}
        {recommendations?.length > 0 && (
          <Section title="Recommendations" icon="💡" accent="#ca8a04">
            <div className="space-y-2">
              {recommendations.map((item, i) => (
                <div key={`r-${i}`}>
                  <InsightCard item={item} />
                  {item.priority && (
                    <div className="mt-1 ml-3">
                      <PriorityBadge priority={item.priority} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* -- Footer --------------------------------------------------- */}
      {generatedAt && (
        <p className="text-[10px] font-spartan text-[var(--color-text-muted)] text-right">
          Generated {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
});

AnalyticsInsights.displayName = 'AnalyticsInsights';
export default AnalyticsInsights;
