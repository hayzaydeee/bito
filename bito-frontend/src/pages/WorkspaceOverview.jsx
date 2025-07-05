import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Text } from "@radix-ui/themes";
import {
  PersonIcon,
  GearIcon,
  PlusIcon,
  ActivityLogIcon,
  StarIcon,
  TargetIcon,
  CalendarIcon,
  HomeIcon,
  BackpackIcon,
  HeartIcon,
  ChevronRightIcon,
  CheckCircledIcon,
  ArrowLeftIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import BaseGridContainer from "../components/shared/BaseGridContainer";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import GroupInviteModal from "../components/ui/GroupInviteModal";
import EncouragementModal from "../components/shared/EncouragementModal";
import MemberProgressWidget from "../components/widgets/MemberProgressWidget";
import EncouragementFeedWidget from "../components/widgets/EncouragementFeedWidget";
import GroupHabitModal from "../components/ui/GroupHabitModal";
import HabitAdoptModal from "../components/ui/HabitAdoptModal";
import "../components/ui/ModalAnimation.css";

// Emoji categories for the picker
const EMOJI_CATEGORIES = {
  common: [
    "✅",
    "🔴",
    "🔵",
    "🟢",
    "⭐",
    "🎯",
    "💪",
    "🧠",
    "📚",
    "💧",
    "🏃",
    "🥗",
    "😊",
  ],
  activity: [
    "🏋️",
    "🧘",
    "🚶",
    "🏃",
    "🚴",
    "🏊",
    "⚽",
    "🎮",
    "🎨",
    "🎵",
    "📝",
    "📚",
    "💻",
  ],
  health: [
    "💧",
    "🥗",
    "🍎",
    "🥦",
    "💊",
    "😴",
    "🧠",
    "🧘",
    "❤️",
    "🦷",
    "🚭",
    "🧹",
    "☀️",
  ],
  productivity: [
    "📝",
    "⏰",
    "📅",
    "📚",
    "💼",
    "💻",
    "📱",
    "✉️",
    "📊",
    "🔍",
    "⚙️",
    "🏆",
    "💯",
  ],
  mindfulness: [
    "🧘",
    "😌",
    "🌱",
    "🌈",
    "🌞",
    "🌙",
    "💭",
    "🧠",
    "❤️",
    "🙏",
    "✨",
    "💫",
    "🔮",
  ],
};

// Predefined colors
const COLOR_OPTIONS = [
  "#4f46e5", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
];

const WorkspaceOverview = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [groupHabits, setGroupHabits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showEditHabitModal, setShowEditHabitModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Notification states
  const [notification, setNotification] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member",
    message: "",
  });
  const [habitForm, setHabitForm] = useState({
    name: "",
    description: "",
    category: "health",
    icon: "🎯",
    color: "#4f46e5",
    defaultTarget: { value: 1, unit: "time" },
    schedule: {
      days: [0, 1, 2, 3, 4, 5, 6], // Default to every day
      reminderTime: "",
      reminderEnabled: false,
    },
    isRequired: false,
  });

  // Modal UI states
  const [activeTab, setActiveTab] = useState("details");
  const [emojiCategory, setEmojiCategory] = useState("common");

  // Adopt modal states
  const [adoptingHabit, setAdoptingHabit] = useState(null);
  // Privacy settings removed
  const [showAdoptModal, setShowAdoptModal] = useState(false);

  // Group tracker data (from GroupTrackersPage)
  const [groupTrackerData, setGroupTrackerData] = useState(null);
  const [encouragements, setEncouragements] = useState([]);
  const [encouragementModal, setEncouragementModal] = useState({
    isOpen: false,
    targetUser: null,
    habitId: null,
  });

  // Show notification helper
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000); // Auto-hide after 4 seconds
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);

      // Fetch group details
      const groupData = await groupsAPI.getGroup(groupId);
      if (groupData.success) {
        const groupInfo = groupData.group || groupData.workspace;
        setGroup(groupInfo);
        setMembers(groupInfo.members || []);
      }

      // Fetch overview data
      const overviewData = await groupsAPI.getGroupOverview(groupId);
      if (overviewData.success) {
        setOverview(overviewData.overview);
      }

      // Fetch group habits
      try {
        const habitsResponse = await groupsAPI.getGroupHabits(groupId);
        if (habitsResponse.success) {
          setGroupHabits(habitsResponse.habits || []);
        }
      } catch (err) {
        console.warn("Failed to fetch group habits:", err);
        setGroupHabits([]);
      }

      // Fetch group tracking data which includes completions
      // Calculate date range for the current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(now);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      const dateRange = {
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
      };

      const groupTrackers = await groupsAPI.getGroupTrackers(
        groupId,
        dateRange
      );
      if (groupTrackers.success) {
        // Store tracker data in the overview
        setOverview((prev) => ({
          ...prev,
          trackers: groupTrackers.trackers || [],
          entries: groupTrackers.entries || {}, // For member dashboard compatibility
          habits: groupTrackers.habits || [], // Use the habits from tracker data if available
        }));

        // Also set the group tracker data for the member progress widget
        setGroupTrackerData(groupTrackers);
      }

      // Fetch recent activities
      const activityData = await groupsAPI.getGroupActivity(groupId, {
        limit: 10,
      });
      if (activityData.success) {
        setActivities(activityData.activities);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get group icon
  const getGroupIcon = (type) => {
    const icons = {
      family: HomeIcon,
      team: BackpackIcon,
      fitness: HeartIcon,
      study: CalendarIcon,
      community: ActivityLogIcon,
    };
    return icons[type] || BackpackIcon;
  };

  const handleInviteMember = async () => {
    try {
      const response = await groupsAPI.inviteMember(groupId, inviteForm);
      if (response.success) {
        setShowInviteModal(false);
        setInviteForm({ email: "", role: "member", message: "" });
        // Show success notification
        showNotification(
          `Invitation sent to ${inviteForm.email} successfully!`
        );
        // Refresh group data
        fetchGroupData();
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      // Show error notification
      showNotification("Failed to send invitation. Please try again.", "error");
    }
  };

  const handleAddHabit = async () => {
    try {
      const response = await groupsAPI.createGroupHabit(groupId, habitForm);
      if (response.success) {
        setShowAddHabitModal(false);
        setHabitForm({
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
        });
        setActiveTab("details");
        setEmojiCategory("common");
        // Show success notification
        showNotification(
          `Group habit "${habitForm.name}" created successfully!`
        );
        // Refresh group data
        fetchGroupData();
      }
    } catch (error) {
      console.error("Error adding habit:", error);
      // Show error notification
      showNotification("Failed to create habit. Please try again.", "error");
    }
  };

  const handleEditHabit = (habit) => {
    // Set the selected habit
    setSelectedHabit(habit);

    // Populate the form with habit data
    setHabitForm({
      name: habit.name || "",
      description: habit.description || "",
      category: habit.category || "health",
      icon: habit.icon || "🎯",
      color: habit.color || "#4f46e5",
      defaultTarget: habit.settings?.defaultTarget || {
        value: 1,
        unit: "time",
      },
      schedule: habit.settings?.schedule || {
        days: [0, 1, 2, 3, 4, 5, 6],
        reminderTime: "",
        reminderEnabled: false,
      },
      isRequired: habit.isRequired || false,
    });

    // Set active tab and show modal
    setActiveTab("details");
    setEmojiCategory("common");
    setShowEditHabitModal(true);
  };

  const handleUpdateHabit = async () => {
    try {
      // Prepare the data with settings properly structured
      const habitData = {
        ...habitForm,
        settings: {
          defaultTarget: habitForm.defaultTarget,
          schedule: habitForm.schedule,
        },
      };

      const response = await groupsAPI.updateGroupHabit(
        groupId,
        selectedHabit._id,
        habitData
      );

      if (response.success) {
        setShowEditHabitModal(false);
        showNotification(
          `Group habit "${habitForm.name}" updated successfully!`
        );
        // Refresh group data
        fetchGroupData();
      }
    } catch (error) {
      console.error("Error updating habit:", error);
      showNotification("Failed to update habit. Please try again.", "error");
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      const response = await groupsAPI.deleteGroupHabit(groupId, habitId);
      if (response.success) {
        setShowEditHabitModal(false);
        showNotification("Group habit deleted successfully!");
        // Refresh group data
        fetchGroupData();
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
      showNotification("Failed to delete habit. Please try again.", "error");
    }
  };

  const handleAdoptHabit = async () => {
    try {
      if (!adoptingHabit) return;

      // Adopt the habit (privacy settings removed)
      await groupsAPI.adoptWorkspaceHabit(groupId, adoptingHabit._id, {
        personalSettings: {
          shareProgress: "full", // Default to full sharing (using valid value)
        },
      });

      // Refresh the group data to update the adoption status
      await fetchGroupData();

      // Show success notification
      showNotification(`Successfully adopted "${adoptingHabit.name}" habit!`);
    } catch (error) {
      console.error("Error adopting habit:", error);
      showNotification(
        "Failed to adopt habit. You may have already adopted it.",
        "error"
      );
    }
  };

  // Encouragement handlers (from GroupTrackersPage)
  const handleMemberClick = (memberId) => {
    navigate(`/app/groups/${groupId}/members/${memberId}/dashboard`);
  };

  const openEncouragementModal = (targetUser, habitId = null) => {
    setEncouragementModal({
      isOpen: true,
      targetUser,
      habitId,
    });
  };

  const closeEncouragementModal = () => {
    setEncouragementModal({
      isOpen: false,
      targetUser: null,
      habitId: null,
    });
  };

  const handleEncouragementSent = () => {
    // Refresh encouragements data
    groupsAPI
      .getEncouragements(groupId)
      .then((response) => setEncouragements(response.data || []))
      .catch((err) => console.warn("Failed to refresh encouragements:", err));
  };

  // Check user permissions with multiple ID format checks
  const currentUserId = user?._id || user?.id;

  const userMember = members.find((m) => {
    const memberUserId = m.userId?._id || m.userId || m.id;
    const match1 =
      memberUserId && memberUserId.toString() === currentUserId?.toString();
    const match2 =
      memberUserId && memberUserId.toString() === user?.id?.toString();
    const match3 =
      memberUserId && memberUserId.toString() === user?._id?.toString();

    return match1 || match2 || match3;
  });

  const userRole = userMember?.role || "member";
  const canManageGroup = userRole === "owner" || userRole === "admin";

  // Widget definitions (excluding header which is now standalone)
  const groupWidgets = useMemo(
    () => ({
      "recent-activity-widget": {
        title: "Recent Activity",
        description: "Latest team updates and member activities",
        category: "collaboration",
        defaultProps: { w: 6, h: 4 },
        component: () => (
          <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <ActivityLogIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">
                  Recent Activity
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Latest team updates
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              {activities.length > 0 ? (
                activities.map((activity, index) => {
                  // Get user info
                  const userInfo = activity.userId || activity.user || {};
                  const userName =
                    userInfo.name || userInfo.email || "A member";

                  // Generate activity description based on type
                  let description = "";
                  let icon = CheckCircledIcon;

                  switch (activity.type) {
                    case "habit_completed":
                      description = `${userName} completed ${
                        activity.data?.habitName || "a habit"
                      }`;
                      if (activity.data?.streakCount > 1) {
                        description += ` (${activity.data.streakCount} day streak!)`;
                      }
                      icon = CheckCircledIcon;
                      break;
                    case "habit_adopted":
                      description = `${userName} adopted ${
                        activity.data?.habitName || "a new habit"
                      }`;
                      icon = PlusIcon;
                      break;
                    case "streak_milestone":
                      description = `🔥 ${userName} reached ${
                        activity.data?.streakCount || 0
                      } days on ${activity.data?.habitName || "a habit"}`;
                      icon = StarIcon;
                      break;
                    case "member_joined":
                      description = `${userName} joined the group`;
                      icon = PersonIcon;
                      break;
                    case "habit_created":
                      description = `${userName} created ${
                        activity.data?.habitName || "a new group habit"
                      }`;
                      icon = TargetIcon;
                      break;
                    default:
                      description =
                        activity.data?.message ||
                        activity.description ||
                        `${userName} completed an activity`;
                      icon = CheckCircledIcon;
                  }

                  // Format timestamp
                  let timeDisplay = "Just now";
                  if (activity.createdAt) {
                    const activityDate = new Date(activity.createdAt);
                    const now = new Date();
                    const diffMs = now - activityDate;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffMinutes < 1) {
                      timeDisplay = "Just now";
                    } else if (diffMinutes < 60) {
                      timeDisplay = `${diffMinutes}m ago`;
                    } else if (diffHours < 24) {
                      timeDisplay = `${diffHours}h ago`;
                    } else if (diffDays < 7) {
                      timeDisplay = `${diffDays}d ago`;
                    } else {
                      timeDisplay = activityDate.toLocaleDateString();
                    }
                  }

                  const ActivityIcon = icon;

                  return (
                    <div
                      key={`activity-${activity._id || index}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-hover)]/30 transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center flex-shrink-0">
                        <ActivityIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                          {description}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                          {timeDisplay}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ActivityLogIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mb-3" />
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    No recent activity yet
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                    Start tracking habits to see team activity here
                  </p>
                </div>
              )}
            </div>
          </div>
        ),
      },

      "group-habits-widget": {
        title: "Group Habits",
        description: "Habits available for all group members to adopt",
        category: "collaboration",
        defaultProps: { w: 6, h: 4 },
        component: () => {
          const handleAdoptHabitLocal = async () => {
            try {
              if (!adoptingHabit) return;

              // Use the top-level handleAdoptHabit function
              await handleAdoptHabit();
            } catch (error) {
              console.error("Error adopting habit:", error);
              showNotification(
                "Failed to adopt habit. You may have already adopted it.",
                "error"
              );
            }
          };

          const openAdoptModal = (habit) => {
            setAdoptingHabit(habit);
            setShowAdoptModal(true);
          };

          // Check if a habit is already adopted by the current user
          const isHabitAdopted = (habit) => {
            if (
              !habit.adoptedBy ||
              !Array.isArray(habit.adoptedBy) ||
              habit.adoptedBy.length === 0 ||
              !user
            ) {
              return false;
            }

            return habit.adoptedBy.some((adoptedUser) => {
              // Extract user ID from the adoptedUser object
              const adoptedUserId =
                adoptedUser?._id ||
                (adoptedUser?.userId &&
                  (typeof adoptedUser.userId === "object"
                    ? adoptedUser.userId._id
                    : adoptedUser.userId)) ||
                adoptedUser;

              // Extract current user ID
              const currentUserId = user?._id || user?.id;

              // Compare as strings to avoid reference comparison issues
              return (
                adoptedUserId &&
                currentUserId &&
                adoptedUserId.toString() === currentUserId.toString()
              );
            });
          };

          return (
            <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">
                    Group Habits
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    {groupHabits.length} habits available
                  </p>
                </div>
                {canManageGroup && (
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    size="2"
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg text-sm transition-all duration-200 font-outfit"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Habit
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto">
                {groupHabits.length > 0 ? (
                  groupHabits.map((habit) => {
                    const isAdopted = isHabitAdopted(habit);

                    return (
                      <div
                        key={`habit-${habit._id}`}
                        className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                          isAdopted
                            ? "bg-[var(--color-success)]/5 border-[var(--color-success)]/20"
                            : "bg-[var(--color-surface-primary)] border-[var(--color-border-primary)]/10 hover:border-[var(--color-brand-500)]/30"
                        }`}
                        onClick={(e) => {
                          // Prevent clicking on card when clicking edit button
                          if (e.target.closest(".edit-button")) return;
                          !isAdopted && openAdoptModal(habit);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                                {habit.name}
                              </h4>
                              {isAdopted && (
                                <CheckCircledIcon className="w-4 h-4 text-[var(--color-success)]" />
                              )}
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                              {habit.description}
                            </p>
                            {habit.settings?.defaultTarget && (
                              <p className="text-xs text-[var(--color-text-tertiary)] font-outfit mt-2">
                                Default: {habit.settings.defaultTarget.value}{" "}
                                {habit.settings.defaultTarget.unit}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {canManageGroup && (
                              <button
                                className="edit-button p-1 rounded-full hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] mb-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditHabit(habit);
                                }}
                                title="Edit habit"
                              >
                                <GearIcon className="w-4 h-4" />
                              </button>
                            )}
                            {isAdopted ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs px-2 py-1 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] font-outfit font-medium">
                                  Adopted
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-lg bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)] font-outfit font-medium cursor-pointer">
                                Click to adopt
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <TargetIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mb-3" />
                    <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                      No group habits yet
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                      {canManageGroup
                        ? "Add the first habit to get started"
                        : "Admins can add habits for the group"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        },
      },

      "team-members-widget": {
        title: "Team Members",
        description: "Active team members with roles and status",
        category: "collaboration",
        defaultProps: { w: 6, h: 4 },
        component: () => (
          <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">
                  Team Members
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  {members.length} active members
                </p>
              </div>
              {canManageGroup && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  size="2"
                  className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg text-sm transition-all duration-200 font-outfit"
                >
                  <PlusIcon className="w-4 h-4" />
                  Invite
                </button>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {members.map((member, index) => {
                const userInfo = member.userId || member.user || member;
                const displayName =
                  userInfo.name ||
                  userInfo.email ||
                  `User ${member.userId || member.id}`;
                const displayEmail = userInfo.email;

                return (
                  <div
                    key={`member-${(
                      member.userId?._id ||
                      member.userId ||
                      member.id ||
                      index
                    ).toString()}`}
                    className="group"
                  >
                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-surface-hover)]/30 transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        // Debug the member object structure
                        // More robust member ID extraction
                        let memberUserId;
                        if (
                          member.userId &&
                          typeof member.userId === "object" &&
                          member.userId._id
                        ) {
                          memberUserId = member.userId._id;
                        } else if (
                          member.userId &&
                          typeof member.userId === "string"
                        ) {
                          memberUserId = member.userId;
                        } else if (member._id) {
                          memberUserId = member._id;
                        } else if (member.id) {
                          memberUserId = member.id;
                        }

                        if (
                          memberUserId &&
                          memberUserId.toString() !== user?.id
                        ) {
                          navigate(
                            `/app/groups/${groupId}/members/${memberUserId}/dashboard`
                          );
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold font-outfit">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)] font-outfit">
                            {displayName}
                            {(member.userId?._id ||
                              member.userId ||
                              member.id) &&
                              (
                                member.userId?._id ||
                                member.userId ||
                                member.id
                              ).toString() === user?.id && (
                                <span className="ml-2 text-xs text-[var(--color-brand-600)] font-outfit">
                                  (You)
                                </span>
                              )}
                          </p>
                          {displayEmail && displayEmail !== displayName && (
                            <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                              {displayEmail}
                            </p>
                          )}
                          <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      {(member.userId?._id || member.userId || member.id) &&
                        (
                          member.userId?._id ||
                          member.userId ||
                          member.id
                        ).toString() !== user?.id && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] font-outfit opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              view dashboard
                            </span>
                            <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)]" />
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      },
      "member-progress-widget": {
        title: "Member Progress",
        description: "Track individual member progress and performance",
        category: "collaboration",
        defaultProps: { w: 8, h: 6 },
        component: () => (
          <MemberProgressWidget
            memberData={groupTrackerData}
            onMemberClick={handleMemberClick}
            onEncourageMember={openEncouragementModal}
          />
        ),
      },

      "encouragement-feed-widget": {
        title: "Encouragement Feed",
        description: "Team encouragements and social interactions",
        category: "collaboration",
        defaultProps: { w: 6, h: 6 },
        component: () => (
          <EncouragementFeedWidget
            encouragements={encouragements}
            onSendEncouragement={openEncouragementModal}
          />
        ),
      },
    }),
    [
      group,
      overview,
      activities,
      groupHabits,
      members,
      challenges,
      canManageGroup,
      navigate,
      groupId,
      user,
      setShowInviteModal,
      setShowAddHabitModal,
      setShowMembersModal,
      groupTrackerData,
      encouragements,
    ]
  );

  // Default widget layouts (excluding header)
  const defaultLayouts = {
    lg: [
      { i: "recent-activity-widget", x: 3, y: 6, w: 6, h: 7 },
      { i: "group-habits-widget", x: 6, y: 0, w: 6, h: 6 },
      { i: "team-members-widget", x: 0, y: 0, w: 6, h: 6 },
    ],
    md: [
      { i: "recent-activity-widget", x: 3, y: 6, w: 6, h: 5 },
      { i: "group-habits-widget", x: 6, y: 0, w: 6, h: 5 },
      { i: "team-members-widget", x: 0, y: 0, w: 6, h: 5 },
    ],
    sm: [
      {
        w: 12,
        h: 6,
        x: 0,
        y: 20,
        i: "recent-activity-widget",
        moved: false,
        static: false,
      },
      {
        w: 12,
        h: 5,
        x: 0,
        y: 10,
        i: "group-habits-widget",
        moved: false,
        static: false,
      },

      {
        w: 12,
        h: 5,
        x: 0,
        y: 0,
        i: "team-members-widget",
        moved: false,
        static: false,
      },
    ],
    xs: [
      {
        w: 4,
        h: 5,
        x: 0,
        y: 5,
        i: "challenges-widget",
        moved: false,
        static: false,
      },
      {
        w: 4,
        h: 7,
        x: 0,
        y: 14,
        i: "recent-activity-widget",
        moved: false,
        static: false,
      },
      {
        w: 4,
        h: 5,
        x: 0,
        y: 4,
        i: "group-habits-widget",
        moved: false,
        static: false,
      },
      {
        w: 4,
        h: 5,
        x: 0,
        y: 0,
        i: "team-members-widget",
        moved: false,
        static: false,
      },
    ],
    xxs: [
      {
        w: 2,
        h: 5,
        x: 0,
        y: 0,
        i: "challenges-widget",
        moved: false,
        static: false,
      },
      {
        w: 2,
        h: 3,
        x: 0,
        y: 5,
        i: "recent-activity-widget",
        moved: false,
        static: false,
      },
      {
        w: 2,
        h: 4,
        x: 0,
        y: 3,
        i: "group-habits-widget",
        moved: false,
        static: false,
      },
      {
        w: 2,
        h: 4,
        x: 0,
        y: 7,
        i: "shared-habits-widget",
        moved: false,
        static: false,
      },
      {
        w: 2,
        h: 4,
        x: 0,
        y: 11,
        i: "team-members-widget",
        moved: false,
        static: false,
      },
    ],
  };

  const defaultWidgets = [
    "recent-activity-widget",
    "group-habits-widget",
    "shared-habits-widget",
    "team-members-widget",
  ];

  const storageKeys = {
    widgets: `groupOverviewWidgets_${groupId}`,
    layouts: `groupOverviewLayouts_${groupId}`,
  };

  if (loading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-[var(--color-surface-elevated)] rounded-2xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-4">
              Group Not Found
            </h1>
            <p className="text-[var(--color-text-secondary)] font-outfit mb-6">
              The group you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Button onClick={() => navigate("/app/groups")}>
              Back to Groups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const GroupIcon = getGroupIcon(group.type);

  return (
    <div className="min-h-screen page-container p-6">
      {/* Success/Error Notification */}
      {notification && (
        <div
          className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <CheckCircledIcon className="w-5 h-5 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            )}
            <p className="text-sm font-medium font-outfit">
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto p-1 hover:bg-black/5 rounded"
            >
              <Cross2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Group Header - Outside of the widget grid */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/app/groups")}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center shadow-lg">
                <GroupIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-dmSerif gradient-text mb-1">
                  {group.name}
                </h1>
                <p className="text-md text-[var(--color-text-secondary)] font-outfit">
                  {group.description ||
                    `${group.type} group • ${members.length} members`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 lg:mt-0">
              <button
                onClick={() => navigate(`/app/groups/${groupId}/settings`)}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200"
              >
                <GearIcon className="w-5 h-5" />
              </button>
          </div>
        </div>

        {/* Widget Grid Container */}
        <BaseGridContainer
          mode="collaboration"
          widgets={groupWidgets}
          availableWidgets={groupWidgets}
          defaultWidgets={defaultWidgets}
          defaultLayouts={defaultLayouts}
          storageKeys={storageKeys}
          className="group-overview-grid"
        />
        {/* Custom Modals */}
        {showInviteModal && (
          <GroupInviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            group={group}
            inviteForm={inviteForm}
            setInviteForm={setInviteForm}
            onInvite={handleInviteMember}
          />
        )}

        {showAddHabitModal && (
          <GroupHabitModal
            isOpen={showAddHabitModal}
            onClose={() => {
              setShowAddHabitModal(false);
              setHabitForm({
                name: "",
                description: "",
                icon: "🎯",
                color: "#6366f1",
                defaultTarget: 1,
                schedule: "daily",
                tags: [],
                category: "other",
              });
              setEmojiCategory("common");
              setActiveTab("details");
            }}
            mode="add"
            groupId={groupId}
            habitForm={habitForm}
            setHabitForm={setHabitForm}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            emojiCategory={emojiCategory}
            setEmojiCategory={setEmojiCategory}
            onSave={handleAddHabit}
            onSuccess={() => {
              setShowAddHabitModal(false);
              showNotification("Group habit added successfully!");
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
              setHabitForm({
                name: "",
                description: "",
                icon: "🎯",
                color: "#6366f1",
                defaultTarget: 1,
                schedule: "daily",
                tags: [],
                category: "other",
              });
              setEmojiCategory("common");
              setActiveTab("details");
            }}
            mode="edit"
            habit={selectedHabit}
            groupId={groupId}
            habitForm={habitForm}
            setHabitForm={setHabitForm}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            emojiCategory={emojiCategory}
            setEmojiCategory={setEmojiCategory}
            onSave={handleUpdateHabit}
            onDelete={handleDeleteHabit}
            onSuccess={() => {
              setShowEditHabitModal(false);
              showNotification("Group habit updated successfully!");
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
            onAdopt={handleAdoptHabit}
            onSuccess={() => {
              setShowAdoptModal(false);
              showNotification("Habit adopted successfully!");
              fetchGroupData();
            }}
          />
        )}

        {/* Encouragement Modal */}
        <EncouragementModal
          isOpen={encouragementModal.isOpen}
          onClose={closeEncouragementModal}
          targetUser={encouragementModal.targetUser}
          workspaceId={groupId}
          habitId={encouragementModal.habitId}
          onEncouragementSent={handleEncouragementSent}
        />
      </div>
    </div>
  );
};

export default WorkspaceOverview;
