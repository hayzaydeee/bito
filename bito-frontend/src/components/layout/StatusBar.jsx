import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@radix-ui/themes";
import {
  HamburgerMenuIcon,
  ChevronRightIcon,
  GearIcon,
  BellIcon,
  ExitIcon,
  TargetIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../../contexts/AuthContext";
import NotificationsDropdown from "./NotificationsDropdown";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import { notificationsAPI } from "../../services/api";

const StatusBar = ({
  isMenuCollapsed,
  setIsMenuCollapsed,
  userName = "User",
  userAvatar,
  isMobile = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
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
      case "/app/journal":
        return "Journal";
      case "/app/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  // ── Mobile: minimal header with logo + avatar ──
  if (isMobile) {
    return (
      <div
        className="px-5 py-4 flex items-center justify-between font-spartan relative z-30"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-brand-600)" }}
          >
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-lg font-bold font-garamond"
            style={{ color: "var(--color-text-primary)" }}
          >
            bito
          </span>
        </div>

        {/* Avatar → Settings */}
        <button
          onClick={() => navigate("/app/settings")}
          className="rounded-full transition-opacity hover:opacity-80"
        >
          <Avatar
            src={
              userAvatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=6366f1`
            }
            alt={userName}
            fallback={userName.charAt(0).toUpperCase()}
            size="1"
            className="ring-1 ring-[var(--color-border-primary)]"
          />
        </button>
      </div>
    );
  }

  // ── Desktop: full status bar ──
  return (
    <div
      className="border-b px-4 py-2 flex items-center justify-between font-spartan relative z-30"
      style={{
        backgroundColor: "var(--color-surface-primary)",
        borderColor: "var(--color-border-primary)",
      }}
    >
      <div className="flex items-center">
        {/* Sidebar collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
            className="mr-3 p-1.5 rounded-lg transition-colors"
            aria-label={isMenuCollapsed ? "Expand menu" : "Collapse menu"}
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <HamburgerMenuIcon className="w-4 h-4" />
          </button>
        )}

        {/* Page title on mobile, breadcrumbs on desktop */}
        {isMobile ? (
          <span
            data-tour="status-page"
            className="font-semibold text-sm font-spartan"
            style={{ color: "var(--color-text-primary)" }}
          >
            {getBreadcrumbTitle()}
          </span>
        ) : (
          <div data-tour="status-page" className="flex items-center text-sm">
            <span style={{ color: "var(--color-text-tertiary)" }}>Home</span>
            <ChevronRightIcon
              className="mx-1.5 w-3 h-3"
              style={{ color: "var(--color-text-tertiary)" }}
            />
            <span
              className="font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {getBreadcrumbTitle()}
            </span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div data-tour="status-actions" className="flex items-center gap-1.5">
        {/* Theme Switcher — desktop only */}
        {!isMobile && (
          <div>
            <ThemeSwitcher compact={true} />
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <BellIcon className="w-4 h-4" />
            {notificationCount > 0 && (
              <div
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border"
                style={{
                  backgroundColor: "var(--color-error)",
                  borderColor: "var(--color-surface-primary)",
                }}
              >
                <span className="text-[9px] text-white font-bold leading-none">
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

        {/* User Avatar with Dropdown — desktop only */}
        {!isMobile && (
          <div className="relative flex items-center pl-2 ml-1 border-l z-50" style={{ borderColor: "var(--color-border-primary)" }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Avatar
                src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=6366f1`}
                alt={userName}
                fallback={userName.charAt(0).toUpperCase()}
                size="1"
                className="ring-1 ring-[var(--color-border-primary)]"
              />
              <span
                className="hidden lg:block text-sm font-medium font-spartan"
                style={{ color: "var(--color-text-primary)" }}
              >
                {userName}
              </span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="absolute top-full right-0 mt-2 w-48 rounded-xl border shadow-lg z-50 py-1"
                  style={{
                    backgroundColor: "var(--color-surface-elevated)",
                    borderColor: "var(--color-border-primary)",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/app/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <GearIcon className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="mx-2 h-px my-1" style={{ backgroundColor: "var(--color-border-primary)" }} />
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
        )}
      </div>
    </div>
  );
};

export default StatusBar;
