import { motion, useReducedMotion } from "framer-motion";
import { CrossCircledIcon, DrawingPinFilledIcon } from "@radix-ui/react-icons";
import CATEGORY_META, { STATUS_THEME } from "../../data/categoryMeta";
import HabitIcon from "../shared/HabitIcon";
import LedgerCard from "../shared/standard/LedgerCard";

/**
 * CompassCard — entity card for the compasses list. Built on the shared
 * LedgerCard frame (twin of the Groups card) with a richer compass body:
 * phase-aware progress meter + habit preview chips. Keeps the per-category
 * accent color, pin, status, and archive action.
 */
const CompassCard = ({ compass, index = 0, onOpen, onArchive, archiveLoading }) => {
  const prefersReduced = useReducedMotion();
  const t = compass;
  const sys = t.system || {};
  const catMeta = CATEGORY_META[sys.category] || CATEGORY_META.custom;
  const sTheme = STATUS_THEME[t.status] || STATUS_THEME.preview;
  const isActive = t.status === "active";
  const isPreview = t.status === "preview";
  const pers = t.personalization || {};
  const displayIcon = pers.icon || catMeta.icon;
  const accentColor = pers.color || catMeta.accent;
  // Preview cards get a desaturated accent — still recognisable but not "live"
  const cardAccent = isPreview ? `${accentColor}66` : accentColor;

  const phases = sys.phases || [];
  const isPhased = phases.length > 0 && phases.some((p) => p.habits?.length > 0);
  const progress = t.progress || {};
  const habitCount = isPhased
    ? phases.reduce((sum, p) => sum + (p.habits?.length || 0), 0)
    : sys.habits?.length || t.habitCount || 0;

  const progressPct =
    progress.overallCompletion != null
      ? progress.overallCompletion
      : t.status === "completed"
      ? 100
      : t.status === "active" && isPhased
      ? Math.round(((progress.completedPhases?.length || 0) / phases.length) * 100)
      : t.status === "active"
      ? 33
      : 0;

  const previewHabits = isPhased
    ? phases.flatMap((p) => p.habits || []).slice(0, 3)
    : (sys.habits || []).slice(0, 3);

  return (
    <motion.div
      layout
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={
        prefersReduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 30, delay: index * 0.05 }
      }
      className={isPreview ? "compass-card--preview" : ""}
    >
      <LedgerCard
        index={index}
        accent={cardAccent}
        active={isActive}
        onClick={() => onOpen(t)}
        minHeight={160}
        icon={
          <span
            className="w-11 h-11 rounded-[10px] flex items-center justify-center border flex-shrink-0"
            style={{ backgroundColor: `${accentColor}1f`, borderColor: `${accentColor}55` }}
          >
            <HabitIcon icon={displayIcon} size={22} />
          </span>
        }
        topAction={
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(t._id); }}
            disabled={archiveLoading === t._id}
            className="p-1.5 rounded-md text-[var(--ink-3)] hover:text-[var(--rose)] hover:bg-[var(--rose)]/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
            title="Archive"
          >
            <CrossCircledIcon className="w-4 h-4" />
          </button>
        }
        title={
          <span className="inline-flex items-center gap-1.5">
            {pers.isPinned && <DrawingPinFilledIcon className="w-3.5 h-3.5 text-[var(--signal)] flex-shrink-0" />}
            <span className="truncate">{sys.name || "Untitled"}</span>
          </span>
        }
        meta={
          <p className="std-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider">
            <span style={{ color: isPreview ? "var(--ink-2)" : "var(--ink-2)" }}>
              {isPreview ? "Awaiting review" : sTheme.label}
            </span>
            {" · "}{habitCount} habit{habitCount !== 1 ? "s" : ""}
            {isActive && isPhased && ` · Phase ${(progress.currentPhaseIndex ?? 0) + 1}/${phases.length}`}
          </p>
        }
        footer={
          isPreview ? (
            <span className="std-mono text-[10px] text-[var(--signal)] uppercase tracking-wider inline-flex items-center gap-1">
              Continue
            </span>
          ) : (
            <span className="std-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider inline-flex items-center gap-1 truncate">
              <HabitIcon icon={catMeta.icon} size={12} /> {catMeta.label}
            </span>
          )
        }
      >
        {/* Richer body — phase-aware progress meter + habit chips */}
        <div className="mt-4">
          <div className="flex items-center justify-between std-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider mb-1.5">
            <span>{isPhased ? "Phase progress" : "Progress"}</span>
            <span style={{ color: cardAccent }}>{progressPct}%</span>
          </div>
          <div className="std-meter">
            <i style={{ width: `${progressPct}%`, background: cardAccent, transition: "width .5s ease" }} />
          </div>
          {previewHabits.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {previewHabits.map((h, i) => (
                <span key={i} className="std-tag" title={h.name}>
                  <HabitIcon icon={h.icon} size={12} />
                  <span className="truncate max-w-[80px] normal-case tracking-normal">{h.name}</span>
                </span>
              ))}
              {habitCount > 3 && (
                <span className="std-mono text-[10px] text-[var(--ink-3)]">+{habitCount - 3}</span>
              )}
            </div>
          )}
        </div>
      </LedgerCard>
    </motion.div>
  );
};

export default CompassCard;
