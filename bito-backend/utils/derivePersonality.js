/**
 * Derive AI personality from onboarding data.
 * 
 * Maps user's goals, capacity, and preferred times to the four personality axes:
 *   - Tone (warm / direct / playful / neutral)
 *   - Focus (wins / patterns / actionable / balanced)
 *   - Verbosity (concise / detailed)
 *   - Accountability (gentle / honest / tough)
 * 
 * Runs once at onboarding completion. The user never sees a personality step —
 * defaults are derived silently from choices they're already making.
 */

function derivePersonality({ goals = [], capacity = 'balanced', preferredTimes = [] }) {
  // ── Accountability from capacity ────────────────────────
  const accountability =
    capacity === 'light' ? 'gentle' :
    capacity === 'full'  ? 'tough'  : 'honest';

  // ── Verbosity from capacity ─────────────────────────────
  const verbosity =
    capacity === 'full' ? 'detailed' : 'concise';

  // ── Categorise selected goals ───────────────────────────
  const soft     = ['mindfulness', 'social'].filter(g => goals.includes(g));
  const hard     = ['productivity', 'learning'].filter(g => goals.includes(g));
  const creative = ['creative'].filter(g => goals.includes(g));

  // ── Tone from goal mix ──────────────────────────────────
  let tone;
  if (creative.length && !soft.length && !hard.length) {
    tone = 'playful';
  } else if (hard.length > soft.length) {
    tone = 'direct';
  } else {
    tone = 'warm';
  }

  // ── Focus from goal mix ─────────────────────────────────
  let focus;
  if (hard.length > soft.length) {
    focus = 'patterns';
  } else if (soft.length > hard.length) {
    focus = 'wins';
  } else {
    focus = 'balanced';
  }

  // ── Time preference as tiebreaker ───────────────────────
  // Secondary signal — only nudges tone when the goal-based logic is ambiguous
  if (tone === 'warm' && focus === 'balanced') {
    const morningOnly = preferredTimes.length === 1 && preferredTimes[0] === 'morning';
    if (morningOnly) {
      tone = 'direct'; // Morning-only users tend toward structure
    }
  }

  return { tone, focus, verbosity, accountability };
}

module.exports = { derivePersonality };
