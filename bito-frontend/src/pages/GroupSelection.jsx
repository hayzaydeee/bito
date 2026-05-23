import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Users, Handshake, Barbell, BookOpen, Globe } from "@phosphor-icons/react";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import GroupCreationModal from "../components/ui/GroupCreationModal";
import AvatarStack from "../components/shared/AvatarStack";
import SkeletonTransition from "../components/ui/SkeletonTransition";
import AnimatedList from "../components/ui/AnimatedList";
import { motion } from "framer-motion";
import { listItemVariants } from "../utils/motion";

const TYPE_ICONS = {
  family:    <Users     size={20} weight="duotone" />,
  team:      <Handshake size={20} weight="duotone" />,
  fitness:   <Barbell   size={20} weight="duotone" />,
  study:     <BookOpen  size={20} weight="duotone" />,
  community: <Globe     size={20} weight="duotone" />,
};

const GroupSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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
              } catch { /* fallback */ }
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

  const totalMembers = groups.reduce((s, g) => s + (g.members?.length || 0), 0);
  const totalHabits = groups.reduce(
    (s, g) => s + (typeof g.habitCount === "number" ? g.habitCount : 0),
    0
  );

  const isRecentlyActive = (group) => {
    if (!group.updatedAt) return false;
    return Date.now() - new Date(group.updatedAt).getTime() < 24 * 60 * 60 * 1000;
  };

  const skeleton = (
    <div className="min-h-screen page-container px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-9 w-36 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
        <div className="h-4 w-64 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[120px] rounded-2xl bg-[var(--color-surface-elevated)] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <SkeletonTransition isLoading={isLoading} skeleton={skeleton}>
      <div className="min-h-screen page-container px-6 py-10">
        <div className="max-w-4xl mx-auto">

          {/* ── Header ─────────────────────── */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold font-garamond text-[var(--color-text-primary)]">
                Groups
              </h1>
              {groups.length > 0 && (
                <p className="text-sm text-[var(--color-text-tertiary)] font-spartan mt-1">
                  {groups.length} group{groups.length !== 1 && "s"} &middot;{" "}
                  {totalMembers} member{totalMembers !== 1 && "s"} &middot;{" "}
                  {totalHabits} shared habit{totalHabits !== 1 && "s"}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 h-9 px-4 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-lg text-sm font-spartan font-medium transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              New Group
            </button>
          </div>

          {/* ── Empty state ────────────────── */}
          {groups.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-5">
                <Users size={28} weight="regular" className="text-[var(--color-text-tertiary)]" />
              </div>
              <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] mb-2">
                No groups yet
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] font-spartan max-w-xs mx-auto mb-6">
                Create your first group to start tracking habits with your team,
                family, or community.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-5 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-lg text-sm font-spartan font-medium transition-colors"
              >
                Create a Group
              </button>
            </div>
          ) : (
            /* ── Group cards grid ─────────── */
            <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groups.map((group, i) => {
                const color = group.color || "#4f46e5";
                const memberCount = group.members?.length || 0;
                const active = isRecentlyActive(group);

                return (
                  <motion.div key={group._id} variants={listItemVariants} custom={i}>
                    <button
                      onClick={() => navigate(`/app/groups/${group._id}`)}
                      className="group w-full text-left rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/15 hover:border-[var(--color-border-primary)]/35 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="p-5 flex gap-4">
                        {/* Icon */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {TYPE_ICONS[group.type] || <Handshake size={20} weight="duotone" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-base font-garamond font-bold text-[var(--color-text-primary)] truncate">
                              {group.name}
                            </h3>
                            {active && (
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                          </div>

                          {group.description && (
                            <p className="text-xs text-[var(--color-text-tertiary)] font-spartan line-clamp-1">
                              {group.description}
                            </p>
                          )}

                          {/* Bottom row */}
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border-primary)]/10">
                            {memberCount > 0 && (
                              <AvatarStack members={group.members || []} max={3} size="xs" />
                            )}
                            <span className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                              {memberCount} member{memberCount !== 1 && "s"}
                            </span>
                            <span className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                              {group.habitCount ?? 0} habit{(group.habitCount ?? 0) !== 1 && "s"}
                            </span>
                            <ChevronRightIcon className="w-3.5 h-3.5 text-[var(--color-text-quaternary)] group-hover:text-[var(--color-text-tertiary)] ml-auto flex-shrink-0 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatedList>
          )}
        </div>

        {/* ── Modals ──────────────────────── */}
        <GroupCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />

        {/* ── Toast ───────────────────────── */}
        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-spartan font-medium ${
              toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
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
