import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Flex, Button } from "@radix-ui/themes";
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
    
    // Listen for workspace updates from other components
    const handleWorkspaceUpdate = (event) => {
      const updatedWorkspace = event.detail.workspace;
      setWorkspaces(prev => 
        prev.map(ws => 
          ws._id === updatedWorkspace._id ? { ...ws, ...updatedWorkspace } : ws
        )
      );
    };

    window.addEventListener('workspaceUpdated', handleWorkspaceUpdate);
    
    return () => {
      window.removeEventListener('workspaceUpdated', handleWorkspaceUpdate);
    };
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
        <div key={item.id} className="group relative mb-1">
          <button
            className={`w-full h-10 rounded-lg transition-all duration-200 flex items-center justify-center relative ${
              isActive
                ? "bg-[var(--color-surface-hover)]"
                : "hover:bg-[var(--color-surface-hover)] bg-transparent"
            }`}
            onClick={() => handleNavigation(item.path)}
            title={item.label}
            style={isActive ? { borderLeft: "3px solid var(--color-brand-500)" } : {}}
          >
            <Icon
              className="w-5 h-5 transition-colors"
              style={{ color: isActive ? "var(--color-brand-500)" : "var(--color-text-secondary)" }}
            />
          </button>

          {/* Tooltip for collapsed mode */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg px-3 py-2 shadow-lg">
              <span className="text-sm font-medium font-spartan" style={{ color: "var(--color-text-primary)" }}>
                {item.label}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={item.id} className="mb-0.5">
        <button
          className={`w-full px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 relative ${
            isActive
              ? "bg-[var(--color-surface-hover)]"
              : "hover:bg-[var(--color-surface-hover)] bg-transparent"
          }`}
          onClick={() => handleNavigation(item.path)}
          style={isActive ? { borderLeft: "3px solid var(--color-brand-500)" } : {}}
        >
          <Icon
            className="w-[18px] h-[18px] flex-shrink-0 transition-colors"
            style={{ color: isActive ? "var(--color-brand-500)" : "var(--color-text-secondary)" }}
          />
          <span
            className="font-medium text-sm font-spartan transition-colors"
            style={{ color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
          >
            {item.label}
          </span>
        </button>
      </div>
    );
  };

  const renderGroupsMenuItem = () => {
    const isGroupsActive = location.pathname.startsWith('/app/groups');
    
    if (isCollapsed) {
      return (
        <div className="group relative mb-1">
          <button
            className={`w-full h-10 rounded-lg transition-all duration-200 flex items-center justify-center relative ${
              isGroupsActive
                ? "bg-[var(--color-surface-hover)]"
                : "hover:bg-[var(--color-surface-hover)] bg-transparent"
            }`}
            onClick={() => handleNavigation('/app/groups')}
            title="Groups"
            style={isGroupsActive ? { borderLeft: "3px solid var(--color-brand-500)" } : {}}
          >
            <BackpackIcon
              className="w-5 h-5 transition-colors"
              style={{ color: isGroupsActive ? "var(--color-brand-500)" : "var(--color-text-secondary)" }}
            />
          </button>

          {/* Tooltip for collapsed mode */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg px-3 py-2 shadow-lg">
              <span className="text-sm font-medium font-spartan" style={{ color: "var(--color-text-primary)" }}>
                Groups
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-0.5">
        {/* Main Groups Button */}
        <button
          className={`w-full px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 relative ${
            isGroupsActive && location.pathname === '/app/groups'
              ? "bg-[var(--color-surface-hover)]"
              : "hover:bg-[var(--color-surface-hover)] bg-transparent"
          }`}
          onClick={() => handleNavigation('/app/groups')}
          style={isGroupsActive && location.pathname === '/app/groups' ? { borderLeft: "3px solid var(--color-brand-500)" } : {}}
        >
          <BackpackIcon
            className="w-[18px] h-[18px] flex-shrink-0 transition-colors"
            style={{ color: isGroupsActive ? "var(--color-brand-500)" : "var(--color-text-secondary)" }}
          />
          
          <span
            className="font-medium text-sm font-spartan transition-colors flex-1 text-left"
            style={{ color: isGroupsActive ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
          >
            Groups
          </span>
          
          {/* Count + Collapse indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-spartan font-medium" style={{ color: "var(--color-text-tertiary)" }}>
              {workspaces.length}
            </span>
            <ChevronDownIcon 
              className={`w-3.5 h-3.5 transition-transform duration-200 ${groupsCollapsed ? 'rotate-180' : ''}`}
              style={{ color: "var(--color-text-tertiary)" }}
              onClick={(e) => {
                e.stopPropagation();
                setGroupsCollapsed(!groupsCollapsed);
              }}
            />
          </div>
        </button>

        {/* Expandable Groups List */}
        {!groupsCollapsed && (
          <div className="mt-1 ml-8 space-y-0.5">
            {loadingWorkspaces ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-4 h-4 rounded bg-[var(--color-surface-elevated)] animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 bg-[var(--color-surface-elevated)] rounded animate-pulse"></div>
                </div>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="px-3 py-2">
                <p className="text-xs font-spartan" style={{ color: "var(--color-text-tertiary)" }}>No groups yet</p>
              </div>
            ) : (
              workspaces.slice(0, 5).map((workspace) => {
                const wsActive = location.pathname === `/app/groups/${workspace._id}`;
                return (
                  <button
                    key={workspace._id}
                    onClick={() => handleNavigation(`/app/groups/${workspace._id}`)}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-all duration-200 flex items-center gap-2.5 ${
                      wsActive
                        ? 'bg-[var(--color-surface-hover)]'
                        : 'hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: wsActive ? "var(--color-brand-500)" : "var(--color-text-tertiary)" }}
                    />
                    <p
                      className="text-xs font-medium truncate font-spartan"
                      style={{ color: wsActive ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
                    >
                      {workspace.name}
                    </p>
                  </button>
                );
              })
            )}
            
            {workspaces.length > 5 && (
              <button
                onClick={() => handleNavigation('/app/groups')}
                className="w-full px-3 py-1.5 text-left transition-all duration-200 hover:bg-[var(--color-surface-hover)] rounded-lg"
              >
                <p className="text-xs font-medium font-spartan" style={{ color: "var(--color-text-tertiary)" }}>
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
        isCollapsed ? "w-16" : "w-60"
      } h-screen relative z-10 transition-all duration-200 border-r border-[var(--color-border-primary)] ${
        isMobile ? 'w-60' : ''
      }`}
      style={{ backgroundColor: "var(--color-surface-primary)" }}
    >
      <div className="h-full flex flex-col px-3 py-4">
        {/* Header — Logo */}
        <div className="mb-6">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--color-brand-600)" }}>
                <TargetIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold font-garamond" style={{ color: "var(--color-text-primary)" }}>
                bito
              </span>
            </div>
          )}
          {isCollapsed && !isMobile && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--color-brand-600)" }}>
              <TargetIcon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Section label */}
        {!isCollapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider font-spartan" style={{ color: "var(--color-text-tertiary)" }}>
            Main
          </p>
        )}

        {/* Main Navigation */}
        <div className="flex-1 space-y-0.5">
          {menuItems.map((item) => renderMenuItem(item))}
          
          {/* Separator */}
          {!isCollapsed && (
            <div className="pt-4 pb-2">
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider font-spartan" style={{ color: "var(--color-text-tertiary)" }}>
                Teams
              </p>
            </div>
          )}
          {isCollapsed && <div className="py-3"><div className="h-px mx-1" style={{ backgroundColor: "var(--color-border-primary)" }} /></div>}
          
          {/* Expandable Groups Menu Item */}
          {renderGroupsMenuItem()}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-auto pt-2 border-t" style={{ borderColor: "var(--color-border-primary)" }}>
          {bottomItems.map((item) => renderMenuItem(item, true))}
        </div>
      </div>
    </div>
  );
};

export default VerticalMenu;
