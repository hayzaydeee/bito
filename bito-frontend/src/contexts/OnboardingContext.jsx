import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useAuth } from './AuthContext';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

// Onboarding flows definition
export const ONBOARDING_FLOWS = {
  FIRST_TIME_USER: 'first-time-user',
  DASHBOARD_BASICS: 'dashboard-basics',
  WIDGET_CUSTOMIZATION: 'widget-customization',
  HABIT_CREATION: 'habit-creation',
  ANALYTICS_TOUR: 'analytics-tour',
  COLLABORATION: 'collaboration',
};

const ONBOARDING_STEPS = {
  [ONBOARDING_FLOWS.FIRST_TIME_USER]: [
    {
      target: 'body',
      content: (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Welcome to Bito! 🎉</h2>
          <p className="text-gray-300">
            Let's get you started with a quick interactive tour. You'll learn by doing, not just watching!
          </p>
          <div className="flex items-center gap-2 text-sm text-blue-300">
            <span>⚡</span>
            <span>This will take about 2 minutes</span>
          </div>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="welcome-card"]',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Your Personal Dashboard</h3>
          <p className="text-gray-300">
            This is your main hub. Everything is customizable and interactive.
          </p>
        </div>
      ),
    },
    {
      target: '[data-tour="add-widget-btn"]',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Add Your First Widget</h3>
          <p className="text-gray-300">
            Click this button to see all available widgets. Try adding one!
          </p>
          <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <p className="text-blue-300 text-sm">👆 Go ahead, click it now!</p>
          </div>
        </div>
      ),
      spotlightClicks: true,
    },
  ],
  [ONBOARDING_FLOWS.WIDGET_CUSTOMIZATION]: [
    {
      target: '[data-tour="edit-mode-toggle"]',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Edit Mode Magic ✨</h3>
          <p className="text-gray-300">
            Toggle this to enter edit mode. You can drag, resize, and customize everything!
          </p>
          <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30">
            <p className="text-green-300 text-sm">Try toggling it now!</p>
          </div>
        </div>
      ),
      spotlightClicks: true,
    },
    {
      target: '[data-grid-widget="habits-overview"]',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Drag Me Around! 🎯</h3>
          <p className="text-gray-300">
            With edit mode on, you can drag this widget anywhere. Try it!
          </p>
          <div className="flex items-center gap-2 text-sm text-yellow-300">
            <span>💡</span>
            <span>Pro tip: You can also resize widgets by dragging the corners</span>
          </div>
        </div>
      ),
    },
  ],
  [ONBOARDING_FLOWS.HABIT_CREATION]: [
    {
      target: '[data-tour="quick-actions"]',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Quick Actions Hub</h3>
          <p className="text-gray-300">
            This is your command center for creating habits and importing data.
          </p>
        </div>
      ),
    },
    {
      target: '[data-tour="add-habit-btn"]',
      content: (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Create Your First Habit</h3>
          <p className="text-gray-300">
            Let's create a habit together. Click this button to get started!
          </p>
          <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <p className="text-purple-300 text-sm">👆 Click to create a habit!</p>
          </div>
        </div>
      ),
      spotlightClicks: true,
    },
  ],
};

export const OnboardingProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeFlow, setActiveFlow] = useState(null);
  const [completedFlows, setCompletedFlows] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bito-onboarding-completed') || '[]');
    } catch {
      return [];
    }
  });
  const [interactiveState, setInteractiveState] = useState({
    waitingForUserAction: false,
    expectedAction: null,
    stepComplete: false,
  });

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !completedFlows.includes(ONBOARDING_FLOWS.FIRST_TIME_USER)) {
      // Small delay to let the page load
      setTimeout(() => {
        startFlow(ONBOARDING_FLOWS.FIRST_TIME_USER);
      }, 1000);
    }
  }, [user]);

  const startFlow = useCallback((flowName, force = false) => {
    if (!force && completedFlows.includes(flowName)) return;
    setActiveFlow(flowName);
    setInteractiveState({
      waitingForUserAction: false,
      expectedAction: null,
      stepComplete: false,
    });
  }, [completedFlows]);

  const completeFlow = useCallback((flowName) => {
    const updated = [...new Set([...completedFlows, flowName])];
    setCompletedFlows(updated);
    localStorage.setItem('bito-onboarding-completed', JSON.stringify(updated));
    setActiveFlow(null);
  }, [completedFlows]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('bito-onboarding-completed');
    setCompletedFlows([]);
    setActiveFlow(null);
  }, []);

  const markActionComplete = useCallback((action) => {
    if (interactiveState.expectedAction === action) {
      setInteractiveState(prev => ({
        ...prev,
        stepComplete: true,
        waitingForUserAction: false,
      }));
    }
  }, [interactiveState.expectedAction]);

  const handleJoyrideCallback = useCallback((data) => {
    const { action, index, status, type, step } = data;

    if (type === EVENTS.STEP_AFTER) {
      if (step.spotlightClicks) {
        setInteractiveState({
          waitingForUserAction: true,
          expectedAction: step.target,
          stepComplete: false,
        });
      }
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      completeFlow(activeFlow);
    }
  }, [activeFlow, completeFlow]);

  const value = {
    activeFlow,
    completedFlows,
    startFlow,
    completeFlow,
    resetOnboarding,
    markActionComplete,
    interactiveState,
    ONBOARDING_FLOWS,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {activeFlow && (
        <Joyride
          steps={ONBOARDING_STEPS[activeFlow] || []}
          run={true}
          continuous={true}
          showProgress={true}
          showSkipButton={true}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: 'rgb(99 102 241)', // Indigo-500
              backgroundColor: 'rgb(15 23 42)', // Slate-900
              textColor: 'white',
              overlayColor: 'rgba(0, 0, 0, 0.8)',
              arrowColor: 'rgb(30 41 59)', // Slate-800
              zIndex: 10000,
            },
            tooltip: {
              borderRadius: 12,
              fontSize: 14,
              padding: 20,
            },
            tooltipContainer: {
              textAlign: 'left',
            },
            tooltipTitle: {
              fontSize: 18,
              marginBottom: 10,
            },
            buttonNext: {
              backgroundColor: 'rgb(99 102 241)',
              fontSize: 14,
              padding: '8px 16px',
              borderRadius: 8,
            },
            buttonBack: {
              color: 'rgb(148 163 184)',
              fontSize: 14,
            },
            buttonSkip: {
              color: 'rgb(148 163 184)',
              fontSize: 14,
            },
            spotlight: {
              borderRadius: 8,
            },
          }}
        />
      )}
    </OnboardingContext.Provider>
  );
};
