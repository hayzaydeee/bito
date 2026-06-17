import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { groupsAPI, habitsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useAppNotifications } from "../hooks/useAppNotifications";

// New redesigned components
import GroupDetailHeader from "../components/groups/GroupDetailHeader";
import StatsBar from "../components/groups/StatsBar";
import FeedTab from "../components/groups/feed/FeedTab";
import MembersTab from "../components/groups/members/MembersTab";
import HabitsTab from "../components/groups/habits/HabitsTab";
import ChallengesTab from "../components/groups/challenges/ChallengesTab";

// Modals (kept)
import EncouragementModal from "../components/shared/EncouragementModal";
import GroupHabitModal from "../components/ui/GroupHabitModal";
import HabitAdoptModal from "../components/ui/HabitAdoptModal";
import SkeletonTransition from "../components/ui/SkeletonTransition";
import "../components/groups/groups-theme.css";

/* ================================================================
   Tabs (new order)
   ================================================================ */
const TABS = [
  { id: "feed",       label: "Feed" },
  { id: "members",    label: "Members" },
  { id: "habits",     label: "Habits" },
  { id: "challenges", label: "Challenges" },
];

/* ================================================================
   Component
   ================================================================ */
const GroupOverview = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { habit: habitNotif } = useAppNotifications();

  /* ── core state ───────────────────────── */
  const [group, setGroup] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [groupHabits, setGroupHabits] = useState([]);
  const [adoptedHabits, setAdoptedHabits] = useState([]);
  const [myHabits, setMyHabits] = useState([]);
  const [members, setMembers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");

  /* ── modal state ──────────────────────── */
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
  const [habitForm, setHabitForm] = useState(defaultHabitForm());
  const [formTab, setFormTab] = useState("details");

  /* ── data fetching ────────────────────── */

  useEffect(() => {
    fetchGroupData();

    const onUpdate = (e) => {
      const ws = e.detail.group;
      setGroup((p) => (p && p._id === ws._id ? { ...p, ...ws } : p));
    };
    window.addEventListener("groupUpdated", onUpdate);
    return () => window.removeEventListener("groupUpdated", onUpdate);
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);

      const [groupRes, overviewRes, habitsRes, activityRes, challengesRes, memberHabitsRes, myHabitsRes] =
        await Promise.all([
          groupsAPI.getGroup(groupId),
          groupsAPI.getGroupOverview(groupId).catch(() => null),
          groupsAPI.getGroupHabits(groupId).catch(() => ({ habits: [] })),
          groupsAPI.getGroupActivity(groupId, { limit: 30 }).catch(() => ({ activities: [] })),
          groupsAPI.getChallenges(groupId).catch(() => ({ challenges: [] })),
          groupsAPI.getMemberHabits(groupId).catch(() => ({ habits: [] })),
          habitsAPI.getHabits().catch(() => ({ habits: [] })),
        ]);

      if (groupRes.success) {
        const info = groupRes.group || groupRes.group;
        setGroup(info);
        setMembers(info.members || []);
      }
      if (overviewRes?.success) setOverview(overviewRes.overview);
      setGroupHabits(habitsRes.habits || []);
      setActivities(activityRes.activities || []);
      setChallenges(challengesRes.challenges || []);
      setAdoptedHabits(memberHabitsRes.habits || []);
      setMyHabits(myHabitsRes.habits || []);
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
  const canCreateHabits = canManage || (userRole === "member" && group?.settings?.allowMemberHabitCreation !== false);

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

  /* ── handlers (habits, adopt) ─────────── */

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
    } catch {
      habitNotif.error("adopt", "You may have already adopted it.");
    }
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
      icon: "Target",
      color: "#4f46e5",
      defaultTarget: { value: 1, unit: "times" },
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
  }

  /* ── skeleton ────────────────────────── */

  const overviewSkeleton = (
    <div className="grp grp-surface h-full flex flex-col min-h-0 px-4 sm:px-8 py-7 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8 w-full">
        <div className="h-16 grp-card animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 grp-card animate-pulse" />
          ))}
        </div>
        <div className="h-12 bg-[var(--surface-2)] animate-pulse" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 grp-card animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  /* ── loading / not-found ──────────────── */

  if (!group && !loading) {
    return (
      <div className="grp grp-surface h-full flex flex-col min-h-0 px-4 sm:px-8 py-7 sm:py-10">
        <div className="max-w-5xl mx-auto text-center py-24">
          <p className="grp-kicker mb-3">Error — 404</p>
          <h1 className="grp-display text-3xl font-bold text-[var(--ink)] mb-3">
            Group not found
          </h1>
          <p className="text-sm text-[var(--ink-2)] mb-8">
            This group doesn't exist or you don't have access.
          </p>
          <button onClick={() => navigate("/app/groups")} className="grp-btn grp-btn--signal mx-auto">
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  /* ── derived data ─────────────────────── */

  const teamGoalChallenge =
    challenges.find((c) => c.type === "team_goal" && c.status === "active") || null;

  const activeChallenge =
    challenges.find(
      (c) =>
        c.status === "active" &&
        c.type !== "team_goal" &&
        c.participants?.some(
          (p) => (p.userId?._id || p.userId)?.toString() === currentUserId?.toString()
        )
    ) || null;

  const TAB_COUNTS = {
    feed: null,
    members: members.length,
    habits: groupHabits.length,
    challenges: challenges.length,
  };

  /* ================================================================
     RENDER
     ================================================================ */

  return (
    <SkeletonTransition isLoading={loading} skeleton={overviewSkeleton}>
    {group ? (
    <div className="grp grp-surface px-4 sm:px-8 py-7 sm:py-10 h-full flex flex-col min-h-0 space-y-0">
      <div className="max-w-5xl mx-auto flex-shrink-0 space-y-8 pb-8 w-full">

        {/* ── Header ──────────────────────── */}
        <GroupDetailHeader group={group} groupId={groupId} members={members} />

        {/* ── Stats bar ───────────────────── */}
        <StatsBar
          overview={overview}
          members={members}
          teamGoalChallenge={teamGoalChallenge}
          onCreateChallenge={() => setActiveTab("challenges")}
        />

        {/* ── Tab bar (scoreboard index) ──── */}
        <div className="flex items-center gap-7 border-b border-[var(--line-2)] overflow-x-auto">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const count = TAB_COUNTS[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`grp-tab whitespace-nowrap ${active ? "grp-tab--active" : ""}`}
              >
                {tab.label}
                {count != null && <span className="grp-tab__n">{count}</span>}
              </button>
            );
          })}
        </div>

        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-20 scrollbar-hide -mx-4 px-4 sm:-mx-8 sm:px-8">
          <div className="max-w-5xl mx-auto space-y-8">
          {/* ── Tab content ─────────────────── */}

        {activeTab === "feed" && (
          <FeedTab
            groupId={groupId}
            initialActivities={activities}
            currentUserId={currentUserId}
            overview={overview}
            members={members}
            teamGoalChallenge={teamGoalChallenge}
            activeChallenge={activeChallenge}
          />
        )}

        {activeTab === "members" && (
          <MembersTab
            groupId={groupId}
            group={group}
            initialMembers={members}
            currentUserId={currentUserId}
            canManage={canManage}
            onEncourage={openEncouragement}
          />
        )}

        {activeTab === "habits" && (
          <HabitsTab
            groupId={groupId}
            habits={groupHabits}
            adoptedHabits={adoptedHabits}
            totalMembers={members.length}
            canManage={canManage}
            canCreateHabits={canCreateHabits}
            currentUserId={currentUserId}
            isAdopted={isAdopted}
            onAdd={() => {
              resetHabitForm();
              setShowAddHabitModal(true);
            }}
            onEdit={handleEditHabitOpen}
            onAdopt={(h) => {
              setAdoptingHabit(h);
              setShowAdoptModal(true);
            }}
            onRefresh={fetchGroupData}
          />
        )}

        {activeTab === "challenges" && (
          <ChallengesTab
            groupId={groupId}
            challenges={challenges}
            currentUserId={currentUserId}
            myHabits={myHabits}
            onRefresh={fetchGroupData}
            canManage={canManage}
          />
        )}
          </div>
        </div>

      {/* ── Modals ──────────────────────── */}

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
        groupId={groupId}
        habitId={encouragementModal.habitId}
        onEncouragementSent={() => {}}
      />
    </div>
    ) : null}
    </SkeletonTransition>
  );
};

export default GroupOverview;
