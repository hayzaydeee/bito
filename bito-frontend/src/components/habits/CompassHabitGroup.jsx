import React, { memo } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Compass as CompassGlyph } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import HabitCard from "./HabitCard";
import { listItemVariants } from "../../utils/motion";

/**
 * CompassHabitGroup — a per-compass section on the Habits page.
 * Header (compass name + phase chip + link to detail), the current/active
 * habits grid, and muted "Upcoming · Phase N" ghost subgroups for
 * not-yet-activated phases. Mirrors the Compass-list suite-group idiom.
 */
const CompassHabitGroup = memo(({ compass, current, upcomingByPhase, archived, onSelect, onOpenCompass }) => {
  const phaseCount = compass?.system?.phases?.length || 0;
  const currentIdx = compass?.progress?.currentPhaseIndex ?? 0;
  const name = compass?.system?.name || "Untitled compass";

  return (
    <div className="std-card p-4 space-y-3">
      {/* Group header */}
      <button
        onClick={() => onOpenCompass(compass._id)}
        className="group w-full flex items-center gap-2 text-left"
      >
        <CompassGlyph size={15} weight="duotone" className="text-[var(--signal)] flex-shrink-0" />
        <span className="std-kicker" style={{ color: "var(--signal)" }}>Compass</span>
        <span className="text-sm text-[var(--ink-2)] truncate min-w-0">· {name}</span>
        {phaseCount > 1 && (
          <span className="std-mono text-[10px] uppercase tracking-wider text-[var(--signal)] bg-[color-mix(in_srgb,var(--signal)_12%,transparent)] px-2 py-0.5 rounded-md flex-shrink-0">
            Phase {Math.min(currentIdx + 1, phaseCount)}/{phaseCount}
          </span>
        )}
        <div className="flex-1" />
        <ArrowRightIcon className="w-4 h-4 text-[var(--ink-3)] flex-shrink-0 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </button>

      {/* Current / active habits */}
      {current.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {current.map((habit, i) => (
            <motion.div key={habit._id} variants={listItemVariants} custom={i}>
              <HabitCard habit={habit} onClick={onSelect} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Archived (only surfaced when the page filter asks for it) */}
      {archived?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {archived.map((habit, i) => (
            <motion.div key={habit._id} variants={listItemVariants} custom={i}>
              <HabitCard habit={habit} onClick={onSelect} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Upcoming phases — muted ghost cards */}
      {upcomingByPhase.map((grp) => (
        <div key={grp.phaseId} className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="std-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
              Upcoming · Phase {grp.phaseNumber}
            </span>
            {grp.phaseName && (
              <span className="text-xs text-[var(--ink-3)] truncate">· {grp.phaseName}</span>
            )}
            <div className="flex-1 border-t border-dashed border-[var(--line)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grp.habits.map((habit) => (
              <HabitCard key={habit._id} habit={habit} onClick={() => onOpenCompass(compass._id)} locked />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

CompassHabitGroup.displayName = "CompassHabitGroup";
export default CompassHabitGroup;
