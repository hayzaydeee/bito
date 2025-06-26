import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  Plus, 
  TrendingUp, 
  Activity, 
  Award,
  Target,
  Calendar,
  MoreHorizontal,
  UserPlus
} from 'lucide-react';

const WorkspaceOverview = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Fetch workspace details
      const workspaceResponse = await fetch(`/api/workspaces/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const workspaceData = await workspaceResponse.json();
      
      if (workspaceData.success) {
        setWorkspace(workspaceData.workspace);
      }
      
      // Fetch overview data
      const overviewResponse = await fetch(`/api/workspaces/${workspaceId}/overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const overviewData = await overviewResponse.json();
      
      if (overviewData.success) {
        setOverview(overviewData.overview);
      }
      
      // Fetch recent activities
      const activityResponse = await fetch(`/api/workspaces/${workspaceId}/activity?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const activityData = await activityResponse.json();
      
      if (activityData.success) {
        setActivities(activityData.activities);
      }
      
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace not found</h2>
          <p className="text-gray-600">The workspace you're looking for doesn't exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{workspace.name}</h1>
                <p className="text-sm text-gray-500">
                  {workspace.type.charAt(0).toUpperCase() + workspace.type.slice(1)} Workspace • {workspace.stats?.activeMemberCount || 0} members
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate(`/app/workspaces/${workspaceId}/dashboard`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                My Dashboard
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <UserPlus className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'habits', label: 'Habits', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="Team Members"
                  value={overview?.teamStats.totalMembers || 0}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="Active Habits"
                  value={overview?.teamStats.activeHabits || 0}
                  icon={<Target className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="Total Completions"
                  value={overview?.teamStats.totalCompletions || 0}
                  icon={<Award className="w-5 h-5" />}
                  color="purple"
                />
                <StatCard
                  title="Avg Streak"
                  value={overview?.teamStats.averageStreak || 0}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="orange"
                />
              </div>

              {/* Team Progress */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Progress</h3>
                <div className="space-y-4">
                  {overview?.memberProgress.map(member => (
                    <div key={member._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          {member.user?.avatar ? (
                            <img 
                              src={member.user.avatar} 
                              alt={member.user.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {member.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.user?.name}</p>
                          <p className="text-sm text-gray-500">{member.totalHabits} habits</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{member.currentStreaks} days</p>
                        <p className="text-sm text-gray-500">current streaks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Streak Leaderboard</h3>
                <div className="space-y-3">
                  {overview?.leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{entry.userId?.name}</p>
                          <p className="text-sm text-gray-500">{entry.workspaceHabitId?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🔥</span>
                        <span className="font-semibold text-gray-900">{entry.currentStreak}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {activities.slice(0, 8).map(activity => (
                    <ActivityItem key={activity._id} activity={activity} />
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all activity
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Workspace Activity</h3>
            <div className="space-y-4">
              {activities.map(activity => (
                <ActivityItem key={activity._id} activity={activity} detailed />
              ))}
            </div>
          </div>
        )}

        {/* Add other tab content here */}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
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
        return `completed ${activity.data.habitName}`;
      case 'streak_milestone':
        return `reached ${activity.data.streakCount} day streak on ${activity.data.habitName}`;
      case 'goal_achieved':
        return `achieved their goal: ${activity.data.message}`;
      case 'member_joined':
        return `joined the workspace`;
      default:
        return activity.data.message || 'had some activity';
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
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <span className="text-lg">{getActivityIcon(activity.type)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.userId?.name}</span>
          {' '}
          <span>{getActivityMessage(activity)}</span>
        </p>
        <p className="text-xs text-gray-500">{timeAgo(activity.createdAt)}</p>
        {detailed && activity.reactionCounts && (
          <div className="mt-2 flex items-center space-x-4">
            {Object.entries(activity.reactionCounts).map(([type, count]) => (
              <button key={type} className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700">
                <span>{type === 'like' ? '👍' : type === 'celebrate' ? '🎉' : '❤️'}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceOverview;
