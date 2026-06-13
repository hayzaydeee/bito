import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusIcon } from "@radix-ui/react-icons";
import { Users, ArrowRight, UserPlus } from "@phosphor-icons/react";
import { groupsAPI } from "../services/api";
import GroupCreationModal from "../components/ui/GroupCreationModal";
import GroupCard from "../components/groups/GroupCard";
import SkeletonTransition from "../components/ui/SkeletonTransition";
import AnimatedList from "../components/ui/AnimatedList";

const GroupSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Join by code state
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const joinInputRef = useRef(null);

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

  // Focus join input when shown
  useEffect(() => {
    if (showJoinInput && joinInputRef.current) {
      joinInputRef.current.focus();
    }
  }, [showJoinInput]);

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

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await groupsAPI.joinByCode(code);
      if (res.success) {
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
            <p className="text-sm text-[var(--color-text-tertiary)] font-spartan">
              {groups.length > 0
                ? `${groups.length} group${groups.length !== 1 ? "s" : ""} · ${totalMembers} member${totalMembers !== 1 ? "s" : ""} · ${totalHabits} shared habit${totalHabits !== 1 ? "s" : ""}`
                : "Track habits together with your team, family, or friends"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Join by code — header button */}
            {!showJoinInput ? (
              <button
                onClick={() => setShowJoinInput(true)}
                className="flex items-center gap-2 h-10 px-4 border border-[var(--color-border-primary)]/30 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]/60 rounded-xl text-sm font-spartan font-medium transition-colors bg-[var(--color-surface-elevated)]/40"
              >
                <UserPlus size={15} />
                Join a Group
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    ref={joinInputRef}
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                      setJoinError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleJoin();
                      if (e.key === "Escape") { setShowJoinInput(false); setJoinCode(""); setJoinError(null); }
                    }}
                    placeholder="INVITE CODE"
                    maxLength={6}
                    className={`h-10 w-36 px-3 rounded-xl text-sm font-spartan font-medium tracking-widest text-center bg-[var(--color-surface-elevated)] border transition-colors focus:outline-none ${
                      joinError
                        ? "border-red-500/50 text-red-500"
                        : "border-[var(--color-border-primary)]/30 focus:border-[var(--color-brand-500)]/50 text-[var(--color-text-primary)]"
                    }`}
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length < 6 || joining}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white transition-colors disabled:opacity-40"
                >
                  <ArrowRight size={16} weight="bold" />
                </button>
                <button
                  onClick={() => { setShowJoinInput(false); setJoinCode(""); setJoinError(null); }}
                  className="h-10 px-3 text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 h-10 px-5 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New Group
            </button>
          </div>
        </div>

        {/* join error */}
        {joinError && (
          <p className="mb-4 text-sm text-red-500 font-spartan text-right">{joinError}</p>
        )}

        {/* empty state */}
        {groups.length === 0 ? (
          <div className="glass-card-minimal rounded-2xl p-12 text-center max-w-lg mx-auto">
            <div className="mb-6 flex justify-center">
              <Users size={56} weight="duotone" className="text-[var(--color-brand-400)]/50" />
            </div>
            <h2 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)] mb-2">
              No groups yet
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan max-w-xs mx-auto mb-8">
              Start one from scratch, or enter an invite code to join a group someone shared with you.
            </p>

            {/* Two equal CTAs */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-12 px-4 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Create Group
              </button>
              <button
                onClick={() => { setShowJoinInput(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="h-12 px-4 border border-[var(--color-border-primary)]/30 text-[var(--color-text-primary)] hover:border-[var(--color-brand-500)]/40 hover:bg-[var(--color-brand-500)]/5 rounded-xl text-sm font-spartan font-medium transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus size={15} />
                Join a Group
              </button>
            </div>

            {/* Inline join input (shown after clicking Join in empty state) */}
            {showJoinInput && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={joinInputRef}
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                      setJoinError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleJoin();
                      if (e.key === "Escape") { setShowJoinInput(false); setJoinCode(""); setJoinError(null); }
                    }}
                    placeholder="Enter invite code"
                    maxLength={6}
                    className={`flex-1 h-10 px-3 rounded-xl text-sm font-spartan tracking-widest text-center bg-[var(--color-surface-hover)] border transition-colors focus:outline-none ${
                      joinError
                        ? "border-red-500/50"
                        : "border-[var(--color-border-primary)]/20 focus:border-[var(--color-brand-500)]/50"
                    } text-[var(--color-text-primary)]`}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={joinCode.length < 6 || joining}
                    className="h-10 px-4 rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-sm font-spartan font-medium transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {joining ? "Joining…" : "Join"}
                  </button>
                </div>
                {joinError && (
                  <p className="text-xs text-red-500 font-spartan">{joinError}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* grid cards */
          <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div key={group._id}>
                <GroupCard group={group} />
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

