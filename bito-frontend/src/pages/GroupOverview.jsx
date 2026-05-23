import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PersonIcon,
  GearIcon,
  PlusIcon,
  ActivityLogIcon,
  TargetIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  StarIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  CheckCircle, PlusCircle, Fire, HandWaving, Target, Trash,
  Trophy, Handshake, Star, Heart, MapPin, Users, House,
  Envelope, Barbell, BookOpen, Globe,
} from "@phosphor-icons/react";
import HabitIcon from "../components/shared/HabitIcon";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useAppNotifications } from "../hooks/useAppNotifications";
import AvatarStack from "../components/shared/AvatarStack";
import GroupInviteModal from "../components/ui/GroupInviteModal";
import EncouragementModal from "../components/shared/EncouragementModal";
import GroupHabitModal from "../components/ui/GroupHabitModal";
import HabitAdoptModal from "../components/ui/HabitAdoptModal";
import ChallengeWidget from "../components/widgets/ChallengeWidget";
import SkeletonTransition from "../components/ui/SkeletonTransition";

const TABS = [
  { id: "activity",   label: "Activity",    Icon: ActivityLogIcon },
  { id: "habits",     label: "Habits",      Icon: TargetIcon      },
  { id: "members",    label: "Members",     Icon: PersonIcon      },
  { id: "challenges", label: "Challenges",  Icon: StarIcon        },
];

const REACTION_EMOJIS = ["👏", "🔥", "💪", "❤️", "🎉"];

const TYPE_ICONS = {
  family:    <Users     size={26} weight="duotone" />,
  team:      <Handshake size={26} weight="duotone" />,
  fitness:   <Barbell   size={26} weight="duotone" />,
  study:     <BookOpen  size={26} weight="duotone" />,
  community: <Globe     size={26} weight="duotone" />,
};

function defaultHabitForm() {
  return {
    name: "",
    description: "",
    category: "health",
    icon: "Target",
    color: "#4f46e5",
    defaultTarget: { value: 1, unit: "times" },
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], reminderTime: "", reminderEnabled: false },
    isRequired: false,
  };
}

/* ================================================================
   GroupOverview
   ================================================================ */
