import React, { useState, useEffect } from "react";
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
import NotificationsDropdown from "./NotificationsDropdown";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import { notificationsAPI } from "../../services/api";

const StatusBar = ({
  isMenuCollapsed,
  setIsMenuCollapsed,
  userName = "User",
  isMobile = false,
  mobileMenuOpen = false,
  setMobileMenuOpen = () => {},
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch notification count on component mount
  useEffect(() => {
    fetchNotificationCount();
    // Set up interval to refresh notification count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setNotificationCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

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
    <div className={`bg-[var(--color-surface-secondary)]/90 border-b border-[var(--color-border-primary)] px-4 py-2 flex items-center justify-between font-outfit backdrop-blur-sm relative z-30 ${
      isMobile ? 'status-bar-mobile' : ''
    }`}>
      <div className="flex items-center">
        {/* Menu toggle button - behavior changes for mobile */}
        <button
          onClick={() => {
            if (isMobile) {
              setMobileMenuOpen(!mobileMenuOpen);
            } else {
              setIsMenuCollapsed(!isMenuCollapsed);
            }
          }}
          className={`mr-3 p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors touch-target ${
            isMobile ? 'touch-target' : ''
          }`}
          aria-label={
            isMobile 
              ? (mobileMenuOpen ? "Close menu" : "Open menu")
              : (isMenuCollapsed ? "Expand menu" : "Collapse menu")
          }
          style={{ color: "var(--color-text-secondary)" }}
        >
          <HamburgerMenuIcon className="w-4 h-4" />
        </button>

        {/* Breadcrumbs - hide on very small screens */}
        <div className={`flex items-center text-sm ${isMobile ? 'hidden sm:flex' : ''}`}>
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

        {/* Mobile title - show only on small screens */}
        {isMobile && (
          <div className="flex sm:hidden">
            <span
              className="font-medium text-sm"
              style={{ color: "var(--color-brand-500)" }}
            >
              {getBreadcrumbTitle()}
            </span>
          </div>
        )}
      </div>

      {/* Right Section - User Actions */}
      <div className="flex items-center gap-2 md:gap-3">

        {/* Theme Switcher - hide on small mobile */}
        <div className={isMobile ? 'hidden sm:block' : ''}>
          <ThemeSwitcher compact={true} />
        </div>

        {/* User Actions from WelcomeBar */}
        <div className="flex items-center gap-1 md:gap-2 pl-2 md:pl-3 border-l border-[var(--color-border-primary)]/50">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative group p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]/60 transition-all duration-200 touch-target"
            >
              <BellIcon className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center border border-[var(--color-surface-primary)] shadow-sm">
                  <span className="text-xs text-white font-bold leading-none">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                </div>
              )}
            </button>
            
            <NotificationsDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onNotificationCountChange={fetchNotificationCount}
            />
          </div>

          {/* Settings - hide on very small screens, show in user menu instead */}
          <button 
            onClick={() => navigate('/app/settings')}
            className={`group p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]/60 transition-all duration-200 touch-target ${
              isMobile ? 'hidden sm:block' : ''
            }`}
          >
            <GearIcon className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
          </button>

          {/* User Avatar with Dropdown */}
          <div className="relative flex items-center gap-1 md:gap-2 pl-1 md:pl-2 ml-1 border-l border-[var(--color-border-primary)]/50 z-50">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 md:gap-2 p-1 rounded-lg hover:bg-[var(--color-surface-hover)]/60 transition-all duration-200 touch-target"
            >
              <Avatar
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=6366f1`}
                alt={userName}
                fallback={userName.charAt(0).toUpperCase()}
                size="1"
                className="ring-1 ring-[var(--color-brand-500)]/30"
              />
              <span className="hidden lg:block text-sm font-medium font-outfit text-[var(--color-text-primary)]">
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
                <div className={`absolute top-full right-0 mt-2 w-48 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50 py-1 ${
                  isMobile ? 'modal-mobile' : ''
                }`}>
                  {/* Show theme switcher in mobile menu */}
                  {isMobile && (
                    <>
                      <div className="px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--color-text-primary)]">Theme</span>
                          <ThemeSwitcher compact={true} />
                        </div>
                      </div>
                      <div className="border-t border-[var(--color-border-primary)] my-1" />
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/app/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors touch-target"
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors touch-target"
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
