import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ArrowLeftIcon
} from '@radix-ui/react-icons';
import { groupsAPI } from '../services/api';

const WorkspaceOverview = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [workspaceHabits, setWorkspaceHabits] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
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
    defaultTarget: { value: 1, unit: 'time' },
    isRequired: false
  });

  useEffect(() => {
    fetchWorkspaceData();
  }, [groupId]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Fetch workspace details
      const workspaceData = await groupsAPI.getGroup(groupId);
      if (workspaceData.success) {
        setWorkspace(workspaceData.workspace);
        setMembers(workspaceData.workspace.members || []);
      }
      
      // Fetch overview data
      const overviewData = await groupsAPI.getGroupOverview(groupId);
      if (overviewData.success) {
        setOverview(overviewData.overview);
      }
      
      // Fetch workspace habits
      const habitsData = await groupsAPI.getGroupHabits(groupId);
      if (habitsData.success) {
        setWorkspaceHabits(habitsData.habits);
      }
      
      // Fetch recent activities
      const activityData = await groupsAPI.getGroupActivity(groupId, { limit: 10 });
      if (activityData.success) {
        setActivities(activityData.activities);
      }
      
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkspaceIcon = (type) => {
    const icons = {
      family: HomeIcon,
      team: BackpackIcon,
      fitness: HeartIcon,
      study: CalendarIcon,
      community: ActivityLogIcon
    };
    return icons[type] || BackpackIcon;
  };

  const getWorkspaceColor = (type) => {
    const colors = {
      family: 'from-blue-500 to-blue-600',
      team: 'from-purple-500 to-purple-600',
      fitness: 'from-red-500 to-red-600',
      study: 'from-green-500 to-green-600',
      community: 'from-orange-500 to-orange-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const handleCreateHabit = async () => {
    try {
      const response = await groupsAPI.createGroupHabit(groupId, {
        name: habitForm.name.trim(),
        description: habitForm.description.trim(),
        category: habitForm.category,
        defaultTarget: habitForm.defaultTarget,
        isRequired: habitForm.isRequired
      });
      
      if (response.success) {
        setShowAddHabitModal(false);
        setHabitForm({
          name: '',
          description: '',
          category: 'health',
          defaultTarget: { value: 1, unit: 'time' },
          isRequired: false
        });
        await fetchWorkspaceData(); // Refresh data
      } else {
        console.error('Failed to create habit:', response.error);
      }
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const handleInviteMember = async () => {
    try {
      const response = await groupsAPI.inviteMember(groupId, {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        message: inviteForm.message.trim()
      });
      
      if (response.success) {
        setShowInviteModal(false);
        setInviteForm({
          email: '',
          role: 'member',
          message: ''
        });
        await fetchWorkspaceData(); // Refresh data
      } else {
        console.error('Failed to invite member:', response.error);
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    }
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

  if (!workspace) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-[var(--color-surface-elevated)] to-[var(--color-surface-hover)] border-2 border-dashed border-[var(--color-border-primary)]/40 flex items-center justify-center mx-auto mb-6">
              <BackpackIcon className="w-12 h-12 text-[var(--color-text-tertiary)]" />
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-3">
              Workspace not found
            </h2>
            <p className="text-[var(--color-text-secondary)] font-outfit mb-8 max-w-md mx-auto">
              The workspace you're looking for doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => navigate('/app/groups')}
              className="flex items-center gap-3 h-12 px-8 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold mx-auto"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  const WorkspaceIcon = getWorkspaceIcon(workspace.type);
  const colorClass = getWorkspaceColor(workspace.type);

  return (
    <div className="min-h-screen page-container p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* Back Button */}
            <button
              onClick={() => navigate('/app/groups')}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>

            {/* Workspace Info */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-3xl bg-gradient-to-r ${colorClass} flex items-center justify-center shadow-xl`}>
                <WorkspaceIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-1">
                  {workspace.name}
                </h1>
                <div className="flex items-center gap-4 text-[var(--color-text-secondary)] font-outfit">
                  <span className="capitalize">{workspace.type} Workspace</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <PersonIcon className="w-4 h-4" />
                    <span>{workspace.stats?.activeMemberCount || 0} members</span>
                  </div>
                  {workspace.description && (
                    <>
                      <span>•</span>
                      <span className="max-w-md truncate">{workspace.description}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 lg:mt-0">
            <button 
              onClick={() => navigate(`/app/workspaces/${groupId}/dashboard`)}
              className="flex items-center gap-3 h-12 px-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold"
            >
              <TargetIcon className="w-5 h-5" />
              My Dashboard
            </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-3 h-12 px-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold"
            >
              <PlusIcon className="w-5 h-5" />
              Invite Member
            </button>
            <button 
              onClick={() => setShowAddHabitModal(true)}
              className="flex items-center gap-3 h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold"
            >
              <PlusIcon className="w-5 h-5" />
              Add Habit
            </button>
            <button 
              onClick={() => setShowMembersModal(true)}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
            >
              <PersonIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>
            <button className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group">
              <GearIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 p-1 bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border-primary)]/20">
          {[
            { id: 'overview', label: 'Overview', icon: BarChartIcon },
            { id: 'activity', label: 'Activity', icon: ActivityLogIcon },
            { id: 'members', label: 'Members', icon: PersonIcon },
            { id: 'habits', label: 'Habits', icon: TargetIcon }
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-outfit font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-brand-600)] text-white shadow-lg'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        {/* Main Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Team Members"
                  value={overview?.teamStats.totalMembers || 0}
                  icon={<PersonIcon className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="Active Habits"
                  value={overview?.teamStats.activeHabits || 0}
                  icon={<TargetIcon className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="Total Completions"
                  value={overview?.teamStats.totalCompletions || 0}
                  icon={<CheckCircledIcon className="w-5 h-5" />}
                  color="purple"
                />
                <StatCard
                  title="Avg Streak"
                  value={overview?.teamStats.averageStreak || 0}
                  icon={<StarIcon className="w-5 h-5" />}
                  color="orange"
                />
              </div>

              {/* Team Progress */}
              <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                    Team Progress
                  </h3>
                  <button className="flex items-center gap-2 text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] font-outfit font-medium">
                    View All
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-6">
                  {overview?.memberProgress?.map((member, index) => (
                    <div key={member._id} className="flex items-center justify-between p-4 bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/10">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-brand-400)] to-[var(--color-brand-600)] rounded-2xl flex items-center justify-center">
                            {member.user?.avatar ? (
                              <img 
                                src={member.user.avatar} 
                                alt={member.user.name}
                                className="w-12 h-12 rounded-2xl object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold text-white font-dmSerif">
                                {member.user?.name?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)] font-outfit text-lg">
                            {member.user?.name}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                            {member.totalHabits} active habits
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🔥</span>
                          <span className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                            {member.currentStreaks}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                          total streaks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <StarIcon className="w-8 h-8 text-yellow-500" />
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                    Streak Champions
                  </h3>
                </div>
                <div className="space-y-4">
                  {overview?.leaderboard?.slice(0, 5).map((entry, index) => (
                    <div key={entry._id} className="flex items-center justify-between p-4 bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/10">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold font-dmSerif ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 shadow-md' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md' :
                          'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]/20'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)] font-outfit">
                            {entry.userId?.name}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                            {entry.workspaceHabitId?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/30 rounded-xl">
                          <span className="text-lg">🔥</span>
                          <span className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                            {entry.currentStreak}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-8">
              <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                    Recent Activity
                  </h3>
                  <button className="flex items-center gap-2 text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] font-outfit font-medium">
                    View All
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {activities?.slice(0, 8).map(activity => (
                    <ActivityItem key={activity._id} activity={activity} />
                  ))}
                  {(!activities || activities.length === 0) && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-4">
                        <ActivityLogIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                      </div>
                      <p className="text-[var(--color-text-secondary)] font-outfit">
                        No recent activity yet
                      </p>
                      <p className="text-sm text-[var(--color-text-tertiary)] font-outfit mt-1">
                        Activity will appear here when members complete habits
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-8">
              Workspace Activity
            </h3>
            <div className="space-y-6">
              {activities?.map(activity => (
                <ActivityItem key={activity._id} activity={activity} detailed />
              ))}
              {(!activities || activities.length === 0) && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-3xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-6">
                    <ActivityLogIcon className="w-12 h-12 text-[var(--color-text-tertiary)]" />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-3">
                    No activity yet
                  </h4>
                  <p className="text-[var(--color-text-secondary)] font-outfit max-w-md mx-auto">
                    When team members complete habits, achieve streaks, or reach goals, their activity will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                Workspace Habits
              </h3>
              <button
                onClick={() => setShowAddHabitModal(true)}
                className="flex items-center gap-3 h-10 px-4 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl transition-all duration-200 font-outfit font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Add Habit
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaceHabits?.map((habit) => (
                <div key={habit._id} className="bg-[var(--color-surface-primary)] rounded-2xl p-6 border border-[var(--color-border-primary)]/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)] flex items-center justify-center">
                      <TargetIcon className="w-6 h-6 text-white" />
                    </div>
                    {habit.isRequired && (
                      <div className="px-2 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-outfit font-medium">
                        Required
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] font-outfit mb-2">
                    {habit.name}
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit mb-4">
                    {habit.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] font-outfit">
                    <span className="capitalize">{habit.category}</span>
                    <span>
                      {habit.settings?.defaultTarget?.value || 1} {habit.settings?.defaultTarget?.unit || 'time'}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!workspaceHabits || workspaceHabits.length === 0) && (
                <div className="col-span-full text-center py-16">
                  <div className="w-24 h-24 rounded-3xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-6">
                    <TargetIcon className="w-12 h-12 text-[var(--color-text-tertiary)]" />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-3">
                    No habits yet
                  </h4>
                  <p className="text-[var(--color-text-secondary)] font-outfit max-w-md mx-auto mb-6">
                    Create shared habits that team members can adopt to their personal dashboards.
                  </p>
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="flex items-center gap-3 h-12 px-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold mx-auto"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Create First Habit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                Team Members
              </h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-3 h-10 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 font-outfit font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Invite Member
              </button>
            </div>
            
            <div className="space-y-4">
              {members?.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-4 bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-brand-400)] to-[var(--color-brand-600)] rounded-2xl flex items-center justify-center">
                      <span className="text-lg font-bold text-white font-dmSerif">
                        {member.userId?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                        {member.userId?.name || 'Unknown User'}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                        {member.userId?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-xl text-xs font-outfit font-medium ${
                      member.role === 'owner' ? 'bg-yellow-100 text-yellow-600' :
                      member.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {member.role}
                    </div>
                    <div className={`px-3 py-1 rounded-xl text-xs font-outfit font-medium ${
                      member.status === 'active' ? 'bg-green-100 text-green-600' :
                      member.status === 'invited' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {member.status}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!members || members.length === 0) && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-3xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-6">
                    <PersonIcon className="w-12 h-12 text-[var(--color-text-tertiary)]" />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-3">
                    Just you for now
                  </h4>
                  <p className="text-[var(--color-text-secondary)] font-outfit max-w-md mx-auto mb-6">
                    Invite team members to start collaborating on habits together.
                  </p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-3 h-12 px-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold mx-auto"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Invite First Member
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add other tab content here */}

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface-primary)] rounded-3xl shadow-2xl border border-[var(--color-border-primary)]/20 max-w-md w-full p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                    <PersonIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
                    Invite Team Member
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Send an invitation to join {workspace?.name}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200"
                      placeholder="colleague@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                      Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                      Personal Message (optional)
                    </label>
                    <textarea
                      value={inviteForm.message}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200 resize-none"
                      rows="3"
                      placeholder="Join our team to track habits together!"
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
                    disabled={!inviteForm.email.trim()}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 disabled:bg-[var(--color-surface-elevated)] disabled:text-[var(--color-text-tertiary)] text-white rounded-xl transition-all duration-200 font-outfit font-semibold shadow-lg"
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Habit Modal */}
        {showAddHabitModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface-primary)] rounded-3xl shadow-2xl border border-[var(--color-border-primary)]/20 max-w-lg w-full p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <TargetIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
                    Create Workspace Habit
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Add a habit template for team members to adopt
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                      Habit Name
                    </label>
                    <input
                      type="text"
                      value={habitForm.name}
                      onChange={(e) => setHabitForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Daily Exercise"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                      Description
                    </label>
                    <textarea
                      value={habitForm.description}
                      onChange={(e) => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200 resize-none"
                      rows="3"
                      placeholder="What is this habit about?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                        Category
                      </label>
                      <select
                        value={habitForm.category}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200"
                      >
                        <option value="health">Health</option>
                        <option value="fitness">Fitness</option>
                        <option value="productivity">Productivity</option>
                        <option value="learning">Learning</option>
                        <option value="mindfulness">Mindfulness</option>
                        <option value="social">Social</option>
                        <option value="creativity">Creativity</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                        Default Target
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          value={habitForm.defaultTarget.value}
                          onChange={(e) => setHabitForm(prev => ({ 
                            ...prev, 
                            defaultTarget: { ...prev.defaultTarget, value: parseInt(e.target.value) || 1 }
                          }))}
                          className="w-20 px-3 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200"
                        />
                        <select
                          value={habitForm.defaultTarget.unit}
                          onChange={(e) => setHabitForm(prev => ({ 
                            ...prev, 
                            defaultTarget: { ...prev.defaultTarget, unit: e.target.value }
                          }))}
                          className="flex-1 px-3 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200"
                        >
                          <option value="time">times</option>
                          <option value="minute">minutes</option>
                          <option value="hour">hours</option>
                          <option value="page">pages</option>
                          <option value="glass">glasses</option>
                          <option value="step">steps</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isRequired"
                      checked={habitForm.isRequired}
                      onChange={(e) => setHabitForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                      className="w-4 h-4 text-[var(--color-brand-600)] bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)] rounded focus:ring-[var(--color-brand-500)]"
                    />
                    <label htmlFor="isRequired" className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                      Required for all team members
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowAddHabitModal(false)}
                    className="flex-1 h-12 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateHabit}
                    disabled={!habitForm.name.trim()}
                    className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 disabled:bg-[var(--color-surface-elevated)] disabled:text-[var(--color-text-tertiary)] text-white rounded-xl transition-all duration-200 font-outfit font-semibold shadow-lg"
                  >
                    Create Habit
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

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-400/30 text-blue-500',
    green: 'from-green-500/20 to-green-600/20 border-green-400/30 text-green-500',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-400/30 text-purple-500',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-400/30 text-orange-500'
  };

  return (
    <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] font-outfit mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)] font-dmSerif">
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${colorClasses[color]} border flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ activity, detailed = false }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'habit_completed':
        return '✅';
      case 'streak_milestone':
        return '🔥';
      case 'goal_achieved':
        return '🎯';
      case 'member_joined':
        return '👋';
      default:
        return '📈';
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'habit_completed':
        return `completed ${activity.data?.habitName || 'a habit'}`;
      case 'streak_milestone':
        return `reached ${activity.data?.streakCount || 0} day streak on ${activity.data?.habitName || 'a habit'}`;
      case 'goal_achieved':
        return `achieved their goal: ${activity.data?.message || 'goal completed'}`;
      case 'member_joined':
        return `joined the workspace`;
      default:
        return activity.data?.message || 'had some activity';
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 ${
      detailed 
        ? 'bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/10' 
        : 'hover:bg-[var(--color-surface-primary)] rounded-xl'
    }`}>
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]/20 flex items-center justify-center">
          <span className="text-lg">{getActivityIcon(activity.type)}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-text-primary)] font-outfit">
          <span className="font-semibold">{activity.userId?.name || 'Someone'}</span>
          {' '}
          <span>{getActivityMessage(activity)}</span>
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)] font-outfit mt-1">
          {timeAgo(activity.createdAt)}
        </p>
        {detailed && activity.reactionCounts && (
          <div className="mt-3 flex items-center gap-3">
            {Object.entries(activity.reactionCounts).map(([type, count]) => (
              <button 
                key={type} 
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] rounded-xl border border-[var(--color-border-primary)]/20 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200"
              >
                <span>{type === 'like' ? '👍' : type === 'celebrate' ? '🎉' : '❤️'}</span>
                <span className="font-outfit font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceOverview;