const GroupOverview = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { group: wsNotif, habit: habitNotif } = useAppNotifications();

  const [group, setGroup] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [groupHabits, setGroupHabits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showEditHabitModal, setShowEditHabitModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [adoptingHabit, setAdoptingHabit] = useState(null);
  const [encouragementModal, setEncouragementModal] = useState({ isOpen: false, targetUser: null, habitId: null });

  const [inviteForm, setInviteForm] = useState({ email: "", role: "member", message: "" });
  const [habitForm, setHabitForm] = useState(defaultHabitForm());
  const [formTab, setFormTab] = useState("details");

  const [reactions, setReactions] = useState({});

  /* ── fetch ──────────────────────────── */

  useEffect(() => {
    fetchGroupData();

    const onUpdate = (e) => {
      const ws = e.detail.group;
      if (group && group._id === ws._id) setGroup((p) => ({ ...p, ...ws }));
    };
    window.addEventListener("groupUpdated", onUpdate);
    return () => window.removeEventListener("groupUpdated", onUpdate);
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const [groupRes, overviewRes, habitsRes, activityRes] = await Promise.all([
        groupsAPI.getGroup(groupId),
        groupsAPI.getGroupOverview(groupId).catch(() => null),
        groupsAPI.getGroupHabits(groupId).catch(() => ({ habits: [] })),
        groupsAPI.getGroupActivity(groupId, { limit: 20 }).catch(() => ({ activities: [] })),
      ]);

      if (groupRes.success) {
        setGroup(groupRes.group);
        setMembers(groupRes.group.members || []);
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

  /* ── permissions ──────────────────── */

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
  const canCreateHabits =
    canManage ||
    (userRole === "member" && group?.settings?.allowMemberHabitCreation !== false);

  /* ── habit helpers ──────────────────── */

  const toHabitPayload = (form) => ({
    name: form.name,
    description: form.description,
    category: form.category,
    icon: form.icon,
    color: form.color,
    isRequired: Boolean(form.isRequired),
    defaultTarget: {
      value: Math.max(1, Number(form.defaultTarget?.value) || 1),
      unit: form.defaultTarget?.unit === "time" ? "times" : (form.defaultTarget?.unit || "times"),
    },
    schedule: {
      days: Array.isArray(form.schedule?.days) ? form.schedule.days : [0, 1, 2, 3, 4, 5, 6],
      reminderEnabled: Boolean(form.schedule?.reminderEnabled),
      reminderTime: form.schedule?.reminderTime || "",
    },
    settings: {
      allowCustomization: true,
      visibility: "all",
      defaultTarget: {
        value: Math.max(1, Number(form.defaultTarget?.value) || 1),
        unit: form.defaultTarget?.unit === "time" ? "times" : (form.defaultTarget?.unit || "times"),
      },
    },
  });

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

  /* ── handlers ───────────────────────── */

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
      const res = await groupsAPI.createGroupHabit(groupId, toHabitPayload(habitForm));
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
      icon: h.icon || "Target",
      defaultTarget: h.defaultSettings?.target || h.settings?.defaultTarget || { value: 1, unit: "times" },
      schedule: h.defaultSettings?.schedule || h.settings?.schedule || {
        days: [0, 1, 2, 3, 4, 5, 6],
        reminderTime: "",
        reminderEnabled: false,
      },
      isRequired: h.groupSettings?.isRequired || h.isRequired || false,
    });
    setFormTab("details");
    setShowEditHabitModal(true);
  };

  const handleUpdateHabit = async () => {
    try {
      const res = await groupsAPI.updateGroupHabit(groupId, selectedHabit._id, toHabitPayload(habitForm));
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
      await groupsAPI.adoptGroupHabit(groupId, adoptingHabit._id, {
        personalSettings: { shareProgress: "full" },
      });
      await fetchGroupData();
      habitNotif.adopted(adoptingHabit.name);
    } catch (err) {
      habitNotif.error("adopt", "You may have already adopted it.");
    }
  };

  const toggleReaction = async (activityId, emoji) => {
    setReactions((prev) => {
      const act = { ...(prev[activityId] || {}) };
      act[emoji] = (act[emoji] || 0) + 1;
      return { ...prev, [activityId]: act };
    });
    const emojiToType = { "👏": "clap", "🔥": "fire", "💪": "celebrate", "❤️": "heart", "🎉": "celebrate" };
    try {
      await groupsAPI.addReaction(activityId, emojiToType[emoji] || "like");
    } catch { /* leave optimistic update */ }
  };

  const openEncouragement = (targetUser, habitId = null) =>
    setEncouragementModal({ isOpen: true, targetUser, habitId });

  const closeEncouragement = () =>
    setEncouragementModal({ isOpen: false, targetUser: null, habitId: null });

  function resetHabitForm() {
    setHabitForm(defaultHabitForm());
    setFormTab("details");
  }

  /* ── skeleton ───────────────────────── */

  const skeleton = (
    <div className="min-h-screen page-container px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-4 w-40 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-7 w-48 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
            <div className="h-4 w-72 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
          </div>
        </div>
        <div className="flex gap-6 border-b border-[var(--color-border-primary)]/20 pb-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-20 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--color-surface-elevated)] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  if (!group && !loading) {
    return (
      <div className="min-h-screen page-container px-6 py-10">
        <div className="max-w-4xl mx-auto text-center py-24">
          <h1 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] mb-2">
            Group not found
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mb-6">
            This group doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate("/app/groups")}
            className="h-9 px-5 bg-[var(--color-brand-600)] text-white rounded-lg text-sm font-spartan font-medium"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const groupColor = group?.color || "#4f46e5";

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <SkeletonTransition isLoading={loading} skeleton={skeleton}>
      {group ? (
        <div className="min-h-screen page-container px-6 py-10">
          <div className="max-w-4xl mx-auto">

            {/* ── Breadcrumb ──────────────── */}
            <div className="flex items-center gap-2 text-sm font-spartan text-[var(--color-text-tertiary)] mb-6">
              <button
                onClick={() => navigate("/app/groups")}
                className="hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Groups
              </button>
              <ChevronRightIcon className="w-3.5 h-3.5" />
              <span className="text-[var(--color-text-primary)] font-medium">{group.name}</span>
            </div>

            {/* ── Group header ─────────────── */}
            <div className="flex items-start gap-4 mb-8">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${groupColor}15`, color: groupColor }}
              >
                {TYPE_ICONS[group.type] || <Handshake size={26} weight="duotone" />}
              </div>

              {/* Name + description + stats */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold font-garamond text-[var(--color-text-primary)] leading-tight">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] font-spartan mt-0.5">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {members.length > 0 && (
                    <AvatarStack members={members} max={5} size="sm" />
                  )}
                  <span className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                    {members.length} member{members.length !== 1 && "s"}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                    {groupHabits.length} habit{groupHabits.length !== 1 && "s"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {canManage && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[var(--color-border-primary)]/25 text-sm font-spartan text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]/45 transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Invite
                  </button>
                )}
                <button
                  onClick={() => navigate(`/app/groups/${groupId}/settings`)}
                  className="w-9 h-9 rounded-lg border border-[var(--color-border-primary)]/20 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-primary)]/40 transition-colors"
                >
                  <GearIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Underline tabs ───────────── */}
            <div className="flex border-b border-[var(--color-border-primary)]/20 mb-8 -mx-6 px-6 overflow-x-auto">
              {TABS.map(({ id, label, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`relative flex items-center gap-2 px-1 py-3 mr-7 text-sm font-spartan font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                        style={{ backgroundColor: groupColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Tab content ──────────────── */}
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
                canCreateHabits={canCreateHabits}
                canManage={canManage}
                currentUserId={currentUserId}
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

            {activeTab === "challenges" && (
              <ChallengeWidget groupId={groupId} />
            )}
          </div>

          {/* ── Modals ──────────────────────── */}
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
              onClose={() => { setShowAddHabitModal(false); resetHabitForm(); }}
              mode="add"
              groupId={groupId}
              habitForm={habitForm}
              setHabitForm={setHabitForm}
              activeTab={formTab}
              setActiveTab={setFormTab}
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
              onClose={() => { setShowEditHabitModal(false); setSelectedHabit(null); resetHabitForm(); }}
              mode="edit"
              habit={selectedHabit}
              groupId={groupId}
              habitForm={habitForm}
              setHabitForm={setHabitForm}
              activeTab={formTab}
              setActiveTab={setFormTab}
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
              onClose={() => { setShowAdoptModal(false); setAdoptingHabit(null); }}
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
            groupId={groupId}
            habitId={encouragementModal.habitId}
            onEncouragementSent={() => {}}
          />
        </div>
      ) : null}
    </SkeletonTransition>
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
    const name = a.userId?.name || a.user?.name || a.userId?.email || "A member";
    switch (a.type) {
      case "habit_completed":
        return `${name} completed ${a.data?.habitName || "a habit"}${
          a.data?.streakCount > 1 ? ` · ${a.data.streakCount}-day streak` : ""
        }`;
      case "habit_adopted":     return `${name} adopted ${a.data?.habitName || "a new habit"}`;
      case "streak_milestone":  return `${name} reached ${a.data?.streakCount || 0} days on ${a.data?.habitName || "a habit"}`;
      case "member_joined":     return `${name} joined the group`;
      case "habit_created":     return `${name} created ${a.data?.habitName || "a group habit"}`;
      case "habit_deleted":     return `${name} removed ${a.data?.habitName || "a group habit"}`;
      case "challenge_started": return `${name} started "${a.data?.challengeName || "a challenge"}"`;
      case "challenge_joined":  return `${name} joined "${a.data?.challengeName || "a challenge"}"`;
      case "challenge_milestone": return `${name} hit a milestone in "${a.data?.challengeName || "a challenge"}"`;
      case "kudos":             return `${name} sent kudos to ${a.data?.targetUserName || "a teammate"}`;
      default:                  return a.data?.message || a.description || `${name} did something`;
    }
  };

  const iconBgFor = (type) => {
    const map = {
      habit_completed:    "bg-emerald-500/10",
      habit_adopted:      "bg-blue-500/10",
      streak_milestone:   "bg-orange-500/10",
      member_joined:      "bg-yellow-500/10",
      habit_created:      "bg-indigo-500/10",
      habit_deleted:      "bg-red-500/10",
      challenge_started:  "bg-amber-500/10",
      challenge_joined:   "bg-teal-500/10",
      challenge_milestone:"bg-yellow-500/10",
      kudos:              "bg-rose-500/10",
    };
    return map[type] || "bg-[var(--color-surface-elevated)]";
  };

  const iconFor = (type) => {
    const p = { size: 14, weight: "fill" };
    const map = {
      habit_completed:    <CheckCircle  {...p} className="text-emerald-500" />,
      habit_adopted:      <PlusCircle   {...p} className="text-blue-500" />,
      streak_milestone:   <Fire         {...p} className="text-orange-500" />,
      member_joined:      <HandWaving   {...p} className="text-yellow-500" />,
      habit_created:      <Target       {...p} className="text-indigo-500" />,
      habit_deleted:      <Trash        {...p} className="text-red-400" />,
      challenge_started:  <Trophy       {...p} className="text-amber-500" />,
      challenge_joined:   <Handshake    {...p} className="text-teal-500" />,
      challenge_milestone:<Star         {...p} className="text-yellow-500" />,
      kudos:              <Heart        {...p} className="text-rose-500" />,
    };
    return map[type] || <MapPin {...p} className="text-[var(--color-text-tertiary)]" />;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-4">
          <Envelope size={24} weight="regular" className="text-[var(--color-text-tertiary)]" />
        </div>
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
    <ul className="space-y-px">
      {activities.map((a, i) => {
        const id = a._id || i;
        const actReactions = reactions[id] || {};
        const name = a.userId?.name || a.user?.name || "?";

        return (
          <li
            key={id}
            className="flex gap-4 py-4 border-b border-[var(--color-border-primary)]/10 last:border-0 group/item"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {a.userId?.avatar ? (
                <img
                  src={a.userId.avatar}
                  alt={name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--color-brand-600)]/15 flex items-center justify-center text-[var(--color-brand-600)] text-sm font-spartan font-semibold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm text-[var(--color-text-primary)] font-spartan leading-relaxed">
                  {descriptionFor(a)}
                </p>
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${iconBgFor(a.type)}`}
                >
                  {iconFor(a.type)}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-quaternary)] font-spartan mt-1">
                {timeAgo(a.createdAt)}
              </p>

              {/* Reactions */}
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
                          : "hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      {emoji}
                      {count > 0 && <span className="ml-0.5">{count}</span>}
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
function HabitsTab({ habits, canCreateHabits, canManage, currentUserId, isAdopted, onAdd, onEdit, onAdopt }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-[var(--color-text-tertiary)] font-spartan">
          {habits.length} habit{habits.length !== 1 && "s"} available
        </p>
        {canCreateHabits && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 h-8 px-3.5 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-lg text-xs font-spartan font-medium transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Add Habit
          </button>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-4">
            <Target size={24} weight="regular" className="text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
            No habits yet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
            {canCreateHabits
              ? "Add the first habit to get your group started."
              : "Only managers can add habits for this group."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {habits.map((h) => {
            const adopted = isAdopted(h);
            const creatorId = (h.createdBy?._id || h.createdBy || "").toString();
            const canEdit = canManage || creatorId === currentUserId?.toString();

            return (
              <li
                key={h._id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-150 ${
                  adopted
                    ? "bg-emerald-500/[0.04] border-emerald-500/15"
                    : "bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]/15 hover:border-[var(--color-border-primary)]/35 cursor-pointer"
                }`}
                onClick={() => !adopted && onAdopt(h)}
              >
                <span className="flex-shrink-0">
                  <HabitIcon icon={h.icon} size={18} />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                      {h.name}
                    </p>
                    {adopted && (
                      <CheckCircledIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  {h.description && (
                    <p className="text-xs text-[var(--color-text-tertiary)] font-spartan truncate mt-0.5">
                      {h.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(h); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <GearIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span
                    className={`text-xs font-spartan font-medium px-2.5 py-1 rounded-lg ${
                      adopted
                        ? "bg-emerald-500/10 text-emerald-600"
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
function MembersTab({ members, currentUserId, canManage, groupId, navigate, onInvite, onEncourage }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-[var(--color-text-tertiary)] font-spartan">
          {members.length} member{members.length !== 1 && "s"}
        </p>
        {canManage && (
          <button
            onClick={onInvite}
            className="flex items-center gap-1.5 h-8 px-3.5 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-lg text-xs font-spartan font-medium transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Invite
          </button>
        )}
      </div>

      <ul className="space-y-px">
        {members.map((m, idx) => {
          const info = m.userId || m.user || m;
          const name = info.name || info.email || "Unknown";
          const email = info.email;
          const memberId = (m.userId?._id || m.userId || m._id || m.id || "").toString();
          const isYou = memberId === currentUserId?.toString();

          return (
            <li
              key={memberId || idx}
              className="flex items-center gap-3 py-3.5 border-b border-[var(--color-border-primary)]/10 last:border-0 group/member"
            >
              {/* Avatar */}
              {info.avatar ? (
                <img src={info.avatar} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--color-brand-600)]/15 flex items-center justify-center text-[var(--color-brand-600)] text-sm font-spartan font-semibold flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)] truncate">
                  {name}
                  {isYou && (
                    <span className="ml-2 text-xs text-[var(--color-brand-600)] font-normal">you</span>
                  )}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan capitalize">
                  {m.role}
                  {email && email !== name && ` · ${email}`}
                </p>
              </div>

              {/* Actions */}
              {!isYou && (
                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover/member:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEncourage(info)}
                    className="text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-600)] transition-colors"
                  >
                    Encourage
                  </button>
                  <button
                    onClick={() => navigate(`/app/groups/${groupId}/members/${memberId}/dashboard`)}
                    className="flex items-center gap-1 text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
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

export default GroupOverview;
