import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@radix-ui/themes";
import {
  GearIcon,
  BellIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../../../contexts/AuthContext";
import NotificationsDropdown from "../NotificationsDropdown";
import ThemeSwitcher from "../../ui/ThemeSwitcher";
import { notificationsAPI } from "../../../services/api";

const TITLES = {
  "/app": "Dashboard",
  "/app/dashboard": "Dashboard",
  "/app/habits": "Habits",
  "/app/analytics": "Analytics",
  "/app/journal": "Journal",
  "/app/compass": "Compass",
  "/app/settings": "Settings",
  "/app/groups": "Groups",
};

/**
 * StandardTopBar — floating horizontal nav for the Standard design system.
 *
 * Props:
 *   userName, userAvatar
 *   leftOffset — px gap on the left to align with the content column
 */
const StandardTopBar = ({ userName = "User", userAvatar, leftOffset = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetch = () => notificationsAPI.getUnreadCount()
      .then((r) => setCount(r.data?.unreadCount || 0)).catch(() => {});
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate("/"); } catch (e) { console.error(e); }
  };

  const title = (() => {
    const p = location.pathname;
    if (p.startsWith("/app/groups")) return "Groups";
    return TITLES[p] || "Dashboard";
  })();

  return (
    <header
      className="std-card fixed top-3 right-3 z-20 h-14 flex items-center justify-between px-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.7)]"
      style={{ left: leftOffset }}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-3 min-w-0 pl-1">
        <p className="std-mono text-[11px] tracking-[0.14em] truncate">
          <span className="text-[var(--ink-3)]">HOME /</span>{" "}
          <span className="text-[var(--signal)] font-bold">{title.toUpperCase()}</span>
        </p>
      </div>

      {/* Right: theme + notifications + avatar */}
      <div className="flex items-center gap-1.5">
        <ThemeSwitcher compact={true} />

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-8 h-8 flex items-center justify-center rounded-[8px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <BellIcon className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center bg-[var(--rose)] text-[9px] font-bold text-white leading-none">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
          <NotificationsDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onNotificationCountChange={() =>
              notificationsAPI.getUnreadCount().then((r) => setCount(r.data?.unreadCount || 0)).catch(() => {})
            }
          />
        </div>

        <div className="relative flex items-center pl-1.5 ml-1 border-l border-[var(--line-2)]">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-[8px] hover:bg-[var(--surface-2)] transition-colors"
          >
            <Avatar
              src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=a78bfa`}
              alt={userName}
              fallback={userName.charAt(0).toUpperCase()}
              size="1"
              className="ring-1 ring-[var(--line-2)]"
            />
            <span className="hidden lg:block text-sm font-medium text-[var(--ink)]">{userName}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="std-card absolute top-full right-0 mt-2 w-48 z-50 py-1 shadow-xl">
                <button
                  onClick={() => { setShowUserMenu(false); navigate("/app/settings"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <GearIcon className="w-4 h-4" /> Settings
                </button>
                <div className="mx-2 h-px my-1 bg-[var(--line-2)]" />
                <button
                  onClick={() => { setShowUserMenu(false); handleLogout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--rose)] hover:bg-[var(--rose)]/10 transition-colors"
                >
                  <ExitIcon className="w-4 h-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default StandardTopBar;
