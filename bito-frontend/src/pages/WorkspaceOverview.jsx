import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Text } from '@radix-ui/themes';
import { 
  PersonIcon, 
  GearIcon, 
  PlusIcon, 
  BarChartIcon, 
  ActivityLogIcon, 
  StarIcon,
  TargetIcon,
  CalendarIcon,
  DotsHorizontalIcon,
  HomeIcon,
  BackpackIcon,
  HeartIcon,
  ChevronRightIcon,
  CheckCircledIcon,
  ArrowLeftIcon,
  EnvelopeClosedIcon,
  Cross2Icon,
  CheckIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon
} from '@radix-ui/react-icons';
import BaseGridContainer from '../components/shared/BaseGridContainer';
import GroupStreaksChart from '../components/analytics/GroupStreaksChart';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Emoji categories for the picker
const EMOJI_CATEGORIES = {
  common: ["✅", "🔴", "🔵", "🟢", "⭐", "🎯", "💪", "🧠", "📚", "💧", "🏃", "🥗", "😊"],
  activity: ["🏋️", "🧘", "🚶", "🏃", "🚴", "🏊", "⚽", "🎮", "🎨", "🎵", "📝", "📚", "💻"],
  health: ["💧", "🥗", "🍎", "🥦", "💊", "😴", "🧠", "🧘", "❤️", "🦷", "🚭", "🧹", "☀️"],
  productivity: ["📝", "⏰", "📅", "📚", "💼", "💻", "📱", "✉️", "📊", "🔍", "⚙️", "🏆", "💯"],
  mindfulness: ["🧘", "😌", "🌱", "🌈", "🌞", "🌙", "💭", "🧠", "❤️", "🙏", "✨", "💫", "🔮"],
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
  const [sharedHabits, setSharedHabits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
    message: ''
  });
  const [habitForm, setHabitForm] = useState({
    name: '',
    description: '',
    category: 'health',
    icon: '🎯',
    color: '#4f46e5',
    defaultTarget: { value: 1, unit: 'time' },
    schedule: {
      days: [0, 1, 2, 3, 4, 5, 6], // Default to every day
      reminderTime: '',
      reminderEnabled: false
    },
    isRequired: false
  });

  // Modal UI states
  const [activeTab, setActiveTab] = useState('details');
  const [emojiCategory, setEmojiCategory] = useState('common');

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      
      // Fetch group details
      const groupData = await groupsAPI.getGroup(groupId);
      console.log('Group data response:', groupData);
      if (groupData.success) {
        const groupInfo = groupData.group || groupData.workspace;
        console.log('Group info:', groupInfo);
        console.log('Members:', groupInfo.members);
        setGroup(groupInfo);
        setMembers(groupInfo.members || []);
      }
      
      // Fetch overview data
      const overviewData = await groupsAPI.getGroupOverview(groupId);
      if (overviewData.success) {
        setOverview(overviewData.overview);
      }
      
      // Fetch group habits
      const habitsData = await groupsAPI.getGroupHabits(groupId);
      if (habitsData.success) {
        setGroupHabits(habitsData.habits);
      }
      
      // Fetch recent activities
      const activityData = await groupsAPI.getGroupActivity(groupId, { limit: 10 });
      if (activityData.success) {
        setActivities(activityData.activities);
      }

      // Fetch shared habits
      try {
        const sharedHabitsData = await groupsAPI.getSharedHabits(groupId);
        if (sharedHabitsData.success) {
          setSharedHabits(sharedHabitsData.sharedHabits);
        }
      } catch (error) {
        console.log('Shared habits not available yet:', error);
        setSharedHabits([]);
      }
      
    } catch (error) {
      console.error('Error fetching group data:', error);
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
      community: ActivityLogIcon
    };
    return icons[type] || BackpackIcon;
  };

  const handleInviteMember = async () => {
    try {
      const response = await groupsAPI.inviteMember(groupId, inviteForm);
      if (response.success) {
        setShowInviteModal(false);
        setInviteForm({ email: '', role: 'member', message: '' });
        // Refresh group data
        fetchGroupData();
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const handleAddHabit = async () => {
    try {
      const response = await groupsAPI.createGroupHabit(groupId, habitForm);
      if (response.success) {
        setShowAddHabitModal(false);
        setHabitForm({
          name: '',
          description: '',
          category: 'health',
          icon: '🎯',
          color: '#4f46e5',
          defaultTarget: { value: 1, unit: 'time' },
          schedule: {
            days: [0, 1, 2, 3, 4, 5, 6],
            reminderTime: '',
            reminderEnabled: false
          },
          isRequired: false
        });
        setActiveTab('details');
        setEmojiCategory('common');
        // Refresh group data
        fetchGroupData();
      }
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  // Check user permissions with multiple ID format checks
  const currentUserId = user?._id || user?.id;

  const userMember = members.find(m => {
    const memberUserId = m.userId?._id || m.userId || m.id;
    const match1 = memberUserId && memberUserId.toString() === currentUserId?.toString();
    const match2 = memberUserId && memberUserId.toString() === user?.id?.toString();
    const match3 = memberUserId && memberUserId.toString() === user?._id?.toString();
    
    return match1 || match2 || match3;
  });
  
  const userRole = userMember?.role || 'member';
  const canManageGroup = userRole === 'owner' || userRole === 'admin'

  console.log('Permission check:', { userRole, canManageGroup });

  // Widget definitions (excluding header which is now standalone)
  const groupWidgets = useMemo(() => ({

    'team-stats-widget': {
      title: "Team Statistics",
      description: "Overview of team performance metrics and completion rates",
      category: "collaboration",
      defaultProps: { w: 6, h: 4 },
      component: () => {
        const teamCards = [
          {
            title: 'Completion Rate',
            value: overview?.completionRate || 0,
            icon: CheckCircledIcon,
            color: 'success',
            suffix: '%',
            description: 'team completion rate'
          },
          {
            title: 'Active Members',
            value: overview?.activeMembers || 0,
            icon: PersonIcon,
            color: 'info',
            suffix: '',
            description: 'active this week'
          },
          {
            title: 'Total Streaks',
            value: overview?.totalStreaks || 0,
            icon: StarIcon,
            color: 'warning',
            suffix: '',
            description: 'combined streaks'
          },
          {
            title: 'Team Score',
            value: overview?.teamScore || 0,
            icon: TargetIcon,
            color: 'brand',
            suffix: '',
            description: 'points earned'
          }
        ];

        const getColorClasses = (color) => {
          const colorMap = {
            brand: {
              icon: 'text-[var(--color-brand-400)]',
              bg: 'from-[var(--color-brand-500)]/10 to-[var(--color-brand-600)]/5',
              border: 'border-[var(--color-brand-400)]/20'
            },
            success: {
              icon: 'text-[var(--color-success)]',
              bg: 'from-[var(--color-success)]/10 to-[var(--color-success)]/5',
              border: 'border-[var(--color-success)]/20'
            },
            info: {
              icon: 'text-[var(--color-info)]',
              bg: 'from-[var(--color-info)]/10 to-[var(--color-info)]/5',
              border: 'border-[var(--color-info)]/20'
            },
            warning: {
              icon: 'text-[var(--color-warning)]',
              bg: 'from-[var(--color-warning)]/10 to-[var(--color-warning)]/5',
              border: 'border-[var(--color-warning)]/20'
            }
          };
          return colorMap[color] || colorMap.brand;
        };

        return (
          <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <BarChartIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Team Progress</h3>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">This week's performance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-1">
              {teamCards.map((card, index) => {
                const Icon = card.icon;
                const colors = getColorClasses(card.color);
                
                return (
                  <div 
                    key={card.title}
                    className="bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm p-4 rounded-xl border border-[var(--color-border-primary)]/30 relative overflow-hidden group hover:scale-105 transition-all duration-300"
                  >
                    {/* Background Pattern */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`}></div>
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${colors.bg} rounded-full -translate-y-12 translate-x-12`}></div>
                    
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>

                      {/* Value */}
                      <div className="mb-2">
                        <span className="text-2xl font-bold font-dmSerif text-[var(--color-text-primary)]">
                          {card.value.toLocaleString()}
                        </span>
                        {card.suffix && (
                          <span className="text-xl font-bold font-dmSerif text-[var(--color-text-secondary)] ml-1">
                            {card.suffix}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-xs font-semibold text-[var(--color-text-primary)] font-outfit mb-1">
                        {card.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[var(--color-text-tertiary)] font-outfit leading-tight">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    },

    'recent-activity-widget': {
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
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Recent Activity</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Latest team updates</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto">
            {activities.length > 0 ? (
              activities.map((activity, index) => {
                console.log(`Activity ${index}:`, activity);
                
                // Get user info
                const userInfo = activity.userId || activity.user || {};
                const userName = userInfo.name || userInfo.email || 'A member';
                
                // Generate activity description based on type
                let description = '';
                let icon = CheckCircledIcon;
                
                switch (activity.type) {
                  case 'habit_completed':
                    description = `${userName} completed ${activity.data?.habitName || 'a habit'}`;
                    if (activity.data?.streakCount > 1) {
                      description += ` (${activity.data.streakCount} day streak!)`;
                    }
                    icon = CheckCircledIcon;
                    break;
                  case 'habit_adopted':
                    description = `${userName} adopted ${activity.data?.habitName || 'a new habit'}`;
                    icon = PlusIcon;
                    break;
                  case 'streak_milestone':
                    description = `🔥 ${userName} reached ${activity.data?.streakCount || 0} days on ${activity.data?.habitName || 'a habit'}`;
                    icon = StarIcon;
                    break;
                  case 'member_joined':
                    description = `${userName} joined the group`;
                    icon = PersonIcon;
                    break;
                  case 'habit_created':
                    description = `${userName} created ${activity.data?.habitName || 'a new group habit'}`;
                    icon = TargetIcon;
                    break;
                  default:
                    description = activity.data?.message || activity.description || `${userName} completed an activity`;
                    icon = CheckCircledIcon;
                }
                
                // Format timestamp
                let timeDisplay = 'Just now';
                if (activity.createdAt) {
                  const activityDate = new Date(activity.createdAt);
                  const now = new Date();
                  const diffMs = now - activityDate;
                  const diffMinutes = Math.floor(diffMs / (1000 * 60));
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  
                  if (diffMinutes < 1) {
                    timeDisplay = 'Just now';
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
                  <div key={`activity-${activity._id || index}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-hover)]/30 transition-all duration-200">
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
      )
    },

    'group-habits-widget': {
      title: "Group Habits",
      description: "Habits available for all group members to adopt",
      category: "collaboration",
      defaultProps: { w: 6, h: 4 },
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Group Habits</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">{groupHabits.length} habits available</p>
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
              groupHabits.map((habit) => (
                <div key={`habit-${habit._id}`} className="p-4 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                        {habit.name}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] font-outfit mt-1">
                        {habit.description}
                      </p>
                      {habit.settings?.defaultTarget && (
                        <p className="text-xs text-[var(--color-text-tertiary)] font-outfit mt-2">
                          Default: {habit.settings.defaultTarget.value} {habit.settings.defaultTarget.unit}
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg bg-purple-100 text-purple-600 font-outfit font-medium">
                      {habit.adoptionCount || 0} members
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TargetIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  No group habits yet
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                  {canManageGroup ? 'Add the first habit to get started' : 'Admins can add habits for the group'}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    },

    'shared-habits-widget': {
      title: "Shared Habits",
      description: "Habits that multiple members are tracking together",
      category: "collaboration", 
      defaultProps: { w: 6, h: 4 },
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Shared Habits</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Habits multiple members track</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto">
            {sharedHabits.length > 0 ? (
              sharedHabits.map((habit) => (
                <div key={`shared-habit-${habit._id}`} className="p-4 rounded-lg bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                        {habit.name}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                        {habit.description}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg bg-orange-100 text-orange-600 font-outfit font-medium">
                      {habit.adoptionCount} members
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                      Tracked by:
                    </span>
                    <div className="flex items-center gap-1">
                      {habit.adoptedBy.slice(0, 3).map((member, index) => (
                        <div
                          key={`${habit._id}-member-${index}`}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white text-xs font-bold"
                          title={member.name}
                        >
                          {member.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      ))}
                      {habit.adoptedBy.length > 3 && (
                        <span className="text-xs text-[var(--color-text-tertiary)] font-outfit ml-1">
                          +{habit.adoptedBy.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <StarIcon className="w-12 h-12 text-[var(--color-text-tertiary)] mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  No shared habits yet
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                  Members will see habits here when multiple people track the same ones
                </p>
              </div>
            )}
          </div>
        </div>
      )
    },

    'team-members-widget': {
      title: "Team Members",
      description: "Active team members with roles and status",
      category: "collaboration",
      defaultProps: { w: 6, h: 4 },
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Team Members</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">{members.length} active members</p>
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
              console.log(`Member ${index}:`, member);
              const userInfo = member.userId || member.user || member;
              const displayName = userInfo.name || userInfo.email || `User ${member.userId || member.id}`;
              const displayEmail = userInfo.email;
              
              return (
                <div key={`member-${(member.userId?._id || member.userId || member.id || index).toString()}`} className="group">
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-surface-hover)]/30 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      const memberUserId = member.userId?._id || member.userId || member.id;
                      if (memberUserId && memberUserId.toString() !== user?.id) {
                        navigate(`/app/groups/${groupId}/members/${memberUserId}/dashboard`);
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
                          {((member.userId?._id || member.userId || member.id) && (member.userId?._id || member.userId || member.id).toString() === user?.id) && (
                            <span className="ml-2 text-xs text-[var(--color-brand-600)] font-outfit">(You)</span>
                          )}
                        </p>
                        {displayEmail && displayEmail !== displayName && (
                          <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                            {displayEmail}
                          </p>
                        )}
                        <p className="text-xs text-[var(--color-text-tertiary)] font-outfit capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {((member.userId?._id || member.userId || member.id) && (member.userId?._id || member.userId || member.id).toString() !== user?.id) && (
                        <span className="text-xs text-[var(--color-brand-600)] font-outfit opacity-0 group-hover:opacity-100 transition-opacity">
                          View Dashboard
                        </span>
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === 'active' ? 'bg-green-500' : 
                        member.status === 'invited' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-xs text-[var(--color-text-tertiary)] font-outfit capitalize">
                        {member.status || 'active'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )
    },

    'group-streaks-widget': {
      title: "Group Streaks",
      description: "Visualizes each member's habit completions over the week",
      category: "collaboration",
      defaultProps: { w: 6, h: 4 },
      component: () => {
        console.log('Rendering Group Streaks widget, members:', members.length);
        
        // Generate mock completion data for the chart
        // In a real app, this would come from the API
        const completionData = [];
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        
        // Generate sample data for each day of the week
        for (let day = 0; day < 7; day++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + day);
          const dateStr = date.toISOString().split('T')[0];
          
          // Add random completions for each member
          members.forEach(member => {
            const userId = member.userId?._id || member.userId || member.id;
            const completions = Math.floor(Math.random() * 6); // 0-5 completions per day
            
            for (let i = 0; i < completions; i++) {
              completionData.push({
                userId,
                date: dateStr,
                habitId: `habit_${i}`,
                habitName: `Habit ${i + 1}`
              });
            }
          });
        }

        console.log('Generated completion data:', completionData.length, 'entries');

        return (
          <GroupStreaksChart 
            members={members}
            completionData={completionData}
            timeRange="week"
          />
        );
      }
    }
  }), [group, overview, activities, groupHabits, sharedHabits, members, canManageGroup, navigate, groupId, user, setShowInviteModal, setShowAddHabitModal, setShowMembersModal]);

  // Default widget layouts (excluding header)
  const defaultLayouts = {
    lg: [
      { i: 'team-stats-widget', x: 0, y: 0, w: 7, h: 7 },
      { i: 'recent-activity-widget', x: 7, y: 0, w: 5, h: 5 },
      { i: 'group-streaks-widget', x: 1, y: 7, w: 10, h: 7 },
      { i: 'group-habits-widget', x: 0, y: 14, w: 4, h: 5 },
      { i: 'shared-habits-widget', x: 4, y: 14, w: 4, h: 5 },
      { i: 'team-members-widget', x: 8, y: 14, w: 4, h: 5 }
    ],
    md: [
      { i: 'team-stats-widget', x: 0, y: 0, w: 4, h: 4 },
      { i: 'recent-activity-widget', x: 4, y: 0, w: 4, h: 4 },
      { i: 'group-habits-widget', x: 0, y: 4, w: 4, h: 5 },
      { i: 'team-members-widget', x: 4, y: 4, w: 4, h: 5 },
      { i: 'shared-habits-widget', x: 0, y: 9, w: 4, h: 5 },
      { i: 'group-streaks-widget', x: 0, y: 14, w: 6, h: 4 }
    ],
    sm: [
      { i: 'team-stats-widget', x: 0, y: 0, w: 4, h: 4 },
      { i: 'recent-activity-widget', x: 0, y: 4, w: 4, h: 5 },
      { i: 'group-habits-widget', x: 0, y: 9, w: 4, h: 5 },
      { i: 'shared-habits-widget', x: 0, y: 14, w: 4, h: 5 },
      { i: 'team-members-widget', x: 0, y: 19, w: 4, h: 5 },
      { i: 'group-streaks-widget', x: 0, y: 24, w: 6, h: 4 }
    ]
  };

  const defaultWidgets = [
    'team-stats-widget', 
    'group-streaks-widget',
    'recent-activity-widget',
    'group-habits-widget',
    'shared-habits-widget',
    'team-members-widget'
  ];

  const storageKeys = {
    widgets: `groupOverviewWidgets_${groupId}`,
    layouts: `groupOverviewLayouts_${groupId}`
  };

  if (loading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--color-surface-elevated)] rounded-2xl"></div>
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
              The group you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/app/groups')}>
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
      <div className="max-w-7xl mx-auto">
        {/* Group Header - Outside of the widget grid */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/app/groups')}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center shadow-lg">
                <GroupIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-1">
                  {group.name}
                </h1>
                <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                  {group.description || `${group.type} group • ${members.length} members`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 lg:mt-0">
            <button
              onClick={() => navigate(`/app/groups/${groupId}/trackers`)}
              className="flex items-center gap-3 h-12 px-6 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-2xl transition-all duration-200 font-outfit font-semibold"
            >
              <ActivityLogIcon className="w-5 h-5" />
              Group Trackers
            </button>
            
            {canManageGroup && (
              <button
                onClick={() => navigate(`/app/groups/${groupId}/settings`)}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200"
              >
                <GearIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Widget Grid Container */}
        <BaseGridContainer
          mode="group-overview"
          widgets={groupWidgets}
          availableWidgets={groupWidgets}
          defaultWidgets={defaultWidgets}
          defaultLayouts={defaultLayouts}
          storageKeys={storageKeys}
          className="group-overview-grid"
        />

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface-primary)] rounded-3xl shadow-2xl border border-[var(--color-border-primary)]/20 max-w-md w-full p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
                    <EnvelopeClosedIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
                    Invite Member
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Send an invitation to join {group.name}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                      className="w-full h-12 px-4 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors"
                      placeholder="member@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                      Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                      className="w-full h-12 px-4 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit focus:outline-none focus:border-[var(--color-brand-500)] transition-colors"
                    >
                      <option value="member">Member</option>
                      {userRole === 'owner' && <option value="admin">Admin</option>}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={inviteForm.message}
                      onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                      className="w-full h-20 px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors resize-none"
                      placeholder="Add a personal message..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 h-12 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteMember}
                    disabled={!inviteForm.email}
                    className="flex-1 h-12 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] disabled:bg-[var(--color-surface-elevated)] disabled:text-[var(--color-text-tertiary)] text-white rounded-xl transition-all duration-200 font-outfit font-semibold"
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Habit Modal */}
        {showAddHabitModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-2xl border border-[var(--color-border-primary)]/20 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                {/* Header */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                    <TargetIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-1">
                    Add Group Habit
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Create a new habit template for {group.name}
                  </p>
                </div>

                {/* Tabs */}
                <div className="mb-4">
                  <div className="flex border-b border-[var(--color-border-primary)] font-outfit">
                    <button
                      type="button"
                      className={`px-3 py-2 font-medium text-xs ${activeTab === "details" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
                      onClick={() => setActiveTab("details")}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 font-medium text-xs ${activeTab === "appearance" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
                      onClick={() => setActiveTab("appearance")}
                    >
                      Style
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 font-medium text-xs ${activeTab === "settings" ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-600)]" : "text-[var(--color-text-secondary)]"}`}
                      onClick={() => setActiveTab("settings")}
                    >
                      Settings
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="mb-4">
                  {activeTab === "details" && (
                    <div className="space-y-3">
                      {/* Basic Info */}
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
                          Habit Name *
                        </label>
                        <input
                          type="text"
                          value={habitForm.name}
                          onChange={(e) => setHabitForm({...habitForm, name: e.target.value})}
                          className="w-full h-10 px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
                          placeholder="e.g., Daily Exercise"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
                          Description
                        </label>
                        <textarea
                          value={habitForm.description}
                          onChange={(e) => setHabitForm({...habitForm, description: e.target.value})}
                          className="w-full h-16 px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors resize-none"
                          placeholder="Describe this habit..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
                            Category
                          </label>
                          <select
                            value={habitForm.category}
                            onChange={(e) => setHabitForm({...habitForm, category: e.target.value})}
                            className="w-full h-10 px-3 bg-[var(--color-surface-elevated] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
                          >
                            <option value="health">Health</option>
                            <option value="fitness">Fitness</option>
                            <option value="productivity">Productivity</option>
                            <option value="learning">Learning</option>
                            <option value="mindfulness">Mindfulness</option>
                            <option value="social">Social</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
                            Target
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={habitForm.defaultTarget.value}
                              onChange={(e) => setHabitForm({
                                ...habitForm, 
                                defaultTarget: {...habitForm.defaultTarget, value: parseInt(e.target.value) || 1}
                              })}
                              className="w-16 h-10 px-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
                              min="1"
                            />
                            <select
                              value={habitForm.defaultTarget.unit}
                              onChange={(e) => setHabitForm({
                                ...habitForm, 
                                defaultTarget: {...habitForm.defaultTarget, unit: e.target.value}
                              })}
                              className="flex-1 h-10 px-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
                            >
                              <option value="time">time</option>
                              <option value="minutes">min</option>
                              <option value="hours">hrs</option>
                              <option value="pages">pages</option>
                              <option value="cups">cups</option>
                              <option value="steps">steps</option>
                              <option value="reps">reps</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Schedule */}
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">
                          Schedule
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                            const dayId = index === 6 ? 0 : index + 1; // Convert to backend format (0=Sunday)
                            const isSelected = habitForm.schedule?.days?.includes(dayId) ?? true;
                            
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  const currentDays = habitForm.schedule?.days || [0, 1, 2, 3, 4, 5, 6];
                                  const newDays = isSelected 
                                    ? currentDays.filter(d => d !== dayId)
                                    : [...currentDays, dayId].sort();
                                  
                                  setHabitForm({
                                    ...habitForm,
                                    schedule: {
                                      ...habitForm.schedule,
                                      days: newDays
                                    }
                                  });
                                }}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 font-outfit ${
                                  isSelected
                                    ? 'bg-[var(--color-brand-500)] text-white'
                                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "appearance" && (
                    <div className="space-y-4">
                      {/* Icon & Color Preview */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white"
                          style={{ backgroundColor: habitForm.color }}
                        >
                          {habitForm.icon}
                        </div>
                        <span className="text-sm text-[var(--color-text-secondary)] font-outfit">
                          Preview
                        </span>
                      </div>
                      
                      {/* Compact Emoji Picker */}
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">Icon</label>                          <div className="flex gap-1 mb-2">
                            {Object.keys(EMOJI_CATEGORIES).map((category) => (
                              <button
                                key={category}
                                type="button"
                                className={`px-2 py-1 text-xs rounded transition-colors font-outfit ${
                                  emojiCategory === category
                                    ? "bg-[var(--color-brand-500)] text-white"
                                    : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]"
                                }`}
                                onClick={() => setEmojiCategory(category)}
                              >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </button>
                            ))}
                        </div>
                        
                        <div className="border border-[var(--color-border-primary)]/40 p-2 rounded-lg bg-[var(--color-surface-elevated)]">
                          <div className="flex flex-wrap gap-1">
                            {EMOJI_CATEGORIES[emojiCategory].slice(0, 12).map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className={`w-8 h-8 flex items-center justify-center text-lg hover:bg-[var(--color-surface-hover)] rounded transition-colors ${
                                  habitForm.icon === emoji ? 'bg-[var(--color-brand-100)] ring-1 ring-[var(--color-brand-500)]' : ''
                                }`}
                                onClick={() => setHabitForm({...habitForm, icon: emoji})}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Compact Color Picker */}
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-2">Color</label>
                        <div className="flex gap-2">
                          {COLOR_OPTIONS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                              style={{ 
                                backgroundColor: color,
                                border: habitForm.color === color ? "2px solid white" : "1px solid var(--color-border-primary)",
                                outline: habitForm.color === color ? `2px solid ${color}` : "none"
                              }}
                              onClick={() => setHabitForm({...habitForm, color})}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <div className="space-y-4">
                      {/* Reminders */}
                      <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                            Enable Reminders
                          </span>
                          <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                            Members can get notifications
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={habitForm.schedule.reminderEnabled || false}
                            onChange={(e) => 
                              setHabitForm({
                                ...habitForm, 
                                schedule: { 
                                  ...habitForm.schedule, 
                                  reminderEnabled: e.target.checked 
                                }
                              })
                            }
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            habitForm.schedule.reminderEnabled 
                              ? 'bg-[var(--color-brand-500)]' 
                              : 'bg-gray-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              habitForm.schedule.reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                            } mt-0.5 ml-0.5`} />
                          </div>
                        </label>
                      </div>
                      
                      {habitForm.schedule.reminderEnabled && (
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-primary)] font-outfit block mb-1">
                            Default Time
                          </label>
                          <input
                            type="time"
                            value={habitForm.schedule.reminderTime || ''}
                            onChange={(e) => 
                              setHabitForm({
                                ...habitForm, 
                                schedule: { 
                                  ...habitForm.schedule, 
                                  reminderTime: e.target.value 
                                }
                              })
                            }
                            className="w-full h-10 px-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-lg text-[var(--color-text-primary)] font-outfit focus:outline-none focus:border-[var(--color-brand-500)] transition-colors text-sm"
                          />
                        </div>
                      )}

                      {/* Required Setting */}
                      <div className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                            Required Habit
                          </span>
                          <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                            All members adopt automatically
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={habitForm.isRequired || false}
                            onChange={(e) => setHabitForm({...habitForm, isRequired: e.target.checked})}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            habitForm.isRequired 
                              ? 'bg-[var(--color-brand-500)]' 
                              : 'bg-gray-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              habitForm.isRequired ? 'translate-x-5' : 'translate-x-0'
                            } mt-0.5 ml-0.5`} />
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-primary)]">
                  <button
                    onClick={() => {
                      setShowAddHabitModal(false);
                      setActiveTab('details');
                      setEmojiCategory('common');
                    }}
                    className="flex-1 h-10 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-lg transition-all duration-200 font-outfit font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddHabit}
                    disabled={!habitForm.name}
                    className="flex-1 h-10 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] disabled:bg-[var(--color-surface-elevated)] disabled:text-[var(--color-text-tertiary)] text-white rounded-lg transition-all duration-200 font-outfit font-semibold flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckIcon className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceOverview;
