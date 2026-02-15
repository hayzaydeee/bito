import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PlusIcon,
  PersonIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import WorkspaceCreationModal from "../components/ui/WorkspaceCreationModal";

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
      const ws = e.detail.workspace;
      setGroups((prev) =>
        prev.map((g) => (g._id === ws._id ? { ...g, ...ws } : g))
      );
    };
    window.addEventListener("workspaceUpdated", onUpdate);
    return () => window.removeEventListener("workspaceUpdated", onUpdate);
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
          res.workspaces.map(async (ws) => {
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
        isPublic: !formData.isPrivate,
        color: formData.color,
      });
      if (res.success) {
        setShowCreateModal(false);
        navigate(`/app/groups/${res.workspace._id}`);
      }
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  /* ── type → emoji map ───────────────── */

  const typeEmoji = {
    family: "👨‍👩‍👧‍👦",
    team: "💼",
    fitness: "💪",
    study: "📚",
    community: "🌍",
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

  /* ── loading skeleton ───────────────── */

  if (isLoading) {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-10 w-40 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="h-5 w-64 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="mt-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-[var(--color-surface-elevated)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── render ──────────────────────────── */

  return (
    <div className="min-h-screen page-container px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold font-garamond text-[var(--color-text-primary)] mb-1">
              Groups
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
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

        {/* list */}
        {groups.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-6">👥</p>
            <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] mb-2">
              No groups yet
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan max-w-sm mx-auto mb-8">
              Create your first group to start tracking habits with your team,
              family, or community.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-10 px-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
            >
              Create a Group
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => (
              <li key={group._id}>
                <button
                  onClick={() => navigate(`/app/groups/${group._id}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 transition-colors text-left group"
                >
                  {/* icon */}
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{
                      backgroundColor: `${group.color || "#4f46e5"}18`,
                    }}
                  >
                    {typeEmoji[group.type] || "💼"}
                  </span>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-garamond font-semibold text-[var(--color-text-primary)] truncate">
                      {group.name}
                    </p>
                    {group.description && (
                      <p className="text-xs text-[var(--color-text-tertiary)] font-spartan truncate mt-0.5">
                        {group.description}
                      </p>
                    )}
                  </div>

                  {/* stats */}
                  <div className="hidden sm:flex items-center gap-5 text-xs text-[var(--color-text-secondary)] font-spartan flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <PersonIcon className="w-3.5 h-3.5" />
                      {group.members?.length || 0}
                    </span>
                    <span>{group.habitCount ?? 0} habits</span>
                  </div>

                  {/* chevron */}
                  <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] flex-shrink-0 transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* create modal */}
      <WorkspaceCreationModal
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
  );
};

export default GroupSelection;
