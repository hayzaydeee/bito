import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PlusIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { Users, Handshake, Barbell, BookOpen, Globe } from "@phosphor-icons/react";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import GroupCreationModal from "../components/ui/GroupCreationModal";
import AvatarStack from "../components/shared/AvatarStack";
import SkeletonTransition from "../components/ui/SkeletonTransition";
import AnimatedList from "../components/ui/AnimatedList";
import { motion } from "framer-motion";
import { listItemVariants } from "../utils/motion";

const GroupSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  /* ── helpers ─────────────────────────── */

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── data ────────────────────────────── */

  useEffect(() => {
    fetchGroups();

    const onUpdate = (e) => {
      const ws = e.detail.group;
      setGroups((prev) =>
        prev.map((g) => (g._id === ws._id ? { ...g, ...ws } : g))
      );
    };
    window.addEventListener("groupUpdated", onUpdate);
    return () => window.removeEventListener("groupUpdated", onUpdate);
  }, []);

  useEffect(() => {
    if (location.state?.notification) {
      showToast(
        location.state.notification.message,
        location.state.notification.type
      );
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const res = await groupsAPI.getGroups();
      if (res.success) {
        const withCounts = await Promise.all(
          res.groups.map(async (ws) => {
            if (ws.habitCount == null || ws.habitCount < 0) {
              try {
                const h = await groupsAPI.getGroupHabits(ws._id);
                if (h.success) return { ...ws, habitCount: h.habits.length };
              } catch {
                /* fallback */
              }
            }
            return { ...ws, habitCount: Number(ws.habitCount) || 0 };
          })
        );
        setGroups(withCounts);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      const res = await groupsAPI.createGroup({
        name: formData.name,
        description: formData.description,
        type: formData.type || "team",
        color: formData.color,
        settings: {
          isPublic: !formData.isPrivate,
          privacyLevel: formData.isPrivate ? "invite-only" : "open",
        },
      });
      if (res.success) {
        setShowCreateModal(false);
        navigate(`/app/groups/${res.group._id}`);
      }
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  /* ── type → icon map ─────────────── */

  const typeIcon = {
    family:    <Users     size={28} weight="duotone" />,
    team:      <Handshake size={28} weight="duotone" />,
    fitness:   <Barbell   size={28} weight="duotone" />,
    study:     <BookOpen  size={28} weight="duotone" />,
    community: <Globe     size={28} weight="duotone" />,
  };

  /* ── derived stats ──────────────────── */

  const totalMembers = groups.reduce(
    (s, g) => s + (g.members?.length || 0),
    0
  );
  const totalHabits = groups.reduce(
    (s, g) => s + (typeof g.habitCount === "number" ? g.habitCount : 0),
    0
  );

  /* ── recently active check — glass treatment for groups updated in last 24h ── */
  const isRecentlyActive = (group) => {
    if (!group.updatedAt) return false;
    const elapsed = Date.now() - new Date(group.updatedAt).getTime();
    return elapsed < 24 * 60 * 60 * 1000;
  };

  /* ── loading skeleton ───────────────── */

  const groupsSkeleton = (
    <div className="min-h-screen page-container px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-10 w-48 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
        <div className="h-5 w-72 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[180px] rounded-2xl bg-[var(--color-surface-elevated)] animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );

  /* ── render ──────────────────────────── */

  return (
    <SkeletonTransition isLoading={isLoading} skeleton={groupsSkeleton}>
    <div className="min-h-screen page-container px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold font-garamond text-[var(--color-text-primary)] mb-1">
              Groups
            </h1>
            <p className="text-base text-[var(--color-text-secondary)] font-spartan">
              {groups.length} group{groups.length !== 1 && "s"} · {totalMembers}{" "}
              member{totalMembers !== 1 && "s"} · {totalHabits} shared habit
              {totalHabits !== 1 && "s"}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 h-10 px-5 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Group
          </button>
        </div>

        {/* empty state */}
        {groups.length === 0 ? (
          <div className="glass-card-minimal rounded-2xl p-12 text-center max-w-lg mx-auto">
            <p className="text-6xl mb-6">👥</p>
            <h2 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)] mb-2">
              No groups yet
            </h2>
            <p className="text-base text-[var(--color-text-secondary)] font-spartan max-w-sm mx-auto mb-8">
              Create your first group to start tracking habits with your team,
              family, or community.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-12 px-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
            >
              Create a Group
            </button>
          </div>
        ) : (
          /* grid cards */
          <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group, i) => {
              const color = group.color || "#4f46e5";
              const memberCount = group.members?.length || 0;
              const featured = isRecentlyActive(group);

              return (
                <motion.div key={group._id} variants={listItemVariants} custom={i}>
                <button
                  onClick={() => navigate(`/app/groups/${group._id}`)}
                  className={`relative overflow-hidden rounded-2xl border text-left transition-all duration-200 min-h-[160px] flex flex-col group w-full ${
                    featured
                      ? "glass-card-minimal hover:shadow-lg hover:shadow-[var(--color-brand-500)]/5"
                      : "bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 hover:shadow-md"
                  }`}
                >
                  {/* Color gradient stripe */}
                  <div
                    className="h-1.5 w-full"
                    style={{
                      background: `linear-gradient(to right, ${color}40, ${color}10)`,
                    }}
                  />

                  {/* Main content */}
                  <div className="flex-1 p-5 flex flex-col">
                    {/* Top: icon + name */}
                    <div className="flex items-start gap-4 mb-3">
                      <span
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        {typeIcon[group.type] || <Handshake size={28} weight="duotone" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] truncate">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-0.5 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Bottom row: avatar stack + stats + chevron */}
                    <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-primary)]/10">
                      {/* Avatar stack */}
                      {memberCount > 0 && (
                        <AvatarStack
                          members={group.members || []}
                          max={4}
                          size="sm"
                        />
                      )}

                      {/* Stats */}
                      <div className="flex-1 flex items-center gap-4 text-xs text-[var(--color-text-tertiary)] font-spartan">
                        <span>{memberCount} member{memberCount !== 1 && "s"}</span>
                        <span>{group.habitCount ?? 0} habit{(group.habitCount ?? 0) !== 1 && "s"}</span>
                      </div>

                      {/* Chevron */}
                      <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] flex-shrink-0 transition-colors" />
                    </div>
                  </div>
                </button>
                </motion.div>
              );
            })}
          </AnimatedList>
        )}
      </div>

      {/* create modal */}
      <GroupCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreate}
      />

      {/* toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-spartan font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
    </SkeletonTransition>
  );
};

export default GroupSelection;
