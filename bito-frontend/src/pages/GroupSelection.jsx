import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusIcon } from "@radix-ui/react-icons";
import { Users, UserPlus } from "@phosphor-icons/react";
import { groupsAPI } from "../services/api";
import GroupCreationModal from "../components/ui/GroupCreationModal";
import JoinGroupModal from "../components/ui/JoinGroupModal";
import GroupCard from "../components/groups/GroupCard";
import FeatureHeader from "../components/shared/standard/FeatureHeader";
import SkeletonTransition from "../components/ui/SkeletonTransition";
import AnimatedList from "../components/ui/AnimatedList";
import "../components/groups/groups-theme.css";

const GroupSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

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

  const openJoinModal = () => { setJoinError(null); setShowJoinModal(true); };

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
          intensity: formData.intensity || "accountable",
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

  const handleJoin = async (code) => {
    if (!code || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await groupsAPI.joinByCode(code);
      if (res.success) {
        setShowJoinModal(false);
        navigate(`/app/groups/${res.group.id}`, {
          state: { notification: { message: res.message, type: "success" } },
        });
      } else {
        setJoinError(res.error || "Invalid invite code.");
      }
    } catch (err) {
      setJoinError(err.message || "Invalid invite code.");
    } finally {
      setJoining(false);
    }
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

  const groupsSkeleton = (
    <div className="grp grp-surface min-h-screen px-4 sm:px-8 py-7 sm:py-12">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-3 w-40 bg-[var(--surface-2)] animate-pulse" />
        <div className="h-12 w-64 bg-[var(--surface-2)] animate-pulse" />
        <div className="h-4 w-80 bg-[var(--surface-2)] animate-pulse" />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[180px] grp-card animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  /* ── render ──────────────────────────── */

  return (
    <SkeletonTransition isLoading={isLoading} skeleton={groupsSkeleton}>
    <div className="grp grp-surface min-h-screen px-4 sm:px-8 py-7 sm:py-12">
      <div className="max-w-6xl mx-auto">

        {/* header — shared Feature-Home masthead */}
        <FeatureHeader
          kicker=""
          title="Groups"
          stats={
            groups.length > 0 ? (
              <>
                <span className="text-[var(--signal)]">{String(groups.length).padStart(2, "0")}</span> ACTIVE
                {"  ·  "}
                <span className="text-[var(--ink-2)]">{totalMembers}</span> MEMBERS
                {"  ·  "}
                <span className="text-[var(--ink-2)]">{totalHabits}</span> SHARED HABITS
              </>
            ) : (
              "TRACK HABITS TOGETHER"
            )
          }
          actions={
            <>
              <button onClick={openJoinModal} className="grp-btn">
                <UserPlus size={15} weight="bold" />
                Join
              </button>
              {groups.length > 0 && (
                <button onClick={() => setShowCreateModal(true)} className="grp-btn grp-btn--signal">
                  <PlusIcon className="w-4 h-4" />
                  New Group
                </button>
              )}
            </>
          }
        />

        {/* empty state */}
        {groups.length === 0 ? (
          <div className="grp-rise max-w-xl mx-auto py-16 grp-card relative overflow-hidden" style={{ animationDelay: "160ms" }}>
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[var(--signal)]/10 blur-3xl pointer-events-none" />
            <div className="px-8 py-4 text-center relative">
              <Users size={48} weight="duotone" className="mx-auto mb-6 text-[var(--signal)]" />
              <p className="grp-kicker mb-3">No groups on record</p>
              <h2 className="grp-display text-3xl font-bold text-[var(--ink)] mb-3">
                Gather the troops
              </h2>
              <p className="text-sm text-[var(--ink-2)] max-w-xs mx-auto mb-8 leading-relaxed">
                Spin up a group from scratch, or punch in an invite code to join one someone shared with you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="grp-btn grp-btn--signal w-full sm:w-auto"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create Group
                </button>
                <button onClick={openJoinModal} className="grp-btn w-full sm:w-auto">
                  <UserPlus size={15} weight="bold" />
                  Join With Code
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* grid cards */
          <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, i) => (
              <div key={group._id} className="grp-rise" style={{ animationDelay: `${160 + i * 60}ms` }}>
                <GroupCard group={group} index={i} />
              </div>
            ))}
          </AnimatedList>
        )}
      </div>

      {/* create modal */}
      <GroupCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreate}
      />

      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => { setShowJoinModal(false); setJoinError(null); }}
        onJoin={handleJoin}
        joining={joining}
        joinError={joinError}
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

