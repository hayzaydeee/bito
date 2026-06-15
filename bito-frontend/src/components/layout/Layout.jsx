import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import VerticalMenu from "./VerticalMenu";
import StatusBar from "./StatusBar";
import BottomTabBar from "./BottomTabBar";
import StandardSidebar from "./standard/StandardSidebar";
import StandardTopBar from "./standard/StandardTopBar";
import AnimatedPage from "../ui/AnimatedPage";
import HabitCreationWizard from "../ui/HabitCreationWizard";
import { useAuth, withAuth } from "../../contexts/AuthContext";
import { useHabits } from "../../contexts/HabitContext";
import { useTheme } from "../../contexts/ThemeContext";

const readNavCollapsed = () => {
  try { return localStorage.getItem('bito:nav-collapsed') === 'true'; }
  catch { return false; }
};

const Layout = () => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(readNavCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [addHabitModalOpen, setAddHabitModalOpen] = useState(false);
  const { user } = useAuth();
  const { createHabit } = useHabits();
  const { designSystem } = useTheme();
  const location = useLocation();

  // Route guard: redirect to profile-setup or onboarding if needed
  if (user && !user.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }
  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleOpenAddHabit = useCallback(() => {
    setAddHabitModalOpen(true);
  }, []);

  const handleSaveNewHabit = useCallback(async (habitData) => {
    const result = await createHabit(habitData);
    if (result.success) {
      setAddHabitModalOpen(false);
    }
  }, [createHabit]);

  // Also listen for the addHabit custom event (fallback)
  useEffect(() => {
    const handler = () => setAddHabitModalOpen(true);
    window.addEventListener("addHabit", handler);
    return () => window.removeEventListener("addHabit", handler);
  }, []);

  // Persist collapsed state across remounts
  useEffect(() => {
    try { localStorage.setItem('bito:nav-collapsed', isMenuCollapsed); }
    catch { /* localStorage unavailable — state won't persist */ }
  }, [isMenuCollapsed]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Standard design system — floating shell (desktop only) ──
  const standardDesktop = designSystem === "standard" && !isMobile;
  if (standardDesktop) {
    const sidebarWidth = isMenuCollapsed ? 68 : 236;
    const contentLeft = sidebarWidth + 24; // left-3 gap + 12px gutter
    return (
      <div className="std std-surface h-screen relative overflow-hidden" style={{ background: "var(--bg)" }}>
        <StandardSidebar
          isCollapsed={isMenuCollapsed}
          onToggle={() => setIsMenuCollapsed(!isMenuCollapsed)}
        />
        <StandardTopBar
          userName={user?.name || user?.username || "User"}
          userAvatar={user?.avatar}
          leftOffset={contentLeft}
        />
        <div
          className="h-full overflow-y-auto overflow-x-hidden"
          style={{ paddingLeft: contentLeft, paddingTop: 80, paddingRight: 12, paddingBottom: 12 }}
        >
          <AnimatePresence mode="wait">
            <AnimatedPage key={location.pathname}>
              <Outlet />
            </AnimatedPage>
          </AnimatePresence>
        </div>

        <HabitCreationWizard
          isOpen={addHabitModalOpen}
          onClose={() => setAddHabitModalOpen(false)}
          onSave={handleSaveNewHabit}
          userId={user?._id || user?.id}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex relative" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      {/* Desktop Sidebar — hidden on mobile */}
      {!isMobile && (
        <div className="relative z-10 flex-shrink-0">
          <VerticalMenu 
            isCollapsed={isMenuCollapsed} 
            isMobile={false}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Status Bar */}
        <StatusBar
          isMenuCollapsed={isMenuCollapsed}
          setIsMenuCollapsed={setIsMenuCollapsed}
          userName={user?.name || user?.username || 'User'}
          userAvatar={user?.avatar}
          firstName={user?.firstName}
          isMobile={isMobile}
        />

        {/* Content Pane */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            paddingBottom: isMobile ? "calc(64px + env(safe-area-inset-bottom, 0px))" : "0",
          }}
        >
          <AnimatePresence mode="wait">
            <AnimatedPage key={location.pathname}>
              <Outlet />
            </AnimatedPage>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar — hidden on desktop */}
      {isMobile && <BottomTabBar onAddHabit={handleOpenAddHabit} />}

      {/* Global Add Habit Wizard (accessible from BottomTabBar on any page) */}
      <HabitCreationWizard
        isOpen={addHabitModalOpen}
        onClose={() => setAddHabitModalOpen(false)}
        onSave={handleSaveNewHabit}
        userId={user?._id || user?.id}
      />
    </div>
  );
};

export default withAuth(Layout);
