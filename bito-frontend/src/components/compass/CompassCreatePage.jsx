import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import useCompassCreate from "./hooks/useCompassCreate";
import GoalInput from "./GoalInput";
import GeneratingOverlay from "./GeneratingOverlay";
import { pageVariants } from "./compassMotion";
import { useEffect } from "react";

/**
 * CompassCreatePage — routed create view at /app/compass/new.
 * Handles goal input → clarification → generating overlay flow.
 */
const CompassCreatePage = () => {
  const location = useLocation();
  const {
    goalText,
    setGoalText,
    generating,
    generatingStep,
    clarification,
    clarifyLoading,
    error,
    handleGenerate,
    handleClarificationSubmit,
    handleSkipClarification,
    updateClarificationAnswer,
    goBack,
  } = useCompassCreate();

  // Prefill goal from navigation state (e.g. empty state suggestion click)
  useEffect(() => {
    const prefill = location.state?.prefillGoal;
    if (prefill && !goalText) {
      setGoalText(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Generating overlay ──
  if (generating) {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <GeneratingOverlay step={generatingStep} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen page-container px-4 sm:px-6 py-10"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-5xl mx-auto">
        <GoalInput
          goalText={goalText}
          setGoalText={setGoalText}
          onGenerate={handleGenerate}
          onBack={goBack}
          error={error}
          clarification={clarification}
          clarifyLoading={clarifyLoading}
          onClarificationSubmit={handleClarificationSubmit}
          onSkipClarification={handleSkipClarification}
          onUpdateAnswer={updateClarificationAnswer}
          goalAnalysis={clarification?.goalAnalysis}
        />
      </div>
    </motion.div>
  );
};

export default CompassCreatePage;
