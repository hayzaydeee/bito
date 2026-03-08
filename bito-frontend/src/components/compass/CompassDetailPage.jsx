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
      <div className="h-[calc(100dvh-3.5rem)] page-container flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
            Loading compass...
          </p>
        </div>
      </div>
    );
  }

  // Error / not found
  if (!compass) {
    return (
      <div className="h-[calc(100dvh-3.5rem)] page-container flex items-center justify-center">
        <div className="text-center space-y-3 animate-fade-in">
          <p className="text-4xl">🧭</p>
          <p className="text-base font-spartan font-semibold text-[var(--color-text-primary)]">
            Compass not found
          </p>
          <p className="text-sm font-spartan text-[var(--color-text-secondary)]">
            {error || "This compass may have been archived or deleted."}
          </p>
          <button
            onClick={goBack}
            className="mt-2 px-5 h-10 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
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
      className="h-[calc(100dvh-3.5rem)] page-container overflow-hidden"
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
