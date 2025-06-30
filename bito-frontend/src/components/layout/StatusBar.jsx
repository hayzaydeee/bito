import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@radix-ui/themes";
import {
  HamburgerMenuIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Cross1Icon,
  GearIcon,
  BellIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../../contexts/AuthContext";

const StatusBar = ({
  isMenuCollapsed,
  setIsMenuCollapsed,
  userName = "User",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    switch (path) {
      case "/app":
      case "/app/dashboard":
        return "Dashboard";
      case "/app/habits":
        return "Habits Management";
      case "/app/calendar":
        return "Calendar View";
      case "/app/analytics":
        return "Analytics";
      case "/app/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };
  return (
    <div className="bg-[var(--color-surface-secondary)]/90 border-b border-[var(--color-border-primary)] px-4 py-2 flex items-center justify-between font-outfit backdrop-blur-sm relative z-30">
      <div className="flex items-center">
        {/* Menu toggle button */}
        <button
          onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
          className="mr-3 p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          aria-label={isMenuCollapsed ? "Expand menu" : "Collapse menu"}
          style={{ color: "var(--color-text-secondary)" }}
        >
          <HamburgerMenuIcon className="w-4 h-4" />
        </button>

        {/* Breadcrumbs */}
        <div className="flex items-center text-sm">
          <span style={{ color: "var(--color-text-secondary)" }}>Home</span>
          <ChevronRightIcon
            className="mx-1 w-3 h-3"
            style={{ color: "var(--color-brand-500)" }}
          />
          <span
            className="font-medium"
            style={{ color: "var(--color-brand-500)" }}
          >
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Right Section - Search + User Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          {isSearchOpen ? (
            <div className="flex items-center bg-[var(--color-surface-elevated)] rounded-md overflow-hidden pr-1 border border-[var(--color-border-primary)]">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent px-3 py-1 text-sm outline-none w-48 font-outfit"
                style={{ color: "var(--color-text-primary)" }}
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <Cross1Icon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Actions from WelcomeBar */}
        <div className="flex items-center gap-2 pl-3 border-l border-[var(--color-border-primary)]/50">
          {/* Notifications */}
          <button className="relative group p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]/60 transition-all duration-200">
            <BellIcon className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center border border-[var(--color-surface-primary)] shadow-sm">
              <span className="text-xs text-white font-bold leading-none">
                3
              </span>
            </div>
          </button>

          {/* Settings */}
          <button className="group p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]/60 transition-all duration-200">
            <GearIcon className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
          </button>          {/* User Avatar with Dropdown */}
          <div className="relative flex items-center gap-2 pl-2 ml-1 border-l border-[var(--color-border-primary)]/50 z-50">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--color-surface-hover)]/60 transition-all duration-200"
            >
              <Avatar
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=6366f1`}
                alt={userName}
                fallback={userName.charAt(0).toUpperCase()}
                size="1"
                className="ring-1 ring-[var(--color-brand-500)]/30"
              />
              <span className="hidden md:block text-sm font-medium font-outfit text-[var(--color-text-primary)]">
                {userName}
              </span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/app/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <GearIcon className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="border-t border-[var(--color-border-primary)] my-1" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <ExitIcon className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
