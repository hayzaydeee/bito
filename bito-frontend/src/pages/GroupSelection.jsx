import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "@radix-ui/themes";
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
  ClockIcon,
} from "@radix-ui/react-icons";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import WorkspaceCreationModal from "../components/ui/WorkspaceCreationModal";

const GroupSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    type: "team",
    isPublic: false,
    color: "#4f46e5", // Added default color for the new modal
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
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (formData) => {
    try {
      // Transform the formData from WorkspaceCreationModal to the format expected by the API
      const groupData = {
        name: formData.name,
        description: formData.description,
        type: formData.type || "team",
        isPublic: !formData.isPrivate, // Convert isPrivate to isPublic
        color: formData.color
      };
      
      const response = await groupsAPI.createGroup(groupData);
      if (response.success) {
        setGroups((prev) => [...prev, response.workspace]);
        setShowCreateModal(false);
        setNewGroup({
          name: "",
          description: "",
          type: "team",
          isPublic: false,
          color: "#4f46e5",
        });
        // Navigate to the new group
        navigate(`/app/groups/${response.workspace._id}`);
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const groupTypeIcons = {
    family: HomeIcon,
    team: BackpackIcon,
    fitness: HeartIcon,
    study: CalendarIcon,
    community: ActivityLogIcon,
  };

  const groupTypeColors = {
    family: "from-blue-500 to-blue-600",
    team: "from-purple-500 to-purple-600",
    fitness: "from-red-500 to-red-600",
    study: "from-green-500 to-green-600",
    community: "from-orange-500 to-orange-600",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen page-container p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-[var(--color-surface-elevated)] rounded-2xl"
                ></div>
              ))}
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
          <div>
            <h1 className="text-3xl font-bold font-dmSerif gradient-text mb-2">
              Groups
            </h1>
            <p className="text-md text-[var(--color-text-secondary)] font-outfit">
              Collaborate on habits with your team, family, and community.
            </p>
          </div>

          {/* Create Group Button */}
          <div className="mt-6 lg:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-700)] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-outfit font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Create Group
            </button>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm p-6 rounded-xl border border-[var(--color-border-primary)]/30 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-blue-600/5 rounded-full -translate-y-12 translate-x-12"></div>
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-400/20 flex items-center justify-center mb-4">
                <BackpackIcon className="w-6 h-6 text-blue-500" />
              </div>

              {/* Value */}
              <div className="mb-2">
                <span className="text-3xl font-bold font-dmSerif text-[var(--color-text-primary)]">
                  {groups.length}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit mb-1">
                Active Groups
              </h3>

              {/* Description */}
              <p className="text-xs text-[var(--color-text-tertiary)] font-outfit leading-tight">
                workspaces in your network
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm p-6 rounded-xl border border-[var(--color-border-primary)]/30 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-green-600/5 rounded-full -translate-y-12 translate-x-12"></div>
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-400/20 flex items-center justify-center mb-4">
                <PersonIcon className="w-6 h-6 text-green-500" />
              </div>

              {/* Value */}
              <div className="mb-2">
                <span className="text-3xl font-bold font-dmSerif text-[var(--color-text-primary)]">
                  {groups.reduce(
                    (total, group) => total + (group.members?.length || 0),
                    0
                  )}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit mb-1">
                Total Members
              </h3>

              {/* Description */}
              <p className="text-xs text-[var(--color-text-tertiary)] font-outfit leading-tight">
                people across all groups
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm p-6 rounded-xl border border-[var(--color-border-primary)]/30 relative overflow-hidden group hover:scale-105 transition-all duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-purple-600/5 rounded-full -translate-y-12 translate-x-12"></div>
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-400/20 flex items-center justify-center mb-4">
                <TargetIcon className="w-6 h-6 text-purple-500" />
              </div>

              {/* Value */}
              <div className="mb-2">
                <span className="text-3xl font-bold font-dmSerif text-[var(--color-text-primary)]">
                  {groups.reduce(
                    (total, group) => total + (group.habitCount || 0),
                    0
                  )}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit mb-1">
                Shared Habits
              </h3>

              {/* Description */}
              <p className="text-xs text-[var(--color-text-tertiary)] font-outfit leading-tight">
                habits available to adopt
              </p>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-elevated)]/80 border-2 border-dashed border-[var(--color-border-primary)]/40 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <BackpackIcon className="w-16 h-16 text-[var(--color-text-tertiary)]" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--color-brand-500)]/10 to-[var(--color-brand-600)]/5 opacity-50"></div>
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-4">
              No groups yet
            </h3>
            <p className="text-md text-[var(--color-text-secondary)] font-outfit mb-8 max-w-lg mx-auto leading-relaxed">
              Create your first group to start collaborating on habits with your
              team, family, or community. Build accountability together and
              achieve your goals faster.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group) => {
              const TypeIcon = groupTypeIcons[group.type] || BackpackIcon;
              const colorClass =
                groupTypeColors[group.type] || "from-gray-500 to-gray-600";

              return (
                <div
                  key={group._id}
                  className="group relative bg-gradient-to-br from-[var(--color-surface-elevated)] via-[var(--color-surface-elevated)]/95 to-[var(--color-surface-elevated)]/90 rounded-2xl p-5 border border-[var(--color-border-primary)]/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:border-[var(--color-border-primary)]/30 overflow-hidden"
                  onClick={() => navigate(`/app/groups/${group._id}`)}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                  {/* Content */}
                  <div className="relative space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}
                      >
                        <TypeIcon className="w-6 h-6 text-white" />
                        {/* Shine effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.isPublic && (
                          <div className="relative w-6 h-6 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-400/40 flex items-center justify-center shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-sm"></div>
                            <div className="absolute inset-0 rounded-lg bg-green-400/20 animate-pulse"></div>
                          </div>
                        )}
                        <button className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]/20 flex items-center justify-center transition-all duration-200 hover:scale-105">
                          <GearIcon className="w-3 h-3 text-[var(--color-text-secondary)]" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-dmSerif leading-tight mb-1 group-hover:text-[var(--color-text-primary)] transition-colors duration-200">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-[var(--color-text-secondary)] font-outfit leading-relaxed line-clamp-2">
                            {group.description}
                          </p>
                        )}
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gradient-to-br from-[var(--color-surface-primary)] to-[var(--color-surface-primary)]/80 rounded-lg p-2.5 border border-[var(--color-border-primary)]/10 group-hover:border-[var(--color-border-primary)]/20 transition-all duration-200">
                          <div className="flex items-center gap-1.5 mb-1">
                            <PersonIcon className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-[var(--color-text-tertiary)] font-outfit font-medium">
                              Members
                            </span>
                          </div>
                          <p className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
                            {group.members?.length || 0}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-[var(--color-surface-primary)] to-[var(--color-surface-primary)]/80 rounded-lg p-2.5 border border-[var(--color-border-primary)]/10 group-hover:border-[var(--color-border-primary)]/20 transition-all duration-200">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TargetIcon className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-[var(--color-text-tertiary)] font-outfit font-medium">
                              Habits
                            </span>
                          </div>
                          <p className="text-base font-bold text-[var(--color-text-primary)] font-dmSerif">
                            {group.habitCount || 0}
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      {group.weeklyProgress !== undefined && (
                        <div className="space-y-2 p-3 bg-gradient-to-br from-[var(--color-surface-primary)] to-[var(--color-surface-primary)]/80 rounded-lg border border-[var(--color-border-primary)]/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <BarChartIcon className="w-3 h-3 text-purple-500" />
                              <span className="text-xs text-[var(--color-text-secondary)] font-outfit font-medium">
                                This week
                              </span>
                            </div>
                            <span className="text-sm font-bold text-[var(--color-text-primary)] font-dmSerif">
                              {Math.round(group.weeklyProgress)}%
                            </span>
                          </div>
                          <div className="relative w-full bg-[var(--color-surface-secondary)] rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${colorClass} shadow-sm transition-all duration-700 ease-out`}
                              style={{ width: `${group.weeklyProgress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-primary)]/10">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] font-outfit">
                        <ClockIcon className="w-3 h-3" />
                        <span>
                          {new Date(group.updatedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-[var(--color-brand-500)]/10 to-[var(--color-brand-600)]/5 border border-[var(--color-brand-400)]/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <EnterIcon className="w-3 h-3 text-[var(--color-brand-500)]" />
                        <span className="text-xs text-[var(--color-brand-600)] font-outfit font-medium">
                          Open
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Group Modal */}
        <WorkspaceCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateGroup}
        />
      </div>
    </div>
  );
};

export default GroupSelection;
