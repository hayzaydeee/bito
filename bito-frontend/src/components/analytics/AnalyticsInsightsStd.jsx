import React, { memo, useCallback, useState } from 'react';
import { useAnalyticsInsights } from '../../globalHooks/useAnalyticsInsights';
import { insightsAPI } from '../../services/api';
import {
  MagnifyingGlass,
  TrendUp,
  ArrowsCounterClockwise,
  Lightbulb,
  Leaf,
} from '@phosphor-icons/react';

/* ─────────────────────────────────────────────────────────────────
   AnalyticsInsightsStd — "The Briefing" DRILL redesign.
   Architecture: used only by AnalyticsPageStd (Standard DS gate).
   Data hook + API are identical to AnalyticsInsights; only the
   presentation is replaced with DRILL editorial language.
───────────────────────────────────────────────────────────────── */

/* ── Section within the briefing ───────────────────────────── */
const BriefSection = ({ title, icon: Icon, accent, items, renderBadge }) => (
  <div className="px-6 py-5">
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={12} weight="duotone" style={{ color: accent, flexShrink: 0 }} />}
      <p className="std-kicker text-[10px]" style={{ color: accent }}>{title}</p>
    </div>
    <div>
      {items.map((item, i) => {
        let stripe = accent;
        if (item.sentiment === 'positive' || item.direction === 'up')   stripe = 'var(--signal)';
        if (item.sentiment === 'negative' || item.direction === 'down') stripe = 'var(--rose, #e11d48)';
        if (item.priority === 'high') stripe = 'var(--rose, #e11d48)';

        return (
          <div key={i} className="py-3 border-b border-[var(--line)] last:border-0 flex gap-3">
            <div
              className="w-0.5 self-stretch rounded-full flex-shrink-0"
              style={{ background: stripe }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--ink)] leading-snug font-medium">{item.title}</p>
              {item.body && (
                <p className="text-xs text-[var(--ink-2)] leading-relaxed mt-0.5">{item.body}</p>
              )}
              {renderBadge?.(item)}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const TrendBadgeStd = ({ direction }) => {
  const cfg = {
    up:     { label: '▲ Rising',  color: 'var(--signal)' },
    down:   { label: '▼ Falling', color: 'var(--rose, #e11d48)' },
    stable: { label: '— Stable',  color: 'var(--ink-3)' },
  };
  const c = cfg[direction] || cfg.stable;
  return (
    <span className="std-mono text-[10px] mt-1.5 inline-block" style={{ color: c.color }}>
      {c.label}
    </span>
  );
};

const PriorityBadgeStd = ({ priority }) => {
  const cfg = {
    high:   { label: '! High',   color: 'var(--rose, #e11d48)' },
    medium: { label: '· Medium', color: 'var(--ink-3)' },
    low:    { label: '· Low',    color: 'var(--ink-3)' },
  };
  const c = cfg[priority] || cfg.medium;
  return (
    <span className="std-mono text-[10px] mt-1.5 inline-block" style={{ color: c.color }}>
      {c.label}
    </span>
  );
};

/* ── Loading skeleton ─────────────────────────────────────── */
const Skeleton = () => (
  <div className="std-card border-l-2 border-l-[var(--signal)] overflow-hidden animate-pulse">
    <div className="px-6 py-5 border-b border-[var(--line)] space-y-2">
      <div className="h-3 bg-[var(--surface-2)] rounded w-20" />
      <div className="h-5 bg-[var(--surface-2)] rounded w-36" />
    </div>
    <div className="px-6 py-5 space-y-2">
      <div className="h-3 bg-[var(--surface-2)] rounded w-full" />
      <div className="h-3 bg-[var(--surface-2)] rounded w-3/4" />
    </div>
  </div>
);

/* ── Main ─────────────────────────────────────────────────── */
const AnalyticsInsightsStd = memo(({ timeRange }) => {
  const apiRange = timeRange === 'all' ? 'all' : timeRange;
  const { sections, llmUsed, isLoading, error, refresh, generatedAt, tier, entryCount, thresholds } =
    useAnalyticsInsights(apiRange);

  const [query, setQuery]             = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError]   = useState('');
  const [queryResult, setQueryResult] = useState(null);

  const runQuery = useCallback(async (forcedQuery) => {
    const q = (forcedQuery ?? query).trim();
    if (!q) return;
    try {
      setQueryLoading(true);
      setQueryError('');
      const res = await insightsAPI.queryAnalytics(q, apiRange);
      if (res.success) setQueryResult(res.data);
      else setQueryError(res.error || 'Unable to answer your analytics question right now.');
    } catch (err) {
      setQueryError(err.message || 'Unable to answer your analytics question right now.');
    } finally {
      setQueryLoading(false);
    }
  }, [apiRange, query]);

  if (isLoading) return <Skeleton />;

  /* ── Seedling ─────────────────────────────────────────── */
  if (tier === 'seedling') {
    const target    = thresholds?.sprouting ?? 7;
    const pct       = Math.min(100, Math.round(((entryCount ?? 0) / target) * 100));
    const remaining = Math.max(0, target - (entryCount ?? 0));
    return (
      <div className="std-card p-8 text-center space-y-5">
        <Leaf size={28} weight="duotone" className="mx-auto" style={{ color: 'var(--signal)' }} />
        <div>
          <p className="std-kicker text-[var(--ink-3)] mb-2">Signal Building</p>
          <p className="std-display text-2xl text-[var(--ink)]">Gathering Intelligence</p>
        </div>
        <p className="text-sm text-[var(--ink-2)] max-w-xs mx-auto leading-relaxed">
          Track {remaining} more {remaining === 1 ? 'entry' : 'entries'} to unlock AI-powered signal analysis.
        </p>
        <div className="max-w-xs mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <span className="std-kicker text-[10px] text-[var(--ink-3)]">Progress</span>
            <span className="std-mono text-[10px] text-[var(--ink-3)]">
              {entryCount ?? 0}/{target}
            </span>
          </div>
          <div className="h-px bg-[var(--line)] relative">
            <div
              className="absolute left-0 top-0 h-full bg-[var(--signal)] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !sections) {
    return (
      <div className="std-card p-5">
        <p className="std-mono text-xs text-[var(--ink-3)]">
          Unable to load signal.{' '}
          <button onClick={refresh} className="text-[var(--signal)] hover:underline">Retry</button>
        </p>
      </div>
    );
  }

  const { summary, patterns, trends, correlations, recommendations } = sections;
  const hasContent = summary || patterns?.length || trends?.length || correlations?.length || recommendations?.length;
  if (!hasContent) return null;

  const QUICK_QUERIES = [
    'Which habit is hurting my consistency?',
    'My strongest trend this period?',
    'One adjustment to improve next week?',
  ];

  return (
    <div className="std-card border-l-2 border-l-[var(--signal)] overflow-hidden">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-[var(--line)] flex items-start justify-between gap-3">
        <div>
          <p className="std-kicker text-[var(--signal)] mb-1">AI Signal</p>
          <div className="flex items-center gap-2">
            <h3 className="std-display text-lg text-[var(--ink)]">The Briefing</h3>
            {llmUsed && (
              <span className="std-mono text-[10px] text-[var(--ink-3)] border border-[var(--line)] px-1.5 py-0.5 rounded-[var(--r-pill)]">
                ⬡ AI
              </span>
            )}
            {tier === 'sprouting' && (
              <span className="std-mono text-[10px] px-1.5 py-0.5 rounded-[var(--r-pill)]"
                style={{ color: 'var(--signal)', border: '1px solid var(--signal)' }}>
                Early data
              </span>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          className="std-btn std-btn--sm flex-shrink-0 flex items-center gap-1.5"
          title="Refresh insights"
        >
          <ArrowsCounterClockwise size={13} />
          Refresh
        </button>
      </div>

      {/* ── Summary pull-quote ──────────────────────────── */}
      {summary && (
        <div className="px-6 py-5 border-b border-[var(--line)]">
          <div className="flex gap-3">
            <span
              className="std-display text-5xl leading-none flex-shrink-0"
              style={{ color: 'var(--signal)', marginTop: '-4px' }}
              aria-hidden
            >
              "
            </span>
            <p className="std-display text-base italic leading-relaxed text-[var(--ink-2)]">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* ── Query terminal ──────────────────────────────── */}
      <div className="px-6 py-4 border-b border-[var(--line)] space-y-3">
        <p className="std-kicker text-[10px] text-[var(--ink-3)]">Ask Your Data</p>

        <div className="flex items-center gap-2">
          <span className="std-mono text-sm text-[var(--signal)] flex-shrink-0 select-none">&gt;</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runQuery(); } }}
            placeholder="Why does my consistency drop on weekends?"
            className="flex-1 h-9 std-mono text-sm bg-transparent outline-none border-b border-[var(--line)] focus:border-[var(--signal)] transition-colors text-[var(--ink)] placeholder:text-[var(--ink-3)]"
          />
          <button
            onClick={() => runQuery()}
            disabled={queryLoading || !query.trim()}
            className="std-btn std-btn--signal std-btn--sm disabled:opacity-50"
          >
            {queryLoading ? '…' : 'Ask'}
          </button>
        </div>

        {/* Quick queries */}
        <div className="flex flex-wrap gap-2">
          {QUICK_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => { setQuery(q); runQuery(q); }}
              className="std-mono text-[10px] px-2.5 py-1 border border-[var(--line)] rounded-[var(--r-pill)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--signal)] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {queryError && (
          <p className="std-mono text-[11px]" style={{ color: 'var(--rose, #e11d48)' }}>
            {queryError}
          </p>
        )}

        {queryResult?.answer && (
          <div className="border-l-2 border-l-[var(--signal)] pl-4 py-1 space-y-3">
            <p className="text-sm text-[var(--ink-2)] leading-relaxed">{queryResult.answer}</p>

            {queryResult.habits?.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {queryResult.habits.slice(0, 4).map((h, idx) => (
                  <div key={`${h.name}-${idx}`} className="std-card p-3">
                    <p className="std-mono text-[11px] text-[var(--ink)] truncate">{h.name}</p>
                    <p className="std-mono text-[10px] text-[var(--ink-3)] mt-0.5">
                      {h.completionRate ?? 0}% · {h.currentStreak ?? 0}d streak
                    </p>
                  </div>
                ))}
              </div>
            )}

            {queryResult.followUps?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {queryResult.followUps.map((nextQ, idx) => (
                  <button
                    key={`${idx}-${nextQ}`}
                    onClick={() => { setQuery(nextQ); runQuery(nextQ); }}
                    className="std-mono text-[10px] px-2.5 py-1 border border-[var(--signal)] rounded-[var(--r-pill)] transition-colors hover:bg-[color-mix(in_srgb,var(--signal)_10%,transparent)]"
                    style={{ color: 'var(--signal)' }}
                  >
                    {nextQ}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sectioned intelligence ──────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-px bg-[var(--line)]">
        {patterns?.length > 0 && (
          <div className="bg-[var(--surface)]">
            <BriefSection
              title="Patterns"
              icon={MagnifyingGlass}
              accent="var(--signal)"
              items={patterns}
            />
          </div>
        )}
        {trends?.length > 0 && (
          <div className="bg-[var(--surface)]">
            <BriefSection
              title="Trends"
              icon={TrendUp}
              accent="var(--signal)"
              items={trends}
              renderBadge={(item) => item.direction && <TrendBadgeStd direction={item.direction} />}
            />
          </div>
        )}
        {correlations?.length > 0 && (
          <div className="bg-[var(--surface)]">
            <BriefSection
              title="Correlations"
              icon={ArrowsCounterClockwise}
              accent="var(--ink-2)"
              items={correlations}
            />
          </div>
        )}
        {recommendations?.length > 0 && (
          <div className="bg-[var(--surface)]">
            <BriefSection
              title="Recommendations"
              icon={Lightbulb}
              accent="var(--rose, #e11d48)"
              items={recommendations}
              renderBadge={(item) => item.priority && <PriorityBadgeStd priority={item.priority} />}
            />
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      {generatedAt && (
        <div className="px-6 py-3 border-t border-[var(--line)]">
          <p className="std-mono text-[10px] text-[var(--ink-3)] text-right">
            Generated {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
});

AnalyticsInsightsStd.displayName = 'AnalyticsInsightsStd';
export default AnalyticsInsightsStd;
