import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@radix-ui/themes';
import { 
  PlusIcon,
  PersonIcon,
  GearIcon,
  BarChartIcon,
  CalendarIcon,
  HomeIcon,
  BackpackIcon,
  HeartIcon,
  TargetIcon,
  ActivityLogIcon,
  EnterIcon,
  CheckIcon,
  ClockIcon
} from '@radix-ui/react-icons';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const GroupSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'team',
    isPublic: false
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await groupsAPI.getGroups();
      if (response.success) {
        setGroups(response.workspaces);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await groupsAPI.createGroup(newGroup);
      if (response.success) {
        setGroups(prev => [...prev, response.workspace]);
        setShowCreateModal(false);
        setNewGroup({ name: '', description: '', type: 'team', isPublic: false });
        // Navigate to the new group
        navigate(`/app/groups/${response.workspace._id}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const groupTypeIcons = {
    family: HomeIcon,
    team: BackpackIcon,
    fitness: HeartIcon,
    study: CalendarIcon,
    community: ActivityLogIcon
  };

  const groupTypeColors = {
    family: 'from-blue-500 to-blue-600',
    team: 'from-purple-500 to-purple-600', 
    fitness: 'from-red-500 to-red-600',
    study: 'from-green-500 to-green-600',
    community: 'from-orange-500 to-orange-600'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-[var(--color-surface-elevated)] rounded-2xl"></div>
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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
          {/* Left side - Title & Subtitle */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold font-dmSerif gradient-text leading-tight">
                  My Groups
                </h1>
                <p className="text-base sm:text-lg text-[var(--color-text-secondary)] font-outfit leading-relaxed mt-1">
                  Collaborate on habits with your team, family, and community
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Create Button */}
          <div className="flex-shrink-0 mt-6 lg:mt-0">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 h-12 px-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold"
            >
              <PlusIcon className="w-5 h-5" />
              Create Group
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/30 flex items-center justify-center">
                <BackpackIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {groups.length}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Active Groups
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/30 flex items-center justify-center">
                <PersonIcon className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {groups.reduce((acc, ws) => acc + (ws.members?.length || 0), 0)}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Total Members
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl p-6 border border-[var(--color-border-primary)]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400/30 flex items-center justify-center">
                <TargetIcon className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                  {groups.reduce((acc, ws) => acc + (ws.habitCount || 0), 0)}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                  Shared Habits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-[var(--color-surface-elevated)] to-[var(--color-surface-hover)] border-2 border-dashed border-[var(--color-border-primary)]/40 flex items-center justify-center mx-auto mb-6">
              <BackpackIcon className="w-12 h-12 text-[var(--color-text-tertiary)]" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-3">
              No groups yet
            </h3>
            <p className="text-[var(--color-text-secondary)] font-outfit mb-8 max-w-md mx-auto">
              Create your first group to start collaborating on habits with your team, family, or community.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 h-12 px-8 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-semibold mx-auto"
            >
              <PlusIcon className="w-5 h-5" />
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const TypeIcon = groupTypeIcons[group.type] || BackpackIcon;
              const colorClass = groupTypeColors[group.type] || 'from-gray-500 to-gray-600';
              
              return (
                <Card 
                  key={group._id} 
                  className="glass-card-minimal p-6 rounded-3xl shadow-lg border border-[var(--color-border-primary)]/10 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]"
                  onClick={() => navigate(`/app/groups/${group._id}`)}
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${colorClass} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                        <TypeIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        {group.isPublic && (
                          <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <GearIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif leading-tight mb-1">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-[var(--color-text-secondary)] font-outfit leading-relaxed">
                            {group.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
                          <PersonIcon className="w-4 h-4" />
                          <span className="font-outfit">{group.members?.length || 0} members</span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
                          <TargetIcon className="w-4 h-4" />
                          <span className="font-outfit">{group.habitCount || 0} habits</span>
                        </div>
                      </div>
                      
                      {/* Progress */}
                      {group.weeklyProgress && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text-secondary)] font-outfit">This week</span>
                            <span className="text-[var(--color-text-primary)] font-outfit font-medium">
                              {Math.round(group.weeklyProgress)}%
                            </span>
                          </div>
                          <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
                              style={{ width: `${group.weeklyProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-primary)]/10">
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                        <ClockIcon className="w-3 h-3" />
                        <span className="font-outfit">
                          Updated {new Date(group.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--color-brand-500)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-xs font-outfit font-medium">Open</span>
                        <EnterIcon className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface-primary)] rounded-3xl shadow-2xl border border-[var(--color-border-primary)]/20 max-w-md w-full p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
                    <PlusIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-2">
                    Create Group
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Start collaborating on habits with your team
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Smith Family Habits"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={newGroup.description}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-all duration-200 resize-none"
                      rows="3"
                      placeholder="What habits will you track together?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] font-outfit mb-2">
                      Group Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(groupTypeIcons).map(([type, Icon]) => (
                        <button
                          key={type}
                          onClick={() => setNewGroup(prev => ({ ...prev, type }))}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                            newGroup.type === type
                              ? 'bg-[var(--color-brand-500)]/10 border-[var(--color-brand-500)]/40 text-[var(--color-brand-600)]'
                              : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-primary)]/40 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-outfit font-medium capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="soft"
                    className="flex-1 h-12 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl transition-all duration-200 font-outfit font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={!newGroup.name.trim()}
                    className="flex-1 h-12 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] disabled:bg-[var(--color-surface-elevated)] disabled:text-[var(--color-text-tertiary)] text-white rounded-xl transition-all duration-200 font-outfit font-semibold shadow-lg"
                  >
                    Create Group
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSelection;
