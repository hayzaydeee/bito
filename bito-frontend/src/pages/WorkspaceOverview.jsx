import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PersonIcon,
  GearIcon,
  PlusIcon,
  ActivityLogIcon,
  TargetIcon,
  CheckCircledIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  StarIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useAppNotifications } from "../hooks/useAppNotifications";
import GroupInviteModal from "../components/ui/GroupInviteModal";
import EncouragementModal from "../components/shared/EncouragementModal";
import GroupHabitModal from "../components/ui/GroupHabitModal";
import HabitAdoptModal from "../components/ui/HabitAdoptModal";

/* ================================================================
   Tab IDs
   ================================================================ */
const TABS = [
  { id: "activity", label: "Activity", icon: ActivityLogIcon },
  { id: "habits", label: "Habits", icon: TargetIcon },
  { id: "members", label: "Members", icon: PersonIcon },
  { id: "challenges", label: "Challenges", icon: StarIcon },
];

/* ================================================================
   Reaction emoji set for inline reactions
   ================================================================ */
const REACTION_EMOJIS = ["👏", "🔥", "💪", "❤️", "🎉"];

/* ================================================================
   Component
   ================================================================ */
const WorkspaceOverview = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspace: wsNotif, habit: habitNotif, app } = useAppNotifications();

  /* ── core state ───────────────────────── */
  const [group, setGroup] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [groupHabits, setGroupHabits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");

  /* ── modal state ──────────────────────── */
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showEditHabitModal, setShowEditHabitModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [adoptingHabit, setAdoptingHabit] = useState(null);
  const [encouragementModal, setEncouragementModal] = useState({
    isOpen: false,
    targetUser: null,
    habitId: null,
  });

  /* ── form state ───────────────────────── */
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member",
    message: "",
  });
  const [habitForm, setHabitForm] = useState(defaultHabitForm());
  const [formTab, setFormTab] = useState("details");
  const [emojiCategory, setEmojiCategory] = useState("common");

  /* ── inline reactions local state ─────── */
  const [reactions, setReactions] = useState({}); // { activityId: { emoji: count } }

  /* ── data fetching ────────────────────── */

  useEffect(() => {
    fetchGroupData();

    const onUpdate = (e) => {
      const ws = e.detail.workspace;
      if (group && group._id === ws._id) setGroup((p) => ({ ...p, ...ws }));
    };
    window.addEventListener("workspaceUpdated", onUpdate);
    return () => window.removeEventListener("workspaceUpdated", onUpdate);
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);

      const [groupRes, overviewRes, habitsRes, activityRes] = await Promise.all(
        [
          groupsAPI.getGroup(groupId),
          groupsAPI.getGroupOverview(groupId).catch(() => null),
          groupsAPI.getGroupHabits(groupId).catch(() => ({ habits: [] })),
          groupsAPI
            .getGroupActivity(groupId, { limit: 20 })
            .catch(() => ({ activities: [] })),
        ]
      );

      if (groupRes.success) {
        const info = groupRes.group || groupRes.workspace;
        setGroup(info);
        setMembers(info.members || []);
      }
      if (overviewRes?.success) setOverview(overviewRes.overview);
      setGroupHabits(habitsRes.habits || []);
      setActivities(activityRes.activities || []);
    } catch (err) {
      console.error("Error fetching group data:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── permissions ──────────────────────── */

  const currentUserId = user?._id || user?.id;

  const userMember = members.find((m) => {
    const mid = (m.userId?._id || m.userId || m.id || "").toString();
    return (
      mid === currentUserId?.toString() ||
      mid === user?.id?.toString() ||
      mid === user?._id?.toString()
    );
  });
  const userRole = userMember?.role || "member";
  const canManage = userRole === "owner" || userRole === "admin";

  /* ── habit helpers ────────────────────── */

  const isAdopted = (h) => {
    if (!h.adoptedBy?.length || !user) return false;
    return h.adoptedBy.some((a) => {
      const aid = (
        a?._id ||
        (typeof a?.userId === "object" ? a.userId._id : a?.userId) ||
        a ||
        ""
      ).toString();
      return aid === currentUserId?.toString();
    });
  };

  /* ── handlers (invites, habits, adopt) ── */

  const handleInvite = async () => {
    try {
      const res = await groupsAPI.inviteMember(groupId, inviteForm);
      if (res.success) {
        setShowInviteModal(false);
        setInviteForm({ email: "", role: "member", message: "" });
        wsNotif.inviteSent(inviteForm.email);
        fetchGroupData();
      }
    } catch (err) {
      wsNotif.error("send invitation", err.message || "Please try again.");
    }
  };

  const handleAddHabit = async () => {
    try {
      const res = await groupsAPI.createGroupHabit(groupId, habitForm);
      if (res.success) {
        setShowAddHabitModal(false);
        resetHabitForm();
        habitNotif.created(habitForm.name);
        fetchGroupData();
      }
    } catch (err) {
      habitNotif.error("create", err.message || "Please try again.");
    }
  };

  const handleEditHabitOpen = (h) => {
    setSelectedHabit(h);
    setHabitForm({
      name: h.name || "",
      description: h.description || "",
      category: h.category || "health",
      icon: h.icon || "🎯",
      color: h.color || "#4f46e5",
      defaultTarget: h.settings?.defaultTarget || { value: 1, unit: "time" },
      schedule: h.settings?.schedule || {
        days: [0, 1, 2, 3, 4, 5, 6],
        reminderTime: "",
        reminderEnabled: false,
      },
      isRequired: h.isRequired || false,
    });
    setFormTab("details");
    setShowEditHabitModal(true);
  };

  const handleUpdateHabit = async () => {
    try {
      const res = await groupsAPI.updateGroupHabit(groupId, selectedHabit._id, {
        ...habitForm,
        settings: {
          defaultTarget: habitForm.defaultTarget,
          schedule: habitForm.schedule,
        },
      });
      if (res.success) {
        setShowEditHabitModal(false);
        habitNotif.updated(habitForm.name);
        fetchGroupData();
      }
    } catch (err) {
      habitNotif.error("update", err.message || "Please try again.");
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      const res = await groupsAPI.deleteGroupHabit(groupId, habitId);
      if (res.success) {
        setShowEditHabitModal(false);
        habitNotif.deleted("Group habit");
        fetchGroupData();
      }
    } catch (err) {
      habitNotif.error("delete", err.message || "Please try again.");
    }
  };

  const handleAdopt = async () => {
    try {
      if (!adoptingHabit) return;
      await groupsAPI.adoptWorkspaceHabit(groupId, adoptingHabit._id, {
        personalSettings: { shareProgress: "full" },
      });
      await fetchGroupData();
      habitNotif.adopted(adoptingHabit.name);
    } catch (err) {
      habitNotif.error("adopt", "You may have already adopted it.");
    }
  };

  /* ── inline reaction handler ──────────── */

  const toggleReaction = (activityId, emoji) => {
    setReactions((prev) => {
      const act = { ...(prev[activityId] || {}) };
      act[emoji] = (act[emoji] || 0) + 1;
      return { ...prev, [activityId]: act };
    });
  };

  /* ── encouragement ────────────────────── */

  const openEncouragement = (targetUser, habitId = null) =>
    setEncouragementModal({ isOpen: true, targetUser, habitId });
  const closeEncouragement = () =>
    setEncouragementModal({ isOpen: false, targetUser: null, habitId: null });

  /* ── utility ──────────────────────────── */

  function defaultHabitForm() {
    return {
      name: "",
      description: "",
      category: "health",
      icon: "🎯",
      color: "#4f46e5",
      defaultTarget: { value: 1, unit: "time" },
      schedule: {
        days: [0, 1, 2, 3, 4, 5, 6],
        reminderTime: "",
        reminderEnabled: false,
      },
      isRequired: false,
    };
  }
  function resetHabitForm() {
    setHabitForm(defaultHabitForm());
    setFormTab("details");
    setEmojiCategory("common");
  }

  /* ── loading / not-found ──────────────── */

  if (loading) {
    return (
      <div className="min-h-screen page-container px-6 py-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="h-5 w-72 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="mt-6 flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse"
              />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[var(--color-surface-elevated)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen page-container px-6 py-10">
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="text-2xl font-garamond font-bold text-[var(--color-text-primary)] mb-3">
            Group not found
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mb-6">
            This group doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate("/app/groups")}
            className="h-10 px-5 bg-[var(--color-brand-600)] text-white rounded-xl text-sm font-spartan font-medium"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  /* ── type → emoji map ───────────────── */
  const typeEmoji = {
    family: "👨‍👩‍👧‍👦",
    team: "💼",
    fitness: "💪",
    study: "📚",
    community: "🌍",
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="min-h-screen page-container px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* ── header ──────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/app/groups")}
            className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>

          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{
              backgroundColor: `${group.color || "#4f46e5"}18`,
            }}
          >
            {typeEmoji[group.type] || "💼"}
          </span>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-garamond text-[var(--color-text-primary)] truncate">
              {group.name}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan truncate">
              {group.description ||
                `${members.length} member${members.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            onClick={() => navigate(`/app/groups/${groupId}/settings`)}
            className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors flex-shrink-0"
          >
            <GearIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* ── tab bar ─────────────────── */}
        <div className="flex gap-1 mb-8 bg-[var(--color-surface-elevated)] p-1 rounded-xl border border-[var(--color-border-primary)]/20">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-spartan font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-brand-600)] text-white"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── tab content ─────────────── */}
        {activeTab === "activity" && (
          <ActivityTab
            activities={activities}
            reactions={reactions}
            onReact={toggleReaction}
          />
        )}

        {activeTab === "habits" && (
          <HabitsTab
            habits={groupHabits}
            canManage={canManage}
            isAdopted={isAdopted}
            onAdd={() => setShowAddHabitModal(true)}
            onEdit={handleEditHabitOpen}
            onAdopt={(h) => {
              setAdoptingHabit(h);
              setShowAdoptModal(true);
            }}
          />
        )}

        {activeTab === "members" && (
          <MembersTab
            members={members}
            currentUserId={currentUserId}
            canManage={canManage}
            groupId={groupId}
            navigate={navigate}
            onInvite={() => setShowInviteModal(true)}
            onEncourage={openEncouragement}
          />
        )}

        {activeTab === "challenges" && <ChallengesTab />}
      </div>

      {/* ── modals ──────────────────────── */}
      {showInviteModal && (
        <GroupInviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          group={group}
          inviteForm={inviteForm}
          setInviteForm={setInviteForm}
          onInvite={handleInvite}
        />
      )}

      {showAddHabitModal && (
        <GroupHabitModal
          isOpen={showAddHabitModal}
          onClose={() => {
            setShowAddHabitModal(false);
            resetHabitForm();
          }}
          mode="add"
          groupId={groupId}
          habitForm={habitForm}
          setHabitForm={setHabitForm}
          activeTab={formTab}
          setActiveTab={setFormTab}
          emojiCategory={emojiCategory}
          setEmojiCategory={setEmojiCategory}
          onSave={handleAddHabit}
          onSuccess={() => {
            setShowAddHabitModal(false);
            habitNotif.created("Group habit");
            fetchGroupData();
          }}
        />
      )}

      {showEditHabitModal && selectedHabit && (
        <GroupHabitModal
          isOpen={showEditHabitModal}
          onClose={() => {
            setShowEditHabitModal(false);
            setSelectedHabit(null);
            resetHabitForm();
          }}
          mode="edit"
          habit={selectedHabit}
          groupId={groupId}
          habitForm={habitForm}
          setHabitForm={setHabitForm}
          activeTab={formTab}
          setActiveTab={setFormTab}
          emojiCategory={emojiCategory}
          setEmojiCategory={setEmojiCategory}
          onSave={handleUpdateHabit}
          onDelete={handleDeleteHabit}
          onSuccess={() => {
            setShowEditHabitModal(false);
            habitNotif.updated("Group habit");
            fetchGroupData();
          }}
        />
      )}

      {showAdoptModal && adoptingHabit && (
        <HabitAdoptModal
          isOpen={showAdoptModal}
          onClose={() => {
            setShowAdoptModal(false);
            setAdoptingHabit(null);
          }}
          habit={adoptingHabit}
          onAdopt={handleAdopt}
          onSuccess={() => {
            setShowAdoptModal(false);
            habitNotif.adopted(adoptingHabit?.name || "habit");
            fetchGroupData();
          }}
        />
      )}

      <EncouragementModal
        isOpen={encouragementModal.isOpen}
        onClose={closeEncouragement}
        targetUser={encouragementModal.targetUser}
        workspaceId={groupId}
        habitId={encouragementModal.habitId}
        onEncouragementSent={() => {}}
      />
    </div>
  );
};

/* ================================================================
   Tab: Activity
   ================================================================ */
function ActivityTab({ activities, reactions, onReact }) {
  const timeAgo = (dateStr) => {
    if (!dateStr) return "just now";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const descriptionFor = (a) => {
    const name =
      a.userId?.name || a.user?.name || a.userId?.email || "A member";
    switch (a.type) {
      case "habit_completed":
        return `${name} completed ${a.data?.habitName || "a habit"}${
          a.data?.streakCount > 1 ? ` (${a.data.streakCount}-day streak)` : ""
        }`;
      case "habit_adopted":
        return `${name} adopted ${a.data?.habitName || "a new habit"}`;
      case "streak_milestone":
        return `${name} reached ${a.data?.streakCount || 0} days on ${
          a.data?.habitName || "a habit"
        }`;
      case "member_joined":
        return `${name} joined the group`;
      case "habit_created":
        return `${name} created ${a.data?.habitName || "a group habit"}`;
      case "habit_deleted":
        return `${name} removed ${a.data?.habitName || "a group habit"}`;
      default:
        return a.data?.message || a.description || `${name} did something`;
    }
  };

  const iconFor = (type) => {
    const map = {
      habit_completed: "✅",
      habit_adopted: "➕",
      streak_milestone: "🔥",
      member_joined: "👋",
      habit_created: "🎯",
      habit_deleted: "🗑️",
    };
    return map[type] || "📌";
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">📭</p>
        <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
          No activity yet
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
          Start tracking habits to see team activity here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {activities.map((a, i) => {
        const id = a._id || i;
        const actReactions = reactions[id] || {};

        return (
          <li
            key={id}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-elevated)] transition-colors group/item"
          >
            <span className="text-lg mt-0.5 flex-shrink-0">
              {iconFor(a.type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-text-primary)] font-spartan">
                {descriptionFor(a)}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">
                {timeAgo(a.createdAt)}
              </p>

              {/* inline reactions */}
              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {REACTION_EMOJIS.map((emoji) => {
                  const count = actReactions[emoji] || 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact(id, emoji)}
                      className={`h-6 px-1.5 rounded-md text-xs font-spartan transition-colors ${
                        count > 0
                          ? "bg-[var(--color-brand-600)]/10 text-[var(--color-brand-600)] border border-[var(--color-brand-600)]/20"
                          : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      {emoji}
                      {count > 0 && (
                        <span className="ml-0.5">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ================================================================
   Tab: Habits
   ================================================================ */
function HabitsTab({ habits, canManage, isAdopted, onAdd, onEdit, onAdopt }) {
  return (
    <div>
      {/* section header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
          {habits.length} habit{habits.length !== 1 && "s"} available
        </p>
        {canManage && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 h-8 px-3 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-lg text-xs font-spartan font-medium transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add Habit
          </button>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🎯</p>
          <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
            No group habits yet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
            {canManage
              ? "Add the first habit to get started."
              : "Admins can add habits for the group."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {habits.map((h) => {
            const adopted = isAdopted(h);
            return (
              <li
                key={h._id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                  adopted
                    ? "bg-green-500/5 border-green-500/15"
                    : "bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/40 cursor-pointer"
                }`}
                onClick={() => !adopted && onAdopt(h)}
              >
                <span className="text-xl flex-shrink-0">
                  {h.icon || "🎯"}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                      {h.name}
                    </p>
                    {adopted && (
                      <CheckCircledIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  {h.description && (
                    <p className="text-xs text-[var(--color-text-tertiary)] font-spartan truncate mt-0.5">
                      {h.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(h);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <GearIcon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                    </button>
                  )}
                  <span
                    className={`text-xs font-spartan font-medium px-2.5 py-1 rounded-lg ${
                      adopted
                        ? "bg-green-500/10 text-green-600"
                        : "bg-[var(--color-brand-600)]/10 text-[var(--color-brand-600)]"
                    }`}
                  >
                    {adopted ? "Adopted" : "Adopt"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ================================================================
   Tab: Members
   ================================================================ */
function MembersTab({
  members,
  currentUserId,
  canManage,
  groupId,
  navigate,
  onInvite,
  onEncourage,
}) {
  return (
    <div>
      {/* section header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
          {members.length} member{members.length !== 1 && "s"}
        </p>
        {canManage && (
          <button
            onClick={onInvite}
            className="flex items-center gap-1.5 h-8 px-3 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-lg text-xs font-spartan font-medium transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Invite
          </button>
        )}
      </div>

      <ul className="space-y-1">
        {members.map((m, idx) => {
          const info = m.userId || m.user || m;
          const name = info.name || info.email || "Unknown";
          const email = info.email;
          const memberId = (
            m.userId?._id ||
            m.userId ||
            m._id ||
            m.id ||
            ""
          ).toString();
          const isYou = memberId === currentUserId?.toString();

          return (
            <li
              key={memberId || idx}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-elevated)] transition-colors group/member"
            >
              {/* avatar */}
              <div className="w-9 h-9 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white text-sm font-spartan font-bold flex-shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)] truncate">
                  {name}
                  {isYou && (
                    <span className="ml-1.5 text-xs text-[var(--color-brand-600)]">
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                  {m.role}
                  {email && email !== name ? ` · ${email}` : ""}
                </p>
              </div>

              {/* actions */}
              {!isYou && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onEncourage(info)}
                    className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-600)] font-spartan transition-colors opacity-0 group-hover/member:opacity-100"
                  >
                    Encourage
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/app/groups/${groupId}/members/${memberId}/dashboard`
                      )
                    }
                    className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] font-spartan transition-colors"
                  >
                    View
                    <ChevronRightIcon className="w-3 h-3" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================================================================
   Tab: Challenges (placeholder — no API endpoints yet)
   ================================================================ */
function ChallengesTab() {
  return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">🏆</p>
      <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
        Challenges coming soon
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] font-spartan max-w-sm mx-auto">
        Group challenges will let you set streak targets, collective goals, and
        compete with your team. Stay tuned.
      </p>
    </div>
  );
}

export default WorkspaceOverview;
