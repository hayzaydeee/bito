import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../contexts/HabitContext';
import { groupsAPI } from '../services/api';
import BaseGridContainer from '../components/shared/BaseGridContainer';
import { createWidgetComponent } from '../components/shared/widgetFactory';
import { widgetRegistry } from '../components/shared/widgetRegistry';
import EncouragementModal from '../components/shared/EncouragementModal';
import { 
  ArrowLeftIcon,
  ActivityLogIcon,
  PersonIcon,
  TargetIcon,
  BarChartIcon,
  CalendarIcon,
  StarIcon
} from '@radix-ui/react-icons';

const GroupTrackersPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getHabitsByWorkspace } = useHabits();
  
  const [workspace, setWorkspace] = useState(null);
  const [groupTrackerData, setGroupTrackerData] = useState(null);
  const [sharedHabitsOverview, setSharedHabitsOverview] = useState(null);
  const [encouragements, setEncouragements] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [encouragementModal, setEncouragementModal] = useState({
    isOpen: false,
    targetUser: null,
    habitId: null
  });

  // Fetch workspace and group tracking data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch workspace info
        const workspaceResponse = await groupsAPI.getGroup(groupId);
        setWorkspace(workspaceResponse);
        
        // Fetch group tracker data (member progress)
        const trackersResponse = await groupsAPI.getGroupTrackers(groupId);
        setGroupTrackerData(trackersResponse.memberTrackers || []);
        
        // Fetch shared habits overview
        const overviewResponse = await groupsAPI.getSharedHabitsOverview(groupId);
        setSharedHabitsOverview(overviewResponse.overview || null);
        
        // Fetch encouragements
        try {
          const encouragementsResponse = await groupsAPI.getEncouragements(groupId);
          setEncouragements(encouragementsResponse.data || []);
        } catch (err) {
          console.warn('Failed to fetch encouragements:', err);
          setEncouragements([]);
        }
        
        // Fetch leaderboard data
        try {
          const leaderboardResponse = await groupsAPI.getLeaderboard(groupId);
          setLeaderboardData(leaderboardResponse.leaderboard || []);
        } catch (err) {
          console.warn('Failed to fetch leaderboard:', err);
          setLeaderboardData([]);
        }
        
        // Fetch challenges
        try {
          const challengesResponse = await groupsAPI.getChallenges(groupId);
          setChallenges(challengesResponse.challenges || []);
        } catch (err) {
          console.warn('Failed to fetch challenges:', err);
          setChallenges([]);
        }
        
      } catch (err) {
        console.error('Error fetching group tracker data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  // Get workspace habits for this group
  const workspaceHabits = useMemo(() => {
    return getHabitsByWorkspace(groupId);
  }, [getHabitsByWorkspace, groupId]);

  const handleMemberClick = (memberId) => {
    navigate(`/app/groups/${groupId}/members/${memberId}/dashboard`);
  };

  const openEncouragementModal = (targetUser, habitId = null) => {
    setEncouragementModal({
      isOpen: true,
      targetUser,
      habitId
    });
  };

  const closeEncouragementModal = () => {
    setEncouragementModal({
      isOpen: false,
      targetUser: null,
      habitId: null
    });
  };

  const handleEncouragementSent = () => {
    // Refresh encouragements data
    groupsAPI.getEncouragements(groupId)
      .then(response => setEncouragements(response || []))
      .catch(err => console.warn('Failed to refresh encouragements:', err));
  };

  const handleCreateChallenge = async (challengeData) => {
    try {
      await groupsAPI.createChallenge(groupId, challengeData);
      // Refresh challenges data
      const challengesResponse = await groupsAPI.getChallenges(groupId);
      setChallenges(challengesResponse || []);
    } catch (err) {
      console.error('Failed to create challenge:', err);
    }
  };

  // Create widgets with dependency injection
  const widgets = useMemo(() => {
    if (!workspace || !groupTrackerData) return {};

    const dependencies = {
      workspaceData: {
        ...workspace,
        overview: sharedHabitsOverview
      },
      memberData: groupTrackerData,
      encouragements,
      leaderboardData,
      challenges,
      onMemberClick: handleMemberClick,
      onEncourageMember: openEncouragementModal,
      onSendEncouragement: handleEncouragementSent,
      onCreateChallenge: handleCreateChallenge,
      currentUserId: user?.id,
      workspaceId: groupId
    };

    const result = {};
    const availableWidgets = widgetRegistry.availableWidgets;

    // Create group accountability widgets
    Object.keys(availableWidgets).forEach(widgetType => {
      const config = availableWidgets[widgetType];
      if (config.category === 'group-accountability') {
        result[widgetType] = {
          title: config.title,
          component: createWidgetComponent(widgetType, config, dependencies)
        };
      }
    });

    return result;
  }, [workspace, groupTrackerData, sharedHabitsOverview, encouragements, leaderboardData, challenges, user?.userId, groupId]);

  // Get group icon (same logic as WorkspaceOverview)
  const getGroupIcon = (type) => {
    const iconMap = {
      family: PersonIcon,
      work: TargetIcon,
      friends: StarIcon,
      health: ActivityLogIcon,
      study: CalendarIcon,
      hobby: BarChartIcon,
    };
    return iconMap[type] || TargetIcon;
  };

  if (loading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto"></div>
            <p className="text-[var(--color-text-secondary)] font-outfit mt-4">Loading group trackers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-4">
              Error Loading Group Trackers
            </h1>
            <p className="text-[var(--color-text-secondary)] font-outfit mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-2xl font-outfit font-semibold transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
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
            <button
              onClick={() => navigate('/app/groups')}
              className="px-6 py-3 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-2xl font-outfit font-semibold transition-all duration-200"
            >
              Back to Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  const GroupIcon = getGroupIcon(workspace.type);

  return (
    <div className="min-h-screen page-container p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Same style as WorkspaceOverview */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
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
                  {workspace.name} Trackers
                </h1>
                <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                  Monitor team progress and accountability on shared habits
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 lg:mt-0">
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="flex items-center gap-3 h-12 px-6 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-2xl transition-all duration-200 font-outfit font-semibold"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Overview
            </button>
          </div>
        </div>

        {/* Widget-based Group Trackers */}
        <BaseGridContainer
          mode="group-accountability"
          widgets={widgets}
          availableWidgets={widgetRegistry.availableWidgets}
          defaultWidgets={widgetRegistry.defaultWidgetSets.groupAccountability}
          defaultLayouts={widgetRegistry.defaultLayouts.groupAccountability}
          storageKeys={widgetRegistry.storageKeys.groupAccountability}
          className="mt-8"
        />

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

export default GroupTrackersPage;
