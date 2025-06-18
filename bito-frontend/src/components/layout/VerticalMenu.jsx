import React, { useState } from "react";
import { Flex, Text, Button } from "@radix-ui/themes";
import {
  DashboardIcon,
  BarChartIcon,
  GearIcon,
  CalendarIcon,
  TargetIcon,
  LightningBoltIcon,
  ActivityLogIcon,
} from "@radix-ui/react-icons";

const VerticalMenu = ({ currentPage, onPageChange, isCollapsed }) => {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: DashboardIcon,
      description: "Overview & insights",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "habits",
      label: "Habits",
      icon: TargetIcon,
      description: "Manage your habits",
      color: "from-green-500 to-green-600",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: CalendarIcon,
      description: "Track progress",
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChartIcon,
      description: "Detailed reports",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "quick-actions",
      label: "Quick Actions",
      icon: LightningBoltIcon,
      description: "Fast completions",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      id: "activity",
      label: "Activity",
      icon: ActivityLogIcon,
      description: "Recent changes",
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  const bottomItems = [
    {
      id: "settings",
      label: "Settings",
      icon: GearIcon,
      description: "Preferences",
      color: "from-gray-500 to-gray-600",
    },
  ];

  const renderMenuItem = (item, isBottom = false) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;

    if (isCollapsed) {
      return (
        <div key={item.id} className="group relative mb-2">
          <button
            className={`w-full h-10 rounded-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
              isActive
                ? `bg-gradient-to-r ${item.color} shadow-lg shadow-black/20 scale-105`
                : "hover:bg-[var(--color-surface-hover)] hover:scale-105 bg-transparent"
            }`}
            onClick={() => onPageChange(item.id)}
            title={item.label}
          >
            <Icon
              className={`w-5 h-5 transition-colors ${
                isActive ? "text-white" : "text-[var(--color-text-accent)]"
              }`}
            />{" "}
            {/* Active glow effect */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl" />
            )}
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
        {" "}
        <button
          className={`w-full p-3 rounded-xl transition-all duration-300 flex items-center gap-3 relative overflow-hidden group ${
            isActive
              ? `bg-gradient-to-r ${item.color} shadow-lg shadow-black/20 transform scale-[1.02]`
              : "hover:bg-[var(--color-surface-hover)] hover:scale-[1.01] bg-transparent"
          }`}
          onClick={() => onPageChange(item.id)}
        >
          {" "}
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
          {/* Active indicator */}
          {isActive && (
            <div className="absolute right-4 w-2 h-8 bg-white/30 rounded-full" />
          )}
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
        {" "}
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
          )}{" "}
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
      </div>
    </div>
  );
};

export default VerticalMenu;
