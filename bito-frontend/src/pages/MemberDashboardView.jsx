import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  TargetIcon,
  EyeOpenIcon,
  PersonIcon,
  StarIcon,
  CheckCircledIcon,
  CalendarIcon,
  LockClosedIcon
} from '@radix-ui/react-icons';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MemberProgressChart from '../components/analytics/MemberProgressChart';
import MemberHabitInteractions from '../components/shared/MemberHabitInteractions';

const MemberDashboardView = () => {
  const { groupId, memberId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [memberDashboard, setMemberDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction handlers
  const handleSendEncouragement = async (habitId, message) => {
    try {
      await groupsAPI.sendEncouragement(groupId, memberId, habitId, { message });
      // You might want to show a success toast here
      console.log('Encouragement sent successfully');
    } catch (error) {
      console.error('Failed to send encouragement:', error);
      throw error;
    }
  };

  const handleCelebrate = async (habitId) => {
    try {
      await groupsAPI.celebrateHabit(groupId, memberId, habitId);
      // You might want to show a success toast here
      console.log('Celebration sent successfully');
    } catch (error) {
      console.error('Failed to celebrate:', error);
      throw error;
    }
  };

  const handleReportConcern = async (habitId, message) => {
    try {
      await groupsAPI.reportConcern(groupId, memberId, habitId, { message });
      // You might want to show a success toast here
      console.log('Check-in sent successfully');
    } catch (error) {
      console.error('Failed to send check-in:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchMemberDashboard();
  }, [groupId, memberId]);

  const fetchMemberDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await groupsAPI.getMemberDashboard(groupId, memberId);
      if (response.success) {
        setMemberDashboard(response);
      } else {
        setError(response.error || 'Failed to load member dashboard');
      }
      
    } catch (error) {
      console.error('Error fetching member dashboard:', error);
      setError(error.message || 'Failed to load member dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
            </button>
            
            <div>
              <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-1">
                Access Denied
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                Unable to view member dashboard
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
              <LockClosedIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
              Dashboard Not Accessible
            </h3>
            <p className="text-[var(--color-text-secondary)] font-outfit mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="px-6 py-3 bg-[var(--color-brand-600)] text-white rounded-xl font-outfit font-semibold hover:bg-[var(--color-brand-700)] transition-colors"
            >
              Back to Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { member, habits, workspace } = memberDashboard;

  return (
    <div className="min-h-screen page-container p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={() => navigate(`/app/groups/${groupId}`)}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 transition-all duration-200 group"
          >
            <ArrowLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-white text-xl font-bold">
                  {member.name?.charAt(0) || 'M'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-1">
                {member.name}'s Dashboard
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                {workspace.name} • Shared habit tracking
              </p>
            </div>
          </div>
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
                  {habits.length}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Shared Habits
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
                  {/* This would need actual completion data */}
                  -
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Today's Progress
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400/30 flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {habits.reduce((total, habit) => total + (habit.currentStreak || 0), 0)}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Total Streaks
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/30 flex items-center justify-center">
                <EyeOpenIcon className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {habits.filter(h => h.workspaceSettings?.shareProgress !== 'private').length}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Shared Habits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
              Progress Trend
            </h2>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit">
              <CalendarIcon className="w-4 h-4" />
              Last 30 days
            </div>
          </div>
          
          <MemberProgressChart
            memberHabits={habits}
            memberEntries={memberDashboard.entries || {}}
            timeRange="30d"
            chartType="line"
            chartHeight={300}
            memberId={memberId}
          />
        </div>

        {/* Member's Habits */}
        <div className="bg-[var(--color-surface-elevated)] rounded-3xl p-8 border border-[var(--color-border-primary)]/20 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
              Shared Habits
            </h2>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit">
              <EyeOpenIcon className="w-4 h-4" />
              Publicly visible habits only
            </div>
          </div>

          <div className="space-y-4">
            {habits.map((habit) => (
              <div
                key={habit._id}
                className="p-4 bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)] flex items-center justify-center">
                      <TargetIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                        {habit.name}
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                        {habit.description || `Target: ${habit.target?.value || 1} ${habit.target?.unit || 'time'} daily`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-100 text-green-600">
                      <EyeOpenIcon className="w-3 h-3" />
                      <span className="text-xs font-outfit font-medium">
                        {habit.workspaceSettings?.shareProgress || 'progress-only'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔥</span>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)] font-dmSerif">
                        {habit.currentStreak || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Components */}
                {user && user._id !== member._id && (
                  <div className="pt-3 border-t border-[var(--color-border-primary)]/10">
                    <MemberHabitInteractions
                      habit={habit}
                      member={member}
                      currentUser={user}
                      workspace={memberDashboard.workspace}
                      onSendEncouragement={handleSendEncouragement}
                      onCelebrate={handleCelebrate}
                      onReportConcern={handleReportConcern}
                      canInteract={true}
                    />
                  </div>
                )}
              </div>
            ))}

            {habits.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]/20 flex items-center justify-center mx-auto mb-4">
                  <EyeOpenIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-[var(--color-text-secondary)] font-outfit mb-2">
                  No shared habits
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
                  {member.name} hasn't shared any habits with the workspace yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboardView;
