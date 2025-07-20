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
import { groupsAPI } from "../../services/api";

const VerticalMenu = ({ isCollapsed, isMobile = false, onMobileMenuClose = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupsCollapsed, setGroupsCollapsed] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    type: "team",
    isPublic: false,
  });

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
      console.error("Error fetching groups:", error);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await groupsAPI.createGroup(newGroup);
      if (response.success) {
        setWorkspaces((prev) => [...prev, response.workspace]);
        setShowCreateModal(false);
        setNewGroup({
          name: "",
          description: "",
          type: "team",
          isPublic: false,
        });
        // Navigate to the new group
        handleNavigation(`/app/groups/${response.workspace._id}`);
        // Close mobile menu after navigation
        if (isMobile) {
          onMobileMenuClose();
        }
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  // Handle navigation with mobile menu closure
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onMobileMenuClose();
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

  const groupTypeIcons = {
    family: HomeIcon,
    team: BackpackIcon,
    fitness: HomeIcon, // You can import HeartIcon if available
    study: CalendarIcon,
    community: ActivityLogIcon,
  };

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
            onClick={() => handleNavigation(item.path)}
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
          onClick={() => handleNavigation(item.path)}
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

  const renderGroupsMenuItem = () => {
    const isGroupsActive = location.pathname.startsWith('/app/groups');
    
    if (isCollapsed) {
      return (
        <div className="group relative mb-2">
          <button
            className={`w-full h-10 rounded-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
              isGroupsActive
                ? "bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-black/20 scale-105"
                : "hover:bg-[var(--color-surface-hover)] hover:scale-105 bg-transparent"
            }`}
            onClick={() => handleNavigation('/app/groups')}
            title="Groups"
          >
            <BackpackIcon
              className={`w-5 h-5 transition-colors ${
                isGroupsActive ? "text-white" : "text-[var(--color-text-accent)]"
              }`}
            />
          </button>

          {/* Tooltip for collapsed mode */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg px-3 py-2 shadow-lg">
              <Text className="text-sm font-medium font-outfit text-[var(--color-text-primary)]">
                Groups
              </Text>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-1">
        {/* Main Groups Button */}
        <button
          className={`w-full p-3 rounded-xl transition-all duration-300 flex items-center gap-3 relative overflow-hidden group ${
            isGroupsActive && location.pathname === '/app/groups'
              ? "bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-black/20 transform scale-[1.02]"
              : "hover:bg-[var(--color-surface-hover)] hover:scale-[1.01] bg-transparent"
          }`}
          onClick={() => handleNavigation('/app/groups')}
        >
          {/* Background pattern for active state */}
          {isGroupsActive && location.pathname === '/app/groups' && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl" />
          )}
          
          {/* Icon container */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
              isGroupsActive && location.pathname === '/app/groups'
                ? "bg-white/20 shadow-lg"
                : "bg-[var(--color-surface-secondary)] group-hover:bg-[var(--color-surface-elevated)]"
            }`}
          >
            <BackpackIcon
              className={`w-5 h-5 transition-colors ${
                isGroupsActive && location.pathname === '/app/groups' ? "text-white" : "text-[var(--color-text-accent)]"
              }`}
            />
          </div>
          
          {/* Text content */}
          <div className="flex-1 text-left min-w-0">
            <Text
              className={`font-medium text-sm font-outfit transition-colors ${
                isGroupsActive && location.pathname === '/app/groups' ? "text-white" : "text-[var(--color-text-primary)]"
              }`}
            >
              Groups
            </Text>
          </div>
          
          {/* Expand/Collapse indicator */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-outfit font-medium ${
              isGroupsActive && location.pathname === '/app/groups' ? "text-white/70" : "text-[var(--color-text-tertiary)]"
            }`}>
              {workspaces.length}
            </span>
            <ChevronDownIcon 
              className={`w-4 h-4 transition-all duration-200 ${
                isGroupsActive && location.pathname === '/app/groups' ? "text-white/70" : "text-[var(--color-text-tertiary)]"
              } ${groupsCollapsed ? 'rotate-180' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setGroupsCollapsed(!groupsCollapsed);
              }}
            />
          </div>
        </button>

        {/* Expandable Groups List */}
        {!groupsCollapsed && (
          <div className="mt-2 ml-11 space-y-1">
            {loadingWorkspaces ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-5 h-5 rounded-md bg-[var(--color-surface-elevated)] animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 bg-[var(--color-surface-elevated)] rounded animate-pulse mb-1"></div>
                  <div className="h-2 bg-[var(--color-surface-elevated)] rounded w-16 animate-pulse"></div>
                </div>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="px-3 py-2">
                <p className="text-xs text-[var(--color-text-tertiary)] font-outfit">No groups yet</p>
              </div>
            ) : (
              workspaces.slice(0, 5).map((workspace) => {
                const isActive = location.pathname === `/app/groups/${workspace._id}`;
                return (
                  <button
                    key={workspace._id}
                    onClick={() => handleNavigation(`/app/groups/${workspace._id}`)}
                    className={`w-full p-2 rounded-lg text-left transition-all duration-200 flex items-center gap-2 group ${
                      isActive
                        ? 'bg-[var(--color-brand-500)] text-white shadow-sm'
                        : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gradient-to-br from-[var(--color-brand-400)] to-[var(--color-brand-600)] text-white'
                    }`}>
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate font-outfit ${
                        isActive ? 'text-white' : 'text-[var(--color-text-primary)]'
                      }`}>
                        {workspace.name}
                      </p>
                    </div>
                    {!isActive && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronDownIcon className="w-3 h-3 text-[var(--color-text-tertiary)] rotate-[-90deg]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
            
            {workspaces.length > 5 && (
              <button
                onClick={() => handleNavigation('/app/groups')}
                className="w-full p-2 text-left transition-all duration-200 hover:bg-[var(--color-surface-hover)] rounded-lg"
              >
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-500)]">
                  View all {workspaces.length} groups →
                </p>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen relative z-10 transition-all duration-300 border-r border-[var(--color-border-primary)] ${
        isMobile ? 'w-64' : '' // Always full width on mobile
      }`}
      style={{ backgroundColor: "var(--color-surface-primary)" }}
    >
      <div className="h-full flex flex-col p-3">
        {/* Header */}
        <div className="mb-6">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center shadow-lg">
                <TargetIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold gradient-text font-outfit">
                bito
                </p>
              </div>
            </div>
          )}
          {isCollapsed && !isMobile && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center shadow-lg mx-auto">
              <TargetIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 space-y-1">
          {menuItems.map((item) => renderMenuItem(item))}
          
          {/* Expandable Groups Menu Item */}
          {renderGroupsMenuItem()}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-auto">
          {bottomItems.map((item) => renderMenuItem(item, true))}
        </div>
      </div>
    </div>
  );
};

export default VerticalMenu;
