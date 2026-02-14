import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DashboardIcon,
  BarChartIcon,
  PlusIcon,
  PersonIcon,
  DotsHorizontalIcon,
  GearIcon,
  ExitIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import { useAuth } from "../../contexts/AuthContext";
import ThemeSwitcher from "../ui/ThemeSwitcher";

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (path) => {
    if (path === "/app/dashboard") {
      return location.pathname === "/app" || location.pathname === "/app/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: DashboardIcon,
      path: "/app/dashboard",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChartIcon,
      path: "/app/analytics",
    },
    {
      id: "add",
      label: "Add",
      icon: PlusIcon,
      path: null, // Special action button
    },
    {
      id: "groups",
      label: "Groups",
      icon: PersonIcon,
      path: "/app/groups",
    },
    {
      id: "more",
      label: "More",
      icon: DotsHorizontalIcon,
      path: null, // Opens half-sheet
    },
  ];

  return (
    <>
      {/* More menu half-sheet backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu half-sheet */}
      {showMore && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+64px)] left-0 right-0 z-50 animate-slide-up">
          <div
            className="mx-3 mb-2 rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              borderColor: "var(--color-border-primary)",
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="w-8 h-1 rounded-full"
                style={{ backgroundColor: "var(--color-border-secondary)" }}
              />
            </div>

            {/* Menu items */}
            <div className="px-2 pb-2">
              <button
                onClick={() => {
                  setShowMore(false);
                  navigate("/app/settings");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                style={{ color: "var(--color-text-primary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <GearIcon className="w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
                <span className="text-sm font-medium font-spartan">Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowMore(false);
                  // Journal action — dispatch event for journal modal
                  window.dispatchEvent(new CustomEvent("openJournal"));
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                style={{ color: "var(--color-text-primary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Pencil1Icon className="w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
                <span className="text-sm font-medium font-spartan">Journal</span>
              </button>

              <div className="px-4 py-3 flex items-center justify-between">
                <span
                  className="text-sm font-medium font-spartan"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Theme
                </span>
                <ThemeSwitcher compact={true} />
              </div>

              <div
                className="my-1 mx-4 h-px"
                style={{ backgroundColor: "var(--color-border-primary)" }}
              />

              <button
                onClick={() => {
                  setShowMore(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-400 hover:bg-red-500/10"
              >
                <ExitIcon className="w-5 h-5" />
                <span className="text-sm font-medium font-spartan">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add menu speed dial */}
      {showAddMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowAddMenu(false)}
          />
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div
              className="rounded-2xl border overflow-hidden min-w-[200px]"
              style={{
                backgroundColor: "var(--color-surface-elevated)",
                borderColor: "var(--color-border-primary)",
              }}
            >
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    // Dispatch add habit event
                    window.dispatchEvent(new CustomEvent("addHabit"));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--color-surface-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-brand-500)" }}
                  >
                    <PlusIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium font-spartan">New Habit</span>
                </button>

                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    window.dispatchEvent(new CustomEvent("openJournal"));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--color-surface-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-secondary-500)" }}
                  >
                    <Pencil1Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium font-spartan">Journal Entry</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t"
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderColor: "var(--color-border-primary)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.path ? isActive(tab.path) : false;

            // Special center "Add" button
            if (tab.id === "add") {
              return (
                <button
                  key={tab.id}
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="relative -mt-4 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform active:scale-95"
                  style={{
                    backgroundColor: "var(--color-brand-500)",
                    boxShadow: "0 4px 16px var(--color-glow)",
                  }}
                  aria-label="Add"
                >
                  <PlusIcon className="w-6 h-6 text-white" />
                </button>
              );
            }

            // "More" button
            if (tab.id === "more") {
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setShowMore(!showMore);
                    setShowAddMenu(false);
                  }}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors"
                  aria-label="More"
                >
                  <Icon
                    className="w-5 h-5"
                    style={{
                      color: showMore
                        ? "var(--color-brand-500)"
                        : "var(--color-text-tertiary)",
                    }}
                  />
                  <span
                    className="text-[10px] font-medium font-spartan"
                    style={{
                      color: showMore
                        ? "var(--color-brand-500)"
                        : "var(--color-text-tertiary)",
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            // Regular tab
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors"
                aria-label={tab.label}
              >
                <Icon
                  className="w-5 h-5"
                  style={{
                    color: active
                      ? "var(--color-brand-500)"
                      : "var(--color-text-tertiary)",
                  }}
                />
                <span
                  className="text-[10px] font-medium font-spartan"
                  style={{
                    color: active
                      ? "var(--color-brand-500)"
                      : "var(--color-text-tertiary)",
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomTabBar;
