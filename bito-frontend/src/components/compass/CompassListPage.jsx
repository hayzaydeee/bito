import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon, TargetIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import useCompassList from "./hooks/useCompassList";
import CompassCard from "./CompassCard";
import CompassEmptyState from "./CompassEmptyState";
import DiscardModal from "./DiscardModal";
import SuitePreview from "./SuitePreview";
import { compassAPI } from "../../services/api";
import { pageVariants, fadeUp, cardVariants } from "./compassMotion";
import { useState } from "react";

/**
 * CompassListPage — routed list view at /app/compass.
 * Handles suite-preview overlay when navigated back from a multi-goal generation.
 */
const CompassListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    compasses,
    loading,
    error,
    setError,
    fetchCompasses,
    archiveLoading,
    handleArchive,
    discardTarget,
    setDiscardTarget,
    discardLoading,
    handleDiscard,
    activeCount,
    totalHabits,
    suiteGroups,
    sortedStandalone,
  } = useCompassList();

  // Suite preview overlay (from multi-goal generation redirect)
  const [activeSuite, setActiveSuite] = useState(
    () => location.state?.suite || null
  );
  const [suiteApplyLoading, setSuiteApplyLoading] = useState(false);

  // ── Open compass detail ──
  const openDetail = async (t) => {
    navigate(`/app/compass/${t._id}`);
  };

  // ── Suite preview (if redirected from multi-goal generation) ──
  if (activeSuite) {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <SuitePreview
            suite={activeSuite}
            onBack={() => setActiveSuite(null)}
            onOpencompass={(t) => navigate(`/app/compass/${t._id}`)}
            onApplyAll={async () => {
              try {
                setSuiteApplyLoading(true);
                for (const t of activeSuite.compasses) {
                  await compassAPI.apply(t._id);
                }
                setActiveSuite(null);
                fetchCompasses();
              } catch (err) {
                setError(err.message || "Failed to apply suite");
              } finally {
                setSuiteApplyLoading(false);
              }
            }}
            applyLoading={suiteApplyLoading}
            onArchive={handleArchive}
            error={error}
          />
        </div>
      </div>
    );
  }

  // ── Discard modal overlay ──
  const discardModalEl = discardTarget ? (
    <DiscardModal
      compass={discardTarget}
      onConfirm={handleDiscard}
      onCancel={() => setDiscardTarget(null)}
      isLoading={discardLoading}
    />
  ) : null;

  return (
    <>
      {discardModalEl}
      <motion.div
        className="min-h-screen page-container px-4 sm:px-6 py-8 sm:py-10"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-5xl mx-auto">
          {/* Header — hidden in empty state since CompassEmptyState is self-contained */}
          {!loading && compasses.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-10">
              <motion.div variants={fadeUp}>
                <h1 className="text-3xl font-bold font-garamond text-[var(--color-text-primary)] mb-1">
                  Compasses
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
                  AI-powered habit systems from your goals
                </p>
              </motion.div>
              <motion.button
                variants={fadeUp}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app/compass/new")}
                className="flex items-center justify-center gap-2 h-11 w-full sm:w-auto px-5 text-white rounded-xl text-sm font-spartan font-medium transition-colors"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))",
                }}
              >
                <PlusIcon className="w-4 h-4" />
                New compass
              </motion.button>
            </div>
          )}

          {/* Stat pills */}
          {!loading && compasses.length > 0 && (
            <motion.div
              className="flex items-center gap-3 mb-6 flex-wrap"
              variants={fadeUp}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/15">
                <TargetIcon className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-spartan font-semibold text-[var(--color-text-primary)]">
                  {activeCount}
                </span>
                <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                  active
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/15">
                <LightningBoltIcon className="w-3.5 h-3.5 text-[var(--color-brand-500)]" />
                <span className="text-xs font-spartan font-semibold text-[var(--color-text-primary)]">
                  {totalHabits}
                </span>
                <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                  habit{totalHabits !== 1 && "s"} tracking
                </span>
              </div>
            </motion.div>
          )}

          {error && (
            <p className="text-sm text-red-400 font-spartan mb-4">{error}</p>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="rounded-2xl overflow-hidden border border-[var(--color-border-primary)]/10 min-h-[160px]"
                >
                  <div className="h-1.5 w-full compass-skeleton-shimmer" />
                  <div className="p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg compass-skeleton-shimmer flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded compass-skeleton-shimmer" />
                        <div className="h-3 w-full rounded compass-skeleton-shimmer" />
                      </div>
                    </div>
                    <div className="flex gap-1 mt-auto pt-6">
                      <div className="h-1 flex-1 rounded-full compass-skeleton-shimmer" />
                      <div className="h-1 flex-1 rounded-full compass-skeleton-shimmer" />
                      <div className="h-1 flex-1 rounded-full compass-skeleton-shimmer" />
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-primary)]/10">
                      <div className="w-8 h-8 rounded-full compass-skeleton-shimmer" />
                      <div className="flex-1 flex gap-1.5">
                        <div className="h-5 w-16 rounded-md compass-skeleton-shimmer" />
                        <div className="h-5 w-20 rounded-md compass-skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && compasses.length === 0 && (
            <CompassEmptyState
              onCreateNew={() => navigate("/app/compass/new")}
              onGoalSelect={(goal) => {
                navigate("/app/compass/new", { state: { prefillGoal: goal } });
              }}
            />
          )}

          {/* Compass grid */}
          {!loading && compasses.length > 0 && (
            <div className="space-y-6">
              {/* Suite groups */}
              {suiteGroups.map((suite) => (
                <div
                  key={suite.suiteId}
                  className="glass-card-minimal rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-spartan font-semibold text-purple-400 uppercase tracking-wider">
                      Suite
                    </span>
                    <span className="text-xs font-spartan text-[var(--color-text-tertiary)]">
                      · {suite.suiteName}
                    </span>
                    <div className="flex-1" />
                    <span className="text-[10px] font-spartan text-[var(--color-text-tertiary)] bg-purple-500/10 px-2 py-0.5 rounded-md">
                      {suite.compasses.length} linked
                    </span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suite.compasses.map((t, i) => (
                        <CompassCard
                          key={t._id}
                          compass={t}
                          index={i}
                          onOpen={openDetail}
                          onArchive={handleArchive}
                          archiveLoading={archiveLoading}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                </div>
              ))}

              {/* Standalone compasses */}
              {sortedStandalone.length > 0 && (
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedStandalone.map((t, i) => (
                      <CompassCard
                        key={t._id}
                        compass={t}
                        index={i}
                        onOpen={openDetail}
                        onArchive={handleArchive}
                        archiveLoading={archiveLoading}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default CompassListPage;
