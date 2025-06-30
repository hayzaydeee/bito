import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Flex, Text, Button } from "@radix-ui/themes";
import {
  DashboardIcon,
  BarChartIcon,
  GearIcon,
  CalendarIcon,
  TargetIcon,
  LightningBoltIcon,
  ActivityLogIcon,
  HomeIcon,
  PersonIcon,
  PlusIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
  BackpackIcon,
} from "@radix-ui/react-icons";
import WorkspaceCreationModal from "../ui/WorkspaceCreationModal";
import { groupsAPI } from "../../services/api";

const VerticalMenu = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch user's workspaces
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoadingWorkspaces(true);
      const data = await groupsAPI.getGroups();
      if (data.success) {
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: DashboardIcon,
      description: "Overview & insights",
      color: "from-blue-500 to-blue-600",
      path: "/app/dashboard",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChartIcon,
      description: "Detailed reports",
      color: "from-orange-500 to-orange-600",
      path: "/app/analytics",
    },
  ];

  const bottomItems = [
    {
      id: "settings",
      label: "Settings",
      icon: GearIcon,
      description: "Preferences",
      color: "from-gray-500 to-gray-600",
      path: "/app/settings",
    },
  ];

  const renderMenuItem = (item, isBottom = false) => {
    const Icon = item.icon;
    const isActive =
      location.pathname === item.path ||
      (location.pathname === "/app" && item.path === "/app/dashboard");

    if (isCollapsed) {
      return (
        <div key={item.id} className="group relative mb-2">
          <button
            className={`w-full h-10 rounded-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
              isActive
                ? `bg-gradient-to-r ${item.color} shadow-lg shadow-black/20 scale-105`
                : "hover:bg-[var(--color-surface-hover)] hover:scale-105 bg-transparent"
            }`}
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                isActive ? "text-white" : "text-[var(--color-text-accent)]"
              }`}
            />
          </button>

          {/* Tooltip for collapsed mode */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg px-3 py-2 shadow-lg">
              <Text className="text-sm font-medium font-outfit text-[var(--color-text-primary)]">
                {item.label}
              </Text>
              <Text className="text-xs font-outfit text-[var(--color-text-tertiary)]">
                {item.description}
              </Text>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={item.id} className="mb-1">
        <button
          className={`w-full p-3 rounded-xl transition-all duration-300 flex items-center gap-3 relative overflow-hidden group ${
            isActive
              ? `bg-gradient-to-r ${item.color} shadow-lg shadow-black/20 transform scale-[1.02]`
              : "hover:bg-[var(--color-surface-hover)] hover:scale-[1.01] bg-transparent"
          }`}
          onClick={() => navigate(item.path)}
        >
          {/* Background pattern for active state */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl" />
          )}
          {/* Icon container */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
              isActive
                ? "bg-white/20 shadow-lg"
                : "bg-[var(--color-surface-secondary)] group-hover:bg-[var(--color-surface-elevated)]"
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                isActive ? "text-white" : "text-[var(--color-text-accent)]"
              }`}
            />
          </div>
          {/* Text content */}
          <div className="flex-1 text-left min-w-0">
            <Text
              className={`font-medium text-sm font-outfit transition-colors ${
                isActive ? "text-white" : "text-[var(--color-text-primary)]"
              }`}
            >
              {item.label}
            </Text>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen relative z-10 transition-all duration-300 border-r border-[var(--color-border-primary)]`}
      style={{ backgroundColor: "var(--color-surface-primary)" }}
    >
      <div className="h-full flex flex-col p-3">
        {/* Header */}
        <div className="mb-6">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center shadow-lg">
                <TargetIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold gradient-text font-dmSerif">
                  Bito
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center shadow-lg mx-auto">
              <TargetIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 space-y-1">
          {menuItems.map((item) => renderMenuItem(item))}
        </div>

        {/* Groups Section */}
        {!isCollapsed && (
          <div className="py-4 border-t border-[var(--color-border-secondary)]">
            {/* Groups Button with Hover Actions */}
            <div className="group relative mb-3">
              <div
                onClick={() => navigate('/app/groups')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-hover)] transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <BackpackIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] font-outfit">
                    Groups
                  </span>
                </div>
                
                {/* Hover Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateModal(true);
                    }}
                    className="p-1.5 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
                    title="Create group"
                  >
                    <PlusIcon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add dropdown menu functionality here
                    }}
                    className="p-1.5 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
                    title="Group options"
                  >
                    <DotsHorizontalIcon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/app/groups');
                    }}
                    className="p-1.5 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
                    title="Expand groups"
                  >
                    <ChevronDownIcon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {loadingWorkspaces ? (
                <div className="text-xs text-[var(--color-text-tertiary)] px-2 py-1">
                  Loading...
                </div>
              ) : workspaces.length === 0 ? (
                <div className="text-xs text-[var(--color-text-tertiary)] px-2 py-1">
                  No groups yet
                </div>
              ) : (
                workspaces.map((workspace) => {
                  const isActive = location.pathname === `/app/groups/${workspace._id}`;
                  return (
                    <button
                      key={workspace._id}
                      onClick={() => navigate(`/app/groups/${workspace._id}`)}
                      className={`w-full p-2 rounded-lg text-left transition-all duration-200 flex items-center gap-2 ${
                        isActive
                          ? 'bg-[var(--color-brand-500)] text-white'
                          : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-white/20' : 'bg-[var(--color-surface-elevated)]'
                      }`}>
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{workspace.name}</p>
                        <p className={`text-xs truncate ${
                          isActive ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'
                        }`}>
                          {workspace.stats?.activeMemberCount || 0} members
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
              {workspaces.length > 0 && (
                <button
                  onClick={() => navigate('/app/groups')}
                  className="w-full p-2 mt-1 rounded-lg text-left transition-all duration-200 hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  <p className="text-xs font-medium">View all groups →</p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapsed Groups */}
        {isCollapsed && workspaces.length > 0 && (
          <div className="py-2 border-t border-[var(--color-border-secondary)]">
            {workspaces.slice(0, 3).map((workspace) => {
              const isActive = location.pathname === `/app/groups/${workspace._id}`;
              return (
                <div key={workspace._id} className="group relative mb-2">
                  <button
                    className={`w-full h-10 rounded-xl transition-all duration-300 flex items-center justify-center ${
                      isActive
                        ? 'bg-[var(--color-brand-500)] text-white shadow-lg scale-105'
                        : 'hover:bg-[var(--color-surface-hover)] hover:scale-105 bg-transparent'
                    }`}
                    onClick={() => navigate(`/app/groups/${workspace._id}`)}
                    title={workspace.name}
                  >
                    <span className="text-sm font-bold">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg px-3 py-2 shadow-lg">
                      <Text className="text-sm font-medium font-outfit text-[var(--color-text-primary)]">
                        {workspace.name}
                      </Text>
                      <Text className="text-xs font-outfit text-[var(--color-text-tertiary)]">
                        {workspace.stats?.activeMemberCount || 0} members
                      </Text>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Section */}
        <div className="border-t border-[var(--color-border-secondary)] pt-3 mt-auto">
          {bottomItems.map((item) => renderMenuItem(item, true))}
        </div>
      </div>

      {/* Workspace Creation Modal */}
      <WorkspaceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWorkspaceCreated={(newWorkspace) => {
          setWorkspaces(prev => [...prev, newWorkspace]);
          navigate(`/app/groups/${newWorkspace._id}`);
        }}
      />
    </div>
  );
};

export default VerticalMenu;