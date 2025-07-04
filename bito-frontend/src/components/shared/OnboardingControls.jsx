import React from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { GearIcon, PlayIcon, ResetIcon } from '@radix-ui/react-icons';

const OnboardingControls = () => {
  const { 
    activeFlow, 
    completedFlows, 
    startFlow, 
    resetOnboarding, 
    ONBOARDING_FLOWS 
  } = useOnboarding();

  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  const flowOptions = [
    { id: ONBOARDING_FLOWS.FIRST_TIME_USER, name: 'First Time User', emoji: '👋' },
    { id: ONBOARDING_FLOWS.DASHBOARD_BASICS, name: 'Dashboard Basics', emoji: '📊' },
    { id: ONBOARDING_FLOWS.WIDGET_CUSTOMIZATION, name: 'Widget Customization', emoji: '🔧' },
    { id: ONBOARDING_FLOWS.HABIT_CREATION, name: 'Habit Creation', emoji: '✨' },
    { id: ONBOARDING_FLOWS.ANALYTICS_TOUR, name: 'Analytics Tour', emoji: '📈' },
    { id: ONBOARDING_FLOWS.COLLABORATION, name: 'Collaboration', emoji: '👥' },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50 glass-card p-4 rounded-lg max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <GearIcon className="w-4 h-4 text-blue-400" />
        <h3 className="font-semibold text-white text-sm">Onboarding Dev Tools</h3>
      </div>

      {activeFlow && (
        <div className="mb-3 p-2 bg-blue-500/20 rounded border border-blue-500/30">
          <p className="text-blue-300 text-xs">
            Active: {flowOptions.find(f => f.id === activeFlow)?.name || activeFlow}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {flowOptions.map((flow) => {
          const isCompleted = completedFlows.includes(flow.id);
          const isActive = activeFlow === flow.id;
          
          return (
            <button
              key={flow.id}
              onClick={() => startFlow(flow.id, true)} // Force start
              disabled={isActive}
              className={`w-full text-left p-2 rounded text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500/30 text-blue-300 cursor-not-allowed'
                  : isCompleted
                  ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                  : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{flow.emoji}</span>
                  <span className="truncate">{flow.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isCompleted && <span className="text-green-400">✓</span>}
                  {isActive && <PlayIcon className="w-3 h-3 text-blue-400" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-500/30">
        <button
          onClick={resetOnboarding}
          className="w-full flex items-center justify-center gap-2 p-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded text-xs transition-all duration-200"
        >
          <ResetIcon className="w-3 h-3" />
          Reset All
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-400 text-center">
        Dev mode only
      </div>
    </div>
  );
};

export default OnboardingControls;
