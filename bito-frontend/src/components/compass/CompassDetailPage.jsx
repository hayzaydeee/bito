import { motion } from "framer-motion";
import useCompassDetail from "./hooks/useCompassDetail";
import CompassDetail from "./CompassDetail";
import RefinementStudio from "./RefinementStudio";
import { pageVariants } from "./compassMotion";

/**
 * CompassDetailPage — routed detail view at /app/compass/:compassId.
 * Renders CompassDetail or RefinementStudio overlay.
 */
const CompassDetailPage = () => {
  const {
    compass,
    loading,
    error,
    applyLoading,
    handleApply,
    handleEditHabit,
    handleRemoveHabit,
    handleArchive,
    handlePersonalize,
    studioOpen,
    openStudio,
    closeStudio,
    handleStudioUpdate,
    handleStudioApply,
    goBack,
    user,
  } = useCompassDetail();

  // Loading state
  if (loading) {
    return (
      <div className="std h-[calc(100dvh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
          <p className="std-kicker">Loading compass</p>
        </div>
      </div>
    );
  }

  // Error / not found
  if (!compass) {
    return (
      <div className="std h-[calc(100dvh-3.5rem)] flex items-center justify-center px-6">
        <div className="text-center max-w-sm animate-fade-in">
          <p className="text-5xl mb-4">🧭</p>
          <h2 className="std-display text-[22px] font-bold text-[var(--ink)] mb-2">
            Compass not found
          </h2>
          <p className="text-[14px] text-[var(--ink-2)] mb-5">
            {error || "This compass may have been archived or deleted."}
          </p>
          <button
            onClick={goBack}
            className="std-btn std-btn--signal mx-auto"
          >
            Back to compasses
          </button>
        </div>
      </div>
    );
  }

  // Refinement studio — full-screen overlay
  if (studioOpen) {
    return (
      <RefinementStudio
        compass={compass}
        onClose={closeStudio}
        onApply={handleStudioApply}
        onUpdate={handleStudioUpdate}
        userAvatar={user?.avatar}
      />
    );
  }

  return (
    <motion.div
      className="std h-[calc(100dvh-3.5rem)] overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-5xl mx-auto h-full">
        <CompassDetail
          compass={compass}
          onBack={goBack}
          onApply={handleApply}
          applyLoading={applyLoading}
          onArchive={handleArchive}
          onEditHabit={handleEditHabit}
          onRemoveHabit={handleRemoveHabit}
          onOpenStudio={openStudio}
          onPersonalize={handlePersonalize}
          error={error}
        />
      </div>
    </motion.div>
  );
};

export default CompassDetailPage;
