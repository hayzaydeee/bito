import React, { useState, useCallback, memo } from 'react';
import {
  LockClosedIcon,
  LockOpen1Icon,
  EyeOpenIcon,
  EyeNoneIcon,
  Cross2Icon,
} from '@radix-ui/react-icons';
import { MagnifyingGlass, Sparkle, Bell, NotePencil } from '@phosphor-icons/react';
import AnimatedModal from '../ui/AnimatedModal';

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
    <AnimatedModal isOpen={true} onClose={onClose} maxWidth="max-w-xl">
      <div className="std relative w-full bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] px-6 pt-5 pb-3 border-b border-[var(--line-2)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="std-kicker">Clearance Levels</p>
              <h2 className="std-display text-xl font-bold text-[var(--ink)] mt-1">
                Journal Intelligence
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors mt-1 outline-none"
            >
              <Cross2Icon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Privacy notice banner */}
          <div className="mt-4 px-3 py-2 rounded-[var(--r-btn)] flex items-start gap-2 bg-[var(--surface-2)] border border-[var(--line-2)]">
            <LockClosedIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--ink-3)]" />
            <p className="std-mono text-[10px] uppercase tracking-wide text-[var(--ink-2)] leading-relaxed">
              Your journal is private. Disable any tier to immediately delete its cached AI data.
            </p>
          </div>
        </div>

        {/* Tiers List */}
        <div className="px-6 py-4 space-y-0 divide-y divide-[var(--line-2)]">
          {AI_TIERS.map((tier) => {
            const isEnabled = settings[tier.key];
            const isDisabled = (tier.key === 'contentAnalysis' && !settings.insightNudges)
              || (tier.key === 'weeklySummaries' && !settings.contentAnalysis);

            return (
              <div
                key={tier.key}
                className={`py-4 transition-opacity duration-200 flex items-start gap-4 ${isDisabled ? 'opacity-40' : 'opacity-100'}`}
              >
                <tier.Icon
                  size={18}
                  weight="duotone"
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: isEnabled ? 'var(--signal)' : 'var(--ink-3)' }}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-[var(--ink)]">
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
                      T{tier.tier}
                    </span>
                  </div>
                  
                  <p className="text-[13px] text-[var(--ink-2)] mt-1.5 leading-relaxed">
                    {tier.description}
                  </p>
                  
                  <div className="flex items-center gap-1.5 mt-2">
                    {isEnabled
                      ? <EyeOpenIcon className="w-3 h-3 text-[var(--signal)]" />
                      : <EyeNoneIcon className="w-3 h-3 text-[var(--ink-3)]" />
                    }
                    <span className="std-mono text-[9.5px] uppercase tracking-wider text-[var(--ink-3)]">
                      {tier.dataAccess}
                    </span>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => !isDisabled && toggleTier(tier.key)}
                  disabled={isDisabled}
                  className="flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 relative mt-0.5 outline-none"
                  style={{
                    backgroundColor: isEnabled ? 'var(--signal)' : 'var(--line-2)',
                  }}
                >
                  <div
                    className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: isEnabled ? 'translateX(18px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[var(--surface)] px-6 py-4 border-t border-[var(--line-2)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {isAllOff
              ? <LockClosedIcon className="w-3.5 h-3.5 text-[var(--ink-3)]" />
              : <LockOpen1Icon className="w-3.5 h-3.5 text-[var(--signal)]" />
            }
            <span className="std-mono text-[9.5px] uppercase tracking-wider text-[var(--ink-3)]">
              {isAllOff ? 'All AI Disabled' : 'AI Active'}
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
    </AnimatedModal>
  );
};

export default JournalPrivacySettings;
