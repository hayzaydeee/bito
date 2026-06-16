import React, { useState, useCallback, memo } from 'react';
import {
  LockClosedIcon,
  LockOpen1Icon,
  EyeOpenIcon,
  EyeNoneIcon,
  Cross2Icon,
} from '@radix-ui/react-icons';
import { MagnifyingGlass, Sparkle, Bell, NotePencil } from '@phosphor-icons/react';

/* ═══════════════════════════════════════════════════════════════
   JournalPrivacy — AI opt-in console + settings + privacy indicator
   DRILL editorial: mono tier labels, hairline-framed tiers, signal
   accent, captain's-log voice. "Clearance levels" framing.
   ═══════════════════════════════════════════════════════════════ */

const AI_TIERS = [
  {
    key: 'insightNudges',
    title: 'Pattern Nudges',
    description: 'Detect patterns from your mood scores and tags — no content reading. You\'ll see gentle nudges like "You\'ve been in a great mood this week!"',
    Icon: Bell,
    dataAccess: 'Mood, energy, tags, entry frequency',
    tier: 1,
  },
  {
    key: 'contentAnalysis',
    title: 'Content Insights',
    description: 'AI reads your journal text to surface deeper themes, correlations, and habit connections.',
    Icon: MagnifyingGlass,
    dataAccess: 'All journal text content + metadata',
    tier: 2,
  },
  {
    key: 'weeklySummaries',
    title: 'Weekly Narratives',
    description: 'AI-generated weekly reflection summaries that weave together your habits, mood, and journal themes.',
    Icon: NotePencil,
    dataAccess: 'All journal text + habit data + mood trends',
    tier: 3,
  },
];

/* ── Privacy indicator badge (shown on journal surface) ─────── */
export const PrivacyBadge = memo(({ journalAI, onClick }) => {
  const isAllOff = !journalAI?.insightNudges && !journalAI?.contentAnalysis && !journalAI?.weeklySummaries;
  const maxTier = journalAI?.weeklySummaries ? 3 : journalAI?.contentAnalysis ? 2 : journalAI?.insightNudges ? 1 : 0;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-tag)] std-mono text-[10px] uppercase tracking-wider transition-all hover:bg-[var(--surface-2)]"
      style={{ color: isAllOff ? 'var(--ink-3)' : 'var(--signal)' }}
      title={isAllOff ? 'AI features off — your journal is fully private' : `AI Tier ${maxTier} active`}
    >
      {isAllOff ? (
        <LockClosedIcon className="w-3 h-3" />
      ) : (
        <LockOpen1Icon className="w-3 h-3" />
      )}
      <span>{isAllOff ? 'Private' : `AI · T${maxTier}`}</span>
    </button>
  );
});
PrivacyBadge.displayName = 'PrivacyBadge';

