import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const LS_KEY_PREFIX = 'bito_journal_tour_completed';

// Build user-specific localStorage key
const getTourKey = (userId) => userId ? `${LS_KEY_PREFIX}_${userId}` : LS_KEY_PREFIX;

// Build steps for the journal page tour
const getSteps = () => [
  {
    target: '[data-tour="journal-mood-energy"]',
    title: 'How are you feeling?',
    body: "Start your entry by logging your mood and energy. Tap an emoji to select, tap again to deselect. These build into patterns over time.",
    position: 'bottom',
  },
  {
    target: '[data-tour="journal-quick-capture"]',
    title: 'Quick capture',
    body: "Jot down quick thoughts in seconds — they appear as timestamped bullet notes. Perfect for capturing moments throughout the day.",
    position: 'bottom',
  },
  {
    target: '[data-tour="journal-editor"]',
    title: 'Long-form writing',
    body: "This is your rich text editor. Type / to access headings, lists, tables, images, and more. Select text to format it bold, italic, or linked. Everything saves automatically.",
    position: 'top',
  },
  {
    target: '[data-tour="journal-status-bar"]',
    title: 'Your writing stats',
    body: "Word count, quick note tally, and estimated reading time update live. The save indicator shows you when your work is safely stored.",
    position: 'top',
  },
  {
    target: '[data-tour="journal-week-strip"]',
    title: 'Navigate your week',
    body: "Tap any day to jump to that entry. Coloured dots show days you've written on. Use the arrows to move between weeks, or tap the calendar icon for a monthly view.",
    position: 'bottom',
  },
  {
    target: '[data-tour="journal-search"]',
    title: 'Search your journal',
    body: "Search across all your entries — long-form and quick notes — by keyword. Results link straight to the matching day.",
    position: 'bottom',
  },
  {
    target: '[data-tour="journal-intelligence"]',
    title: 'Journal Intelligence',
    body: "Once you've built a writing habit, unlock AI-powered insights. Choose your privacy level: pattern nudges, content analysis, or weekly narrative summaries.",
    position: 'bottom',
  },
  {
    target: null,
    title: "Your journal is ready",
    body: "That's everything. Start by logging your mood and capturing a quick thought — even one sentence counts. You can replay this tour from Settings → About.",
    position: 'center',
  },
];

/**
 * JournalTour — spotlight walkthrough for the journal page.
 * Follows the same pattern as DashboardTour / AnalyticsTour.
 *
 * Props:
 *   forceShow  — bypass localStorage and show tour (for replay)
 *   onComplete — callback after tour finishes or is skipped
 *   userId     — for per-user localStorage key
 */
const JournalTour = ({ forceShow = false, onComplete, userId }) => {
  const lsKey = getTourKey(userId);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(-1); // -1 = prompt, 0..N = steps
  const [spotlightRect, setSpotlightRect] = useState(null);
  const tooltipRef = useRef(null);
  const stepsRef = useRef(getSteps());
  const STEPS = stepsRef.current;

  // Check if we should show the prompt
  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setStep(-1);
      return;
    }
    try {
      if (localStorage.getItem(lsKey) !== 'true') {
        setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, [forceShow, lsKey]);

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
  }, [step, STEPS]);

  // Track actual tooltip height for smart positioning
  const [tooltipH, setTooltipH] = useState(0);
  useEffect(() => {
    if (tooltipRef.current) {
      const h = tooltipRef.current.getBoundingClientRect().height;
      if (h > 0) setTooltipH(h);
    }
  });

  // Find the nearest scrollable ancestor of an element
  const findScrollParent = useCallback((el) => {
    let node = el.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }, []);

  // Scroll target into view with room for its tooltip, then measure
  useEffect(() => {
    if (step >= 0 && step < STEPS.length) {
      const { target, position } = STEPS[step];
      if (target) {
        const el = document.querySelector(target);
        if (el) {
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          const tooltipSpace = 220;

          const needsAbove = position === 'top' || rect.bottom > vh * 0.55;
          const topBound = needsAbove ? 0 : -tooltipSpace;
          const bottomBound = needsAbove ? vh - tooltipSpace : vh;
          const inView = rect.top >= topBound && rect.bottom <= bottomBound;

          if (!inView) {
            // Try scrolling the nearest scrollable ancestor first,
            // then fall back to scrollIntoView for the layout scroll container
            const scrollParent = findScrollParent(el);
            if (scrollParent) {
              const parentRect = scrollParent.getBoundingClientRect();
              const elTop = el.getBoundingClientRect().top - parentRect.top + scrollParent.scrollTop;
              const targetScroll = elTop - scrollParent.clientHeight / 2 + el.offsetHeight / 2;
              scrollParent.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
            }
            // Also call scrollIntoView to handle the Layout.jsx overflow-y-auto wrapper
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }
    // Measure immediately, then re-measure after scroll animation
    measureTarget();
    const t1 = setTimeout(measureTarget, 120);
    const t2 = setTimeout(measureTarget, 450);
    const t3 = setTimeout(measureTarget, 800); // extra delay for nested scroll containers
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [measureTarget, step, STEPS]);

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
      localStorage.setItem(lsKey, 'true');
    } catch {
      /* ignore */
    }
    onComplete?.();
  }, [onComplete, lsKey]);

  const startTour = () => {
    setStep(0);
  };

  const advance = () => {
    const next = step + 1;
    if (next >= STEPS.length) {
      finish();
    } else {
      setStep(next);
    }
  };

  if (!visible) return null;

  // ── Prompt screen (step === -1) ──
  if (step === -1) {
    return createPortal(
      <div className="tour-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={finish}>
        <div
          className="tour-prompt"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Journal tour prompt"
        >
          <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] mb-1">
            Want a quick tour of your journal?
          </h2>
          <p className="text-sm font-spartan text-[var(--color-text-secondary)] mb-5">
            30 seconds to learn what you can do here. You can always replay it from Settings → About.
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

  // Tooltip position — edge-aware with auto-flip
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
    const tooltipEstH = 180;
    const margin = 16;

    // Decide vertical placement
    const actualH = tooltipH > 0 ? tooltipH : tooltipEstH;
    let vertical = currentStep.position;
    const spaceBelow = window.innerHeight - (y + h + gap);
    const spaceAbove = y - gap;

    // If the target sits in the lower 45% of the viewport, prefer above
    const targetMidpoint = y + h / 2;
    if (targetMidpoint > window.innerHeight * 0.55) {
      vertical = 'top';
    } else if (vertical === 'bottom' && spaceBelow < actualH && spaceAbove > spaceBelow) {
      vertical = 'top';
    } else if (vertical === 'top' && spaceAbove < actualH && spaceBelow > spaceAbove) {
      vertical = 'bottom';
    }

    // Horizontal: center on target, then clamp
    const centerX = x + w / 2;
    let left = centerX - tooltipW / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipW - margin));

    const style = {
      position: 'fixed',
      left: `${left}px`,
      width: `${tooltipW}px`,
      transform: 'none',
    };

    if (vertical === 'bottom') {
      style.top = `${y + h + gap}px`;
      const maxTop = window.innerHeight - actualH - margin;
      if (parseFloat(style.top) > maxTop) {
        style.top = `${Math.max(margin, maxTop)}px`;
      }
    } else {
      style.bottom = `${window.innerHeight - y + gap}px`;
      const maxBottom = window.innerHeight - margin - actualH;
      if (parseFloat(style.bottom) > maxBottom) {
        style.bottom = `${Math.max(margin, maxBottom)}px`;
      }
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

export default JournalTour;
export { getTourKey };
