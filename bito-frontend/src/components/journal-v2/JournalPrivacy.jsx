import React, { useState, useCallback, memo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LockClosedIcon,
  LockOpen1Icon,
  EyeOpenIcon,
  EyeNoneIcon,
  InfoCircledIcon,
  Cross2Icon,
} from '@radix-ui/react-icons';

/* ═══════════════════════════════════════════════════════════════
   JournalPrivacy — AI opt-in tour + settings + privacy indicator
   ═══════════════════════════════════════════════════════════════ */

const AI_TIERS = [
  {
    key: 'insightNudges',
    title: 'Pattern Nudges',
    description: 'Detect patterns from your mood scores and tags — no content reading. You\'ll see gentle nudges like "You\'ve been in a great mood this week!"',
    icon: '🔔',
    dataAccess: 'Mood, energy, tags, entry frequency',
    tier: 1,
  },
  {
    key: 'contentAnalysis',
    title: 'Content Insights',
    description: 'AI reads your journal text to surface deeper themes, correlations, and habit connections.',
    icon: '🔍',
    dataAccess: 'All journal text content + metadata',
    tier: 2,
  },
  {
    key: 'weeklySummaries',
    title: 'Weekly Narratives',
    description: 'AI-generated weekly reflection summaries that weave together your habits, mood, and journal themes.',
    icon: '📝',
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
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-spartan font-semibold transition-all hover:bg-[var(--color-surface-hover)]"
      style={{ color: 'var(--color-text-tertiary)' }}
      title={isAllOff ? 'AI features off — your journal is fully private' : `AI Tier ${maxTier} active`}
    >
      {isAllOff ? (
        <LockClosedIcon className="w-3 h-3" />
      ) : (
        <LockOpen1Icon className="w-3 h-3" style={{ color: 'var(--color-brand-500)' }} />
      )}
      <span>{isAllOff ? 'Private' : `AI Tier ${maxTier}`}</span>
    </button>
  );
});
PrivacyBadge.displayName = 'PrivacyBadge';

/* ── First-week nudge banner ─────────────────────────────────── */
export const AIOptInNudge = memo(({ onStartTour, onDismiss }) => {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border"
      style={{
        backgroundColor: 'rgba(99,102,241,0.04)',
        borderColor: 'rgba(99,102,241,0.15)',
      }}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">✨</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-spartan font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Unlock Journal Intelligence
        </p>
        <p className="text-xs font-spartan mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Optionally enable AI features to get personalized insights from your journal. You choose exactly what data is used.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={onStartTour}
            className="px-3 py-1 rounded-lg text-xs font-spartan font-semibold text-white"
            style={{ backgroundColor: 'var(--color-brand-500)' }}
          >
            Learn More
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 rounded-lg text-xs font-spartan font-semibold"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded transition-colors hover:bg-[var(--color-surface-hover)]"
        style={{ color: 'var(--color-text-tertiary)' }}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface-primary)',
          borderColor: 'var(--color-border-primary)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-garamond font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Journal Intelligence
              </h2>
              <p className="text-xs font-spartan mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Choose what AI features you'd like. Every tier is optional. You can change these anytime.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Cross2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="mx-6 px-3 py-2 rounded-lg mb-4 flex items-start gap-2"
          style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
          <LockClosedIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
            style={{ color: 'var(--color-text-tertiary)' }} />
          <p className="text-[11px] font-spartan leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
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
                className="rounded-xl border p-4 transition-all duration-200"
                style={{
                  borderColor: isEnabled ? 'var(--color-brand-300)' : 'var(--color-border-primary)',
                  backgroundColor: isEnabled ? 'rgba(99,102,241,0.03)' : 'var(--color-surface-primary)',
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{tier.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-spartan font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {tier.title}
                        </h3>
                        <span className="text-[9px] font-spartan font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isEnabled ? 'var(--color-brand-500)' : 'var(--color-surface-elevated)',
                            color: isEnabled ? 'white' : 'var(--color-text-tertiary)',
                          }}>
                          Tier {tier.tier}
                        </span>
                      </div>
                      <p className="text-xs font-spartan mt-0.5 leading-relaxed"
                        style={{ color: 'var(--color-text-secondary)' }}>
                        {tier.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {isEnabled
                          ? <EyeOpenIcon className="w-3 h-3" style={{ color: 'var(--color-brand-500)' }} />
                          : <EyeNoneIcon className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
                        }
                        <span className="text-[10px] font-spartan" style={{ color: 'var(--color-text-tertiary)' }}>
                          Data accessed: {tier.dataAccess}
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
                      backgroundColor: isEnabled ? 'var(--color-brand-500)' : 'var(--color-surface-elevated)',
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
        <div className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--color-border-primary)' }}>
          <div className="flex items-center gap-1.5">
            {isAllOff
              ? <LockClosedIcon className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
              : <LockOpen1Icon className="w-3.5 h-3.5" style={{ color: 'var(--color-brand-500)' }} />
            }
            <span className="text-xs font-spartan" style={{ color: 'var(--color-text-secondary)' }}>
              {isAllOff ? 'Fully private — no AI processing' : 'Selected tiers will process your data'}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-sm font-spartan font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-brand-500)' }}
          >
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalPrivacySettings;
