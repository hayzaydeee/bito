import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon } from "@radix-ui/react-icons";
import useCompassList from "./hooks/useCompassList";
import CompassCard from "./CompassCard";
import CompassEmptyState from "./CompassEmptyState";
import FeatureHeader from "../shared/standard/FeatureHeader";
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
      <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12">
        <div className="max-w-6xl mx-auto">
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
        className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header — shared Feature-Home masthead (twin of Groups home) */}
          <FeatureHeader
            kicker="The Engine Room"
            title="Compass"
            stats={
              !loading && compasses.length > 0 ? (
                <>
                  <span className="text-[var(--signal)]">{String(activeCount).padStart(2, "0")}</span> ACTIVE
                  {"  ·  "}
                  <span className="text-[var(--ink-2)]">{totalHabits}</span> HABIT{totalHabits !== 1 ? "S" : ""} TRACKING
                  {"  ·  "}
                  <span className="text-[var(--ink-2)]">{compasses.length}</span> TOTAL
                </>
              ) : (
                "AI-POWERED HABIT SYSTEMS FROM YOUR GOALS"
              )
            }
            actions={
              <motion.button
                variants={fadeUp}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app/compass/new")}
                className="std-btn std-btn--signal w-full sm:w-auto"
              >
                <PlusIcon className="w-4 h-4" />
                New compass
              </motion.button>
            }
          />

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
                  className="std-card p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="std-kicker" style={{ color: "var(--signal)" }}>
                      Suite
                    </span>
                    <span className="text-xs text-[var(--ink-3)]">
                      · {suite.suiteName}
                    </span>
                    <div className="flex-1" />
                    <span className="grp-mono text-[10px] text-[var(--signal)] bg-[var(--signal)]/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
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
