import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

const LS_KEY_PREFIX = 'bito_analytics_tour_completed';

const getTourKey = (userId) =>
  userId ? `${LS_KEY_PREFIX}_${userId}` : LS_KEY_PREFIX;

/* ── Steps ────────────────────────────────────────────────────────── */
const getSteps = () => [
  {
    target: '[data-tour="analytics-header"]',
    title: 'Time range',
    body: 'Switch between 7 days, 30 days, 90 days, or all time. Every chart and metric below updates instantly to match.',
    position: 'bottom',
  },
  {
    target: '[data-tour="analytics-metrics"]',
    title: 'Key metrics',
    body: 'Four headline numbers at a glance — total habits, completions, completion rate, and best streak. The trend arrows compare to the previous period.',
    position: 'bottom',
  },
  {
    target: '[data-tour="analytics-charts"]',
    title: 'Completion & streaks',
    body: 'The area chart shows your daily completion rate over time, while the bar chart shows each habit\'s current streak. Hover any point for details.',
    position: 'bottom',
  },
  {
    target: '[data-tour="analytics-streak-timeline"]',
    title: 'Streak timeline',
    body: 'This chart tracks how your running streaks evolve day-by-day for your most active habits. Watch the lines climb as you stay consistent!',
    position: 'top',
  },
  {
    target: '[data-tour="analytics-ai-insights"]',
    title: 'AI Insights',
    body: 'Our AI analyses your data and surfaces patterns, trends, correlations, and recommendations. These insights get smarter as you log more data.',
    position: 'top',
    extra: 'settings', // flag to show settings nudge
  },
  {
    target: null,
    title: 'You\'re all set!',
    body: 'That\'s the analytics tour. You can replay it any time from Settings → About.',
    position: 'center',
  },
];

/**
 * AnalyticsTour — spotlight walkthrough for the analytics page.
 * Follows the exact same pattern as DashboardTour for consistency.
 */
const AnalyticsTour = ({ forceShow = false, onComplete, userId }) => {
  const navigate = useNavigate();
  const lsKey = getTourKey(userId);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(-1);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const tooltipRef = useRef(null);
  const stepsRef = useRef(getSteps());
  const STEPS = stepsRef.current;

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

  /* ── Measure target ─────────────────────────────────────────── */
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

  useEffect(() => {
    measureTarget();
    const timer = setTimeout(measureTarget, 100);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [measureTarget]);

  /* ── Keyboard ───────────────────────────────────────────────── */
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

  const startTour = () => setStep(0);

  const advance = () => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!visible) return null;

  /* ── Prompt screen ──────────────────────────────────────────── */
  if (step === -1) {
    return createPortal(
      <div className="tour-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={finish}>
        <div
          className="tour-prompt"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Analytics tour prompt"
        >
          <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] mb-1">
            Explore your analytics
          </h2>
          <p className="text-sm font-spartan text-[var(--color-text-secondary)] mb-5">
            A quick walkthrough of your charts, metrics, and AI insights. Takes about 20 seconds.
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

  /* ── Tour steps ─────────────────────────────────────────────── */
  const currentStep = STEPS[step];
  const isCenter = currentStep.position === 'center';

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
    const tooltipEstH = 200;
    const margin = 16;

    let vertical = currentStep.position;
    const spaceBelow = window.innerHeight - (y + h + gap);
    const spaceAbove = y - gap;

    if (vertical === 'bottom' && spaceBelow < tooltipEstH && spaceAbove > spaceBelow) {
      vertical = 'top';
    } else if (vertical === 'top' && spaceAbove < tooltipEstH && spaceBelow > spaceAbove) {
      vertical = 'bottom';
    }

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
      aria-label={`Analytics tour step ${step + 1} of ${STEPS.length}`}
    >
      {spotlightRect && <div className="tour-spotlight" style={{ clipPath }} />}
      {!spotlightRect && <div className="tour-spotlight-full" />}

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

      <div
        ref={tooltipRef}
        className="tour-tooltip"
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step dots */}
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
        <p className="text-sm font-spartan text-[var(--color-text-secondary)] leading-relaxed mb-3">
          {currentStep.body}
        </p>

        {/* Settings nudge on AI Insights step */}
        {currentStep.extra === 'settings' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              finish();
              navigate('/app/settings/personality');
            }}
            className="mb-3 w-full flex items-center gap-2 p-2.5 rounded-lg bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.18)] hover:bg-[rgba(99,102,241,0.14)] transition-colors cursor-pointer"
          >
            <span className="text-base">🗣️</span>
            <div className="text-left">
              <p className="text-xs font-spartan font-semibold text-[var(--color-brand-400)]">
                Customise your AI voice
              </p>
              <p className="text-[10px] font-spartan text-[var(--color-text-tertiary)]">
                Adjust tone, focus, verbosity & accountability in Settings
              </p>
            </div>
          </button>
        )}

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

export default AnalyticsTour;
export { getTourKey };
