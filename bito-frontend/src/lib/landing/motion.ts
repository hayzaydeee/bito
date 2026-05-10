// Single source of truth for the reduced-motion gate (spec §4.5).
// Read once at module load — components import the constant rather than
// running matchMedia repeatedly.

export const reduceMotion: boolean =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Touch-device guard (spec §4.1). Lenis wheel smoothing fights native
// momentum on iOS/Android — fall back to native scroll on touch.
export const isTouchDevice = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches

// Spec §4.3 — Framer Motion equivalent of --ease-out-expo.
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

// Spring ease used by Compass card deal and similar moments.
export const EASE_OUT_SPRING = [0.34, 1.56, 0.64, 1] as const
