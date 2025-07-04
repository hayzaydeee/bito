import { useCallback } from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';

export const useInteractiveOnboarding = () => {
  const { markActionComplete, interactiveState } = useOnboarding();

  const handleUserAction = useCallback((actionTarget) => {
    if (interactiveState.waitingForUserAction) {
      // Remove the data-tour prefix from the target for comparison
      const cleanTarget = actionTarget.replace('[data-tour="', '').replace('"]', '');
      const expectedTarget = interactiveState.expectedAction.replace('[data-tour="', '').replace('"]', '');
      
      if (cleanTarget === expectedTarget) {
        markActionComplete(interactiveState.expectedAction);
        
        // Add visual feedback
        const element = document.querySelector(actionTarget);
        if (element) {
          element.classList.add('onboarding-success');
          setTimeout(() => {
            element.classList.remove('onboarding-success');
          }, 2000);
        }
      }
    }
  }, [interactiveState, markActionComplete]);

  return {
    handleUserAction,
    isWaitingForAction: interactiveState.waitingForUserAction,
    expectedAction: interactiveState.expectedAction,
  };
};

// Custom CSS for onboarding feedback (add to your CSS file)
export const onboardingStyles = `
.onboarding-success {
  animation: onboarding-pulse 0.6s ease-in-out;
}

@keyframes onboarding-pulse {
  0% { 
    transform: scale(1); 
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  50% { 
    transform: scale(1.05); 
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
  100% { 
    transform: scale(1); 
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.joyride-spotlight {
  border-radius: 12px !important;
}
`;
