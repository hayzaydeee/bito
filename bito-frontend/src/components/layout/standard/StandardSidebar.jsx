import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DashboardIcon,
  BarChartIcon,
  GearIcon,
  CalendarIcon,
  TargetIcon,
  LightningBoltIcon,
  BackpackIcon,
  ChevronDownIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { groupsAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * StandardSidebar — floating vertical nav for the Standard design system.
 * Detached, rounded panel pinned to the left over the standard surface.
 *
 * Props:
 *   isCollapsed — boolean (icons-only rail)
 */
const MENU = [
  { id: "dashboard", label: "Dashboard", icon: DashboardIcon,    path: "/app/dashboard" },
  { id: "habits",    label: "Habits",    icon: TargetIcon,       path: "/app/habits" },
  { id: "analytics", label: "Analytics", icon: BarChartIcon,     path: "/app/analytics" },
  { id: "journal",   label: "Journal",   icon: CalendarIcon,     path: "/app/journal" },
  { id: "compass",   label: "Compass",   icon: LightningBoltIcon, path: "/app/compass" },
];

const StandardSidebar = ({ isCollapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [groupsOpen, setGroupsOpen] = useState(true);

  useEffect(() => {
    let active = true;
    groupsAPI.getGroups()
      .then((d) => { if (active && d.success) setGroups(d.groups || []); })
      .catch(() => {});
    const onUpd = (e) => {
      const g = e.detail.group;
      setGroups((prev) => prev.map((w) => (w._id === g._id ? { ...w, ...g } : w)));
    };
    window.addEventListener("groupUpdated", onUpd);
    return () => { active = false; window.removeEventListener("groupUpdated", onUpd); };
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate("/"); } catch (e) { console.error("Logout failed:", e); }
  };

  const isActive = (path) =>
    location.pathname === path || (location.pathname === "/app" && path === "/app/dashboard");

  const navBtn = (item) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <button
        key={item.id}
        onClick={() => navigate(item.path)}
        title={isCollapsed ? item.label : undefined}
        className={`group relative w-full flex items-center gap-3 rounded-[10px] transition-colors ${
          isCollapsed ? "justify-center h-10" : "px-3 h-10"
        } ${active ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"}`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[var(--signal)]" />
        )}
        <Icon className="w-[18px] h-[18px] flex-shrink-0" style={{ color: active ? "var(--signal)" : "var(--ink-3)" }} />
        {!isCollapsed && (
          <span className="text-sm font-medium" style={{ color: active ? "var(--ink)" : "var(--ink-2)" }}>
            {item.label}
          </span>
        )}
      </button>
    );
  };

  const groupsActive = location.pathname.startsWith("/app/groups");

  return (
    <aside
      className="std-card fixed left-3 top-3 bottom-3 z-30 flex flex-col p-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.7)] transition-[width] duration-200"
      style={{ width: isCollapsed ? 68 : 236 }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 mb-5 ${isCollapsed ? "justify-center" : "px-1"}`}>
        <span className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 bg-[var(--signal)]">
          <TargetIcon className="w-5 h-5" style={{ color: "var(--signal-ink)" }} />
        </span>
        {!isCollapsed && <span className="std-display text-lg font-bold text-[var(--ink)]">bito</span>}
      </div>

      {/* Main */}
      {!isCollapsed && <p className="std-kicker px-2 mb-2">Main</p>}
      <div className="space-y-0.5">{MENU.map(navBtn)}</div>

      {/* Teams / Groups */}
      <div className="mt-4">
        {!isCollapsed ? (
          <button
            onClick={() => navigate("/app/groups")}
            className={`group relative w-full flex items-center gap-3 px-3 h-10 rounded-[10px] transition-colors ${
              groupsActive && location.pathname === "/app/groups" ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
            }`}
          >
            {groupsActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[var(--signal)]" />}
            <BackpackIcon className="w-[18px] h-[18px] flex-shrink-0" style={{ color: groupsActive ? "var(--signal)" : "var(--ink-3)" }} />
            <span className="text-sm font-medium flex-1 text-left" style={{ color: groupsActive ? "var(--ink)" : "var(--ink-2)" }}>Groups</span>
            <span className="std-mono text-[10px] text-[var(--ink-3)]">{String(groups.length).padStart(2, "0")}</span>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 transition-transform ${groupsOpen ? "" : "-rotate-90"}`}
              style={{ color: "var(--ink-3)" }}
              onClick={(e) => { e.stopPropagation(); setGroupsOpen((v) => !v); }}
            />
          </button>
        ) : (
          <button
            onClick={() => navigate("/app/groups")}
            title="Groups"
            className={`relative w-full flex items-center justify-center h-10 rounded-[10px] transition-colors ${groupsActive ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"}`}
          >
            {groupsActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[var(--signal)]" />}
            <BackpackIcon className="w-[18px] h-[18px]" style={{ color: groupsActive ? "var(--signal)" : "var(--ink-3)" }} />
          </button>
        )}

        {!isCollapsed && groupsOpen && (
          <div className="mt-1 ml-7 space-y-0.5">
            {groups.length === 0 ? (
              <p className="std-mono text-[10px] text-[var(--ink-3)] px-3 py-1.5 uppercase tracking-wider">No groups yet</p>
            ) : (
              groups.slice(0, 5).map((g) => {
                const a = location.pathname === `/app/groups/${g._id}`;
                return (
                  <button
                    key={g._id}
                    onClick={() => navigate(`/app/groups/${g._id}`)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-left transition-colors ${a ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a ? "var(--signal)" : "var(--ink-3)" }} />
                    <span className="text-xs font-medium truncate" style={{ color: a ? "var(--ink)" : "var(--ink-2)" }}>{g.name}</span>
                  </button>
                );
              })
            )}
            {groups.length > 5 && (
              <button onClick={() => navigate("/app/groups")} className="w-full px-3 py-1.5 text-left rounded-[8px] hover:bg-[var(--surface-2)]">
                <span className="std-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider">View all {groups.length} →</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="mt-auto pt-3 border-t border-[var(--line-2)] space-y-0.5">
        {navBtn({ id: "settings", label: "Settings", icon: GearIcon, path: "/app/settings" })}
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Log out" : undefined}
          className={`w-full flex items-center gap-3 rounded-[10px] transition-colors hover:bg-[var(--rose)]/10 ${isCollapsed ? "justify-center h-10" : "px-3 h-10"}`}
        >
          <ExitIcon className="w-[18px] h-[18px] flex-shrink-0" style={{ color: "var(--ink-3)" }} />
          {!isCollapsed && <span className="text-sm font-medium" style={{ color: "var(--ink-3)" }}>Log out</span>}
        </button>
      </div>
    </aside>
  );
};

export default StandardSidebar;