/* ── First-week nudge banner ─────────────────────────────────── */
export const AIOptInNudge = memo(({ onStartTour, onDismiss }) => {
  return (
    <div className="std-card flex items-start gap-3 px-4 py-3 border-[var(--signal-2)]">
      <Sparkle size={20} weight="duotone" className="flex-shrink-0 mt-0.5 text-[var(--signal)]" />
      <div className="flex-1 min-w-0">
        <p className="std-kicker">Clearance · Optional</p>
        <p className="std-display text-[15px] font-bold text-[var(--ink)] mt-0.5">
          Unlock Journal Intelligence
        </p>
        <p className="text-[13px] text-[var(--ink-2)] mt-0.5 leading-relaxed">
          Optionally enable AI features to get personalized insights from your journal. You choose exactly what data is used.
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <button onClick={onStartTour} className="std-btn std-btn--signal std-btn--sm">
            Learn More
          </button>
          <button onClick={onDismiss} className="std-btn std-btn--sm">
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded transition-colors hover:bg-[var(--surface-2)] text-[var(--ink-3)]"
      >
        <Cross2Icon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});
AIOptInNudge.displayName = 'AIOptInNudge';

/* ── Full AI opt-in tour / settings panel ────────────────────── */
const JournalPrivacySettings = ({ journalAI = {}, onUpdate, onClose }) => {
  const [settings, setSettings] = useState({
    insightNudges: journalAI.insightNudges || false,
    contentAnalysis: journalAI.contentAnalysis || false,
    weeklySummaries: journalAI.weeklySummaries || false,
  });
  const [saving, setSaving] = useState(false);

  const toggleTier = useCallback((key) => {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Enforce tier hierarchy: higher tiers require lower tiers
      if (key === 'contentAnalysis' && !next.contentAnalysis) {
        next.weeklySummaries = false;
      }
      if (key === 'insightNudges' && !next.insightNudges) {
        next.contentAnalysis = false;
        next.weeklySummaries = false;
      }
      // Enabling a higher tier auto-enables lower tiers
      if (key === 'weeklySummaries' && next.weeklySummaries) {
        next.insightNudges = true;
        next.contentAnalysis = true;
      }
      if (key === 'contentAnalysis' && next.contentAnalysis) {
        next.insightNudges = true;
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onUpdate({
        ...settings,
        tourCompleted: true,
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  }, [settings, onUpdate, onClose]);

  const isAllOff = !settings.insightNudges && !settings.contentAnalysis && !settings.weeklySummaries;

  return (
    <div className="std fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className="std-card relative w-full max-w-lg shadow-2xl overflow-hidden p-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="std-kicker">Clearance Levels</p>
              <h2 className="std-display text-2xl font-bold text-[var(--ink)] mt-1">
                Journal Intelligence
              </h2>
              <p className="text-[13px] text-[var(--ink-2)] mt-1 leading-relaxed">
                Choose what AI features you'd like. Every tier is optional. You can change these anytime.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--r-btn)] hover:bg-[var(--surface-2)] transition-colors text-[var(--ink-3)]"
            >
              <Cross2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="mx-6 px-3 py-2.5 rounded-[var(--r-btn)] mb-4 flex items-start gap-2 border border-[var(--line)] bg-[var(--surface-2)]">
          <LockClosedIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--ink-3)]" />
          <p className="std-mono text-[10.5px] leading-relaxed text-[var(--ink-2)]">
            Your journal is always stored privately. AI features only process data you explicitly opt into.
            Disabling any tier immediately stops processing and deletes any cached AI data for that tier.
          </p>
        </div>

        {/* Tiers */}
        <div className="px-6 space-y-3 pb-4">
          {AI_TIERS.map((tier) => {
            const isEnabled = settings[tier.key];
            const isDisabled = tier.key === 'contentAnalysis' && !settings.insightNudges
              || tier.key === 'weeklySummaries' && !settings.contentAnalysis;

            return (
              <div
                key={tier.key}
                className="rounded-[var(--r-card)] border p-4 transition-all duration-200"
                style={{
                  borderColor: isEnabled ? 'var(--signal)' : 'var(--line)',
                  backgroundColor: isEnabled ? 'var(--signal-2)' : 'var(--surface)',
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <tier.Icon
                      size={18}
                      weight="duotone"
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: isEnabled ? 'var(--signal)' : 'var(--ink-3)' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="std-display text-[15px] font-bold text-[var(--ink)]">
                          {tier.title}
                        </h3>
                        <span
                          className="std-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--r-tag)]"
                          style={{
                            backgroundColor: isEnabled ? 'var(--signal)' : 'transparent',
                            color: isEnabled ? 'var(--signal-ink)' : 'var(--ink-3)',
                            border: isEnabled ? 'none' : '1px solid var(--line-2)',
                          }}
                        >
                          Tier {tier.tier}
                        </span>
                      </div>
                      <p className="text-[13px] text-[var(--ink-2)] mt-1 leading-relaxed">
                        {tier.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {isEnabled
                          ? <EyeOpenIcon className="w-3 h-3 text-[var(--signal)]" />
                          : <EyeNoneIcon className="w-3 h-3 text-[var(--ink-3)]" />
                        }
                        <span className="std-mono text-[9.5px] uppercase tracking-wide text-[var(--ink-3)]">
                          Data: {tier.dataAccess}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => !isDisabled && toggleTier(tier.key)}
                    disabled={isDisabled}
                    className="flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 relative"
                    style={{
                      backgroundColor: isEnabled ? 'var(--signal)' : 'var(--line-2)',
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                      style={{ transform: isEnabled ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {isAllOff
              ? <LockClosedIcon className="w-3.5 h-3.5 text-[var(--ink-3)]" />
              : <LockOpen1Icon className="w-3.5 h-3.5 text-[var(--signal)]" />
            }
            <span className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
              {isAllOff ? 'Fully private — no AI processing' : 'Selected tiers will process your data'}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="std-btn std-btn--signal disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalPrivacySettings;
