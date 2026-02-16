import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const LS_KEY = 'bito_tour_completed';

const STEPS = [
  {
    target: '[data-tour="today-habits"]',
    title: 'Your daily habits',
    body: 'This is your command centre. Check off habits as you complete them — every tick builds your streak.',
    position: 'bottom',
  },
  {
    target: '[data-tour="nav-analytics"]',
    title: 'Analytics',
    body: 'Dive into charts, streaks, heatmaps and AI-powered insights to see your progress over time.',
    position: 'top',
  },
  {
    target: '[data-tour="nav-groups"]',
    title: 'Groups',
    body: 'Create or join a group to build habits together — family, team, or friends.',
    position: 'top',
  },
  {
    target: '[data-tour="nav-add"]',
    title: 'Quick add',
    body: 'Tap here to create a new habit or jot down a journal entry, anytime.',
    position: 'top',
  },
  {
    target: null, // No spotlight — full-screen closing card
    title: "You're all set!",
    body: "That's the tour. Start by adding a habit and checking it off today. You can replay this tour from Settings → About any time.",
    position: 'center',
  },
];

/**
 * DashboardTour — optional spotlight walkthrough
 * Renders as a portal to ensure overlay is above everything.
 *
 * Props:
 *   forceShow  — if true, bypass localStorage and show tour (for replay)
 *   onComplete — callback after tour finishes or is skipped
 */
const DashboardTour = ({ forceShow = false, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(-1); // -1 = prompt, 0..N = steps
  const [spotlightRect, setSpotlightRect] = useState(null);
  const tooltipRef = useRef(null);

  // Check if we should show the prompt
  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setStep(-1);
      return;
    }
    try {
      if (localStorage.getItem(LS_KEY) !== 'true') {
        setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, [forceShow]);

  // Measure target element whenever step changes
  const measureTarget = useCallback(() => {
    if (step < 0 || step >= STEPS.length) {
      setSpotlightRect(null);
      return;
    }
    const { target } = STEPS[step];
    if (!target) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(target);
    if (!el) {
      setSpotlightRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const pad = 8;
    setSpotlightRect({
      x: rect.left - pad,
      y: rect.top - pad,
      w: rect.width + pad * 2,
      h: rect.height + pad * 2,
      r: 12,
    });
  }, [step]);

  useEffect(() => {
    measureTarget();
    // Re-measure after a short delay to catch async-rendered elements
    const timer = setTimeout(measureTarget, 100);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [measureTarget]);

  // Keyboard: Escape to dismiss, ArrowRight / Enter to advance
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (step === -1) startTour();
        else advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const finish = useCallback(() => {
    setVisible(false);
    setStep(-1);
    try {
      localStorage.setItem(LS_KEY, 'true');
    } catch {
      /* ignore */
    }
    onComplete?.();
  }, [onComplete]);

  const startTour = () => setStep(0);

  const advance = () => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!visible) return null;

  // ── Prompt screen (step === -1) ──
  if (step === -1) {
    return createPortal(
      <div className="tour-overlay" onClick={finish}>
        <div
          className="tour-prompt"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Dashboard tour prompt"
        >
          <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] mb-1">
            Want a quick tour?
          </h2>
          <p className="text-sm font-spartan text-[var(--color-text-secondary)] mb-5">
            30 seconds to learn your way around. You can always replay it later.
          </p>
          <div className="flex gap-3">
            <button onClick={startTour} className="tour-btn-primary">
              Show me around
            </button>
            <button onClick={finish} className="tour-btn-skip">
              Skip
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── Tour steps ──
  const currentStep = STEPS[step];
  const isCenter = currentStep.position === 'center';

  // Build clip-path for spotlight cutout
  const clipPath = spotlightRect
    ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${spotlightRect.x}px ${spotlightRect.y}px,
        ${spotlightRect.x}px ${spotlightRect.y + spotlightRect.h}px,
        ${spotlightRect.x + spotlightRect.w}px ${spotlightRect.y + spotlightRect.h}px,
        ${spotlightRect.x + spotlightRect.w}px ${spotlightRect.y}px,
        ${spotlightRect.x}px ${spotlightRect.y}px
      )`
    : undefined;

  // Tooltip position calculation — edge-aware with auto-flip
  const getTooltipStyle = () => {
    if (isCenter || !spotlightRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const { x, y, w, h } = spotlightRect;
    const gap = 16;
    const tooltipW = Math.min(320, window.innerWidth - 32);
    const tooltipEstH = 180; // estimated tooltip height
    const margin = 16; // min distance from screen edge

    // Decide vertical placement — prefer the step's declared position,
    // but auto-flip if there isn't enough room.
    let vertical = currentStep.position; // 'top' or 'bottom'
    const spaceBelow = window.innerHeight - (y + h + gap);
    const spaceAbove = y - gap;

    if (vertical === 'bottom' && spaceBelow < tooltipEstH && spaceAbove > spaceBelow) {
      vertical = 'top';
    } else if (vertical === 'top' && spaceAbove < tooltipEstH && spaceBelow > spaceAbove) {
      vertical = 'bottom';
    }

    // Horizontal: center on target, then clamp so tooltip stays on screen
    const centerX = x + w / 2;
    let left = centerX - tooltipW / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipW - margin));

    const style = {
      position: 'fixed',
      left: `${left}px`,
      width: `${tooltipW}px`,
      // Reset transform — we position explicitly, no translateX needed
      transform: 'none',
    };

    if (vertical === 'bottom') {
      style.top = `${y + h + gap}px`;
    } else {
      style.bottom = `${window.innerHeight - y + gap}px`;
    }

    return style;
  };

  return createPortal(
    <div
      className="tour-overlay"
      onClick={finish}
      role="dialog"
      aria-label={`Tour step ${step + 1} of ${STEPS.length}`}
    >
      {/* Dark overlay with spotlight cutout */}
      {spotlightRect && (
        <div className="tour-spotlight" style={{ clipPath }} />
      )}
      {!spotlightRect && <div className="tour-spotlight-full" />}

      {/* Spotlight ring glow */}
      {spotlightRect && (
        <div
          className="tour-ring"
          style={{
            top: spotlightRect.y,
            left: spotlightRect.x,
            width: spotlightRect.w,
            height: spotlightRect.h,
            borderRadius: spotlightRect.r,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="tour-tooltip"
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator dots */}
        <div className="flex gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-4 bg-[var(--color-brand-500)]'
                  : i < step
                    ? 'bg-[var(--color-brand-500)] opacity-40'
                    : 'bg-[var(--color-text-tertiary)] opacity-30'
              }`}
            />
          ))}
        </div>

        <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
          {currentStep.title}
        </h3>
        <p className="text-sm font-spartan text-[var(--color-text-secondary)] leading-relaxed mb-4">
          {currentStep.body}
        </p>

        <div className="flex items-center justify-between">
          <button onClick={finish} className="tour-btn-skip text-xs">
            Skip tour
          </button>
          <button onClick={advance} className="tour-btn-primary text-sm">
            {step >= STEPS.length - 1 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DashboardTour;
