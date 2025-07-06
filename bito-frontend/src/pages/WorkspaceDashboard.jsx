import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  TargetIcon,
  PlusIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  PersonIcon,
  StarIcon,
  CheckCircledIcon,
  ActivityLogIcon,
  CalendarIcon,
  GearIcon
} from '@radix-ui/react-icons';
import { groupsAPI, habitsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../contexts/HabitContext';

const WorkspaceDashboard = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { habits, entries, isLoading: habitsLoading, fetchHabits } = useHabits();
  
  const [workspace, setWorkspace] = useState(null);
  const [workspaceHabits, setWorkspaceHabits] = useState([]);
  const [memberHabits, setMemberHabits] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  const [dashboardPermissions, setDashboardPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    fetchWorkspaceData();
  }, [groupId]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Fetch workspace details
      const workspaceResponse = await groupsAPI.getGroup(groupId);
      if (workspaceResponse.success) {
        setWorkspace(workspaceResponse.workspace);
      }

      // Fetch workspace habits (templates)
      const habitsResponse = await groupsAPI.getGroupHabits(groupId);
      if (habitsResponse.success) {
        setWorkspaceHabits(habitsResponse.habits);
      }

      // Fetch user's adopted habits in this workspace
      const memberHabitsResponse = await groupsAPI.getMemberHabits(groupId);
      if (memberHabitsResponse.success) {
        setMemberHabits(memberHabitsResponse.habits);
      }

      // Fetch recent team activity
      const activityResponse = await groupsAPI.getGroupActivity(groupId, { limit: 5 });
      if (activityResponse.success) {
        setTeamActivity(activityResponse.activities);
      }

      // Fetch dashboard sharing permissions
      const permissionsResponse = await groupsAPI.getDashboardPermissions(groupId);
      if (permissionsResponse.success) {
        setDashboardPermissions(permissionsResponse.permissions);
      }

    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptHabit = async (workspaceHabit) => {
    // Close the modal immediately to prevent multiple clicks
    setShowAdoptModal(false);
    
    try {
      const response = await groupsAPI.adoptWorkspaceHabit(groupId, workspaceHabit._id, {
        personalSettings: {
          target: workspaceHabit.defaultSettings?.target || { value: 1, unit: 'times' },
          reminderTime: '09:00',
          shareProgress: 'progress-only',
          allowInteraction: true,
          shareInActivity: true
        }
      });

      if (response.success) {
        // Update local member habits list with the new habit
        setMemberHabits(prev => [...prev, response.habit]);
        
        // Refresh the main habit context so it appears in personal dashboard
        await fetchHabits();
        setSelectedHabit(null);
      }
    } catch (error) {
      console.error('Error adopting habit:', error);
      // The modal is already closed, but we could show an error notification here
    }
  };

  const toggleHabitPrivacy = async (habitId, currentShareLevel) => {
    try {
      // Cycle through privacy levels: full -> progress-only -> streaks-only -> private -> full
      const privacyLevels = ['full', 'progress-only', 'streaks-only', 'private'];
      const currentIndex = privacyLevels.indexOf(currentShareLevel);
      const nextLevel = privacyLevels[(currentIndex + 1) % privacyLevels.length];
      
      const response = await habitsAPI.updateHabit(habitId, {
        workspaceSettings: {
          shareProgress: nextLevel
        }
      });

      if (response.success) {
        setMemberHabits(prev => 
          prev.map(habit => 
            habit._id === habitId 
              ? { ...habit, workspaceSettings: { ...habit.workspaceSettings, shareProgress: nextLevel } }
              : habit
          )
        );
        
        // Also refresh the main habits context
        await fetchHabits();
      }
    } catch (error) {
      console.error('Error updating habit privacy:', error);
    }
  };

  const updateDashboardSharing = async (newPermissions) => {
    try {
      const response = await groupsAPI.updateDashboardPermissions(groupId, newPermissions);
      if (response.success) {
        setDashboardPermissions(response.permissions);
      }
    } catch (error) {
      console.error('Error updating dashboard sharing:', error);
    }
  };

  if (loading || habitsLoading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-elevated)]"></div>
                <div>
                  <div className="h-10 bg-[var(--color-surface-elevated)] rounded-xl w-64 mb-2"></div>
                  <div className="h-6 bg-[var(--color-surface-elevated)] rounded-lg w-96"></div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 lg:mt-0">
                <div className="h-12 w-32 bg-[var(--color-surface-elevated)] rounded-xl"></div>
                <div className="h-12 w-28 bg-[var(--color-surface-elevated)] rounded-xl"></div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--color-surface-elevated)] rounded-2xl shadow-sm"></div>
              ))}
            </div>
            
            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-[var(--color-surface-elevated)] rounded-3xl shadow-sm"></div>
              </div>
              <div className="space-y-8">
                <div className="h-64 bg-[var(--color-surface-elevated)] rounded-3xl shadow-sm"></div>
                <div className="h-64 bg-[var(--color-surface-elevated)] rounded-3xl shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group shadow-sm hover:shadow-md"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>
            
            <div>
              <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-2">
                My Dashboard
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                {workspace?.name} • Personal habit tracking and progress insights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 lg:mt-0">
            <button
              onClick={() => setShowSharingModal(true)}
              className="flex items-center gap-3 h-12 px-6 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium shadow-sm hover:shadow-md"
            >
              <PersonIcon className="w-4 h-4" />
              Share Dashboard
            </button>

            <button
              onClick={() => setShowAdoptModal(true)}
              className="flex items-center gap-3 h-12 px-6 bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-700)] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Add Habit
            </button>
          </div>
        </div>

        {/* Quick Start Guide for empty state */}
        {memberHabits.length === 0 && (
          <div className="mb-8 p-8 bg-gradient-to-r from-[var(--color-brand-500)]/10 to-[var(--color-brand-600)]/5 rounded-3xl border border-[var(--color-brand-400)]/20 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎯</div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
                  Welcome to Your Personal Dashboard!
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-4 font-outfit">
                  Start by adopting habits from your workspace to track your personal progress. 
                  Your dashboard will show beautiful insights and help you stay motivated.
                </p>
                <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)] font-outfit">
                  <span>💡 Click "Add Habit" to get started</span>
                  <span>📊 Track progress with beautiful charts</span>
                  <span>🔥 Build streaks and stay motivated</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/80 rounded-2xl p-6 border border-[var(--color-border-primary)]/20 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/30 flex items-center justify-center shadow-sm">
                <TargetIcon className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {memberHabits.length}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit font-medium">
                  Active Habits
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/80 rounded-2xl p-6 border border-[var(--color-border-primary)]/20 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-400/30 flex items-center justify-center shadow-sm">
                <CheckCircledIcon className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {/* Calculate today's completions */}
                  {memberHabits.filter(h => {
                    const today = new Date().toDateString();
                    return entries.some(e => 
                      e.habitId === h._id && 
                      new Date(e.date).toDateString() === today && 
                      e.completed
                    );
                  }).length}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit font-medium">
                  Today's Progress
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/80 rounded-2xl p-6 border border-[var(--color-border-primary)]/20 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-400/30 flex items-center justify-center shadow-sm">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {/* Calculate current streaks */}
                  {memberHabits.reduce((total, habit) => {
                    // Simple streak calculation - can be enhanced
                    return total + (habit.currentStreak || 0);
                  }, 0)}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit font-medium">
                  Total Streaks
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/80 rounded-2xl p-6 border border-[var(--color-border-primary)]/20 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/30 flex items-center justify-center shadow-sm">
                <PersonIcon className="w-7 h-7 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {workspace?.stats?.activeMemberCount || 0}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit font-medium">
                  Team Members
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Habits */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/90 rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
                    My Active Habits
                  </h2>
                  <p className="text-[var(--color-text-secondary)] font-outfit">
                    Track your personal progress and build consistency
                  </p>
                </div>
                <button
                  onClick={() => setShowAdoptModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-700)] text-white rounded-xl text-sm font-outfit font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Habit
                </button>
              </div>

              <div className="space-y-4">
                {memberHabits.map((memberHabit) => (
                  <div
                    key={memberHabit._id}
                    className="group flex items-center justify-between p-6 bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/10 hover:shadow-md transition-all duration-200 hover:border-[var(--color-border-primary)]/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-brand-400)] to-[var(--color-brand-600)] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                        <TargetIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--color-text-primary)] font-outfit text-lg mb-1">
                          {memberHabit.name || 'Habit'}
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                          Target: <span className="font-medium">{memberHabit.target?.value || 1} {memberHabit.target?.unit || 'time'}</span> daily
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleHabitPrivacy(memberHabit._id, memberHabit.workspaceSettings?.shareProgress || 'progress-only')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-outfit font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                          memberHabit.workspaceSettings?.shareProgress === 'private'
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200 border border-green-200'
                        }`}
                      >
                        {memberHabit.workspaceSettings?.shareProgress === 'private' ? (
                          <>
                            <EyeClosedIcon className="w-4 h-4" />
                            Private
                          </>
                        ) : (
                          <>
                            <EyeOpenIcon className="w-4 h-4" />
                            {memberHabit.workspaceSettings?.shareProgress === 'full' ? 'Full Sharing' :
                             memberHabit.workspaceSettings?.shareProgress === 'progress-only' ? 'Progress Only' :
                             memberHabit.workspaceSettings?.shareProgress === 'streaks-only' ? 'Streaks Only' : 'Sharing'}
                          </>
                        )}
                      </button>
                      
                      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl">
                        <span className="text-2xl">🔥</span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif block">
                            {memberHabit.currentStreak || 0}
                          </span>
                          <span className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                            day streak
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {memberHabits.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-surface-secondary)] to-[var(--color-surface-secondary)]/80 border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <TargetIcon className="w-10 h-10 text-[var(--color-text-tertiary)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif mb-2">
                      No habits adopted yet
                    </h3>
                    <p className="text-[var(--color-text-secondary)] font-outfit mb-6">
                      Choose from your workspace habits to get started with personal tracking
                    </p>
                    <button
                      onClick={() => setShowAdoptModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-700)] text-white rounded-xl font-outfit font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Browse Workspace Habits
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Activity & Available Habits */}
          <div className="space-y-8">
            {/* Team Activity */}
            <div className="bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/90 rounded-3xl p-6 border border-[var(--color-border-primary)]/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/30 flex items-center justify-center shadow-sm">
                  <ActivityLogIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
                    Team Activity
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Recent team progress
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {teamActivity.slice(0, 4).map((activity, index) => (
                  <div key={activity._id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface-hover)]/50 transition-all duration-200">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-surface-secondary)] to-[var(--color-surface-secondary)]/80 flex items-center justify-center shadow-sm border border-[var(--color-border-primary)]/10">
                      <span className="text-lg">
                        {activity.type === 'habit_completed' ? '✅' : 
                         activity.type === 'streak_milestone' ? '🔥' : 
                         activity.type === 'habit_created' ? '�' : 
                         activity.type === 'habit_deleted' ? '🗑️' : 
                         activity.type === 'habit_adopted' ? '👍' : 
                         activity.type === 'member_joined' ? '👋' : '�📈'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-primary)] font-outfit font-medium">
                        <span className="font-semibold">{activity.userId?.name || 'Someone'}</span> {' '}
                        {activity.type === 'habit_completed' && 'completed a habit'}
                        {activity.type === 'streak_milestone' && 'achieved a streak milestone'}
                        {activity.type === 'habit_created' && `created habit "${activity.data?.habitName || 'Unnamed habit'}"`}
                        {activity.type === 'habit_deleted' && `deleted habit "${activity.data?.habitName || 'Unnamed habit'}"`}
                        {activity.type === 'habit_adopted' && 'adopted a habit'}
                        {activity.type === 'member_joined' && 'joined the workspace'}
                        {activity.type === 'member_left' && 'left the workspace'}
                        {!['habit_completed', 'streak_milestone', 'habit_created', 'habit_deleted', 'habit_adopted', 'member_joined', 'member_left'].includes(activity.type) && 'performed an action'}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] font-outfit mt-1">
                        {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {teamActivity.length === 0 && (
                  <div className="text-center py-6">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
                      No recent activity
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Available Workspace Habits */}
            <div className="bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/90 rounded-3xl p-6 border border-[var(--color-border-primary)]/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/30 flex items-center justify-center shadow-sm">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif">
                    Available Habits
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Adopt from workspace
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {workspaceHabits
                  .filter(wh => !memberHabits.some(mh => mh.workspaceHabitId?._id === wh._id))
                  .slice(0, 4)
                  .map((habit) => (
                    <div key={habit._id} className="group flex items-center justify-between p-4 bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/10 hover:border-[var(--color-brand-400)]/30 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-brand-400)]/20 to-[var(--color-brand-600)]/20 border border-[var(--color-brand-400)]/30 flex items-center justify-center">
                          <TargetIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--color-text-primary)] font-outfit text-sm truncate">
                            {habit.name}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)] font-outfit truncate">
                            {habit.description || 'Build this habit daily'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedHabit(habit);
                          setShowAdoptModal(true);
                        }}
                        className="ml-2 opacity-0 group-hover:opacity-100 flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white transition-all duration-200 shadow-md"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                {workspaceHabits.filter(wh => !memberHabits.some(mh => mh.workspaceHabitId?._id === wh._id)).length === 0 && (
                  <div className="text-center py-6">
                    <div className="text-2xl mb-2">🎯</div>
                    <p className="text-sm text-[var(--color-text-tertiary)] font-outfit mb-2">
                      All habits adopted!
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                      You've adopted all available workspace habits
                    </p>
                  </div>
                )}
              </div>
              
              {workspaceHabits.filter(wh => !memberHabits.some(mh => mh.workspaceHabitId?._id === wh._id)).length > 4 && (
                <button
                  onClick={() => setShowAdoptModal(true)}
                  className="w-full mt-4 py-3 text-sm font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)] rounded-xl transition-all duration-200 font-outfit"
                >
                  View All Available Habits
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
            💡 <strong>Pro tip:</strong> Share your habits with the team or keep them private. Track your progress and build consistent habits together!
          </p>
        </div>

        {/* Dashboard Sharing Modal */}
        {showSharingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface-primary)] rounded-3xl shadow-2xl border border-[var(--color-border-primary)]/20 max-w-md w-full p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                    <PersonIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
                    Dashboard Sharing
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Control who can view your personal habit dashboard
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Public to Workspace Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border-primary)]/20">
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                        Share with all members
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                        All workspace members can view your dashboard
                      </p>
                    </div>
                    <button
                      onClick={() => updateDashboardSharing({
                        isPublicToWorkspace: !dashboardPermissions?.isPublicToWorkspace,
                        allowedMembers: dashboardPermissions?.allowedMembers || []
                      })}
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${
                        dashboardPermissions?.isPublicToWorkspace
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        dashboardPermissions?.isPublicToWorkspace ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-[var(--color-text-primary)] font-outfit">
                      Workspace Members
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {workspace?.members?.filter(member => member.userId.toString() !== user?.id).map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border-primary)]/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {member.name?.charAt(0) || 'M'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-[var(--color-text-primary)] font-outfit text-sm">
                                {member.name || 'Member'}
                              </p>
                              <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                                {member.role}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-600 font-outfit">
                            Can view
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowSharingModal(false)}
                    className="flex-1 h-12 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Adopt Habit Modal */}
        {showAdoptModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface-primary)] rounded-3xl shadow-2xl border border-[var(--color-border-primary)]/20 max-w-md w-full p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
                    <PlusIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
                    Add Workspace Habit
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Choose a habit from your workspace to add to your personal dashboard
                  </p>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {workspaceHabits
                    .filter(wh => !memberHabits.some(mh => mh.workspaceHabitId?._id === wh._id))
                    .map((habit) => (
                      <button
                        key={habit._id}
                        onClick={() => handleAdoptHabit(habit)}
                        className="w-full flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] rounded-2xl border border-[var(--color-border-primary)]/20 transition-all duration-200 text-left"
                      >
                        <div>
                          <h3 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                            {habit.name}
                          </h3>
                          <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                            {habit.description}
                          </p>
                          {habit.settings?.defaultTarget && (
                            <p className="text-xs text-[var(--color-text-tertiary)] font-outfit mt-1">
                              Target: {habit.settings.defaultTarget.value} {habit.settings.defaultTarget.unit}
                            </p>
                          )}
                        </div>
                        <PlusIcon className="w-5 h-5 text-[var(--color-brand-600)]" />
                      </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowAdoptModal(false)}
                    className="flex-1 h-12 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium"
                  >
                    Cancel
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

export default WorkspaceDashboard;
