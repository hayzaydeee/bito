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
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../contexts/HabitContext';

const WorkspaceDashboard = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { habits, entries, isLoading: habitsLoading } = useHabits();
  
  const [workspace, setWorkspace] = useState(null);
  const [workspaceHabits, setWorkspaceHabits] = useState([]);
  const [memberHabits, setMemberHabits] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Fetch workspace details
      const workspaceResponse = await groupsAPI.getGroup(workspaceId);
      if (workspaceResponse.success) {
        setWorkspace(workspaceResponse.workspace);
      }

      // Fetch workspace habits (templates)
      const habitsResponse = await groupsAPI.getGroupHabits(workspaceId);
      if (habitsResponse.success) {
        setWorkspaceHabits(habitsResponse.habits);
      }

      // Fetch user's adopted habits in this workspace
      const memberHabitsResponse = await groupsAPI.getMemberHabits(workspaceId);
      if (memberHabitsResponse.success) {
        setMemberHabits(memberHabitsResponse.habits);
      }

      // Fetch recent team activity
      const activityResponse = await groupsAPI.getGroupActivity(workspaceId, { limit: 5 });
      if (activityResponse.success) {
        setTeamActivity(activityResponse.activities);
      }

    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptHabit = async (workspaceHabit) => {
    try {
      const response = await groupsAPI.adoptWorkspaceHabit(workspaceId, workspaceHabit._id, {
        personalSettings: {
          target: workspaceHabit.settings.defaultTarget,
          reminderTime: '09:00',
          isPrivate: false
        }
      });

      if (response.success) {
        setMemberHabits(prev => [...prev, response.memberHabit]);
        setShowAdoptModal(false);
        setSelectedHabit(null);
      }
    } catch (error) {
      console.error('Error adopting habit:', error);
    }
  };

  const toggleHabitPrivacy = async (memberHabitId, isPrivate) => {
    try {
      const response = await groupsAPI.updateMemberHabit(workspaceId, memberHabitId, {
        personalSettings: { isPrivate: !isPrivate }
      });

      if (response.success) {
        setMemberHabits(prev => 
          prev.map(habit => 
            habit._id === memberHabitId 
              ? { ...habit, personalSettings: { ...habit.personalSettings, isPrivate: !isPrivate } }
              : habit
          )
        );
      }
    } catch (error) {
      console.error('Error updating habit privacy:', error);
    }
  };

  if (loading || habitsLoading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--color-surface-elevated)] rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(`/app/groups/${workspaceId}`)}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>
            
            <div>
              <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-1">
                My Dashboard
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                {workspace?.name} • Personal habit tracking
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdoptModal(true)}
            className="flex items-center gap-3 h-12 px-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold"
          >
            <PlusIcon className="w-5 h-5" />
            Add Habit
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/30 flex items-center justify-center">
                <TargetIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {memberHabits.length}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Active Habits
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/30 flex items-center justify-center">
                <CheckCircledIcon className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
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
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Today's Progress
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-400/30 flex items-center justify-center">
                <span className="text-xl">🔥</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {/* Calculate current streaks */}
                  {memberHabits.reduce((total, habit) => {
                    // Simple streak calculation - can be enhanced
                    return total + (habit.currentStreak || 0);
                  }, 0)}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Total Streaks
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400/30 flex items-center justify-center">
                <PersonIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {workspace?.stats?.activeMemberCount || 0}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Team Members
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Habits */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  My Habits
                </h2>
                <button
                  onClick={() => setShowAdoptModal(true)}
                  className="flex items-center gap-2 text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] font-outfit font-medium"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add from workspace
                </button>
              </div>

              <div className="space-y-4">
                {memberHabits.map((memberHabit) => (
                  <div
                    key={memberHabit._id}
                    className="flex items-center justify-between p-4 bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)] flex items-center justify-center">
                        <TargetIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                          {memberHabit.workspaceHabitId?.name || 'Habit'}
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                          Target: {memberHabit.personalSettings?.target?.value || 1} {memberHabit.personalSettings?.target?.unit || 'time'} daily
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleHabitPrivacy(memberHabit._id, memberHabit.personalSettings?.isPrivate)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-outfit font-medium transition-all duration-200 ${
                          memberHabit.personalSettings?.isPrivate
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {memberHabit.personalSettings?.isPrivate ? (
                          <>
                            <EyeClosedIcon className="w-3 h-3" />
                            Private
                          </>
                        ) : (
                          <>
                            <EyeOpenIcon className="w-3 h-3" />
                            Shared
                          </>
                        )}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔥</span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] font-dmSerif">
                          {memberHabit.currentStreak || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {memberHabits.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-4">
                      <TargetIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                    </div>
                    <p className="text-[var(--color-text-secondary)] font-outfit mb-2">
                      No habits adopted yet
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
                      Choose from your workspace habits to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Activity & Available Habits */}
          <div className="space-y-6">
            {/* Team Activity */}
            <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-6 border border-[var(--color-border-primary)]/20 shadow-sm">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-4">
                Team Activity
              </h3>
              <div className="space-y-3">
                {teamActivity.slice(0, 3).map((activity) => (
                  <div key={activity._id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center">
                      <span className="text-sm">
                        {activity.type === 'habit_completed' ? '✅' : 
                         activity.type === 'streak_milestone' ? '🔥' : '📈'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--color-text-primary)] font-outfit">
                        <span className="font-medium">{activity.userId?.name}</span> completed a habit
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Workspace Habits */}
            <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-6 border border-[var(--color-border-primary)]/20 shadow-sm">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-4">
                Available Habits
              </h3>
              <div className="space-y-3">
                {workspaceHabits
                  .filter(wh => !memberHabits.some(mh => mh.workspaceHabitId?._id === wh._id))
                  .slice(0, 3)
                  .map((habit) => (
                    <div key={habit._id} className="flex items-center justify-between p-3 bg-[var(--color-surface-primary)] rounded-xl">
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)] font-outfit text-sm">
                          {habit.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                          {habit.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAdoptHabit(habit)}
                        className="px-2 py-1 bg-[var(--color-brand-600)] text-white rounded-lg text-xs font-outfit font-medium hover:bg-[var(--color-brand-700)] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

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
